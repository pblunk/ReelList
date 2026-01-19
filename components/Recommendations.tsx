import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { Colors } from '../constants/Colors';
import { MediaItem, MediaType } from '../types';

interface RecommendationsProps {
    tmdbId: number;
    mediaType: MediaType;
    currentId: string; // To exclude current item if it appears
}

export function Recommendations({ tmdbId, mediaType, currentId }: RecommendationsProps) {
    const [recommendations, setRecommendations] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    useEffect(() => {
        let isMounted = true;

        const fetchRecommendations = async () => {
            if (!tmdbId) return;

            try {
                const apiKey = Constants.expoConfig?.extra?.TMDB_API_KEY;
                if (!apiKey) {
                    console.warn("TMDB API Key missing");
                    setLoading(false);
                    return;
                }

                // 1. Fetch Source Details (for Genres & Year)
                const sourceUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${apiKey}`;
                const sourceRes = await fetch(sourceUrl);
                const sourceData = await sourceRes.json();

                if (!sourceData || !isMounted) return;

                const sourceGenres = new Set((sourceData.genres || []).map((g: any) => g.id));
                const sourceYear = parseInt((sourceData.release_date || sourceData.first_air_date || '').split('-')[0]) || new Date().getFullYear();

                // 2. Fetch Recommendations Endpoint
                const recUrl = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/recommendations?api_key=${apiKey}&language=en-US&page=1`;
                const recRes = await fetch(recUrl);
                const recData = await recRes.json();

                if (isMounted) {
                    // 3. Filter & Rank
                    const candidates: any[] = recData.results || [];

                    const processed = candidates
                        .filter(item => {
                            // Basic Filtering
                            if (!item.poster_path) return false; // Must have image
                            if (item.vote_count < 50) return false; // Must have some votes (noise filter)
                            if (item.id.toString() === currentId) return false; // No self-ref
                            return true;
                        })
                        .map(item => {
                            // Scoring
                            let score = 0;

                            // Genre Match
                            const itemGenres = item.genre_ids || [];
                            const shared = itemGenres.filter((id: number) => sourceGenres.has(id)).length;
                            // Heuristic: +10 per shared genre
                            score += (shared * 10);

                            // Vote Average Bonus
                            // e.g. 8.0 -> +8 pts
                            score += (item.vote_average || 0);

                            // Temporal Relevance
                            const itemYear = parseInt((item.release_date || item.first_air_date || '').split('-')[0]) || 0;
                            if (itemYear && Math.abs(itemYear - sourceYear) <= 10) {
                                score += 15; // Same era bonus
                            }

                            return { ...item, score };
                        })
                        .sort((a, b) => b.score - a.score) // Descending Score
                        .slice(0, 12) // Top 12
                        .map(item => ({
                            id: item.id.toString(),
                            tmdbId: item.id,
                            title: item.title || item.name,
                            releaseYear: (item.release_date || item.first_air_date || '').split('-')[0],
                            mediaType: mediaType,
                            posterPath: item.poster_path,
                            overview: item.overview,
                        }));

                    setRecommendations(processed);
                }
            } catch (e) {
                console.error("Error fetching recommendations:", e);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        setLoading(true);
        fetchRecommendations();

        return () => {
            isMounted = false;
        };
    }, [tmdbId, mediaType, currentId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.textSecondary} />
            </View>
        );
    }

    if (recommendations.length === 0) {
        return null; // Hide if empty
    }

    const handlePress = (item: MediaItem) => {
        // Push new details on stack
        router.push({
            pathname: '/details/[id]',
            params: {
                id: String(item.tmdbId),
                item: JSON.stringify(item),
                // Pass through other context if needed, e.g., targetListId? 
                // For now, let's keep it simple, it's a discovery flow.
            }
        });
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>You Might Also Like</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {recommendations.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.itemContainer}
                        onPress={() => handlePress(item)}
                    >
                        <Image
                            source={{ uri: `https://image.tmdb.org/t/p/w185${item.posterPath}` }}
                            style={[styles.poster, { backgroundColor: theme.card }]}
                        />
                        <Text
                            numberOfLines={2}
                            style={[styles.title, { color: theme.textSecondary }]}
                        >
                            {item.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 24,
    },
    loadingContainer: {
        marginTop: 24,
        height: 100,
        justifyContent: 'center',
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 1,
    },
    scrollContent: {
        gap: 12,
        paddingRight: 20, // Add some end padding
    },
    itemContainer: {
        width: 100,
        marginRight: 4,
    },
    poster: {
        width: 100,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    title: {
        fontSize: 12,
        textAlign: 'center',
    }
});
