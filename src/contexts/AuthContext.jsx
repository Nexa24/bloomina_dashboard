import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = async () => {
            console.log('[Auth] Fetching session...');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setSession(session);
                setUser(session?.user ?? null);
            } catch (err) {
                console.error('[Auth] Session fetch failed:', err);
            } finally {
                setLoading(false);
            }
        };

        // Safety timeout — proceed after 5s regardless
        const timer = setTimeout(() => {
            setLoading(prev => {
                if (prev) console.warn('[Auth] Session check timed out, proceeding...');
                return false;
            });
        }, 5000);

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            if (subscription) subscription.unsubscribe();
            clearTimeout(timer);
        };
    }, []);


    const logout = async () => {
        await supabase.auth.signOut();
    };

    const deleteAccount = async () => {
        // Note: Supabase requires an RPC (Postgres Function) to allow a user to delete themselves
        // from the client side. The expected function name here is 'delete_user'.
        const { error } = await supabase.rpc('delete_user');

        if (error) {
            console.error("Failed to delete account:", error);
            throw new Error(error.message || "Failed to delete account. If using Supabase, ensure the 'delete_user' RPC function exists.");
        }

        // Sign out clear local session after deletion
        await logout();
    };

    const value = {
        session,
        user,
        logout,
        deleteAccount,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

