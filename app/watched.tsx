import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { CinematicHeader } from '../components/CinematicHeader';
import { ListItem } from '../components/ListItem';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function WatchedScreen() {
    const { user } = useAuth(); // Need user ID
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    const [loading, setLoading] = useState(true);
    const [watchedItems, setWatchedItems] = useState<any[]>([]);

    useEffect(() => {
        fetchWatchedHistory();
    }, [user]);

    const fetchWatchedHistory = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('watched_items')
                .select(`
                    id,
                    list_item:list_items (
                        id,
                        tmdb_id,
                        title,
                        poster_path,
                        media_type,
                        list:lists (
                            id,
                            name
                        )
                    )
                `)
                .eq('user_id', user.id)
                .order('watched_at', { ascending: false });

            if (error) {
                console.error("Error fetching watched history:", error);
            } else {
                // Filter out items that may have been deleted or access lost (RLS)
                const validItems = data
                    .filter(item => item.list_item && item.list_item.list)
                    .map(item => ({
                        // Flat logic for UI
                        id: item.list_item.id, // list_item_id
                        tmdbId: item.list_item.tmdb_id,
                        title: item.list_item.title,
                        posterPath: item.list_item.poster_path,
                        listName: item.list_item.list.name,
                        listId: item.list_item.list.id
                    }));
                setWatchedItems(validItems);
            }
        } catch (e) {
            console.error("Exception fetching history:", e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <CinematicHeader
                title="Watched History"
                rightElement={
                    <TouchableOpacity onPress={() => router.dismiss()}>
                        <Text style={{ color: theme.tint, fontSize: 17, fontWeight: '600' }}>Done</Text>
                    </TouchableOpacity>
                }
            />

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: theme.textSecondary }}>Loading history...</Text>
                </View>
            ) : (
                <FlatList
                    data={watchedItems}
                    keyExtractor={(item) => `${item.listId}-${item.id}`} // Unique key
                    contentContainerStyle={styles.content}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="film-outline" size={64} color={theme.icon} style={{ opacity: 0.5 }} />
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                No movies watched yet.
                            </Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <ListItem
                            title={item.title}
                            subtitle={`From "${item.listName}"`}
                            image={item.posterPath}
                            onPress={() => router.push({
                                pathname: '/details/[id]',
                                params: { listId: item.listId, itemId: item.id }
                            })}
                        // Removed rating here to simplify query, can re-add if we fetch ratings too
                        />
                    )}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        paddingTop: 16,
    },
    emptyContainer: {
        flex: 1,
        marginTop: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    }
});
