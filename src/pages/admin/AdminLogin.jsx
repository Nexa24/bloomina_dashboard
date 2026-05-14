import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminAuth, clearAdminAuthLocks } from '../../contexts/AdminAuthContext';


import { AnimatePresence, motion } from 'framer-motion';

const AdminLogin = () => {
    const navigate = useNavigate();
    const { adminUser, loading: authLoading, authError, setAuthError, needs2FA, verify2FA, resendOTP } = useAdminAuth();

    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Stage tracking (for UI logic)
    const [isVerifying, setIsVerifying] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Resend timer countdown logic
    useEffect(() => {
        let timer;
        if (resendTimer > 0) {
            timer = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [resendTimer]);

    // Synchronize with AuthContext needs2FA
    useEffect(() => {
        setIsVerifying(needs2FA);
        if (needs2FA) {
            setLoading(false);
        }
    }, [needs2FA]);

    // Redirect if already logged in as admin
    useEffect(() => {
        if (!authLoading && adminUser) {
            console.log('[AdminLogin] Admin session detected, redirecting...');
            setLoading(false); 
            navigate('/admin', { replace: true });
        }
    }, [adminUser, authLoading, navigate]);

    // Ensure loading state clears if an auth error occurs from the context
    useEffect(() => {
        if (authError) {
            setLoading(false);
        }
    }, [authError]);

    // Fallback: sync with global auth loading state if we're waiting for the context
    useEffect(() => {
        if (!authLoading && !adminUser && !needs2FA) {
            // The context has finished checking, and we are not verified and don't need 2FA.
            // If we are still "loading" locally after a successful sign-in, clear it.
            setLoading(false);
        }
    }, [authLoading, adminUser, needs2FA]);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setAuthError(null);

        try {
            console.log('[AdminLogin] Stage 1: Initiating credentials check...');
            clearAdminAuthLocks(); // Guarantee clean state before signaling the provider
            const { error: authError } = await supabase.auth.signInWithPassword({
                email: credentials.email,
                password: credentials.password,
            });

            if (authError) throw authError;

        } catch (err) {
            console.error('[AdminLogin] Stage 1 failed:', err.message);
            setError(err.message || 'Invalid email or password.');
            setLoading(false);
            await supabase.auth.signOut();
        }
    };

    const handleVerifyOtp = async (e) => {
        if (e) e.preventDefault();
        if (otp.length !== 6 || loading) return;

        console.log('[AdminLogin] 2FA Verification Initiated for code:', otp);
        setLoading(true);
        setError(null);

        // Safety Timeout: clear loading if it takes more than 15 seconds
        const safetyTimer = setTimeout(() => {
            if (loading) {
                console.warn('[AdminLogin] 2FA Verification timed out. Clearing loading...');
                setLoading(false);
                setError('Verification took too long. Please try again.');
            }
        }, 15000);

        try {
            const success = await verify2FA(otp);
            clearTimeout(safetyTimer);
            
            if (success) {
                console.log('[AdminLogin] 2FA Success — redirecting...');
                // Keep loading true while we navigate, but handle cleanup
                setTimeout(() => setLoading(false), 5000); // Safety clear
                navigate('/admin', { replace: true });
            } else {
                setError('Invalid or expired verification code.');
                setLoading(false);
            }
        } catch (err) {
            clearTimeout(safetyTimer);
            console.error('[AdminLogin] 2FA Critical Failure:', err);
            setError('An unexpected security error occurred. Please try again.');
            setLoading(false);
        }
    };



    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Loading Overlay */}
            <AnimatePresence>
                {loading && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-8"
                    >
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-[#944555]/30 rounded-full blur-3xl animate-pulse" />
                            <img 
                                src="/logo/BLO_TRNSP_WHITE_LRG.png" 
                                alt="Authenticating..." 
                                className="w-56 h-56 md:w-72 md:h-72 object-contain relative z-10 animate-pulse"
                            />
                        </motion.div>
                        <div className="text-center space-y-3 relative z-10">
                            <h3 className="text-white font-black text-2xl tracking-[0.2em] uppercase">
                                {isVerifying ? 'Verifying Code' : 'Verifying Identity'}
                            </h3>
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-1.5 h-1.5 bg-[#944555] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                <div className="w-1.5 h-1.5 bg-[#944555] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                <div className="w-1.5 h-1.5 bg-[#944555] rounded-full animate-bounce"></div>
                            </div>
                            <p className="text-slate-400 font-bold text-[10px] tracking-[0.3em] uppercase opacity-70">
                                {isVerifying ? 'Finalizing Secure Handshake' : 'Establishing Secure Portal Connection'}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-md w-full relative z-10">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black text-white flex items-center justify-center gap-2">
                        <Lock className="w-8 h-8 text-[#944555]" />
                        Bloomina Admin
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Secured Portal Access</p>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-[#944555]/20 rounded-full blur-3xl pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {!isVerifying ? (
                            <motion.form 
                                key="login-form"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 20, opacity: 0 }}
                                onSubmit={handleLoginSubmit} 
                                className="space-y-6 relative z-10"
                            >
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                                    Authentication Required
                                </h2>

                                {(authError || error) && (
                                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5 shrink-0" />
                                        <span>{authError || error}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Admin Email</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Mail className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="email"
                                            required
                                            value={credentials.email}
                                            onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all"
                                            placeholder="Authorized email"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-slate-400" />
                                        </div>
                                        <input
                                            type="password"
                                            required
                                            value={credentials.password}
                                            onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all"
                                            placeholder="Secure password"
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || !credentials.email || !credentials.password}
                                    className="w-full py-4 bg-[#944555] hover:bg-[#7d3a47] text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Authenticating...' : 'Secure Login'}
                                    {!loading && <ArrowRight className="w-5 h-5" />}
                                </button>


                            </motion.form>
                        ) : (
                            <motion.form 
                                key="otp-form"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                onSubmit={handleVerifyOtp}
                                className="space-y-6 relative z-10"
                            >
                                <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    Two-Step Verification
                                </h2>
                                <p className="text-slate-500 text-sm mb-6 font-medium leading-relaxed">
                                    A 6-digit secure code has been dispatched to <span className="text-slate-900 font-bold">{adminUser?.email?.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length)) || credentials.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length))}</span>. Please enter it below to complete your clearance.
                                </p>

                                {!error && !loading && (
                                    <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-pulse">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                        <span>Security Code Dispatched Successfully</span>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-bold flex items-center gap-2">
                                        <ShieldAlert className="w-5 h-5 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Verification Code</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={6}
                                        autoFocus
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                        className="w-full px-4 py-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black text-3xl tracking-[0.5em] text-center focus:outline-none focus:ring-2 focus:ring-[#944555]/20 focus:border-[#944555] transition-all"
                                        placeholder="000000"
                                        disabled={loading}
                                    />
                                    

                                </div>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full py-4 bg-[#944555] hover:bg-[#7d3a47] text-white font-bold rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Verifying...' : 'Complete Verification'}
                                    {!loading && <ArrowRight className="w-5 h-5" />}
                                </button>

                                <div className="flex flex-col gap-2">
                                     <button
                                     type="button"
                                     disabled={resendTimer > 0}
                                     onClick={async () => {
                                         const { error: rpcError } = await resendOTP();
                                         if (rpcError) {
                                             const isRateLimit = rpcError.message?.includes('30 seconds') || rpcError.message?.includes('60 seconds');
                                             setError(isRateLimit ? 'Please wait 30 seconds before requesting a new code.' : rpcError.message);
                                             return;
                                         }
                                         setError(null);
                                         setResendTimer(30);
                                     }}
                                     id="resend-btn"
                                     className="w-full py-2 text-[#944555] hover:text-[#7d3a47] text-sm font-bold transition-all disabled:opacity-50 disabled:text-slate-400"
                                 >
                                     {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : 'Resend Verification Code'}
                                 </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsVerifying(false);
                                            supabase.auth.signOut();
                                        }}
                                        className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition-all"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;


