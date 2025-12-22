import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import { User } from "../../types";

export default function ParentProfile({ user }: { user: User }) {
  const [childCount, setChildCount] = useState(0);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const children = await UserService.getChildren(user.uid);
        setChildCount(children.length);
      } catch (e) {
        console.log("Error fetching children count", e);
      }
    };
    fetchChildren();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await AuthService.logout();
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const SettingItem = ({ icon, label, subtext, onPress }: { icon: any, label: string, subtext?: string, onPress?: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center bg-primary/20 p-4 rounded-2xl mb-3 border border-primary active:bg-primary"
    >
      <View className="bg-base p-2 rounded-full mr-4">
        <Ionicons name={icon} size={20} color="#3f51b5" />
      </View>
      <View className="flex-1">
        <Text className="text-primary text-base font-semibold">{label}</Text>
        {/* {subtext && <Text className="text-primary text-xs">{subtext}</Text>} */}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#3f51b5" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="items-center mt-6 mb-8">
          <View className="h-24 w-24 bg-primary rounded-full justify-center items-center mb-4 shadow-lg">
            <Text className="text-white text-4xl font-bold">
              {user.email ? user.email[0].toUpperCase() : "P"}
            </Text>
          </View>
          <Text className="text-primary text-2xl font-bold">Parent Account</Text>
          <Text className="text-primary text-sm">{user.email}</Text>
        </View>

        <View className="flex-row justify-between mb-8 bg-primary p-4 rounded-2xl">
          <View className="items-center flex-1 border-r border-base/50">
            <Text className="text-white text-xl font-bold">{childCount}</Text>
            <Text className="text-white text-xs">Children</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-white text-xl font-bold">Active</Text>
            <Text className="text-white text-xs">Status</Text>
          </View>
        </View>

        <Text className="text-primary text-lg font-bold mb-4">Account Settings</Text>
        <View className="mb-8">
          <SettingItem icon="notifications-outline" label="Notifications" subtext="Email & Push alerts" />
          <SettingItem
            icon="lock-closed-outline"
            label="Security"
            subtext="Change password"
            onPress={() => router.push("/parent/change-password")}
          />
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="flex-row bg-[#D9534F] justify-center items-center py-4 rounded-xl mb-10"
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-lg">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
