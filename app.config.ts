import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: "ReelList",
    slug: "ReelList",
    version: "1.0.0",
    jsEngine: "hermes",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "reellist",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#101014"
    },
    ios: {
        bundleIdentifier: "com.philblunk.reellist",
        buildNumber: "1",
        supportsTablet: true
    },
    android: {
        package: "com.philblunk.reellist",
        adaptiveIcon: {
            foregroundImage: "./assets/images/adaptive-icon.png",
            backgroundColor: "#ffffff"
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false
    },
    web: {
        bundler: "metro",
        output: "static",
        favicon: "./assets/images/favicon.png"
    },
    plugins: [
        "expo-router"
    ],
    experiments: {
        typedRoutes: true
    },
    extra: {
        eas: {
            projectId: "17e3cdb5-c6b1-4018-bc90-9d9d235158b7",
        },
        TMDB_API_KEY: process.env.TMDB_API_KEY,
    }
});
