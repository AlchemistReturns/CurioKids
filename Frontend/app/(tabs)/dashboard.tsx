import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { AuthService } from "../../services/AuthService";
import { User } from "../../types";

// Import the distinct dashboards
import ChildDashboardScreen from "../child/dashboard";
import ParentDashboardScreen from "../parent/dashboard";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();

      if (currentUser) {
        setUser(currentUser as any); // Type assertion or update User type
        setRole(currentUser.role || 'child');
      } else {
        router.replace("/login");
      }
    } catch (e) {
      console.error("Failed to load user profile", e);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading || role === null) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text className="mt-4 text-primary font-bold text-lg">Loading...</Text>
      </View>
    );
  }

  if (role === "parent") {
    return <ParentDashboardScreen />;
  }

  if (role === "child") {
    return <ChildDashboardScreen />;
  }

  // Fallback for unknown role
  return (
    <View className="flex-1 justify-center items-center px-6 bg-base">
      <Text className="text-center text-primary text-xl font-bold mb-4">
        Account Role Error
      </Text>
      <Text className="text-primary text-center">
        Your account does not have a valid role assigned. Please contact support.
      </Text>
      <Text
        className="mt-8 text-white font-bold bg-secondary/50 px-6 py-3 rounded-xl overflow-hidden"
        onPress={() => AuthService.logout().then(() => router.replace("/login"))}
      >
        Sign Out
      </Text>
    </View>
  );
}