import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, Share, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

import { Colors } from '../constants/Colors';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';

export default function ShareScreen() {
    const { listId } = useLocalSearchParams<{ listId: string }>();
    const { lists, refreshLists } = useStore();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    const list = lists.find(l => l.id === listId);

    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const inviteLink = inviteToken ? `https://reellist.app/invite/${inviteToken}` : null;

    useEffect(() => {
        if (listId) {
            fetchToken();
        }
    }, [listId]);

    const fetchToken = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.rpc('generate_invite_token', {
                target_list_id: listId
            });

            if (error) throw error;
            setInviteToken(data);
        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to generate link');
        } finally {
            setLoading(false);
        }
    };

    const regenerateToken = async () => {
        Alert.alert(
            "Regenerate Link?",
            "The old link will stop working immediately. Access for existing members will remain.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Regenerate",
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await supabase.rpc('revoke_invite_token', { target_list_id: listId });
                            await fetchToken();
                        } catch (e) {
                            Alert.alert("Error", "Failed to regenerate");
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleRemoveUser = (email: string) => {
        Alert.alert(
            "Remove User",
            `Are you sure you want to remove ${email}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.from('list_shares')
                            .delete()
                            .match({ list_id: listId, user_email: email });

                        if (error) {
                            Alert.alert("Error", "Failed to remove user");
                        } else {
                            refreshLists();
                        }
                    }
                }
            ]
        );
    };

    const handleShare = async () => {
        if (!inviteLink) return;
        try {
            await Share.share({
                message: `I’m sharing my ReelList list ‘${list?.name || 'My List'}’ with you. Tap the link to join and start adding shows or movies.\n\n${inviteLink}`,
                url: inviteLink, // iOS often uses this for the clickable link preview
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleCopyLink = async () => {
        if (!inviteLink) return;
        await Clipboard.setStringAsync(inviteLink);
        Alert.alert('Copied', 'Link copied to clipboard');
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen
                options={{
                    headerLeft: () => (
                        <TouchableOpacity onPress={() => router.back()}>
                            <Ionicons name="close" size={28} color={theme.tint} />
                        </TouchableOpacity>
                    ),
                    title: 'Share List',
                }}
            />
            <View style={styles.content}>
                <Ionicons name="people" size={64} color={theme.tint} style={{ marginBottom: 20 }} />
                <Text style={[styles.title, { color: theme.text }]}>Share "{list?.name}"</Text>

                <Text style={[styles.description, { color: theme.icon }]}>
                    Share this link to let others join this list.
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color={theme.tint} style={{ marginVertical: 20 }} />
                ) : error ? (
                    <View style={{ alignItems: 'center' }}>
                        <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>
                        <Button title="Retry" onPress={fetchToken} />
                    </View>
                ) : (
                    <>
                        <TouchableOpacity
                            style={[
                                styles.linkContainer,
                                {
                                    backgroundColor: theme.card,
                                    borderColor: theme.border,
                                    shadowColor: theme.shadow,
                                }
                            ]}
                            onPress={handleCopyLink}
                        >
                            <Text numberOfLines={1} ellipsizeMode="middle" style={[styles.linkText, { color: theme.text }]}>
                                {inviteLink}
                            </Text>
                            <Ionicons name="copy-outline" size={20} color={theme.tint} style={{ marginLeft: 8 }} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={regenerateToken} style={{ marginTop: 20 }}>
                            <Text style={{ color: theme.textSecondary, fontSize: 14, textDecorationLine: 'underline' }}>
                                Revoke & Regenerate Link
                            </Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* Members List */}
                {list?.sharedWith && list.sharedWith.length > 0 && (
                    <View style={{ width: '100%', marginTop: 40, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border, paddingTop: 20 }}>
                        <Text style={{ color: theme.textSecondary, marginBottom: 12, fontWeight: '600' }}>
                            MEMBERS ({list.sharedWith.length})
                        </Text>
                        {list.sharedWith.map((email, idx) => (
                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                    <Ionicons name="person-circle-outline" size={24} color={theme.text} style={{ marginRight: 10 }} />
                                    <Text numberOfLines={1} style={{ color: theme.text, fontSize: 16 }}>{email}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleRemoveUser(email)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                                    <Ionicons name="trash-outline" size={20} color={theme.danger || '#ef4444'} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.footer}>
                <Button
                    title="Share Link..."
                    onPress={handleShare}
                    color={Colors.light.tint}
                    disabled={!inviteLink || loading}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    linkContainer: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between', // Changed to space-between
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    linkText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1, // Allow text to shrink/truncate
        marginRight: 10,
    },
    footer: {
        marginBottom: 20,
    }
});
