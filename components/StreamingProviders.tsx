import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useColorScheme
} from 'react-native';
import { Colors } from '../constants/Colors';
import { MediaType } from '../types';

interface StreamingProvidersProps {
    tmdbId: number;
    mediaType: MediaType;
}

interface Provider {
    provider_id: number;
    provider_name: string;
    logo_path: string;
}

export function StreamingProviders({ tmdbId, mediaType }: StreamingProvidersProps) {
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    useEffect(() => {
        let isMounted = true;

        const fetchProviders = async () => {
            if (!tmdbId) return;

            try {
                const apiKey = Constants.expoConfig?.extra?.TMDB_API_KEY;
                if (!apiKey) {
                    console.warn("TMDB API Key missing");
                    setError(true);
                    return;
                }

                const url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/watch/providers?api_key=${apiKey}`;
                const response = await fetch(url);
                const data = await response.json();

                if (isMounted) {
                    // Default to US region, look for flatrate (streaming) options
                    const usData = data.results?.US;

                    if (usData) {
                        setProviders(usData.flatrate || []);
                    } else {
                        setProviders([]);
                    }
                }
            } catch (e) {
                console.error("Error fetching providers:", e);
                if (isMounted) setError(true);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchProviders();

        return () => {
            isMounted = false;
        };
    }, [tmdbId, mediaType]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={theme.textSecondary} />
            </View>
        );
    }

    if (error || providers.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Where to Watch</Text>
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                    Not currently streaming
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Where to Watch</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {providers.map((provider) => (
                    <View
                        key={provider.provider_id}
                        style={styles.providerItem}
                    >
                        <Image
                            source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                            style={[styles.logo, { backgroundColor: theme.card }]}
                        />
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 8,
    },
    loadingContainer: {
        marginTop: 24,
        height: 60,
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
        gap: 16,
    },
    providerItem: {
        alignItems: 'center',
        marginRight: 4,
    },
    logo: {
        width: 50,
        height: 50,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    emptyText: {
        fontSize: 15,
        fontStyle: 'italic',
    }
});
