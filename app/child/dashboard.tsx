import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";

const ChildDashboardScreen = () => {
  const [user, setUser] = useState<User | null>(null);

  // Simple Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else router.replace("/login");
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Error signing out");
    }
  };

  if (!user) return <View className="flex-1 bg-base" />;

  // Extract display name or use default
  const childName = user.displayName || "Explorer"; 

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        
        {/* Header with Logout (Hidden/Subtle) */}
        <View className="flex-row justify-between items-center mt-6 mb-10">
          <View className="flex-row items-center">
            <View className="h-14 w-14 bg-ternary rounded-full justify-center items-center border-2 border-primary mr-4">
               <Ionicons name="happy" size={32} color="#F0E491" />
            </View>
            <View>
              <Text className="text-secondary font-bold text-lg">Welcome back,</Text>
              <Text className="text-primary text-3xl font-extrabold">{childName}!</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleSignOut} className="bg-ternary p-2 rounded-full">
             <Ionicons name="log-out-outline" size={24} color="#F0E491" />
          </TouchableOpacity>
        </View>

        {/* BIG Play Button */}
        <TouchableOpacity 
          className="bg-primary h-48 rounded-3xl justify-center items-center mb-8 shadow-lg shadow-black/50"
          onPress={() => router.push("/(tabs)/courses")}
        >
          <View className="bg-[#E0D480] p-4 rounded-full mb-2">
            <Ionicons name="play" size={48} color="#31694E" />
          </View>
          <Text className="text-base text-3xl font-black uppercase tracking-widest">Start Playing</Text>
          <Text className="text-base/70 font-semibold">Continue: Space Adventure</Text>
        </TouchableOpacity>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-8">
          <View className="bg-ternary w-[48%] p-4 rounded-2xl flex-row items-center justify-center space-x-3">
            <Ionicons name="star" size={32} color="#F0E491" />
            <View>
              <Text className="text-white text-2xl font-bold">124</Text>
              <Text className="text-secondary text-xs font-bold uppercase">Stars</Text>
            </View>
          </View>

          <View className="bg-ternary w-[48%] p-4 rounded-2xl flex-row items-center justify-center space-x-3">
            <Ionicons name="flame" size={32} color="#F0E491" />
            <View>
              <Text className="text-white text-2xl font-bold">12</Text>
              <Text className="text-secondary text-xs font-bold uppercase">Days</Text>
            </View>
          </View>
        </View>

        {/* Daily Mission */}
        <Text className="text-primary text-xl font-bold mb-4">Today's Mission</Text>
        <TouchableOpacity className="bg-[#4A7A60] p-5 rounded-2xl flex-row items-center mb-8 border-2 border-dashed border-secondary/30">
          <View className="bg-secondary/20 h-12 w-12 rounded-full justify-center items-center mr-4">
            <Ionicons name="rocket" size={24} color="#BBC863" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Complete "Solar System"</Text>
            <Text className="text-secondary text-sm">Reward: +50 Stars</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#BBC863" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ChildDashboardScreen;