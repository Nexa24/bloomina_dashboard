import { supabase } from './supabase';

const CATALOG_ID = '1541918233141610';
const API_VERSION = 'v25.0'; // Using the version from your working manual tests

/**
 * Syncs all active products from Supabase to Meta (WhatsApp) Catalog
 */
export const syncProductsToWhatsApp = async (accessToken) => {
    // 1. Fetch active products from Supabase
    const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'Active');

    if (error) throw error;
    if (!products || products.length === 0) return { message: "No active products to sync." };

    // 2. Format products for Meta Batch API
    const requests = products.map(p => ({
        method: "UPDATE", // Use UPDATE to handle both new and existing items (if ID exists)
        data: {
            id: p.id,
            title: p.name,
            description: p.description || p.name,
            price: `${(p.price || 0).toFixed(2)} INR`,
            image_link: p.images?.[0] || 'https://Bloomina.in/placeholder.jpg',
            link: `https://Bloomina.in/product/${p.id}`,
            availability: p.stock > 0 ? "in stock" : "out of stock",
            condition: "new",
            brand: "Bloomina"
        }
    }));

    // 3. Send Batch Request to Meta using Form Data format (URLSearchParams)
    const params = new URLSearchParams();
    params.append('item_type', 'PRODUCT_ITEM');
    params.append('requests', JSON.stringify(requests));

    const response = await fetch(
        `https://graph.facebook.com/${API_VERSION}/${CATALOG_ID}/items_batch`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`
                // Content-Type is set automatically to application/x-www-form-urlencoded
            },
            body: params
        }
    );

    return await response.json();
};

/**
 * Fetches current products from the WhatsApp Catalog (for verification)
 */
export const fetchWhatsAppProducts = async (accessToken, filterTerm = "") => {
    let url = `https://graph.facebook.com/${API_VERSION}/${CATALOG_ID}/products?fields=retailer_id,id,name,category,errors`;
    
    if (filterTerm) {
        url += `&filter={"name":{"i_contains":"${filterTerm}"}}`;
    }

    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });

    return await response.json();
};

