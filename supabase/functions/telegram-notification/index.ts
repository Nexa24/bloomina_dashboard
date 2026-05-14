// Supabase Edge Function: telegram-notification
// Triggered by a Supabase DB Webhook on INSERT to the `orders` table.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID')

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Received payload:", payload);

    // Supabase Webhooks send data in the 'record' field
    const order = payload.record || payload

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error("Missing Bot Token or Chat ID");
      return new Response(
        JSON.stringify({ error: "Notification system not configured (Missing secrets)" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const orderId = order.id?.toString().substring(0, 8) || 'N/A'
    const customer = order.customer_name || 'Guest'
    const total = order.total || 0
    
    // Format items list
    let itemsList = "<i>No items found</i>"
    if (order.items && Array.isArray(order.items)) {
      itemsList = order.items.map((it: any) => `• ${it.title || it.name} (x${it.quantity})`).join('\n')
    }

    const message = `
<b>🛍 New Order Placed!</b>

<b>Order ID:</b> #${orderId}
<b>Customer:</b> ${customer}
<b>Total:</b> ₹${total.toLocaleString('en-IN')}

<b>Items:</b>
${itemsList}

<b>Delivery:</b> ${order.delivery_method || 'Standard'}
<b>Email:</b> ${order.email || 'N/A'}

<a href="https://admin.Bloomina.in/admin/orders">View in Dashboard</a>
    `.trim()

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    const result = await res.json()
    
    if (!result.ok) {
      console.error("Telegram API Error:", result);
      throw new Error(result.description || "Failed to send Telegram message");
    }

    return new Response(JSON.stringify({ success: true, message: "Notification sent" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in telegram-notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
})

