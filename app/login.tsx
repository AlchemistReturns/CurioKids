import { router } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { ActivityIndicator, Button, Text, TextInput, View } from 'react-native';
import { auth, firestore } from '../config/firebase';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const normalizeError = (err: any) => {
    const code = err?.code ?? err?.message ?? 'unknown';
    return String(code).replace('auth/', '').replace(/[-_.()]/g, ' ').trim();
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1) Sign in
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid as string;

      // 2) Read user doc to get role
      const userDocRef = doc(firestore, 'users', uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        // No user document — sign out and show helpful message
        await auth.signOut();
        throw new Error('No user profile found. Please complete registration.');
      }

      const data = userSnap.data() as any;
      const role = (data?.role ?? '').toString();

      // 3) Route based on role
      if (role === 'parent') {
        router.replace('/parent/dashboard');
      } else if (role === 'child') {
        // route to nested child dashboard folder
        router.replace('/child/dashboard');
      } else {
        // Unknown role — sign out and show message
        await auth.signOut();
        throw new Error('Account role not assigned. Contact support.');
      }
    } catch (err: any) {
      console.error(err);
      setError(normalizeError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-gray-100">
      <Text className="text-3xl font-bold mb-8 text-center text-gray-800">Main Login</Text>

      <TextInput
        className="h-12 border border-gray-300 rounded-lg px-4 mb-4 bg-white text-gray-600"
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        className="h-12 border border-gray-300 rounded-lg px-4 mb-4 bg-white text-gray-600"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {error ? <Text className="text-red-600 mb-4 text-center font-semibold">{error}</Text> : null}

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" className="my-2" />
      ) : (
        <View className="rounded-lg overflow-hidden mb-4">
          <Button title="Sign In" onPress={handleSignIn} color="#007AFF" />
        </View>
      )}

      <View className="flex-row justify-center mt-5">
        <Text className="text-gray-600">Don&#39;t have an account? </Text>
        <Text className="text-blue-600 font-bold" onPress={() => router.replace('/')}>
          Sign Up
        </Text>
      </View>
    </View>
  );
};

export default LoginScreen;