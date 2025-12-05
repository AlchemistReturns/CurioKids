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
import { ActivityIndicator, Button, Text, View } from "react-native";
import { auth, firestore } from "../config/firebase";

const DashboardScreen = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [linkKey, setLinkKey] = useState<string | null>(null);
    const [children, setChildren] = useState<Array<any>>([]);
    const [childrenLoading, setChildrenLoading] = useState(false);

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
                    setLinkKey((snap.data() as any).linkKey ?? null);
                } else {
                    setLinkKey(null);
                }
            } catch (e) {
                console.error("Failed to load parent linkKey", e);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        if (!user) return;
        setChildrenLoading(true);

        const q = query(
            collection(firestore, "users"),
            where("parentUid", "==", user.uid)
        );
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const list = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as any),
                }));
                setChildren(list);
                setChildrenLoading(false);
            },
            (err) => {
                console.error("Children listener error:", err);
                setChildrenLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-100">
                <ActivityIndicator size="large" color="#007AFF" />
                <Text className="mt-2 text-gray-600 text-base">
                    Checking authentication status...
                </Text>
            </View>
        );
    }

    if (!user) return null;

    return (
        <View className="flex-1 px-6 bg-gray-100 pt-20">
            <Text className="text-2xl font-bold text-center mb-10 text-gray-800">
                Welcome to Your Dashboard
            </Text>

            <View className="bg-white p-5 rounded-xl shadow-md mb-10">
                <Text className="text-gray-500 text-base mb-1">
                    Authenticated User:
                </Text>

                <Text className="text-lg font-semibold text-blue-600 mb-2">
                    {user.email}
                </Text>

                <Text className="text-sm text-gray-500 font-mono">
                    Link Key: {linkKey ?? "Not set"}
                </Text>
            </View>

            <Text className="text-lg font-semibold text-gray-700 mb-2">
                Children
            </Text>

            {childrenLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
            ) : children.length === 0 ? (
                <Text className="text-sm text-gray-500">
                    No children connected yet.
                </Text>
            ) : (
                children.map((child) => (
                    <View
                        key={child.id}
                        className="mt-3 bg-gray-50 p-3 rounded"
                    >
                        <Text className="font-medium text-blue-600">
                            {child.name ?? child.email}
                        </Text>
                        <Text className="text-sm text-gray-500">
                            Email: {child.email ?? "—"}
                        </Text>
                        <Text className="text-xs text-gray-400">
                            UID: {child.id}
                        </Text>
                    </View>
                ))
            )}

            <View className="rounded-lg overflow-hidden">
                <Button
                    title="Sign Out"
                    onPress={handleSignOut}
                    color="#FF3B30"
                />
            </View>
        </View>
    );
};

export default DashboardScreen;
