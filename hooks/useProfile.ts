import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Profile {
    id: string;
    display_name: string;
    created_at: string;
}

// Simple in-memory cache to avoid re-fetching the same profile repeatedly
const profileCache: Record<string, Profile> = {};
const pendingRequests: Record<string, Promise<Profile | null> | undefined> = {};

export function useProfile() {
    const [loading, setLoading] = useState(false);

    const getProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        if (!userId) return null;

        // Return cached if available
        if (profileCache[userId]) {
            return profileCache[userId];
        }

        // Return pending promise if already fetching
        const pending = pendingRequests[userId];
        if (pending) {
            return pending;
        }

        setLoading(true);

        const promise = (async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .single();

                if (error) {
                    if (error.code !== 'PGRST116') {
                        console.warn('Error fetching profile:', error);
                    }
                    return null;
                }

                if (data) {
                    profileCache[userId] = data;
                    return data as Profile;
                }
                return null;
            } finally {
                setLoading(false);
                delete pendingRequests[userId];
            }
        })();

        pendingRequests[userId] = promise;
        return promise;
    }, []);

    return {
        getProfile,
        loading
    };
}
