import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AdminAuthContext = createContext({});

export const useAdminAuth = () => {
    return useContext(AdminAuthContext);
};

// ─── Module-level locks (survive concurrent async calls unlike React refs) ───
let _otpDispatchLock  = false;  // Prevents duplicate OTP generation
let _adminVerifyLock  = false;  // Prevents concurrent verifyAndSetAdmin calls

export const clearAdminAuthLocks = () => {
    _otpDispatchLock = false;
    _adminVerifyLock = false;
};

// ─── Stable 2FA session key (NEVER overwritten after creation) ───────────────
// Bloomina_admin_session_id  → the UUID stored in admin_2fa_sessions
// Bloomina_admin_heartbeat_id → the user_sessions.id (for heartbeat only)

export const AdminAuthProvider = ({ children }) => {
    const [adminUser, setAdminUser] = useState(null);
    const [pendingUser, setPendingUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const [needs2FA, setNeeds2FA] = useState(false);

    // ── Track session in user_sessions table ─────────────────────────────────
    // Uses a SEPARATE key (Bloomina_admin_heartbeat_id) so the stable
    // 2FA session key (Bloomina_admin_session_id) is never clobbered.
    const trackSession = async (user) => {
        if (!user) return;
        try {
            const ua = window.navigator.userAgent;
            let device = 'Admin Dashboard (Web)';
            if (ua.includes('Windows')) device = 'Admin Panel (Windows)';
            else if (ua.includes('Macintosh')) device = 'Admin Panel (Mac)';

            const { data } = await supabase.from('user_sessions').insert({
                user_id: user.id,
                user_agent: ua,
                device_name: device,
                last_seen_at: new Date().toISOString()
            }).select('id').single();

            if (data?.id) {
                // Use a dedicated heartbeat key — do NOT touch Bloomina_admin_session_id
                localStorage.setItem('Bloomina_admin_heartbeat_id', data.id);
            }
        } catch (err) {
            console.error('Admin session tracking failed:', err);
        }
    };

    const updateHeartbeat = async () => {
        const sessionId = localStorage.getItem('Bloomina_admin_heartbeat_id');
        if (sessionId) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase.from('user_sessions')
                    .update({ last_seen_at: new Date().toISOString() })
                    .eq('id', sessionId)
                    .eq('user_id', session.user.id);
            }
        }
    };

    // ── Central role + 2FA verifier ──────────────────────────────────────────
    const verifyAndSetAdmin = async (user, session = null, event = null) => {
        // Prevent concurrent runs — only one can execute at a time
        if (_adminVerifyLock) {
            console.log('[AdminAuth] verifyAndSetAdmin already running, skipping duplicate call.');
            return;
        }
        _adminVerifyLock = true;

        if (!user) {
            setAdminUser(null);
            setNeeds2FA(false);
            setPendingUser(null);
            setLoading(false);
            _adminVerifyLock = false;
            return;
        }

        try {
            // Get or create a stable browser-based 2FA session ID (NEVER overwrite)
            let browserSessionId = localStorage.getItem('Bloomina_admin_session_id');
            if (!browserSessionId) {
                browserSessionId = crypto.randomUUID();
                localStorage.setItem('Bloomina_admin_session_id', browserSessionId);
            }

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, two_factor_enabled')
                .eq('id', user.id)
                .single();

            if (!profileError && profile?.role === 'admin') {
                // Check DB for a valid 2FA session
                let is2FAVerified = false;
                try {
                    const sid = localStorage.getItem('Bloomina_admin_session_id');
                    console.log('[AdminAuth] Checking 2FA status for user:', user.email, 'Session:', sid);
                    
                    const { data, error: rpcError } = await supabase.rpc('is_admin_2fa_verified', {
                        p_user_id: user.id,
                        p_session_id: sid
                    });
                    
                    if (rpcError) throw rpcError;
                    is2FAVerified = data;
                    console.log('[AdminAuth] 2FA Verified Status:', is2FAVerified);
                } catch (err) {
                    console.warn('[AdminAuth] 2FA check error:', err.message);
                }

                if (profile.two_factor_enabled && !is2FAVerified) {
                    // Critical: if we are currently in the middle of a verify2FA call, 
                    // or if we already have an adminUser set, don't clear it yet.
                    if (adminUser && !needs2FA) {
                        console.log('[AdminAuth] Admin session already active, skipping state reset.');
                        _adminVerifyLock = false;
                        return;
                    }

                    setNeeds2FA(true);
                    setAdminUser(null);
                    setPendingUser(user);

                    console.log('[AdminAuth] 2FA required for session:', browserSessionId);

                    // Only dispatch OTP once — module lock prevents duplicates
                    if (!_otpDispatchLock) {
                        _otpDispatchLock = true;
                        try {
                            // SQL function generates OTP + sends email via pg_net (server-side)
                            const { error: otpError } = await supabase.rpc('generate_admin_otp', { p_user_id: user.id });
                            if (otpError) throw otpError;
                            console.log('[AdminAuth] OTP generated and email dispatched via pg_net.');
                        } catch (err) {
                            const isRateLimit = err.message?.includes('30 seconds') || err.message?.includes('60 seconds');
                            if (isRateLimit) {
                                console.log('[AdminAuth] Rate limited — OTP already sent recently.');
                            } else {
                                console.error('[AdminAuth] Failed to trigger OTP:', err);
                                setAuthError('Security Dispatch Error: Verification code could not be sent.');
                                _otpDispatchLock = false;
                            }
                        }
                    }
                } else {
                    // 2FA verified (or not required) — grant access
                    setAdminUser(user);
                    setNeeds2FA(false);
                    setPendingUser(null);
                    if (event === 'SIGNED_IN') trackSession(user);
                }
            } else {
                setAdminUser(null);
                setNeeds2FA(false);
                if (event === 'SIGNED_IN') {
                    setAuthError('Unauthorized: You do not possess the required admin clearance.');
                    await supabase.auth.signOut();
                }
            }
        } catch (err) {
            console.error('[AdminAuth] Role verification error:', err);
            setAdminUser(null);
        } finally {
            setLoading(false);
            _adminVerifyLock = false;
        }
    };

    // ── Verify submitted OTP ─────────────────────────────────────────────────
    const verify2FA = async (code) => {
        if (!needs2FA) {
            console.warn('[AdminAuth] verify2FA called but needs2FA is false');
            return false;
        }

        try {
            console.log('[AdminAuth] Starting 2FA Verification for code:', code);
            if (!pendingUser) {
                console.error('[AdminAuth] No pending user found during 2FA verify');
                return false;
            }

            const browserSessionId = localStorage.getItem('Bloomina_admin_session_id');
            console.log('[AdminAuth] RPC verify_admin_otp params:', { 
                p_user_id: pendingUser.id, 
                p_code: code, 
                p_session_id: browserSessionId 
            });

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('RPC_TIMEOUT')), 10000)
            );

            const { data: isValid, error: rpcError } = await Promise.race([
                supabase.rpc('verify_admin_otp', {
                    p_user_id: pendingUser.id,
                    p_code: code,
                    p_session_id: browserSessionId
                }),
                timeoutPromise
            ]);

            if (rpcError) {
                console.error('[AdminAuth] RPC verify_admin_otp Error:', rpcError);
                throw rpcError;
            }

            console.log('[AdminAuth] Verification Result:', isValid);

            if (isValid) {
                console.log('[AdminAuth] 2FA Success. Updating states...');
                _otpDispatchLock = false; // Release lock on success
                setAdminUser(pendingUser);
                setNeeds2FA(false);
                
                // Track session asynchronously
                trackSession(pendingUser).catch(err => console.error('[AdminAuth] trackSession error:', err));
                
                return true;
            }
            console.warn('[AdminAuth] 2FA Failed: Code is incorrect or expired.');
            return false;
        } catch (err) {
            console.error('[AdminAuth] 2FA verification process crashed:', err);
            return false;
        }
    };

    // ── Resend OTP ───────────────────────────────────────────────────────────
    const resendOTP = async () => {
        if (!pendingUser) return { error: 'No active session' };

        _otpDispatchLock = false; // Release lock to allow resend

        try {
            const { error: rpcError } = await supabase.rpc('generate_admin_otp', { p_user_id: pendingUser.id });
            if (rpcError) throw rpcError;

            _otpDispatchLock = true;
            console.log('[AdminAuth] OTP resent and email dispatched via pg_net.');
            return { error: null };
        } catch (err) {
            const isRateLimit = err.message?.includes('30 seconds') || err.message?.includes('60 seconds');
            if (isRateLimit) {
                // Still a successful state — OTP from before is valid
                _otpDispatchLock = true;
                return { error: null, rateLimited: true };
            }
            console.error('[AdminAuth] Resend failed:', err);
            _otpDispatchLock = false;
            return { error: err };
        }
    };

    // ── Bootstrap auth listeners ─────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 5000);

        supabase.auth.getSession().then(({ data: { session } }) => {
            clearTimeout(timer);
            verifyAndSetAdmin(session?.user ?? null, session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[AdminAuth] Auth state changed:', event);

            if (event === 'SIGNED_OUT') {
                setAdminUser(null);
                setNeeds2FA(false);
                _otpDispatchLock  = false;
                _adminVerifyLock  = false;
                localStorage.removeItem('Bloomina_admin_session_id');
                localStorage.removeItem('Bloomina_admin_heartbeat_id');
                setLoading(false);
                return;
            }

            // Skip INITIAL_SESSION — getSession() above already handles it
            if (event === 'INITIAL_SESSION') return;

            // If we are already waiting for 2FA, ignore background SIGNED_IN events
            // that might trigger when a token refreshes, to prevent RPC deadlocks.
            if (event === 'SIGNED_IN' && _otpDispatchLock) {
                console.log('[AdminAuth] Ignoring SIGNED_IN event because OTP dispatch lock is active.');
                return;
            }

            if (session?.user) {
                await verifyAndSetAdmin(session.user, session, event);
            } else {
                setAdminUser(null);
                setNeeds2FA(false);
                setPendingUser(null);
                setLoading(false);
            }
        });

        const heartbeat = setInterval(updateHeartbeat, 5 * 60 * 1000);

        return () => {
            subscription.unsubscribe();
            clearInterval(heartbeat);
            clearTimeout(timer);
        };
    }, []);

    // ── Logout ───────────────────────────────────────────────────────────────
    const adminLogout = async () => {
        _otpDispatchLock = false;
        _adminVerifyLock = false;
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            localStorage.removeItem('Bloomina_admin_session_id');
            localStorage.removeItem('Bloomina_admin_heartbeat_id');
            setAdminUser(null);
            setNeeds2FA(false);
        }
    };

    const value = {
        adminUser,
        adminLogout,
        loading,
        authError,
        setAuthError,
        needs2FA,
        verify2FA,
        resendOTP
    };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
};
