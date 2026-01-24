import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import { User } from "../../types";

import React, { useCallback, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ChildProfile({ user }: { user: User }) {
  const [profileData, setProfileData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [user])
  );

  const loadProfile = async () => {
    if (!user) return;
    try {
      const [profile, progress] = await Promise.all([
        UserService.getProfile(user.uid),
        UserService.getProgress(user.uid)
      ]);
      if (profile) setProfileData(profile);
      if (progress) setProgressData(progress);
    } catch (e) {
      console.error("Error loading profile", e);
    }
  };

  // Helper to capitalize subject names
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Extract marks from DB (from 'categoryScores' map)
  const subjects = profileData?.categoryScores || {};
  const subjectKeys = Object.keys(subjects);

  const badges = progressData?.badges || [];
  const streak = progressData?.streak || 0;
  const totalPoints = progressData?.totalPoints || 0;

  return (
    <View className="flex-1 bg-tigerCream">
      {/* Custom Header */}
      <View className="bg-tigerYellow pt-12 pb-12 px-6 rounded-b-[40px] items-center shadow-sm z-10 mb-4 relative">
        <View className="h-28 w-28 bg-white rounded-full justify-center items-center mb-4 border-4 border-tigerOrange shadow-sm">
          <Text className="text-tigerOrange text-5xl font-black">
            {profileData?.name?.[0] || user.displayName?.[0] || "S"}
          </Text>
        </View>
        <Text className="text-tigerBrown text-3xl font-black tracking-wide">
          {profileData?.name || user.displayName || "Student"}
        </Text>
        <Text className="text-tigerBrown/70 font-bold">{user.email}</Text>

        {/* Decorative Tiger */}
        <Image
          source={require('../../assets/tiger.png')}
          className="w-16 h-16 absolute bottom-4 right-6 opacity-80"
          resizeMode="contain"
        />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>

        {/* Stats Section with Fire Streak */}
        <View className="flex-row justify-between mb-8">
          {/* Streak */}
          <View className="bg-white p-4 rounded-3xl flex-1 mr-2 items-center justify-center border-2 border-tigerOrdering/10 shadow-sm relative">
            <Ionicons name="flame" size={60} color="#FF8C00" />
            <View className="absolute top-[28px] items-center justify-center w-full">
              <Text className="text-white font-black text-lg shadow-sm">{streak}</Text>
            </View>
            <Text className="text-tigerBrown font-bold mt-1">Day Streak</Text>
          </View>

          {/* Points/Stars */}
          <View className="bg-white p-4 rounded-3xl flex-1 ml-2 items-center justify-center border-2 border-tigerBrown/10 shadow-sm">
            <Ionicons name="star" size={50} color="#FFD700" className="mb-1" />
            <Text className="text-tigerOrange text-2xl font-black">{totalPoints}</Text>
            <Text className="text-tigerBrown font-bold">Total Stars</Text>
          </View>
        </View>

        {/* League Section */}
        <View className="mb-8">
          <Text className="text-tigerBrown text-xl font-black mb-4">Current League</Text>
          <View className="bg-white rounded-3xl overflow-hidden shadow-sm border-2 border-tigerBrown/10 relative">
            <Image
              source={require('../../assets/league_banner.png')}
              className="w-full h-32"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/30 justify-center items-center">
              <Text
                className="text-white text-3xl font-black uppercase tracking-widest"
                style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 5 }}
              >
                {totalPoints >= 500 ? "King" : (totalPoints >= 100 ? "Bloomer" : "Novice")}
              </Text>
              <Text
                className="text-white font-bold opacity-90"
                style={{ textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }}
              >
                {totalPoints >= 500 ? "Top 100" : (totalPoints >= 100 ? "Rising Star" : "Just Started")}
              </Text>
            </View>
          </View>
        </View>

        {/* Badges Section */}
        <Text className="text-tigerBrown text-xl font-black mb-4">My Badges</Text>
        {badges.length === 0 ? (
          <View className="bg-tigerCard p-4 rounded-3xl items-center mb-8 border-2 border-tigerBrown/5">
            <Text className="text-tigerBrown font-bold text-center">No badges yet.</Text>
            <Text className="text-tigerBrown/60 text-xs mt-1">Complete courses to earn them!</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
            {badges.map((badge: any, index: number) => (
              <TouchableOpacity
                key={index}
                className="bg-white p-3 rounded-2xl mr-3 items-center w-28 border-2 border-tigerCream shadow-sm"
                onPress={() => Alert.alert("Badge Earned!", `You completed: ${badge.name}`)}
              >
                <Image
                  source={require('../../assets/badge_trophy.png')}
                  className="w-16 h-16 mb-2"
                  resizeMode="contain"
                />
                <Text className="text-tigerBrown text-xs font-bold text-center leading-4" numberOfLines={2}>
                  {badge.name.replace(' Master', '')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Academic Performance Section */}
        <Text className="text-tigerBrown text-xl font-black mb-4">Subject Points</Text>

        {subjectKeys.length === 0 ? (
          <View className="bg-tigerCard p-6 rounded-3xl items-center mb-8 border-2 border-tigerBrown/5">
            <Ionicons name="book-outline" size={48} color="#5A3E29" className="mb-2 opacity-50" />
            <Text className="text-tigerBrown font-bold text-center">No marks recorded yet.</Text>
            <Text className="text-tigerBrown/60 text-xs mt-1 font-bold">Play games to earn scores!</Text>
          </View>
        ) : (
          <View className="mb-8">
            {subjectKeys.map((subject, index) => (
              <View
                key={index}
                className="flex-row items-center justify-between bg-white p-5 rounded-3xl mb-3 shadow-sm border-2 border-tigerCream"
              >
                <View className="flex-row items-center">
                  <View className="bg-tigerCard p-3 rounded-2xl mr-4">
                    <Ionicons name="bookmark" size={24} color="#5A3E29" />
                  </View>
                  <Text className="text-tigerBrown text-lg font-black capitalize">
                    {capitalize(subject)}
                  </Text>
                </View>

                <View className="items-end">
                  <Text className="text-tigerOrange text-2xl font-black">
                    {subjects[subject]}
                  </Text>
                  <Text className="text-tigerBrown/50 text-[10px] uppercase font-bold tracking-widest">Score</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Account Actions */}
        <View className="mb-8">
          <TouchableOpacity className="flex-row items-center justify-between bg-tigerCard p-4 rounded-2xl mb-3 border-2 border-tigerBrown/5">
            <View className="flex-row items-center">
              <View className="bg-white p-2 rounded-xl mr-3">
                <Ionicons name="settings-outline" size={24} color="#5A3E29" />
              </View>
              <Text className="text-tigerBrown font-bold text-lg">App Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#5A3E29" />
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}