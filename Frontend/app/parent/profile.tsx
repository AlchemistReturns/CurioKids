import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import { User } from "../../types";

export default function ParentProfile({ user }: { user: User }) {
  const [children, setChildren] = useState<any[]>([]);

  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const data = await UserService.getChildren(user.uid);
        setChildren(data);
      } catch (e) {
        console.log("Error fetching children", e);
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
      className="flex-row items-center bg-white p-4 rounded-3xl mb-3 shadow-sm border-2 border-tigerCream active:bg-tigerCard"
    >
      <View className="bg-tigerCream p-3 rounded-2xl mr-4">
        <Ionicons name={icon} size={22} color="#5A3E29" />
      </View>
      <View className="flex-1">
        <Text className="text-tigerBrown text-lg font-bold">{label}</Text>
        {/* {subtext && <Text className="text-tigerBrown/60 text-xs font-semibold">{subtext}</Text>} */}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#5A3E29" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-tigerCream">
      {/* Custom Header */}
      <View className="bg-tigerYellow pt-12 pb-12 px-6 rounded-b-[40px] items-center shadow-sm z-10 mb-6 relative">
        <View className="h-24 w-24 bg-white rounded-full justify-center items-center mb-4 border-4 border-tigerOrange shadow-sm">
          <Text className="text-tigerOrange text-4xl font-black">
            {user.email ? user.email[0].toUpperCase() : "P"}
          </Text>
        </View>
        <Text className="text-tigerBrown text-2xl font-black">Parent Account</Text>
        <Text className="text-tigerBrown/70 font-bold">{user.email}</Text>

        <Image
          source={require('../../assets/tiger.png')}
          className="w-16 h-16 absolute bottom-4 right-6 opacity-80"
          resizeMode="contain"
        />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>

        <View className="flex-row justify-between mb-8 bg-tigerCard p-5 rounded-3xl border-2 border-tigerBrown/5">
          <View className="items-center flex-1 border-r border-tigerBrown/10">
            <Text className="text-tigerBrown text-2xl font-black">{children.length}</Text>
            <Text className="text-tigerBrown/60 text-xs font-bold uppercase tracking-widest">Children</Text>
          </View>
          <View className="items-center flex-1">
            <Text className="text-tigerBrown text-2xl font-black">Active</Text>
            <Text className="text-tigerBrown/60 text-xs font-bold uppercase tracking-widest">Status</Text>
          </View>
        </View>

        {/* Children Progress Section */}
        <Text className="text-tigerBrown text-xl font-black mb-4">Children Progress</Text>
        {children.length === 0 ? (
          <View className="bg-white p-6 rounded-3xl items-center mb-8 border-2 border-tigerBrown/5">
            <Text className="text-tigerBrown font-bold">No children linked yet.</Text>
          </View>
        ) : (
          <View className="mb-8">
            {children.map((child, index) => (
              <View key={index} className="bg-white p-5 rounded-3xl mb-4 shadow-sm border-2 border-tigerCream">
                <View className="flex-row items-center justify-between mb-3 border-b border-tigerCream pb-2">
                  <Text className="text-tigerBrown text-lg font-black">{child.name || "Child"}</Text>
                  <View className="bg-tigerCard px-3 py-1 rounded-full">
                    <Text className="text-tigerOrange font-bold text-xs">{child.totalPoints || 0} pts</Text>
                  </View>
                </View>

                <Text className="text-tigerBrown/60 text-xs font-bold uppercase tracking-widest mb-2">Completed Courses</Text>

                {(child.badges && child.badges.length > 0) ? (
                  <View className="flex-row flex-wrap">
                    {child.badges.map((badge: any, bIndex: number) => (
                      <View key={bIndex} className="bg-green-100 rounded-lg px-3 py-2 mr-2 mb-2 border border-green-200 flex-row items-center">
                        <Ionicons name="checkmark-circle" size={16} color="green" style={{ marginRight: 4 }} />
                        <Text className="text-green-800 text-xs font-bold">{badge.name.replace(' Master', '')}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text className="text-gray-400 text-sm italic">No courses completed yet.</Text>
                )}
              </View>
            ))}
          </View>
        )}


        <Text className="text-tigerBrown text-xl font-black mb-4">Account Settings</Text>
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
          className="flex-row bg-tigerOrange justify-center items-center py-4 rounded-2xl mb-10 shadow-sm"
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-lg">Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
