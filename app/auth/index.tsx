import { Ionicons } from '@expo/vector-icons';
import { Href, Stack, useRouter } from 'expo-router';
import { useSearchParams } from 'expo-router/build/hooks';
import React, { useState } from 'react';
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
    View,
    useColorScheme
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'email' | 'otp'>('email');
    const [loading, setLoading] = useState(false);
    const { signInWithOtp, verifyOtp } = useAuth();
    const router = useRouter();
    const params = useSearchParams();
    const returnTo = params?.get("returnTo") as string | undefined;
    const colorScheme = useColorScheme() ?? 'dark';
    const theme = Colors[colorScheme];

    const handleLogin = async () => {
        if (step === 'email') {
            if (!email.trim()) {
                Alert.alert("Email required", "Please enter your email address.");
                return;
            }

            setLoading(true);
            const { error } = await signInWithOtp(email);
            setLoading(false);

            if (error) {
                Alert.alert("Login Failed", error.message);
            } else {
                setStep('otp');
                Alert.alert("Check your email", "We sent you a verification code.");
            }
        } else {
            if (!otp.trim()) {
                Alert.alert("Code required", "Please enter the 6-digit code.");
                return;
            }
            setLoading(true);
            const { error } = await verifyOtp(email, otp);
            setLoading(false);

            if (error) {
                Alert.alert("Verification Failed", error.message);
            } else {
                if (returnTo) {
                    router.replace(returnTo as Href);
                }
                // If no returnTo, _layout.tsx will redirect to home
            }
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <Stack.Screen options={{ headerShown: false }} />

            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.header}>
                        <Ionicons name="film-outline" size={64} color={theme.tint} style={{ marginBottom: 16 }} />
                        <Text style={[styles.title, { color: theme.text }]}>ReelList</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Your personal cinematic universe.
                        </Text>
                    </View>

                    <View style={styles.form}>
                        {step === 'email' ? (
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.secondaryBackground }]}
                                    placeholder="Enter your email"
                                    placeholderTextColor={theme.textSecondary}
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    autoCorrect={false}
                                />
                            </View>
                        ) : (
                            <View style={styles.inputContainer}>
                                <Ionicons name="key-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.input, { color: theme.text, backgroundColor: theme.secondaryBackground }]}
                                    placeholder="Enter 6-digit code"
                                    placeholderTextColor={theme.textSecondary}
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    maxLength={6}
                                />
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.button, { backgroundColor: theme.tint, opacity: loading ? 0.7 : 1 }]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>
                                    {step === 'email' ? "Send Code" : "Verify Code"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {step === 'otp' && (
                            <TouchableOpacity onPress={() => setStep('email')} style={{ marginTop: 16 }}>
                                <Text style={{ color: theme.tint, textAlign: 'center' }}>Change Email</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
                            By continuing, you agree to our Terms of Service and Privacy Policy.
                        </Text>
                    </View>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 48,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
    form: {
        width: '100%',
        marginBottom: 32,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    inputIcon: {
        position: 'absolute',
        left: 16,
        zIndex: 1,
    },
    input: {
        flex: 1,
        height: 56,
        borderRadius: 12,
        paddingLeft: 48,
        paddingRight: 16,
        fontSize: 17,
    },
    button: {
        height: 56,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        textAlign: 'center',
        opacity: 0.6,
    },
});
