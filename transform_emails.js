import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, 'email_templates');
const logoUrl = 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771920901826_Bloomina_transparent_blue.png';

const illustrations = {
    '01_welcome_account.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921621583_mega-creator%20(2).png',
    '02_password_reset.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771922642661_mega-creator%20(3).png',
    '03_order_confirmation.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921815694_glossy-ecommerce.png',
    '04_order_shipped.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927807480_3d-business-drone-with-a-parcel.png',
    '05_payment_failed.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927188982_credit-card-with-decline-symbol-failed-payment-notification.png',
    '06_promo_new_collection.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927102357_3d-casual-life-online-shopping-on-mobile-phone.png',
    '07_cod_confirmation.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927153700_credit-card-with-user-icon-personal-account-payment-access-1.png',
    '08_email_change_confirmation.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771922642661_mega-creator%20(3).png',
    '09_payment_successful.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927027515_payment-success-confirmation-phone-with-credit-card-and-checkmark-completed-transaction-icon-1.png',
    '10_order_processing.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921815694_glossy-ecommerce.png',
    '11_out_for_delivery.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927807480_3d-business-drone-with-a-parcel.png',
    '12_order_delivered.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927660343_product-comparison-rating-system-shopping-insights-1.png',
    '13_order_cancelled.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927188982_credit-card-with-decline-symbol-failed-payment-notification.png',
    '14_refund_processed.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927027515_payment-success-confirmation-phone-with-credit-card-and-checkmark-completed-transaction-icon-1.png',
    '15_invoice_attached.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927153700_credit-card-with-user-icon-personal-account-payment-access-1.png',
    '16_policy_update.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771922642661_mega-creator%20(3).png',
    '17_flash_sale.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921064986_sale-6.png',
    '18_festive_sale.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921064986_sale-6.png',
    '19_back_in_stock.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921815694_glossy-ecommerce.png',
    '20_price_drop.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921064986_sale-6.png',
    '21_clearance_sale.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921064986_sale-6.png',
    '22_apology_notice.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927602636_discount-voucher-box-promo-coupons-with-stars-and-coins-special-offer.png',
    '23_shipping_delay.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927807480_3d-business-drone-with-a-parcel.png',
    '24_return_request.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927660343_product-comparison-rating-system-shopping-insights-1.png',
    '25_return_approved.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927807480_3d-business-drone-with-a-parcel.png',
    '26_limited_drop.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927102357_3d-casual-life-online-shopping-on-mobile-phone.png',
    '27_bundle_offer.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921815694_glossy-ecommerce.png',
    '28_referral_program.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927602636_discount-voucher-box-promo-coupons-with-stars-and-coins-special-offer.png',
    '29_giveaway_announcement.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771927602636_discount-voucher-box-promo-coupons-with-stars-and-coins-special-offer.png',
    '30_milestone_thank_you.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921815694_glossy-ecommerce.png',
    '31_community_newsletter.html': 'https://hszccnxojpwfqjqzymlx.supabase.co/storage/v1/object/public/portfolio/1771921815694_glossy-ecommerce.png'
};

const files = fs.readdirSync(templatesDir);
console.log(`Processing ${files.length} files...`);

files.forEach(file => {
    if (!file.endsWith('.html')) return;

    let content = fs.readFileSync(path.join(templatesDir, file), 'utf8');

    // Domain replacements
    content = content.replace(/Bloomina\.com/g, 'Bloomina.in');

    // Logo replacement
    const logoImgTag = `<img src="${logoUrl}" alt="Bloomina Logo" style="height: 48px; width: auto; max-width: 100%; display: block; margin: 0 auto;">`;

    // Handle specific logo text formats
    content = content.replace(/<span class="logo-icon">.*?<\/span>\s*Bloomina Issue #04/g, logoImgTag);
    content = content.replace(/<span class="logo-icon">.*?<\/span>\s*Bloomina/g, logoImgTag);
    content = content.replace(/<span style="color: #8c74fb;">.*?<\/span>\s*Bloomina/g, logoImgTag);

    // Fallback if just generic logo text exists without span
    content = content.replace(/<a href="https:\/\/Bloomina\.in" class="logo">Bloomina<\/a>/gi, `<a href="https://Bloomina.in" class="logo">${logoImgTag}</a>`);

    // Deal with inserting the illustration.
    const illusUrl = illustrations[file];

    if (illusUrl) {
        // Handle 01 and 02 which already have illustration-container
        if (content.includes('class="illustration-container"') && !content.includes(illusUrl)) {
            content = content.replace(/<div class="illustration-container">[\s\S]*?<\/div>(\s*)<div class="content">/g,
                `<div class="illustration-container" style="text-align: center; padding: 20px 40px 0;"><img src="${illusUrl}" style="max-width: 200px; height: auto;"></div>$1<div class="content">`);
        }
        // 06_promo_new_collection.html structure
        else if ((content.includes('Hero Product') || file === '06_promo_new_collection.html') && !content.includes(illusUrl)) {
            content = content.replace(/<img src="https:\/\/via\.placeholder\.com\/600x400.*?">/g, `<img src="${illusUrl}" alt="Featured Illustration" style="width: 100%; max-width: 300px; height: auto; display: block; margin: 20px auto 0;">`);
        }
        else if (!content.includes(illusUrl)) {
            // Insert the image just above the content for standard templates
            const imgHTML = `<div class="illustration-container" style="text-align: center; padding: 20px 40px 0;"><img src="${illusUrl}" style="max-width: 200px; height: auto;"></div>`;
            if (content.includes('<div class="content">')) {
                content = content.replace('<div class="content">', imgHTML + '\n                    <div class="content">');
            }
        }
    }

    fs.writeFileSync(path.join(templatesDir, file), content);
    console.log(`✔ Updated ${file}`);
});
console.log('All files transformed successfully!');

