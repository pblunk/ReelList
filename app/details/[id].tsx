import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

import { CinematicHeader } from '../../components/CinematicHeader';
import { Recommendations } from '../../components/Recommendations';
import { StarRating } from '../../components/StarRating';
import { StreamingProviders } from '../../components/StreamingProviders';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useProfile } from '../../hooks/useProfile';
import { MediaItem } from '../../types';

// Helper component to render a single rating row with user name
function RatingRow({ userId, rating, theme }: { userId: string, rating: number, theme: any }) {
    const { getProfile } = useProfile();
    const [name, setName] = useState<string | null>(null);

    useEffect(() => {
        getProfile(userId).then(p => {
            if (p?.display_name) setName(p.display_name);
        });
    }, [userId, getProfile]);

    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <StarRating rating={rating} size={14} readonly />
            <Text style={{ color: theme.textSecondary, fontSize: 13, marginLeft: 8 }}>
                {name || 'Unknown User'}
            </Text>
        </View>
    );
}

export default function DetailsScreen() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { lists, addItemToList, updateItem, updateList, toggleWatched, rateItem } = useStore();
    const { user } = useAuth();
    const userEmail = user?.email || 'Anonymous';

    const colorScheme = useColorScheme() ?? 'dark'; // Force dark preference
    const theme = Colors[colorScheme];

    const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
    const [mode, setMode] = useState<'preview' | 'edit'>('preview');
    // Toast State
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Derived state for Edit mode
    const list = lists.find(l => l.id === params.listId);
    const editItem = (params.listId && params.itemId)
        ? list?.items.find(i => i.id === params.itemId) || null
        : null;

    const item = mode === 'edit' ? editItem : previewItem;

    useEffect(() => {
        if (params.listId && params.itemId) {
            setMode('edit');
        } else if (params.item) {
            // Preview Mode: Parse from params only once
            try {
                const raw = JSON.parse(Array.isArray(params.item) ? params.item[0] : params.item);

                // Normalization for TMDB raw objects (snake_case) to our MediaItem (camelCase)
                // If it already has camelCase props, we keep them.
                const normalized: MediaItem = {
                    id: raw.id?.toString() || Date.now().toString(),
                    tmdbId: raw.tmdbId ?? raw.id, // search.tsx maps id->id, but raw tmdb object has id
                    title: raw.title || raw.name, // movie vs tv
                    releaseYear: raw.releaseYear || (raw.release_date || raw.first_air_date || '').split('-')[0],
                    mediaType: raw.mediaType || raw.media_type,
                    posterPath: raw.posterPath || raw.poster_path, // Key fix: handle snake_case
                    overview: raw.overview,
                    ratings: raw.ratings,
                    watchedBy: raw.watchedBy,
                    addedBy: raw.addedBy,
                    addedByUserId: raw.addedByUserId,
                };

                setPreviewItem(normalized);
                setMode('preview');
            } catch (e) {
                console.error("Failed to parse item", e);
            }
        }
    }, [params.listId, params.itemId, params.item]);

    // Hooks must be called before any conditional return
    const [addedByName, setAddedByName] = useState<string | null>(null);
    const { getProfile } = useProfile();

    useEffect(() => {
        if (item?.addedByUserId) {
            getProfile(item.addedByUserId).then(p => {
                if (p?.display_name) setAddedByName(p.display_name);
            });
        }
    }, [item?.addedByUserId, getProfile]);

    if (!item) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: theme.text }}>Loading item details...</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.tint }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleAddToList = (listId: string) => {
        const newItem = {
            ...item,
            id: Date.now().toString(),
            // Remove legacy fields if present on preview item
            isWatched: undefined,
            rating: undefined,
        };
        addItemToList(listId, newItem);

        // Show Feedback
        const targetList = lists.find(l => l.id === listId);
        setToastMessage(`Added to ${targetList?.name || 'List'}`);
        setShowToast(true);

        // Auto dismiss after delay
        setTimeout(() => {
            setShowToast(false);
            router.dismiss();
        }, 800);
    };

    const handleToggleWatched = () => {
        if (mode === 'edit' && params.listId && params.itemId) {
            toggleWatched(params.listId as string, params.itemId as string);
        }
    };

    const handleRate = (rating: number) => {
        if (mode === 'edit' && params.listId && params.itemId) {
            rateItem(params.listId as string, params.itemId as string, rating);
        }
    };

    // Calculate status for current user
    const isWatchedByMe = item?.watchedBy?.includes(userEmail);
    const myRating = item?.ratings?.[userEmail] || 0;

    // Get ratings from others
    const otherRatings = Object.entries(item?.ratings || {}).filter(([email, _]) => email !== userEmail);


    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <CinematicHeader
                title={mode === 'preview' ? 'Title Details' : 'Manage Item'}
                showBack={false} // Modal has implicit close or we add one
                rightElement={
                    <TouchableOpacity onPress={() => router.dismiss()}>
                        <Text style={{ color: theme.tint, fontSize: 17, fontWeight: '600' }}>Done</Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.topSection}>
                    {item.posterPath ? (
                        <Image
                            source={{ uri: `https://image.tmdb.org/t/p/w500${item.posterPath}` }}
                            style={styles.poster}
                        />
                    ) : (
                        <View style={[styles.poster, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="image-outline" size={40} color={theme.icon} />
                        </View>
                    )}
                    <View style={styles.info}>
                        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
                        <Text style={[styles.meta, { color: theme.textSecondary }]}>
                            {item.releaseYear} • {item.mediaType === 'movie' ? 'Movie' : 'TV Show'}
                        </Text>

                        {(addedByName || item.addedBy) && (
                            <Text style={{ color: theme.textSecondary, fontSize: 13, marginBottom: 8 }}>
                                Added by {addedByName || item.addedBy}
                            </Text>
                        )}

                        {mode === 'edit' && (
                            <View style={styles.ratingContainer}>
                                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                                    Your Rating
                                </Text>
                                <StarRating
                                    rating={myRating}
                                    onRate={handleRate}
                                    size={32}
                                />

                                {/* Show ratings from others */}
                                {otherRatings.length > 0 && (
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={[styles.sectionLabel, { color: theme.textSecondary, fontSize: 12 }]}>
                                            Community Ratings
                                        </Text>
                                        {otherRatings.map(([userId, rating], index) => (
                                            <RatingRow key={userId} userId={userId} rating={rating} theme={theme} />
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                </View>

                {/* Actions */}
                <View style={[styles.actionSection, { borderTopColor: theme.border, borderBottomColor: theme.border }]}>
                    {mode === 'preview' ? (
                        <TouchableOpacity
                            style={[styles.primaryButton, { backgroundColor: theme.tint }]}
                            onPress={() => {
                                // For MVP, add to first list or prompt? 
                                // Simplified: Add to params.targetListId if passed, else first list.
                                const targetListId = params.targetListId as string || lists[0]?.id;
                                if (targetListId) handleAddToList(targetListId);
                            }}
                        >
                            <Text style={styles.buttonText}>Add to List</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.actionRow, { backgroundColor: theme.card }]}
                            onPress={handleToggleWatched}
                        >
                            <Text style={[styles.actionLabel, { color: theme.text }]}>Mark as Watched</Text>
                            <Ionicons
                                name={isWatchedByMe ? "checkmark-circle" : "ellipse-outline"}
                                size={28}
                                color={isWatchedByMe ? theme.tint : theme.icon}
                            />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.overviewSection}>
                    <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Overview</Text>
                    <Text style={[styles.overview, { color: theme.text }]}>
                        {item.overview || "No overview available."}
                    </Text>
                </View>

                {/* Streaming Providers */}
                <StreamingProviders tmdbId={item.tmdbId} mediaType={item.mediaType} />

                {/* Recommendations */}
                <Recommendations tmdbId={item.tmdbId} mediaType={item.mediaType} currentId={item.id} />

            </ScrollView>

            {/* Toast Feedback */}
            {showToast && (
                <View style={[styles.toastContainer, { backgroundColor: '#1C1C1E', borderColor: 'rgba(255,255,255,0.1)' }]}>
                    <Ionicons name="checkmark-circle" size={28} color={theme.tint} style={{ marginRight: 12 }} />
                    <Text style={[styles.toastText, { color: 'white' }]}>{toastMessage}</Text>
                </View>
            )}
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    topSection: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    poster: {
        width: 120,
        height: 180,
        borderRadius: 8,
        marginRight: 16,
    },
    info: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
        lineHeight: 30,
    },
    meta: {
        fontSize: 16,
        marginBottom: 16,
    },
    ratingContainer: {
        marginTop: 8,
    },
    actionSection: {
        paddingVertical: 16,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderBottomWidth: StyleSheet.hairlineWidth,
        marginBottom: 24,
    },
    primaryButton: {
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
    },
    actionLabel: {
        fontSize: 17,
        fontWeight: '500',
    },
    overviewSection: {
        marginTop: 8,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
    },
    overview: {
        fontSize: 16,
        lineHeight: 24,
    },
    toastContainer: {
        position: 'absolute',
        top: '45%', // Visual center
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 32,
        paddingVertical: 24,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        zIndex: 100,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
    },
    toastText: {
        fontSize: 17,
        fontWeight: '600',
    }
});
