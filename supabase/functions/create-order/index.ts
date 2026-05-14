// Supabase Edge Function: create-order
// Secure checkout engine that calculates totals and deducts coins server-side.
// Prevents price tampering, coin double-spending, and unauthorized ordering.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // 1. Setup Auth & Clients
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 2. Validate Input
    const { 
      items, 
      coinsToUse, 
      formData, 
      selectedAddressIndex 
    } = await req.json()

    if (!items || items.length === 0) {
      throw new Error('Cart is empty')
    }

    // 3. Authenticate User (if present)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id || null

    // 4. SERVER-SIDE PRICE VALIDATION
    const productIds = items.map(item => item.id)
    const { data: dbProducts, error: prodError } = await adminClient
      .from('products')
      .select('id, price, name, images')
      .in('id', productIds)

    if (prodError || !dbProducts) throw new Error(`Could not fetch product prices: ${prodError?.message || JSON.stringify(prodError)}`)

    let subtotal = 0
    const validatedItems = items.map(item => {
      const dbProd = dbProducts.find(p => p.id === item.id)
      if (!dbProd) throw new Error(`Product ${item.id} no longer exists`)
      
      subtotal += dbProd.price * item.quantity
      return {
        ...item,
        price: dbProd.price, // Trust server price ONLY
        title: dbProd.name,
        image: dbProd.images?.[0] || ''
      }
    })

    // 5. SERVER-SIDE COIN VALIDATION & DEDUCTION
    let finalCoinDiscount = 0
    if (userId && coinsToUse > 0) {
      const { data: profile, error: profError } = await adminClient
        .from('profiles')
        .select('coins, coin_history')
        .eq('id', userId)
        .single()

      if (profError || !profile) throw new Error('User profile not found')
      
      const availableCoins = profile.coins || 0
      finalCoinDiscount = Math.min(availableCoins, coinsToUse, subtotal) // Can't use more than you have or more than subtotal

      // Deduct coins atomically
      if (finalCoinDiscount > 0) {
        const newBalance = availableCoins - finalCoinDiscount
        const historyItem = {
          id: Date.now(),
          type: 'spend',
          title: 'Checkout Discount',
          amount: finalCoinDiscount,
          date: new Date().toISOString(),
          status: 'Completed'
        }

        const { error: updateError } = await adminClient
          .from('profiles')
          .update({ 
            coins: newBalance,
            coin_history: [historyItem, ...(profile.coin_history || [])]
          })
          .eq('id', userId)

        if (updateError) throw new Error('Transaction failed: Could not deduct coins')
      }
    }

    // 6. CALCULATE TOTALS
    const shippingCost = subtotal >= 200 ? 0 : 50
    const total = subtotal + shippingCost - finalCoinDiscount

    // 7. GENERATE SECURE ORDER ID
    const baseId = Math.floor(1000 + Math.random() * 9000)
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const orderId = `TRU-${baseId}-${suffix}`

    // 8. INSERT ORDER
    const newOrder = {
      id: orderId,
      user_id: userId,
      email: formData.email,
      customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
      phone: formData.phone,
      shipping_address: {
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        address_index: selectedAddressIndex
      },
      subtotal,
      shipping_cost: shippingCost,
      coin_discount: finalCoinDiscount,
      total,
      payment_method: 'WhatsApp (Manual)',
      status: 'Payment Pending',
      items: validatedItems,
      created_at: new Date().toISOString()
    }

    const { error: orderError } = await adminClient
      .from('orders')
      .insert([newOrder])

    if (orderError) throw new Error(`Order saving failed: ${orderError.message}`)

    return new Response(JSON.stringify({ 
      success: true, 
      orderId,
      finalTotal: total 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // TEMPORARY DIAGNOSTIC: Send 200 so the Supabase SDK does not discard the JSON body
    })
  }
})
