import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: { backgroundColor: "#FFC226", borderTopWidth: 0, elevation: 0, height: 60, paddingBottom: 10 },
                tabBarActiveTintColor: "#5A3E29",
                tabBarInactiveTintColor: "#FFF9E6",
                sceneStyle: { backgroundColor: "#FFF9E6" },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: "Dashboard",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons
                            name="speedometer"
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

            <Tabs.Screen
                name="leaderboard"
                options={{
                    title: "Leaderboard",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="trophy" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="courses"
                options={{
                    title: "Courses",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="book" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="chatbot"
                options={{
                    title: "AI Chat",
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="chatbubbles" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
