// Supabase Edge Function: send-push
// Triggered by a Supabase DB Webhook on INSERT to the `notifications` table.
//
// Deploy steps:
//   1. supabase functions deploy send-push
//   2. supabase secrets set VAPID_PRIVATE_KEY=YeSfEqWkIEmYDgUhxcylol6mCRDy0phrdFAlv6yx7dsqEgqM0xsvYkdwquLRubt9NKGzRW7hoA65rLla0
//   3. supabase secrets set VAPID_PUBLIC_KEY=BH-SNWUzFuXqQsFxhynfda0crQFt2Q7toMG8XMGDS0kqEgqM0xsvYkdwquLRubt9NKGzRW7hoA65rLla0fkZhBA
//   4. supabase secrets set VAPID_SUBJECT=mailto:admin@Bloomina.in
//   5. In Supabase Dashboard → Database → Webhooks → Create new webhook:
//         Table: notifications | Event: INSERT | URL: [your edge function URL]

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PUBLIC_KEY  = Deno.env.get('VAPID_PUBLIC_KEY')!;
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!;
const VAPID_SUBJECT     = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@Bloomina.in';
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_KEY      = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async (req: Request) => {
    try {
        const body = await req.json();
        // Supabase webhook sends { type, table, record, ... }
        const notification = body.record ?? body;

        if (!notification?.id) {
            return new Response('No notification record', { status: 400 });
        }

        // Fetch all active push subscriptions
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('endpoint, p256dh, auth');

        if (error) throw error;
        if (!subscriptions || subscriptions.length === 0) {
            return new Response('No subscribers', { status: 200 });
        }

        const payload = JSON.stringify({
            title: notification.title,
            body:  notification.body,
            type:  notification.type,
            data:  notification.data,
        });

        // Send push to all subscriptions in parallel
        const results = await Promise.allSettled(
            subscriptions.map((sub) =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth },
                    },
                    payload
                )
            )
        );

        // Remove expired/invalid subscriptions (410 Gone)
        const expiredEndpoints: string[] = [];
        results.forEach((result, i) => {
            if (result.status === 'rejected') {
                const err = result.reason as { statusCode?: number };
                if (err?.statusCode === 410 || err?.statusCode === 404) {
                    expiredEndpoints.push(subscriptions[i].endpoint);
                }
            }
        });

        if (expiredEndpoints.length > 0) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .in('endpoint', expiredEndpoints);
        }

        const sent    = results.filter(r => r.status === 'fulfilled').length;
        const failed  = results.filter(r => r.status === 'rejected').length;

        return new Response(
            JSON.stringify({ sent, failed, expired_removed: expiredEndpoints.length }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    } catch (err) {
        console.error('[send-push] Error:', err);
        return new Response(JSON.stringify({ error: String(err) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});

