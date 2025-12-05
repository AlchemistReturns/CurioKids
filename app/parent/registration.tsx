import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Button, Text, TextInput, View } from 'react-native';
import { auth, firestore } from '../../config/firebase';

const RegistrationScreen = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function generateUniqueKey() {
        let key;
        let isUnique = false;
        while (!isUnique) {
            key = Math.random().toString(36).substring(2, 8).toUpperCase();

            const q = query(collection(firestore, 'users'), where('linkKey', '==', key));
            const snapshot = await getDocs(q);

            isUnique = snapshot.empty;
        }
        return key;
    }

    const handleSignUp = async () => {
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const parentUid = userCredential.user.uid;
            const linkKey = await generateUniqueKey();

            await setDoc(doc(firestore, 'users', parentUid), {
                role: 'parent',
                email: email,
                name: name,
                linkKey: linkKey, 
                createdAt: serverTimestamp(),
            });

            router.replace('/parent/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(
                err.message
                    .replace('Firebase: Error (auth/', '')
                    .replace(').', '')
                    .replace(/-/g, ' ')
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6">
            <Text className="text-3xl font-bold mb-8 text-center text-primary">
                Create Account
            </Text>

            <TextInput
                className="h-12 border border-primary rounded-lg px-4 mb-4"
                placeholder="Name"
                placeholderTextColor="#F0E491"
                value={name}
                onChangeText={setName}
                autoCapitalize="none"
            />

            <TextInput
                className="h-12 border border-primary rounded-lg px-4 mb-4"
                placeholder="Email"
                placeholderTextColor="#F0E491"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <TextInput
                className="h-12 border border-primary rounded-lg px-4 mb-4"
                placeholder="Password (min 6 characters)"
                placeholderTextColor="#F0E491"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            {error ? (
                <Text className="text-primary mb-4 text-center">{error}</Text>
            ) : null}

            {loading ? (
                <ActivityIndicator size="large" color="#F0E491" className="my-2" />
            ) : (
                <View className="rounded-lg overflow-hidden mb-4">
                    <Button title="Sign Up" onPress={handleSignUp} color="#F0E491" />
                </View>
            )}

            <View className="flex-row justify-center mt-5">
                <Text className="text-secondary">Already have an account? </Text>
                <Text
                    className="text-primary font-bold"
                    onPress={() => router.replace('../login')}
                >
                    Sign In
                </Text>
            </View>
        </View>
    );
};

export default RegistrationScreen;
