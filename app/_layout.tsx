import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '../constants/Colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { StoreProvider } from '../context/StoreContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'auth';

    if (!session && !inAuthGroup) {
      // Redirect to the sign-in page.
      if (pathname.startsWith('/invite/')) {
        router.replace({
          pathname: '/auth',
          params: { returnTo: pathname }
        });
      } else {
        router.replace('/auth');
      }
    } else if (session) {
      if (!profile) {
        // No profile yet? Send to create profile.
        // We check if we are already there to avoid loop.
        // @ts-ignore: segment typing mismatch
        if (segments[1] !== 'create-profile') {
          // @ts-ignore: route typing mismatch
          router.replace('/auth/create-profile');
        }
      } else if (inAuthGroup) {
        // Has session AND profile, but is in auth group (login or create profile)
        // Redirect to home
        router.replace('/');
      }
    }
  }, [session, profile, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'dark'].tint} />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colorScheme === 'dark' ? Colors.dark.background : Colors.light.background,
          },
          headerTintColor: colorScheme === 'dark' ? Colors.dark.tint : Colors.light.tint,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        <Stack.Screen name="index" options={{ title: 'ReelList' }} />
        <Stack.Screen name="auth/index" options={{ headerShown: false }} />
        <Stack.Screen name="list/[id]" options={{ title: 'List Details' }} />
        <Stack.Screen name="search" options={{ presentation: 'modal', headerShown: false }} />
        <Stack.Screen name="share" options={{ presentation: 'modal', title: 'Share List' }} />
        <Stack.Screen name="details/[id]" options={{ presentation: 'modal', title: 'Details' }} />
        <Stack.Screen name="watched" options={{ presentation: 'modal', title: 'Watched History' }} />
        <Stack.Screen name="+not-found" />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <StoreProvider>
        <InitialLayout />
      </StoreProvider>
    </AuthProvider>
  );
}
