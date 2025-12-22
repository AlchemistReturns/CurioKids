import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { AuthService } from "../../services/AuthService";
import { User } from "../../types";

// Import the role-specific profiles
import ChildProfile from "../child/profile";
import ParentProfile from "../parent/profile";

export default function ProfileWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // 1. Monitor Auth State
  // 1. Monitor Auth State & Fetch Role
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();

      if (currentUser) {
        setUser(currentUser as any);
        setRole(currentUser.role || 'child');
      } else {
        router.replace("/login");
      }
    } catch (e) {
      console.error("Profile load error:", e);
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  };

  // 3. Loading State (Themed)
  if (loading || !user) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text className="mt-4 text-primary font-bold">Loading Profile...</Text>
      </View>
    );
  }

  // 4. Render Role-Based Content
  if (role === "parent") {
    return <ParentProfile user={user} />;
  }

  if (role === "child") {
    return <ChildProfile user={user} />;
  }

  // 5. Fallback for Unknown Role
  return (
    <View className="flex-1 justify-center items-center bg-base px-6">
      <Text className="text-center text-primary text-xl font-bold mb-4">
        Profile Error
      </Text>
      <Text className="text-primary text-center mb-8">
        We couldn't determine your account type.
      </Text>
      <TouchableOpacity
        onPress={() => AuthService.logout().then(() => router.replace("/login"))}
        className="bg-secondary/20 px-6 py-3 rounded-xl"
      >
        <Text className="text-primary font-bold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}