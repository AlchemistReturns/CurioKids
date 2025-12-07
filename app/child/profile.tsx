import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from "../../config/firebase";

export default function ChildProfile({ user }: { user: User }) {
  const [profileData, setProfileData] = useState<any>(null);

  // Listen to profile changes in real-time
  useEffect(() => {
    const userRef = doc(firestore, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/login"); 
    } catch (error) {
      Alert.alert("Error", "Could not sign out");
    }
  };

  // Helper to capitalize subject names
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // Extract marks from DB (from 'categoryScores' map)
  const subjects = profileData?.categoryScores || {}; 
  const subjectKeys = Object.keys(subjects);

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        {/* Profile Header */}
        <View className="items-center mt-8 mb-10">
          <View className="h-24 w-24 bg-[#4A7A60] rounded-full justify-center items-center mb-4 border-4 border-primary shadow-xl">
            <Ionicons name="school" size={48} color="#F0E491" />
          </View>
          <Text className="text-primary text-3xl font-extrabold tracking-wide">
             {profileData?.name || user.displayName || "Student"}
          </Text>
          <Text className="text-secondary text-base font-semibold">{user.email}</Text>
        </View>

        {/* Academic Performance Section */}
        <Text className="text-primary text-xl font-bold mb-4">Subject Marks</Text>
        
        {subjectKeys.length === 0 ? (
            <View className="bg-ternary p-6 rounded-2xl border border-secondary/30 items-center mb-8">
                <Ionicons name="book-outline" size={48} color="#BBC863" className="mb-2 opacity-50" />
                <Text className="text-secondary text-center">No marks recorded yet.</Text>
                <Text className="text-secondary/60 text-xs mt-1">Play games to earn scores!</Text>
            </View>
        ) : (
            <View className="mb-8">
                {subjectKeys.map((subject, index) => (
                    <View 
                        key={index} 
                        className="flex-row items-center justify-between bg-ternary p-5 rounded-2xl mb-3 border border-primary/10 shadow-sm"
                    >
                        <View className="flex-row items-center">
                            <View className="bg-base p-2 rounded-lg mr-4">
                                <Ionicons name="bookmark" size={20} color="#F0E491" />
                            </View>
                            <Text className="text-white text-lg font-bold capitalize">
                                {capitalize(subject)}
                            </Text>
                        </View>
                        
                        <View className="items-end">
                            <Text className="text-primary text-2xl font-black">
                                {subjects[subject]}
                            </Text>
                            <Text className="text-secondary text-[10px] uppercase font-bold">Score</Text>
                        </View>
                    </View>
                ))}
            </View>
        )}

        {/* Account Actions */}
        <View className="mb-8">
            <TouchableOpacity className="flex-row items-center justify-between bg-ternary/40 p-4 rounded-xl mb-3">
                <View className="flex-row items-center">
                    <Ionicons name="settings-outline" size={24} color="#BBC863" />
                    <Text className="text-white font-bold ml-3 text-lg">App Settings</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#BBC863" />
            </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity 
          onPress={handleSignOut}
          className="bg-[#D9534F] py-4 rounded-2xl shadow-lg active:scale-95 transform transition mb-10 flex-row justify-center items-center"
        >
          <Ionicons name="log-out-outline" size={24} color="white" style={{marginRight: 8}} />
          <Text className="text-white font-bold text-xl uppercase tracking-widest">
            Log Out
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}