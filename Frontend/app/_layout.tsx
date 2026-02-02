import { Stack } from "expo-router";
import "./globals.css";
import { SessionProvider, useSession } from "../context/SessionContext";
import { TimeoutScreen } from "../components/TimeoutScreen";
import { View } from "react-native";

// Separate component to safely use the hook
function AppLayout() {
    const { isTimeout } = useSession();

    return (
        <View style={{ flex: 1 }}>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: "#edf0f7",
                    },
                }}
            />
            {isTimeout && <TimeoutScreen />}
        </View>
    );
}

export default function RootLayout() {
    return (
        <SessionProvider>
            <AppLayout />
        </SessionProvider>
    );
}
