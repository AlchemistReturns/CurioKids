import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut, User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from "../../config/firebase";

export default function ParentProfile({ user }: { user: User }) {
  const [childCount, setChildCount] = useState(0);

  // Fetch count of linked children for the UI
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const q = query(collection(firestore, "users"), where("parentUid", "==", user.uid));
        const snapshot = await getDocs(q);
        setChildCount(snapshot.size);
      } catch (e) {
        console.log("Error fetching children count", e);
      }
    };
    fetchChildren();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/login"); 
    } catch (error) {
      Alert.alert("Error", "Failed to sign out");
    }
  };

  const SettingItem = ({ icon, label, subtext }: { icon: any, label: string, subtext?: string }) => (
    <TouchableOpacity className="flex-row items-center bg-ternary/20 p-4 rounded-2xl mb-3 border border-ternary/50 active:bg-ternary/40">
      <View className="bg-base p-2 rounded-full mr-4">
        <Ionicons name={icon} size={20} color="#F0E491" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-base font-semibold">{label}</Text>
        {subtext && <Text className="text-secondary text-xs">{subtext}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#BBC863" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="items-center mt-6 mb-8">
          <View className="h-24 w-24 bg-ternary rounded-full justify-center items-center mb-4 border-2 border-primary shadow-lg">
            <Text className="text-primary text-4xl font-bold">
                {user.email ? user.email[0].toUpperCase() : "P"}
            </Text>
          </View>
          <Text className="text-primary text-2xl font-bold">Parent Account</Text>
          <Text className="text-secondary text-sm">{user.email}</Text>
          <View className="bg-[#4A7A60] px-3 py-1 rounded-full mt-3 border border-secondary/30">
            <Text className="text-white text-xs font-bold uppercase">Standard Plan</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-8 bg-ternary/30 p-4 rounded-2xl">
            <View className="items-center flex-1 border-r border-base/50">
                <Text className="text-primary text-xl font-bold">{childCount}</Text>
                <Text className="text-secondary text-xs">Children</Text>
            </View>
            <View className="items-center flex-1">
                <Text className="text-primary text-xl font-bold">Active</Text>
                <Text className="text-secondary text-xs">Status</Text>
            </View>
        </View>

        {/* Settings List */}
        <Text className="text-primary text-lg font-bold mb-4">Account Settings</Text>
        <View className="mb-8">
          <SettingItem icon="notifications-outline" label="Notifications" subtext="Email & Push alerts" />
          <SettingItem icon="card-outline" label="Subscription" subtext="Manage billing" />
          <SettingItem icon="lock-closed-outline" label="Security" subtext="Change password" />
          <SettingItem icon="help-circle-outline" label="Support" subtext="Contact us" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleSignOut}
          className="flex-row justify-center items-center bg-[#8B4513] py-4 rounded-xl mb-10 shadow-md active:opacity-90"
        >
          <Ionicons name="log-out-outline" size={24} color="#F0E491" style={{ marginRight: 8 }} />
          <Text className="text-primary font-bold text-lg">Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}