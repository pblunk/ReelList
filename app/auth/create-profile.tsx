import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useColorScheme,
    View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function CreateProfile() {
    const [displayName, setDisplayName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { session, refreshProfile } = useAuth();
    const colorScheme = useColorScheme();
    const theme = Colors[colorScheme ?? 'dark'];

    const handleSave = async () => {
        if (!displayName.trim()) {
            Alert.alert('Required', 'Please enter a display name.');
            return;
        }

        if (!session?.user) {
            Alert.alert('Error', 'No user session found.');
            return;
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: session.user.id,
                    display_name: displayName.trim(),
                });

            if (error) throw error;

            // Refresh profile in context so the app knows we are good to go
            await refreshProfile();

            // Navigate to home
            router.replace('/');
        } catch (e: any) {
            Alert.alert('Error', e.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, { backgroundColor: theme.background }]}
            >
                <View style={[styles.card, { backgroundColor: theme.card }]}>
                    <Text style={[styles.title, { color: theme.text }]}>Welcome to ReelList</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Choose a display name to get started. This will be visible to friends when you share lists.
                    </Text>

                    <TextInput
                        style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
                        placeholder="Display Name (e.g. MovieBuff99)"
                        placeholderTextColor={theme.textSecondary}
                        value={displayName}
                        onChangeText={setDisplayName}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.tint }]}
                        onPress={handleSave}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Start Watching</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        padding: 24,
        borderRadius: 16,
        gap: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 16,
        marginTop: -8,
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
    },
    button: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
