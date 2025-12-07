import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { auth, firestore } from "../../config/firebase";

// Import the distinct dashboards
import ChildDashboardScreen from "../child/dashboard";
import ParentDashboardScreen from "../parent/dashboard";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.replace("/login");
      }
      // Don't stop loading yet, we need the role
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        const snap = await getDoc(doc(firestore, "users", user.uid));
        if (cancelled) return;

        if (snap.exists()) {
          const userData = snap.data();
          setRole(userData.role ?? null);
        } else {
          // No profile found
          await signOut(auth);
          router.replace("/");
        }
      } catch (e) {
        console.error("Failed to load user profile", e);
        try { await signOut(auth); } catch {}
        router.replace("/");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  if (loading || role === null) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <ActivityIndicator size="large" color="#F0E491" />
        <Text className="mt-4 text-primary font-bold text-lg">Loading Curiokids...</Text>
      </View>
    );
  }

  if (role === "parent") {
    return <ParentDashboardScreen />;
  }

  if (role === "child") {
    return <ChildDashboardScreen />;
  }

  // Fallback for unknown role
  return (
    <View className="flex-1 justify-center items-center px-6 bg-base">
      <Text className="text-center text-primary text-xl font-bold mb-4">
        Account Role Error
      </Text>
      <Text className="text-secondary text-center">
        Your account does not have a valid role assigned. Please contact support.
      </Text>
      <Text 
        className="mt-8 text-white font-bold bg-secondary/50 px-6 py-3 rounded-xl overflow-hidden"
        onPress={() => signOut(auth).then(() => router.replace("/login"))}
      >
        Sign Out
      </Text>
    </View>
  );
}