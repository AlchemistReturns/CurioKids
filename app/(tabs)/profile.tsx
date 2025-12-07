import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { auth, firestore } from "../../config/firebase";

// Import the role-specific profiles
import ChildProfile from "../child/profile";
import ParentProfile from "../parent/profile";

export default function ProfileWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace("/login");
      }
      // Note: We don't set loading(false) here because we still need the role
    });
    return unsubscribe;
  }, []);

  // 2. Fetch User Role
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(firestore, "users", user.uid));
        if (cancelled) return;

        if (snap.exists()) {
          setRole((snap.data() as any).role ?? null);
        } else {
          // Valid auth but no DB profile? Force logout.
          await signOut(auth);
          router.replace("/login");
        }
      } catch (e) {
        console.error("Profile load error:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // 3. Loading State (Themed)
  if (loading || !user) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <ActivityIndicator size="large" color="#F0E491" />
        <Text className="mt-4 text-primary font-bold">Loading Profile...</Text>
      </View>
    );
  }

  // 4. Render Role-Based Content
  if (role === "parent") {
    return <ParentProfile user={user} />;
  }

  if (role === "child") {
    return <ChildProfile user={user} />;
  }

  // 5. Fallback for Unknown Role
  return (
    <View className="flex-1 justify-center items-center bg-base px-6">
      <Text className="text-center text-primary text-xl font-bold mb-4">
        Profile Error
      </Text>
      <Text className="text-secondary text-center mb-8">
        We couldn't determine your account type.
      </Text>
      <TouchableOpacity 
        onPress={() => signOut(auth).then(() => router.replace("/login"))}
        className="bg-secondary/20 px-6 py-3 rounded-xl"
      >
        <Text className="text-primary font-bold">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}