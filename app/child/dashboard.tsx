import { router } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { auth, firestore } from "../../config/firebase";

const ChildDashboardScreen = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [linkKey, setLinkKey] = useState<string | null>(null);

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
                const childSnap = await getDoc(
                    doc(firestore, "users", user.uid)
                );
                if (cancelled) return;
                if (!childSnap.exists()) {
                    setLinkKey(null);
                    return;
                }
                const childData = childSnap.data() as any;
                if (childData.parentUid) {
                    const parentSnap = await getDoc(
                        doc(firestore, "users", childData.parentUid)
                    );
                    if (cancelled) return;
                    setLinkKey(
                        parentSnap.exists()
                            ? (parentSnap.data() as any).linkKey ?? null
                            : null
                    );
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

    const handleSignOut = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#F0E491" />
                <Text className="mt-2 text-primary text-base">
                    Checking authentication status...
                </Text>
            </View>
        );
    }

    if (!user) return null;

    return (
        <View className="flex-1 px-6 pt-20">
            <Text className="text-2xl font-bold text-center mb-10 text-primary">
                Welcome to Your Dashboard
            </Text>

            <View className="bg-ternary p-5 rounded-xl shadow-md mb-10">
                <Text className="text-secondary text-base mb-1">
                    Authenticated User:
                </Text>

                <Text className="text-lg font-semibold text-primary mb-2">
                    {user.email}
                </Text>

                <Text className="text-sm text-secondary font-mono">
                    Parent Uid: {linkKey ?? "Not set"}
                </Text>

                <Text className="text-sm text-secondary font-mono">
                    User Id: {user.uid}
                </Text>
            </View>

            <View className="rounded-lg overflow-hidden bg-[#313647] mt-8 text-bold">
                <Button
                    title="Sign Out"
                    onPress={handleSignOut}
                    color="#F0E491"
                />
            </View>
        </View>
    );
};

export default ChildDashboardScreen;
