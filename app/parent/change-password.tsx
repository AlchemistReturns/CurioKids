import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import React, { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../config/firebase";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Error", "New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        throw new Error("No user logged in");
      }

      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      Alert.alert(
        "Success",
        "Password changed successfully",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Password change error:", error);
      let errorMessage = "Failed to change password";
      
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log in again before changing password";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center mt-4 mb-8">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-4 p-2 bg-ternary/20 rounded-full"
          >
            <Ionicons name="arrow-back" size={24} color="#F0E491" />
          </TouchableOpacity>
          <Text className="text-primary text-2xl font-bold">Change Password</Text>
        </View>

        {/* Info Card */}
        <View className="bg-ternary/20 p-4 rounded-2xl mb-6 border border-ternary/50">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={24} color="#BBC863" />
            <Text className="text-primary text-base font-semibold ml-2">Security Tips</Text>
          </View>
          <Text className="text-secondary text-sm">
            • Use at least 6 characters{"\n"}
            • Avoid common words{"\n"}
            • Don't reuse old passwords
          </Text>
        </View>

        {/* Current Password Field */}
        <View className="mb-4">
          <Text className="text-primary text-sm font-semibold mb-2">Current Password</Text>
          <View className="flex-row items-center bg-ternary/20 rounded-xl border border-ternary/50">
            <View className="pl-4">
              <Ionicons name="lock-closed-outline" size={20} color="#BBC863" />
            </View>
            <TextInput
              className="flex-1 h-14 px-4 text-white text-base"
              placeholder="Enter current password"
              placeholderTextColor="#BBC863"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              className="pr-4"
            >
              <Ionicons 
                name={showCurrentPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#BBC863" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* New Password Field */}
        <View className="mb-4">
          <Text className="text-primary text-sm font-semibold mb-2">New Password</Text>
          <View className="flex-row items-center bg-ternary/20 rounded-xl border border-ternary/50">
            <View className="pl-4">
              <Ionicons name="lock-closed-outline" size={20} color="#BBC863" />
            </View>
            <TextInput
              className="flex-1 h-14 px-4 text-white text-base"
              placeholder="Enter new password"
              placeholderTextColor="#BBC863"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowNewPassword(!showNewPassword)}
              className="pr-4"
            >
              <Ionicons 
                name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#BBC863" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Field */}
        <View className="mb-8">
          <Text className="text-primary text-sm font-semibold mb-2">Confirm New Password</Text>
          <View className="flex-row items-center bg-ternary/20 rounded-xl border border-ternary/50">
            <View className="pl-4">
              <Ionicons name="lock-closed-outline" size={20} color="#BBC863" />
            </View>
            <TextInput
              className="flex-1 h-14 px-4 text-white text-base"
              placeholder="Re-enter new password"
              placeholderTextColor="#BBC863"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              className="pr-4"
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                size={20} 
                color="#BBC863" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity
          onPress={handleChangePassword}
          disabled={loading}
          className="bg-primary py-4 rounded-xl mb-4 shadow-md active:opacity-90"
        >
          {loading ? (
            <ActivityIndicator size="small" color="#2B1810" />
          ) : (
            <Text className="text-base font-bold text-center text-lg">Change Password</Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-ternary/20 py-4 rounded-xl mb-10 border border-ternary/50"
        >
          <Text className="text-secondary font-semibold text-center text-base">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
