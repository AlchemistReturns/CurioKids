import { router } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, firestore } from "../../config/firebase";

const ChildRegistrationScreen = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [parentKey, setParentKey] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password || !parentKey) {
            setError("Please enter name, email, password and parent key.");
            return;
        }

        setError("");
        setLoading(true);

        try {
            // Normalize the parentKey the same way you generate it (trim/uppercase)
            const normalizedKey = parentKey.trim().toUpperCase();

            // Find parent by linkKey (and role === 'parent' if you use that field)
            const q = query(
                collection(firestore, "users"),
                where("linkKey", "==", normalizedKey),
                where("role", "==", "parent")
            );
            const parentSnap = await getDocs(q);

            if (parentSnap.empty) {
                throw new Error(
                    "Invalid parent key. Please check and try again."
                );
            }

            const parentDoc = parentSnap.docs[0];
            const parentUid = parentDoc.id;

            // Create the child auth user
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const childUid = userCredential.user.uid;

            // Create the child user document
            await setDoc(doc(firestore, "users", childUid), {
                role: "child",
                email: email,
                name: name,
                parentUid: parentUid,
                createdAt: serverTimestamp(),
            });

            router.replace("/child/dashboard");
        } catch (err: any) {
            console.error(err);
            const message =
                err?.message ?? err?.code
                    ? String(err.message || err.code)
                          .replace("Firebase: Error (auth/", "")
                          .replace(").", "")
                          .replace(/-/g, " ")
                    : "An unknown error occurred.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6">
            <View className="bg-white px-6 py-12 rounded-xl">
                <Text className="text-3xl font-bold mb-8 text-center text-primary">
                    Create Account
                </Text>

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4"
                    placeholder="Name"
                    placeholderTextColor="#aaa"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="none"
                />

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4"
                    placeholder="Email"
                    placeholderTextColor="#aaa"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4"
                    placeholder="Password (min 6 characters)"
                    placeholderTextColor="#aaa"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TextInput
                    className="h-12 border border-primary rounded-lg px-4 mb-4"
                    placeholder="Parent Key"
                    placeholderTextColor="#aaa"
                    value={parentKey}
                    onChangeText={setParentKey}
                />

                {error ? (
                    <Text className="text-primary mb-4 text-center">
                        {error}
                    </Text>
                ) : null}

                {loading ? (
                    <ActivityIndicator
                        size="large"
                        color="#F0E491"
                        className="my-2"
                    />
                ) : (
                    <View className="rounded-lg overflow-hidden mb-4">
                        <TouchableOpacity
                            className="bg-secondary py-4 px-8 rounded-xl w-full"
                            onPress={handleSignUp}
                        >
                            <Text className="text-primary text-xl font-bold text-center">
                                Sign Up
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View className="flex-row justify-center mt-5">
                    <Text className="text-primary">
                        Already have an account?{" "}
                    </Text>
                    <Text
                        className="text-primary font-bold"
                        onPress={() => router.replace("../login")}
                    >
                        Sign In
                    </Text>
                </View>
            </View>
        </View>
    );
};

export default ChildRegistrationScreen;
