import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function InviteScreen() {
    const { token } = useLocalSearchParams<{ token: string }>();
    const router = useRouter();
    const { session } = useAuth();
    const [status, setStatus] = useState<'validating' | 'joining' | 'success' | 'error'>('validating');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const statusColor = status === 'error' ? 'red' : Colors.light.tint;

    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    useEffect(() => {
        // If not authenticated, the _layout logic should have redirected us to auth,
        // OR this screen mounts and we see no session.
        // If we are here and have no session, we should probably redirect to auth manually just in case,
        // but _layout handles it globally typically. 
        // However, if _layout passed us through (unlikely if we set it up right), we check here.

        // Note: The _layout redirect logic runs on *mount* or *session change*.
        // If we are here, we might briefly be session-less.

        if (!session) {
            // Should be handled by _layout but safety check
            return;
        }

        if (token) {
            joinList();
        } else {
            setStatus('error');
            setErrorMessage('Invalid invite link.');
        }
    }, [token, session]);

    const joinList = async () => {
        setStatus('joining');
        try {
            const { data, error } = await supabase.rpc('join_list_via_invite', {
                invite_token: token
            });

            if (error) {
                throw error;
            }

            // data is { success: boolean, list_id: uuid, list_name: text, message?: text }
            if (data && data.success) {
                setStatus('success');
                // Small delay to show success state then redirect
                setTimeout(() => {
                    router.replace(`/list/${data.list_id}`);
                }, 1000);
            } else {
                setStatus('error');
                setErrorMessage(data?.message || 'Failed to join list.');
            }

        } catch (e: any) {
            console.error('Join error:', e);
            setStatus('error');
            setErrorMessage(e.message || 'An unexpected error occurred.');
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.card}>
                {status === 'validating' || status === 'joining' ? (
                    <>
                        <ActivityIndicator size="large" color={theme.tint} style={{ marginBottom: 20 }} />
                        <Text style={[styles.text, { color: theme.text }]}>Joining list...</Text>
                    </>
                ) : status === 'success' ? (
                    <>
                        <Ionicons name="checkmark-circle" size={64} color="#4ade80" style={{ marginBottom: 20 }} />
                        <Text style={[styles.text, { color: theme.text }]}>Successfully joined!</Text>
                    </>
                ) : (
                    <>
                        <Ionicons name="warning-outline" size={64} color="gray" style={{ marginBottom: 20 }} />
                        <Text style={[styles.title, { color: theme.text }]}>Unable to Join</Text>
                        <Text style={[styles.errorText, { color: theme.textSecondary }]}>{errorMessage}</Text>

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.tint }]}
                            onPress={() => router.replace('/')}
                        >
                            <Text style={styles.buttonText}>Go Home</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
    },
    text: {
        fontSize: 18,
        fontWeight: '500',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    }
});
