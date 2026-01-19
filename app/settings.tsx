import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { CinematicHeader } from '../components/CinematicHeader';
import { Colors } from '../constants/Colors';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen() {
    const { user, profile, signOut } = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];
    const [loading, setLoading] = React.useState(false);

    const handleSignOut = async () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Sign Out",
                style: "destructive",
                onPress: async () => {
                    setLoading(true);
                    await signOut();
                    // Navigation is handled by RootLayout auth protection
                }
            }
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <CinematicHeader
                title="Settings"
                showBack={true}
                rightElement={null}
            />

            <View style={styles.content}>
                <View style={[styles.section, { backgroundColor: theme.card }]}>
                    <View style={styles.userRow}>
                        <View style={[styles.avatar, { backgroundColor: theme.secondaryBackground }]}>
                            <Ionicons name="person" size={32} color={theme.textSecondary} />
                        </View>
                        <View style={styles.userInfo}>
                            <Text style={[styles.email, { color: theme.text }]}>
                                {profile?.display_name || user?.email}
                            </Text>
                            {profile?.display_name && (
                                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 2 }]}>
                                    {user?.email}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.signOutButton, { borderColor: theme.danger }]}
                onPress={handleSignOut}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={theme.danger} />
                ) : (
                    <Text style={[styles.signOutText, { color: theme.danger }]}>Sign Out</Text>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={[styles.version, { color: theme.textSecondary }]}>ReelList v1.0.0</Text>
            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    section: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    label: {
        fontSize: 13,
        marginBottom: 4,
    },
    email: {
        fontSize: 17,
        fontWeight: '600',
    },
    signOutButton: {
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    signOutText: {
        fontSize: 17,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
    },
    version: {
        fontSize: 13,
        opacity: 0.5,
    },
});
