import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3'

// Load environment variables (to be set in Supabase Secrets)
const RESEND_API_KEY = Deno.env.get('VITE_RESEND_API_KEY') || Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const resend = new Resend(RESEND_API_KEY)
const supabase = createClient(SUPABASE_URL ?? '', SUPABASE_SERVICE_ROLE_KEY ?? '')

const interpolate = (template: string, data: Record<string, any>) => {
  let result = template
  for (const key in data) {
    const value = data[key]
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, value || '')
  }
  return result
}

// Function to fetch template from storage or public URL
const getTemplate = async (templateName: string) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('email_templates')
      .download(templateName)
    
    if (error) throw error
    const text = await data.text()
    return text
  } catch (err: any) {
    console.error(`Error fetching template ${templateName}:`, err.message)
    return null
  }
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    console.log("Order Event Payload:", JSON.stringify(payload, null, 2))

    const order = payload.record || payload.old_record || payload
    const status = order.status
    const email = order.email
    const firstName = order.customer_name?.split(' ')[0] || 'there'
    const customerName = order.customer_name || 'Customer'
    const id = order.id
    const total = order.total
    const { shipping_address, tracking_number, items } = order

    if (!email) return new Response("No email", { status: 400 })

    let templateName = ''
    let subject = ''

    // Identify which status change or update happened
    if (payload.type === 'INSERT') {
        // New order created - Send confirmation
        templateName = '03_order_confirmation.html'
        subject = `Order Confirmed: #${order.id.slice(0, 8)} 🛒`
    } else if (payload.type === 'UPDATE') {
        const oldStatus = payload.old_record?.status
        const newStatus = payload.record?.status
        const oldTracking = payload.old_record?.tracking_number
        const newTracking = payload.record?.tracking_number

        if (newStatus === 'Shipped' || (newTracking && newTracking !== oldTracking)) {
            templateName = '04_order_shipped.html'
            subject = `Your order is on the way! 🚚 #${order.id.slice(0, 8)}`
        } else if (newStatus === 'Delivered' && newStatus !== oldStatus) {
            templateName = '12_order_delivered.html'
            subject = `Delivered: #${order.id.slice(0, 8)} 🏙️`
        } else if (newStatus === 'Cancelled' && newStatus !== oldStatus) {
            templateName = '13_order_cancelled.html'
            subject = `Order Update: #${order.id.slice(0, 8)} Cancelled`
        } else {
            return new Response("No relevant change", { status: 200 })
        }
    }

    if (!templateName) return new Response("No template matches", { status: 200 })

    const templateHtml = await getTemplate(templateName)
    if (!templateHtml) return new Response("Template missing", { status: 500 })

    const emailData: Record<string, string> = {
      first_name: firstName,
      customer_name: customerName,
      order_id: String(id).slice(0, 8),
      total_amount: `₹${parseFloat(total).toLocaleString()}`,
      shipping_address: shipping_address || 'N/A',
      tracking_number: tracking_number || 'Pending',
      order_link: `https://Bloomina.in/account/orders/${id}`
    }

    let interpolatedHtml = interpolate(templateHtml, emailData)

    // Manual item loop for confirmation if template has the placeholder
    if (templateName === '03_order_confirmation.html' && items && items.length > 0) {
        const itemsHtml = items.map((item: any) => `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 15px;">
              <span style="color: #0f172a; font-weight: 600;">${item.quantity}x ${item.title}</span>
              <span style="color: #475569;">₹${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          `).join('')
        interpolatedHtml = interpolatedHtml.replace('<!-- Loop items here -->', itemsHtml)
    }

    const { data, error } = await resend.emails.send({
      from: 'Bloomina <no-reply@Bloomina.in>',
      to: [email],
      subject: subject,
      html: interpolatedHtml,
    })

    if (error) {
      console.error("Resend Error:", JSON.stringify(error, null, 2))
      return new Response(JSON.stringify({ error }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true, id: data?.id }), {
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error("System Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})

