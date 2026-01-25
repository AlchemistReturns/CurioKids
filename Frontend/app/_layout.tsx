import { Stack } from "expo-router";
import "./globals.css";
import { SessionProvider } from "../context/SessionContext";
import TimeoutScreen from "../components/TimeoutScreen";

export default function RootLayout() {
    return (
        <SessionProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: "#edf0f7",
                    },
                }}
            />
            <TimeoutScreen />
        </SessionProvider>
    );
}
