import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { LayoutAnimation, Platform, StyleSheet, Text, TouchableOpacity, UIManager, View, useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
}

export function CollapsibleSection({ title, children, defaultExpanded = true }: CollapsibleSectionProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    const toggle = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.header, { backgroundColor: theme.secondaryBackground }]}
                onPress={toggle}
                activeOpacity={0.7}
            >
                <Text style={[styles.title, { color: theme.textSecondary }]}>{title}</Text>
                <Ionicons
                    name={expanded ? "chevron-down" : "chevron-forward"}
                    size={20}
                    color={theme.icon}
                />
            </TouchableOpacity>

            {expanded && (
                <View style={styles.content}>
                    {children}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    content: {
        marginTop: 8,
    }
});
