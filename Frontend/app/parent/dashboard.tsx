import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import { useSession } from "../../context/SessionContext";

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
  const [user, setUser] = useState<any>(null);
  const [linkKey, setLinkKey] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  // Use session context just to enforce Role = 'parent' (prevents timeout overlay)
  const { setRole, logout } = useSession();

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      setRole('parent'); // Ensure parent role when in this screen
    }, [])
  );

  const loadData = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        router.replace("/login");
        return;
      }
      setUser(currentUser);

      // Parallel Fetch
      const [key, childrenList] = await Promise.all([
        UserService.getLinkKey(currentUser.uid),
        UserService.getChildren(currentUser.uid)
      ]);

      setLinkKey(key);
      setChildren(childrenList);

    } catch (e) {
      console.error(e);
    } finally {
      setChildrenLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
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

  if (!user) return <View className="flex-1 bg-tigerCream" />;

  return (
    <View className="flex-1 bg-tigerCream">
      {/* Custom Header */}
      <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] flex-row justify-between items-end shadow-sm z-10">
        <View className="mb-2">
          <Text className="text-tigerBrown text-3xl font-black">Parent Dashboard</Text>
          <Text className="text-tigerBrown/70 text-base font-bold">Manage your little tigers</Text>
        </View>
        <Image
          source={require('../../assets/tiger.png')}
          className="w-20 h-20"
          resizeMode="contain"
        />
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Joining Code Card */}
        <TouchableOpacity
          onPress={copyToClipboard}
          activeOpacity={0.7}
          className="bg-tigerCard rounded-3xl p-6 mb-8 shadow-sm border-2 border-tigerBrown/10"
        >
          <Text className="text-tigerBrown/60 text-sm uppercase font-black tracking-wider text-center">Family Linking Code</Text>
          <Text className="text-tigerBrown text-4xl font-black tracking-widest text-center my-4">
            {linkKey ?? "..."}
          </Text>
          <View className="flex-row justify-center items-center">
            <View className="bg-tigerBrown/10 p-2 rounded-lg flex-row items-center">
              <Ionicons name="copy-outline" size={18} color="#5A3E29" />
              <Text className="text-tigerBrown ml-2 font-bold">Tap to Copy</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Children List */}
        <Text className="text-tigerBrown text-2xl font-black mb-4">My Children</Text>

        {childrenLoading ? (
          <ActivityIndicator size="large" color="#FF6E4F" className="mb-8" />
        ) : children.length === 0 ? (
          <View className="bg-tigerCard p-6 rounded-2xl items-center mb-8">
            <Ionicons name="happy-outline" size={40} color="#5A3E29" className="mb-2" />
            <Text className="text-tigerBrown font-bold">No children connected yet.</Text>
          </View>
        ) : (
          <View className="mb-8">
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                className="bg-white rounded-3xl mb-4 shadow-sm p-4"
                onPress={() => router.push(`../parent/child/${child.id}`)}
                activeOpacity={0.9}
              >
                <View className="flex-row items-center mb-4">
                  <View className="bg-tigerYellow h-14 w-14 rounded-full items-center justify-center mr-4 border-2 border-white shadow-sm">
                    <Text className="text-tigerBrown font-black text-xl">{(child.name?.[0] || child.email?.[0] || "C").toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-tigerBrown font-black text-xl">{(child.name ?? "Unnamed Child")}</Text>
                    <Text className="text-tigerBrown/60 text-sm font-bold">{child.email}</Text>
                  </View>

                  {/* Child Logout Button */}
                  <TouchableOpacity
                    className="bg-tigerOrange/10 p-2.5 rounded-xl ml-2"
                    onPress={(e) => {
                      e.stopPropagation();
                      Alert.alert(
                        "Logout Child?",
                        `Are you sure you want to log out ${child.name}?`,
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Logout",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await AuthService.logoutChild(child.id);
                                Alert.alert("Success", "Child logged out successfully.");
                              } catch (err) {
                                Alert.alert("Error", "Failed to logout child.");
                              }
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Ionicons name="power" size={20} color="#FF6E4F" />
                  </TouchableOpacity>

                  <Ionicons name="chevron-forward" size={24} color="#5A3E29" className="ml-2" />
                </View>

                {/* Child Action Tabs */}
                <View className="flex-row bg-tigerCream rounded-2xl overflow-hidden border-2 border-tigerBrown/10">
                  {/* Controls Tab */}
                  <TouchableOpacity
                    className="items-center flex-1 py-4 border-r border-tigerBrown/10 bg-tigerCream"
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push(`../parent/child/${child.id}`);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="settings-outline" size={24} color="#5A3E29" />
                    <Text className="text-tigerBrown font-bold mt-1">Controls</Text>
                    <Text className="text-tigerBrown/50 text-[10px] uppercase font-bold">Manage Time</Text>
                  </TouchableOpacity>

                  {/* Analytics Tab */}
                  <TouchableOpacity
                    className="items-center flex-1 py-4 bg-tigerCream"
                    onPress={(e) => {
                      e.stopPropagation();
                      router.push({
                        pathname: '/parent/analytics',
                        params: { childId: child.id, childName: child.name }
                      });
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="stats-chart" size={24} color="#FF6E4F" />
                    <Text className="text-tigerOrange font-bold mt-1">Analytics</Text>
                    <Text className="text-tigerBrown/50 text-[10px] uppercase font-bold">View Insights</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Action Button (e.g., Logout) moved to bottom or accessible via header */}
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-tigerOrange py-4 rounded-2xl flex-row items-center justify-center mb-10 shadow-sm"
        >
          <Ionicons name="log-out-outline" size={24} color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-white font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
};

export default ParentDashboardScreen;