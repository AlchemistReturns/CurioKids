import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { auth, firestore } from "../../config/firebase";

// import the pre-built dashboards
import ChildProfile from "../child/profile";
import ParentProfile from "../parent/profile";

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
      setLoading(false);
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
          setRole((snap.data() as any).role ?? null);
        } else {
          // no profile for this account: sign out and send to login/registration
          await signOut(auth);
          router.replace("/"); // or "/login" depending on your flow
        }
      } catch (e) {
        console.error("Failed to load user profile", e);
        // fallback: sign out to avoid leaving user in undefined state
        try { await signOut(auth); } catch {}
        router.replace("/");
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  if (loading || role === null) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F0E491" />
        <Text className="mt-2 text-primary">Loading Profile</Text>
      </View>
    );
  }

  if (role === "parent") {
    return <ParentProfile />;
  }

  if (role === "child") {
    return <ChildProfile />;
  }

  // unknown role
  return (
    <View className="flex-1 justify-center items-center bg-gray-100 px-6">
      <Text className="text-center text-primary mb-4">
        Account role not assigned. Please contact support.
      </Text>
    </View>
  );
}