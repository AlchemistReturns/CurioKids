import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut, User } from "firebase/auth";
import React from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";

export default function ChildProfile({ user }: { user: User }) {
  
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/login"); 
    } catch (error) {
      Alert.alert("Error", "Could not sign out");
    }
  };

  const Badge = ({ icon, color }: { icon: any, color: string }) => (
    <View className="bg-ternary p-3 rounded-full m-1 border-2 border-primary/20">
      <Ionicons name={icon} size={28} color={color} />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Fun Header */}
        <View className="items-center mt-8 mb-8">
          <View className="h-28 w-28 bg-[#4A7A60] rounded-full justify-center items-center mb-4 border-4 border-primary shadow-xl">
            <Ionicons name="happy" size={64} color="#F0E491" />
          </View>
          <Text className="text-primary text-3xl font-extrabold tracking-wide">
             {user.displayName || "Explorer"}
          </Text>
          <Text className="text-secondary text-lg font-semibold">Level 5 Scholar</Text>
        </View>

        {/* XP Card */}
        <View className="bg-ternary p-6 rounded-3xl mb-8 border border-secondary/30 relative overflow-hidden">
            {/* Decorative Icon */}
            <Ionicons name="trophy" size={80} color="rgba(240, 228, 145, 0.1)" style={{position: 'absolute', right: -10, bottom: -10}} />
            
            <Text className="text-secondary text-sm font-bold uppercase mb-1">Current XP</Text>
            <Text className="text-white text-4xl font-black mb-4">1,250</Text>
            
            <View className="w-full h-3 bg-base/50 rounded-full overflow-hidden">
                <View className="h-full w-[70%] bg-primary rounded-full" />
            </View>
            <Text className="text-secondary text-xs text-right mt-1">250 XP to Level 6</Text>
        </View>

        {/* Badges Collection */}
        <Text className="text-primary text-xl font-bold mb-4 ml-1">My Badges</Text>
        <View className="flex-row flex-wrap justify-center bg-base/50 p-4 rounded-2xl border-2 border-dashed border-ternary mb-8">
            <Badge icon="rocket" color="#FF6B6B" />
            <Badge icon="planet" color="#4ECDC4" />
            <Badge icon="book" color="#FFE66D" />
            <Badge icon="leaf" color="#95E1D3" />
            <Badge icon="telescope" color="#A8D8EA" />
            <View className="bg-ternary/30 p-3 rounded-full m-1 justify-center items-center w-[56px] h-[56px]">
                <Text className="text-secondary/50 text-xs">???</Text>
            </View>
        </View>

        {/* Simple Settings */}
        <View className="mb-8">
            <TouchableOpacity className="flex-row items-center justify-between bg-ternary/40 p-4 rounded-xl mb-3">
                <View className="flex-row items-center">
                    <Ionicons name="volume-high" size={24} color="#BBC863" />
                    <Text className="text-white font-bold ml-3 text-lg">Sound Effects</Text>
                </View>
                <Ionicons name="toggle" size={32} color="#F0E491" />
            </TouchableOpacity>
        </View>

        {/* Big Logout */}
        <TouchableOpacity 
          onPress={handleSignOut}
          className="bg-[#D9534F] py-4 rounded-2xl shadow-lg active:scale-95 transform transition"
        >
          <Text className="text-white text-center font-bold text-xl uppercase tracking-widest">
            Log Out
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}