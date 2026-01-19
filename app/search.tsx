import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ListItem } from '../components/ListItem';
import { Colors } from '../constants/Colors';
import { useStore } from '../context/StoreContext';
import { MediaItem } from '../types';

export default function SearchScreen() {
    const { listId } = useLocalSearchParams<{ listId: string }>();
    const { addItemToList } = useStore();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark'; // Force dark preference if needed, but respect system
    const theme = Colors[colorScheme];

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Real API call
    const handleSearch = React.useCallback(async (text: string) => {
        setQuery(text);
        if (text.length > 2) {
            setLoading(true);
            try {
                const apiKey = Constants.expoConfig?.extra?.TMDB_API_KEY;

                if (!apiKey) {
                    console.error("TMDB API Key missing");
                    setLoading(false);
                    return;
                }

                // console.log("Searching TMDB...");

                const response = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(text)}`);
                const data = await response.json();

                const items: MediaItem[] = (data.results || [])
                    .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
                    .map((item: any) => ({
                        id: item.id.toString(), // Temp ID for list compatibility
                        tmdbId: item.id,
                        title: item.title || item.name,
                        releaseYear: (item.release_date || item.first_air_date || '').split('-')[0],
                        mediaType: item.media_type as 'movie' | 'tv',
                        posterPath: item.poster_path,
                        overview: item.overview,
                    }));

                setResults(items);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setLoading(false);
            }
        } else {
            setResults([]);
        }
    }, []);

    const handleViewDetails = (item: MediaItem) => {
        router.push({
            pathname: '/details/[id]',
            params: {
                id: String(item.tmdbId), // Ensure ID is string for route matching
                item: JSON.stringify(item),
                targetListId: listId || ''
            }
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.secondaryBackground }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={[styles.searchContainer, { borderBottomColor: theme.border, backgroundColor: theme.background }]}>
                    <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
                        <Ionicons name="chevron-back" size={28} color={theme.tint} />
                    </TouchableOpacity>

                    <View style={[styles.inputWrapper, { backgroundColor: theme.secondaryBackground }]}>
                        <Ionicons name="search" size={20} color={theme.icon} style={styles.searchIcon} />
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="Search movies & TV..."
                            placeholderTextColor={theme.icon}
                            value={query}
                            onChangeText={handleSearch}
                            clearButtonMode="while-editing"
                            keyboardAppearance={colorScheme === 'dark' ? 'dark' : 'light'}
                        />
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    {loading ? (
                        <ActivityIndicator size="large" style={{ marginTop: 20 }} color={theme.tint} />
                    ) : (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            keyboardDismissMode="on-drag"
                            renderItem={({ item }) => (
                                <ListItem
                                    title={item.title}
                                    subtitle={`${item.releaseYear} • ${item.mediaType === 'movie' ? 'Movie' : 'TV'}`}
                                    image={item.posterPath}
                                    onPress={() => handleViewDetails(item)}
                                    rightElement={<Ionicons name="chevron-forward" size={24} color={theme.icon} />}
                                    showChevron={false}
                                />
                            )}
                            ListEmptyComponent={
                                query.length > 2 ? (
                                    <View style={styles.emptyContainer}>
                                        <Text style={{ color: theme.icon }}>No results found</Text>
                                    </View>
                                ) : (
                                    <View style={styles.emptyContainer}>
                                        <Text style={{ color: theme.icon, textAlign: 'center' }}>
                                            Type to search for movies or TV shows to add to your list.
                                        </Text>
                                    </View>
                                )
                            }
                        />
                    )}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        borderRadius: 10,
        paddingHorizontal: 8,
    },
    searchIcon: {
        marginRight: 6,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 0, // Fix alignment on Android
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    }
});
