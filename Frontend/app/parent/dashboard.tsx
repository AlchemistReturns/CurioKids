import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  doc,
  getCountFromServer,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from "../../config/firebase";

// Extended Child Interface to include Rank
interface ChildData {
  id: string;
  name?: string;
  email?: string;
  totalPoints?: number;
  rank?: number | string;
  [key: string]: any;
}

const ParentDashboardScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [linkKey, setLinkKey] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildData[]>([]);
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

  // 3. Listen for Children & Calculate Rank
  useEffect(() => {
    if (!user) return;
    setChildrenLoading(true);
    const q = query(
      collection(firestore, "users"),
      where("parentUid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list: ChildData[] = [];

      // Process each child
      for (const d of snapshot.docs) {
        const data = d.data();
        const myPoints = data.totalPoints || 0;

        // Calculate Rank: Count how many children have MORE points than this child
        let rank = "-";
        try {
          const usersRef = collection(firestore, 'users');
          const betterPlayersQuery = query(
            usersRef,
            where("role", "==", "child"),
            where("totalPoints", ">", myPoints)
          );
          const snapshotBetter = await getCountFromServer(betterPlayersQuery);
          rank = (snapshotBetter.data().count + 1).toString(); // Rank = (People better than me) + 1
        } catch (e) {
          console.log("Rank calc error", e);
        }

        list.push({
          id: d.id,
          ...data,
          rank: rank
        });
      }

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

  const copyToClipboard = async () => {
    if (linkKey) {
      await Clipboard.setStringAsync(linkKey);
      Alert.alert("Copied!", "Linking code copied to clipboard.");
    }
  };

  if (!user) return <View className="flex-1 bg-base" />;

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="px-6" showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View className="flex-row justify-between items-center mt-4 mb-8">
          <View>

            <Text className="text-primary text-3xl font-bold">Dashboard</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} className="bg-[#D9534F] p-2 rounded-full">
            <Ionicons name="log-out-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Joining Code Card */}
        <TouchableOpacity
          onPress={copyToClipboard}
          activeOpacity={0.7}
          className="bg-secondary rounded-3xl p-6 mb-8 shadow-lg border-2 border-primary/10"
        >

          <Text className="text-primary text-sm uppercase font-bold tracking-wider text-center">Family Linking Code</Text>
          <Text className="text-primary text-4xl font-mono font-bold tracking-widest text-center my-4">
            {linkKey ?? "..."}
          </Text>
          <View className="flex-row justify-center items-center">
            <View className="bg-base/30 p-1.5 rounded-lg">
              <Ionicons name="copy-outline" size={20} color="#3f51b5" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Children List */}
        <Text className="text-primary text-2xl font-bold mb-4">My Children</Text>

        {childrenLoading ? (
          <ActivityIndicator size="large" color="#3f51b5" className="mb-8" />
        ) : children.length === 0 ? (
          <View className="bg-primary p-6 rounded-2xl items-center mb-8">
            <Ionicons name="happy-outline" size={40} color="#edf0f7" className="mb-2" />
            <Text className="text-secondary">No children connected yet.</Text>
          </View>
        ) : (
          <View className="mb-8">
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                className="bg-primary p-6 rounded-2xl mb-3 shadow-md"
                onPress={() => router.push(`../parent/child/${child.id}`)}
                activeOpacity={0.9}
              >
                <View className="flex-row items-center mb-3">
                  <View className="bg-base h-12 w-12 rounded-full items-center justify-center mr-4 border border-secondary">
                    <Text className="text-primary font-bold text-lg">{(child.name?.[0] || child.email?.[0] || "C").toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-xl">{(child.name ?? "Unnamed Child").toUpperCase()}</Text>
                    <Text className="text-secondary text-sm">{child.email}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#FFF" />
                </View>

                {/* Child Stats Grid */}
                <View className="flex-row bg-base/30 rounded-xl p-3 justify-between">
                  <View className="items-center flex-1 border-r border-ternary">
                    <Text className="text-white font-bold text-lg">{child.totalPoints ?? 0}</Text>
                    <Text className="text-secondary text-[10px] uppercase">Points</Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-white font-bold text-lg">#{child.rank}</Text>
                    <Text className="text-secondary text-[10px] uppercase">Global Rank</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <Text className="text-primary text-xl font-bold mb-4">Actions</Text>
        <View className="flex-row flex-wrap justify-between gap-y-4 mb-10">
          <TouchableOpacity className="bg-primary w-full p-4 rounded-2xl flex-row items-center">
            <Ionicons name="bar-chart-outline" size={28} color="#ffffff" className="mr-3" />
            <View>
              <Text className="text-white font-bold text-lg">View Detailed Reports</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentDashboardScreen;