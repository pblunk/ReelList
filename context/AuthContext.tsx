import { Session, User } from '@supabase/supabase-js';

import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Profile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    signInWithOtp: (email: string) => Promise<{ error: any }>;
    verifyOtp: (email: string, token: string) => Promise<{ data: any; error: any }>;
    signOut: () => Promise<{ error: any }>;
    refreshProfile: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId: string) => {
        if (!userId) {
            console.warn("fetchProfile called with null userId");
            return;
        }
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // PGRST116: JSON object might look like { code: 'PGRST116', ... }
                if (error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                }
                setProfile(null);
            } else {
                setProfile(data);
            }
        } catch (e) {
            console.error('Exception fetching profile:', e);
            setProfile(null);
        }
    };

    useEffect(() => {
        // Fetch session from storage on app launch
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) throw error;

                setSession(session);
                if (session?.user) {
                    await fetchProfile(session.user.id);
                }
            } catch (e) {
                console.warn("Error restoring session:", e);
                setSession(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();

        // Listen for internal auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);

            if (session?.user) {
                // If we switched users or signed in, fetch profile
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signInWithOtp = async (email: string) => {
        try {
            console.log("Sending OTP to:", email);
            console.log("Auth Options:", JSON.stringify({ email }));
            const { error } = await supabase.auth.signInWithOtp({ email });
            return { error };
        } catch (e) {
            console.error("Sign in error:", e);
            return { error: e };
        }
    };

    const verifyOtp = async (email: string, token: string) => {
        try {
            const { data, error } = await supabase.auth.verifyOtp({
                email,
                token,
                type: 'email',
            });

            if (data?.session) {
                setSession(data.session);
                await fetchProfile(data.session.user.id);
            }

            return { data, error };
        } catch (e) {
            console.error("Verify OTP error:", e);
            return { data: null, error: e };
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    return (
        <AuthContext.Provider value={{
            session,
            user: session?.user ?? null,
            profile,
            signInWithOtp,
            verifyOtp,
            signOut,
            refreshProfile: async () => {
                if (session?.user) await fetchProfile(session.user.id);
            },
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
