import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";

export default function ChildDashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [childData, setChildData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      checkSession();
    }, [])
  );

  const checkSession = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        const forceLogout = await AuthService.checkChildStatus(currentUser.uid);
        if (forceLogout) {
          await AuthService.logout();
          router.replace("/login");
          Alert.alert("Session Ended", "Your parent has logged you out.");
        }
      }
    } catch (e) {
      console.error("Session check failed", e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser); // From local storage

      // Parallel fetch for speed
      const [profile, progress] = await Promise.all([
        UserService.getProfile(currentUser.uid),
        UserService.getProgress(currentUser.uid)
      ]);

      setChildData(profile);
      setProgressData(progress);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <ActivityIndicator size="large" color="#F0E491" />
      </View>
    );
  }

  if (!user) return <View className="flex-1 bg-base" />;

  // Default values
  const childName = childData?.name || user.displayName || "Explorer";
  const stars = progressData?.stars || 0;
  const streak = progressData?.streak || 0;
  const totalPoints = progressData?.totalPoints || 0;

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row justify-between items-center mt-6 mb-10">
          <View className="flex-row items-center">
            <View className="h-14 w-14 bg-primary rounded-full justify-center items-center border-2 border-primary mr-4">
              <Ionicons name="happy" size={32} color="#F0E491" />
            </View>
            <View>
              <Text className="text-primary font-bold text-2xl">Welcome back!</Text>
            </View>
          </View>
          {/* Logout button removed as per requirements */}
        </View>

        {/* BIG Play Button */}
        <TouchableOpacity
          className="bg-primary h-48 rounded-3xl justify-center items-center mb-8 shadow-lg shadow-black/50"
          onPress={() => router.push("/(tabs)/courses")}
        >
          <View className="bg-primary p-1 rounded-full mb-2">
            <Ionicons name="play" size={48} color="#fff" />
          </View>
          <Text className="text-white text-2xl font-black uppercase tracking-widest">Fun with Numbers</Text>
          <Text className="text-base/70 font-semibold">Continue Learning</Text>
        </TouchableOpacity>

        {/* Stats Row (Updated to include Points) */}
        <View className="flex-row justify-between mb-8">

          {/* Points Card */}
          <View className="bg-primary w-[31%] p-3 rounded-2xl items-center justify-center">
            <Ionicons name="trophy" size={28} color="#F0E491" />
            <Text className="text-white text-xl font-bold mt-1">{totalPoints}</Text>
          </View>

          {/* Stars Card */}
          <View className="bg-primary w-[31%] p-3 rounded-2xl items-center justify-center">
            <Ionicons name="star" size={28} color="#F0E491" />
            <Text className="text-white text-xl font-bold mt-1">{stars}</Text>
          </View>

          {/* Streak Card */}
          <View className="bg-primary w-[31%] p-3 rounded-2xl items-center justify-center">
            <Ionicons name="flame" size={28} color="#F0E491" />
            <Text className="text-white text-xl font-bold mt-1">{streak}</Text>
          </View>

        </View>

        {/* Daily Mission */}
        <Text className="text-primary text-xl font-bold mb-4">Today's Mission</Text>
        <TouchableOpacity className="bg-primary p-5 rounded-2xl flex-row items-center mb-8">
          <View className="bg-secondary/40 h-12 w-12 rounded-full justify-center items-center mr-4">
            <Ionicons name="rocket" size={24} color="#F0E491" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Complete a Lesson</Text>
            <Text className="text-secondary text-sm">Reward: +10 Stars</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#F0E491" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}