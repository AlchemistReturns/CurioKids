import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
    collection,
    doc,
    getDoc,
    onSnapshot,
    query,
    where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from "../../config/firebase";

const ParentDashboardScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [linkKey, setLinkKey] = useState<string | null>(null);
  const [children, setChildren] = useState<Array<any>>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else router.replace("/login");
    });
    return unsubscribe;
  }, []);

  // 2. Fetch Parent Link Key
  useEffect(() => {
    if (!user) return;
    const fetchLinkKey = async () => {
      try {
        const snap = await getDoc(doc(firestore, "users", user.uid));
        if (snap.exists()) {
          setLinkKey((snap.data() as any).linkKey ?? null);
        }
      } catch (e) {
        console.error("Failed to load parent linkKey", e);
      }
    };
    fetchLinkKey();
  }, [user]);

  // 3. Listen for Children Updates
  useEffect(() => {
    if (!user) return;
    setChildrenLoading(true);
    const q = query(
      collection(firestore, "users"),
      where("parentUid", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));
      setChildren(list);
      setChildrenLoading(false);
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

  if (!user) return <View className="flex-1 bg-base" />;

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="flex-row justify-between items-center mt-4 mb-8">
          <View>
            <Text className="text-secondary text-lg font-medium">Dashboard</Text>
            <Text className="text-primary text-3xl font-bold">Parent View</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} className="bg-ternary p-2 rounded-full border border-primary/20">
            <Ionicons name="log-out-outline" size={24} color="#F0E491" />
          </TouchableOpacity>
        </View>

        {/* Joining Code Card */}
        <View className="bg-ternary rounded-3xl p-6 mb-8 shadow-lg border-2 border-primary/10">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-secondary text-sm uppercase font-bold tracking-wider">Family Linking Code</Text>
            <Ionicons name="link" size={20} color="#BBC863" />
          </View>
          <Text className="text-primary text-4xl font-mono font-bold tracking-widest text-center my-2">
            {linkKey ?? "..."}
          </Text>
          <Text className="text-white/60 text-xs text-center">
            Share this code with your child to link their account.
          </Text>
        </View>

        {/* Children List */}
        <Text className="text-primary text-xl font-bold mb-4">My Children</Text>
        
        {childrenLoading ? (
          <ActivityIndicator size="large" color="#F0E491" className="mb-8" />
        ) : children.length === 0 ? (
          <View className="bg-ternary/50 p-6 rounded-2xl items-center mb-8 border border-dashed border-secondary/50">
            <Ionicons name="happy-outline" size={40} color="#BBC863" className="mb-2"/>
            <Text className="text-secondary">No children connected yet.</Text>
          </View>
        ) : (
          <View className="mb-8">
            {children.map((child) => (
              <View key={child.id} className="bg-ternary p-4 rounded-2xl mb-3 flex-row items-center border border-ternary/50">
                <View className="bg-base h-12 w-12 rounded-full items-center justify-center mr-4 border border-secondary">
                  <Text className="text-primary font-bold text-lg">{(child.name?.[0] || child.email?.[0] || "C").toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold text-lg">{child.name ?? "Unnamed Child"}</Text>
                  <Text className="text-secondary text-xs">{child.email}</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#BBC863" />
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Text className="text-primary text-xl font-bold mb-4">Actions</Text>
        <View className="flex-row flex-wrap justify-between gap-y-4 mb-10">
          <TouchableOpacity className="bg-[#4A7A60] w-[48%] p-4 rounded-2xl items-start">
            <Ionicons name="person-add-outline" size={28} color="#BBC863" className="mb-2" />
            <Text className="text-white font-bold text-lg">Add Child</Text>
          </TouchableOpacity>

          <TouchableOpacity className="bg-[#4A7A60] w-[48%] p-4 rounded-2xl items-start">
            <Ionicons name="bar-chart-outline" size={28} color="#BBC863" className="mb-2" />
            <Text className="text-white font-bold text-lg">Reports</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentDashboardScreen;