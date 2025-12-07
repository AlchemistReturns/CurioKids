import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from "../../config/firebase";

export default function ChildDashboardScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [childData, setChildData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 1. Auth Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace("/login");
      }
    });
    return unsubscribe;
  }, []);

  // 2. Real-time Data Listener
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(firestore, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setChildData(docSnap.data());
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Error signing out");
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
  const stars = childData?.stars || 0;
  const streak = childData?.streak || 0;
  const totalPoints = childData?.totalPoints || 0; // Added Total Points

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
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
          
          <TouchableOpacity onPress={handleSignOut} className="bg-secondary/20 p-2 rounded-full border border-secondary">
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
          <Text className="text-base/70 font-semibold">Continue Learning</Text>
        </TouchableOpacity>

        {/* Stats Row (Updated to include Points) */}
        <View className="flex-row justify-between mb-8">
          
          {/* Points Card */}
          <View className="bg-ternary w-[31%] p-3 rounded-2xl items-center justify-center border border-primary/20">
            <Ionicons name="trophy" size={28} color="#F0E491" />
            <Text className="text-white text-xl font-bold mt-1">{totalPoints}</Text>
            <Text className="text-secondary text-[10px] font-bold uppercase">Points</Text>
          </View>

          {/* Stars Card */}
          <View className="bg-ternary w-[31%] p-3 rounded-2xl items-center justify-center border border-primary/20">
            <Ionicons name="star" size={28} color="#F0E491" />
            <Text className="text-white text-xl font-bold mt-1">{stars}</Text>
            <Text className="text-secondary text-[10px] font-bold uppercase">Stars</Text>
          </View>

          {/* Streak Card */}
          <View className="bg-ternary w-[31%] p-3 rounded-2xl items-center justify-center border border-primary/20">
            <Ionicons name="flame" size={28} color="#F0E491" />
            <Text className="text-white text-xl font-bold mt-1">{streak}</Text>
            <Text className="text-secondary text-[10px] font-bold uppercase">Days</Text>
          </View>

        </View>

        {/* Daily Mission */}
        <Text className="text-primary text-xl font-bold mb-4">Today's Mission</Text>
        <TouchableOpacity className="bg-[#4A7A60] p-5 rounded-2xl flex-row items-center mb-8 border-2 border-dashed border-secondary/30">
          <View className="bg-secondary/20 h-12 w-12 rounded-full justify-center items-center mr-4">
            <Ionicons name="rocket" size={24} color="#BBC863" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">Complete a Lesson</Text>
            <Text className="text-secondary text-sm">Reward: +10 Stars</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#BBC863" />
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}