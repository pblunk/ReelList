import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors } from '../constants/Colors';

import { useEffect, useState } from 'react';
import { useProfile } from '../hooks/useProfile';

// ... imports ...

interface ListItemProps {
    title: string;
    subtitle?: string;
    image?: string | null;
    onPress?: () => void;
    showChevron?: boolean;
    rightElement?: React.ReactNode;
    isDestructive?: boolean;
    addedBy?: string; // Legacy/Text fallback
    addedByUserId?: string; // UUID to fetch profile
}

export function ListItem({
    title,
    subtitle,
    image,
    onPress,
    showChevron = true,
    rightElement,
    isDestructive,
    addedBy,
    addedByUserId,
}: ListItemProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const theme = Colors[colorScheme];

    // Profile fetching
    const { getProfile } = useProfile();
    const [addedByName, setAddedByName] = useState<string | null>(null);

    useEffect(() => {
        if (addedByUserId) {
            getProfile(addedByUserId).then(p => {
                if (p?.display_name) {
                    setAddedByName(p.display_name);
                }
            });
        }
    }, [addedByUserId, getProfile]);

    // Use fetched name, or fallback to passed 'addedBy' text (e.g. email or legacy), or nothing
    const displayAddedBy = addedByName || addedBy;

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.container,
                {
                    backgroundColor: theme.card,
                    shadowColor: theme.shadow,
                },
                pressed && { opacity: 0.7, transform: [{ scale: 0.99 }] },
            ]}
        >
            <View style={styles.content}>
                {image && (
                    <Image source={{ uri: `https://image.tmdb.org/t/p/w92${image}` }} style={styles.image} />
                )}
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: isDestructive ? theme.danger : theme.text }]}>
                        {title}
                    </Text>
                    {subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
                    {displayAddedBy && (
                        <Text style={[styles.subtitle, { color: theme.tint, fontSize: 12, marginTop: 4 }]}>
                            Added by {displayAddedBy}
                        </Text>
                    )}
                </View>
                <View style={styles.rightContainer}>
                    {rightElement}
                    {showChevron && (
                        <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} style={{ marginLeft: 8 }} />
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginVertical: 6,
        borderRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15, // Slightly stronger for dark mode visibility
        shadowRadius: 4,
        elevation: 3, // Android shadow
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    image: {
        width: 40,
        height: 60,
        borderRadius: 4,
        marginRight: 12,
        backgroundColor: '#e1e1e1',
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 17,
        fontWeight: '400',
    },
    subtitle: {
        fontSize: 14,
        marginTop: 2,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
