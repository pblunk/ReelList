import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

const THEME = Colors.dark; // Force dark theme

export type CinematicHeaderProps = {
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    rightElement?: React.ReactNode;
    onTitlePress?: () => void;
};

export function CinematicHeader({ title = 'ReelList', subtitle, showBack = false, rightElement, onTitlePress }: CinematicHeaderProps) {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.content}>
                    <View style={styles.leftContainer}>
                        {showBack ? (
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="chevron-back" size={28} color={THEME.tint} />
                            </TouchableOpacity>
                        ) : (
                            <Ionicons name="film-outline" size={24} color={THEME.tint} style={{ marginRight: 8 }} />
                        )}
                        {onTitlePress ? (
                            <TouchableOpacity onPress={onTitlePress} activeOpacity={0.7}>
                                <View style={{ justifyContent: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={styles.title}>{title}</Text>
                                        <Ionicons name="pencil" size={16} color={THEME.textSecondary} style={{ marginLeft: 8 }} />
                                    </View>
                                    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                                </View>
                            </TouchableOpacity>
                        ) : (
                            <View>
                                <Text style={styles.title}>{title}</Text>
                                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
                            </View>
                        )}
                    </View>

                    {rightElement && (
                        <View style={styles.rightContainer}>
                            {rightElement}
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: THEME.background,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: THEME.border,
        paddingTop: Platform.OS === 'android' ? 24 : 0, // Handle android status bar if not handled by SafeArea
    },
    safeArea: {
        backgroundColor: THEME.background,
    },
    content: {
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    leftContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800', // Heavy weight for cinematic feel
        color: THEME.text,
        letterSpacing: 0.5,
    },
    backButton: {
        marginRight: 8,
        marginLeft: -8,
    },
    subtitle: {
        fontSize: 12,
        color: THEME.textSecondary,
        marginTop: -2,
    }
});
