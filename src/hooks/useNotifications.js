import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
// useNotifications
//
// How it works (simple & reliable):
//   1. On mount → request browser Notification permission
//   2. Subscribe to Supabase Realtime INSERT on the `orders` table
//   3. Every new order → add to in-app list + fire native browser notification
//
// No Edge Function, no VAPID keys, no service worker needed for this to work.
// The browser tab just needs to be open (even in background).
// ─────────────────────────────────────────────────────────────────────────────

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [toasts, setToasts] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [permission, setPermission] = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const channelRef = useRef(null);
    const notificationsRef = useRef([]);

    // Keep ref in sync
    useEffect(() => {
        notificationsRef.current = notifications;
    }, [notifications]);

    // ── Request browser notification permission ────────────────────────────────
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window)) return 'unsupported';
        if (Notification.permission === 'granted') return 'granted';

        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
    }, []);

    // ── Play notification chime ───────────────────────────────────────────────
    const playNotificationSound = useCallback(() => {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const playTone = (freq, startAt, duration, gain = 0.2) => {
                const osc = ctx.createOscillator();
                const vol = ctx.createGain();
                osc.connect(vol);
                vol.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                vol.gain.setValueAtTime(0, startAt);
                vol.gain.linearRampToValueAtTime(gain, startAt + 0.01);
                vol.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
                osc.start(startAt);
                osc.stop(startAt + duration);
            };
            const now = ctx.currentTime;
            playTone(587.3, now, 0.18);
            playTone(783.9, now + 0.18, 0.28);
        } catch (_) {}
    }, []);

    // ── Fire browser notification ─────────────────────────────────────────────
    const fireBrowserNotification = useCallback((title, body, tag) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') return;
        try {
            const n = new Notification(title, {
                body,
                icon: '/logo/BLO_TRNSP_LOVE_ICON.png',
                tag,
                requireInteraction: true,
            });
            n.onclick = () => {
                window.focus();
                n.close();
            };
        } catch (err) {
            console.warn('[Notification]', err);
        }
    }, []);

    // ── Fetch Initial Notifications ───────────────────────────────────────────
    const fetchNotifications = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            setNotifications(data || []);
            setUnreadCount(data?.filter(n => !n.read).length || 0);
        } catch (err) {
            console.error('[Notifications] Fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
        requestPermission();
    }, [fetchNotifications, requestPermission]);

    // ── Supabase Realtime ──────────────────────────────────────────────────────
    useEffect(() => {
        if (channelRef.current) supabase.removeChannel(channelRef.current);

        const channel = supabase
            .channel('db-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                (payload) => {
                    console.log('[Notifications] Realtime payload received:', payload);
                    const newNotif = payload.new;
                    setNotifications(prev => [newNotif, ...prev].slice(0, 50));
                    setToasts(prev => [...prev, newNotif]);
                    setUnreadCount(prev => prev + 1);
                    playNotificationSound();
                    fireBrowserNotification(newNotif.title, newNotif.body, newNotif.id);

                    // Auto-remove toast after 8 seconds
                    setTimeout(() => {
                        setToasts(prev => prev.filter(t => t.id !== newNotif.id));
                    }, 8000);
                }
            )
            .subscribe((status) => {
                console.log('[Notifications] Subscription status:', status);
            });

        channelRef.current = channel;
        return () => {
            console.log('[Notifications] Cleaning up channel');
            supabase.removeChannel(channel);
        };
    }, [fireBrowserNotification, playNotificationSound]);

    // ── Actions ────────────────────────────────────────────────────────────────
    const markAllRead = useCallback(async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('read', false);
        } catch (err) {
            console.error('[Notifications] Mark all read failed:', err);
        }
    }, []);

    const markRead = useCallback(async (id) => {
        try {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setToasts(prev => prev.filter(t => t.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', id);
        } catch (err) {
            console.error('[Notifications] Mark read failed:', err);
        }
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const markTypeAsRead = useCallback(async (type) => {
        try {
            const currentNotifs = notificationsRef.current || [];
            if (currentNotifs.length === 0) return;

            const toMark = currentNotifs.filter(n => n && n.type === type && !n.read);
            if (toMark.length === 0) return;

            setNotifications(prev => (prev || []).map(n => n.type === type ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - toMark.length));

            await supabase
                .from('notifications')
                .update({ read: true })
                .eq('type', type)
                .eq('read', false);
        } catch (err) {
            console.error(`[Notifications] Mark ${type} read failed:`, err);
        }
    }, []);

    const enablePushNotifications = useCallback(async () => {
        const result = await requestPermission();
        if (result === 'granted') return { success: true };
        return { success: false, reason: 'Permission denied or unsupported.' };
    }, [requestPermission]);

    return {
        notifications,
        toasts,
        unreadCount,
        loading,
        pushPermission: permission,
        enablePushNotifications,
        markAllRead,
        markRead,
        markTypeAsRead,
        removeToast,
    };
};

