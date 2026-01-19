import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
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
      <View className="flex-1 justify-center items-center bg-tigerCream">
        <ActivityIndicator size="large" color="#FF6E4F" />
      </View>
    );
  }

  if (!user) return <View className="flex-1 bg-tigerCream" />;

  // Default values
  const childName = childData?.name || user.displayName || "Explorer";
  const stars = progressData?.stars || 0;
  const streak = progressData?.streak || 0;
  const totalPoints = progressData?.totalPoints || 0;

  return (
    <View className="flex-1 bg-tigerCream">
      {/* Custom Header */}
      <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] flex-row justify-between items-end shadow-sm z-10">
        <View className="mb-2">
          <Text className="text-tigerBrown text-3xl font-black">Welcome back!</Text>
          <Text className="text-tigerBrown/80 text-lg font-bold">{childName} 🐯</Text>
        </View>
        {/* Tiger Image positioned slightly over the edge could be tricky, for now standard placement */}
        <Image
          source={require('../../assets/tiger.png')}
          className="w-24 h-24"
          resizeMode="contain"
        />
      </View>

      <ScrollView className="flex-1 px-6 pt-8" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* BIG Play Button */}
        <TouchableOpacity
          className="bg-tigerCard py-6 px-6 rounded-3xl flex-row items-center justify-between mb-8 shadow-sm"
          onPress={() => router.push("/(tabs)/courses")}
        >
          <View>
            <Text className="text-tigerBrown text-2xl font-black uppercase tracking-widest mb-1">Fun with Numbers</Text>
            <Text className="text-tigerBrown/70 font-bold">Continue Learning</Text>
          </View>
          <View className="bg-tigerBrown h-12 w-12 rounded-full justify-center items-center">
            <Ionicons name="play" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-8">
          {/* Trophy Card */}
          <View className="bg-tigerCard w-[31%] p-3 rounded-2xl items-center justify-center shadow-sm">
            <Ionicons name="trophy" size={28} color="#5A3E29" />
            <Text className="text-tigerBrown text-xs font-bold mt-1">Trophy</Text>
            <Text className="text-tigerBrown text-lg font-black">{totalPoints}</Text>
          </View>

          {/* Star Card */}
          <View className="bg-tigerCard w-[31%] p-3 rounded-2xl items-center justify-center shadow-sm">
            <Ionicons name="star" size={28} color="#5A3E29" />
            <Text className="text-tigerBrown text-xs font-bold mt-1">Star</Text>
            <Text className="text-tigerBrown text-lg font-black">{stars}</Text>
          </View>

          {/* Fire Card */}
          <View className="bg-tigerCard w-[31%] p-3 rounded-2xl items-center justify-center shadow-sm">
            <Ionicons name="flame" size={28} color="#5A3E29" />
            <Text className="text-tigerBrown text-xs font-bold mt-1">Fire</Text>
            <Text className="text-tigerBrown text-lg font-black">{streak}</Text>
          </View>
        </View>

        {/* Daily Mission */}
        <Text className="text-tigerBrown text-xl font-bold mb-4">Today's Mission</Text>
        <TouchableOpacity className="bg-tigerCard p-5 rounded-2xl flex-row items-center mb-8 shadow-sm">
          <View className="bg-tigerBrown/10 h-12 w-12 rounded-full justify-center items-center mr-4">
            <Ionicons name="rocket" size={24} color="#5A3E29" />
          </View>
          <View className="flex-1">
            <Text className="text-tigerBrown font-bold text-lg">Complete a Lesson</Text>
            <Text className="text-tigerBrown/70 text-sm font-bold">Reward: +10 Stars</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#5A3E29" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}