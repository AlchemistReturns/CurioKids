import { Ionicons } from "@expo/vector-icons";
import *  as Clipboard from 'expo-clipboard';
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import { FriendsService } from "../../services/FriendsService";
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

interface Friend {
  id: string;
  name: string;
  email: string;
  childrenCount: number;
}

const ParentDashboardScreen = () => {
  const [user, setUser] = useState<any>(null);
  const [linkKey, setLinkKey] = useState<string | null>(null);
  const [children, setChildren] = useState<ChildData[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);

  // Friends state
  const [friendCode, setFriendCode] = useState<string>('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendInput, setFriendInput] = useState('');
  const [friendModalVisible, setFriendModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendChildren, setFriendChildren] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);

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

      // Parallel Fetch - critical data
      const [key, childrenList, friendCodeData, friendsList] = await Promise.all([
        UserService.getLinkKey(currentUser.uid),
        UserService.getChildren(currentUser.uid),
        FriendsService.getFriendCode(currentUser.uid),
        FriendsService.getFriends(currentUser.uid)
      ]);

      setLinkKey(key);
      setChildren(childrenList);
      setFriendCode(friendCodeData.friendCode);
      setFriends(friendsList);

      // Fetch pending requests separately (non-critical)
      try {
        const requests = await FriendsService.getPendingRequests(currentUser.uid);
        setPendingRequests(requests);
      } catch (requestError) {
        console.warn('Failed to fetch pending requests:', requestError);
        // Don't break login if this fails
        setPendingRequests([]);
      }

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

  const copyFriendCode = async () => {
    if (friendCode) {
      await Clipboard.setStringAsync(friendCode);
      Alert.alert("Copied!", "Friend code copied to clipboard.");
    }
  };

  const handleAddFriend = async () => {
    if (!friendInput.trim()) {
      Alert.alert("Error", "Please enter a friend code");
      return;
    }

    try {
      const result = await FriendsService.addFriend(user.uid, friendInput.trim().toUpperCase());
      Alert.alert("Request Sent!", `Friend request sent to ${result.recipient}. Waiting for approval.`);
      setFriendInput('');

      // Reload friends list
      const friendsList = await FriendsService.getFriends(user.uid);
      setFriends(friendsList);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send friend request");
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friendName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await FriendsService.removeFriend(user.uid, friendId);
              Alert.alert("Success", "Friend removed successfully");

              // Reload friends list
              const friendsList = await FriendsService.getFriends(user.uid);
              setFriends(friendsList);
            } catch (error) {
              Alert.alert("Error", "Failed to remove friend");
            }
          }
        }
      ]
    );
  };

  const viewFriendChildren = async (friend: Friend) => {
    try {
      const children = await FriendsService.getFriendChildren(user.uid, friend.id);
      setSelectedFriend(friend);
      setFriendChildren(children);
      setFriendModalVisible(true);
    } catch (error) {
      Alert.alert("Error", "Failed to load friend's children");
    }
  };

  const handleAcceptRequest = async (requestId: string, requesterName: string) => {
    try {
      await FriendsService.acceptFriendRequest(user.uid, requestId);
      Alert.alert("Success", `You are now friends with ${requesterName}!`);

      // Reload data
      const friendsListPromise = FriendsService.getFriends(user.uid);
      const requestsPromise = FriendsService.getPendingRequests(user.uid);
      const [friendsList, requests] = await Promise.all([friendsListPromise, requestsPromise]);
      setFriends(friendsList);
      setPendingRequests(requests);
    } catch (error) {
      Alert.alert("Error", "Failed to accept friend request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await FriendsService.rejectFriendRequest(user.uid, requestId);
      Alert.alert("Success", "Friend request rejected");

      // Reload pending requests
      const requests = await FriendsService.getPendingRequests(user.uid);
      setPendingRequests(requests);
    } catch (error) {
      Alert.alert("Error", "Failed to reject friend request");
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

        {/* Connect with Friends Card */}
        <View className="bg-white rounded-3xl p-6 mb-8 shadow-sm border-2 border-tigerOrange/20">
          <View className="flex-row items-center mb-4">
            <Ionicons name="people" size={24} color="#FF6E4F" />
            <Text className="text-tigerBrown text-2xl font-black ml-2">Connect with Friends</Text>
          </View>

          {/* My Friend Code */}
          <TouchableOpacity
            onPress={copyFriendCode}
            className="bg-tigerCream rounded-2xl p-4 mb-4"
          >
            <Text className="text-tigerBrown/60 text-xs uppercase font-bold tracking-wider mb-2">My Friend Code</Text>
            <Text className="text-tigerOrange text-3xl font-black tracking-widest text-center my-2">
              {friendCode || "..."}
            </Text>
            <View className="flex-row justify-center items-center">
              <View className="bg-tigerOrange/10 p-2 rounded-lg flex-row items-center">
                <Ionicons name="copy-outline" size={16} color="#FF6E4F" />
                <Text className="text-tigerOrange ml-2 font-bold text-sm">Tap to Copy</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Add Friend Input */}
          <View className="mb-4">
            <Text className="text-tigerBrown/60 text-xs uppercase font-bold tracking-wider mb-2">Add Friend</Text>
            <View className="flex-row">
              <TextInput
                className="flex-1 bg-tigerCream rounded-xl p-3 font-bold text-tigerBrown mr-2 border border-tigerBrown/10"
                placeholder="Enter Friend Code"
                placeholderTextColor="#5A3E2960"
                value={friendInput}
                onChangeText={setFriendInput}
                autoCapitalize="characters"
                maxLength={10}
              />
              <TouchableOpacity
                onPress={handleAddFriend}
                className="bg-tigerOrange px-6 rounded-xl justify-center items-center"
              >
                <Ionicons name="add-circle" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <View className="mb-4">
              <Text className="text-tigerBrown/60 text-xs uppercase font-bold tracking-wider mb-2">
                Pending Requests ({pendingRequests.length})
              </Text>
              {pendingRequests.map((request) => (
                <View
                  key={request.id}
                  className="bg-tigerYellow/30 rounded-xl p-3 mb-2 border border-tigerOrange/30"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View className="bg-tigerOrange h-10 w-10 rounded-full items-center justify-center mr-3">
                        <Text className="text-white font-black text-lg">{request.fromUserName[0]?.toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-tigerBrown font-bold text-base">{request.fromUserName}</Text>
                        <Text className="text-tigerBrown/50 text-xs font-bold">wants to be friends</Text>
                      </View>
                    </View>
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => handleAcceptRequest(request.id, request.fromUserName)}
                        className="bg-green-500 p-2 rounded-lg mr-2"
                      >
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRejectRequest(request.id)}
                        className="bg-red-500 p-2 rounded-lg"
                      >
                        <Ionicons name="close" size={20} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Friends List */}
          <View>
            <Text className="text-tigerBrown/60 text-xs uppercase font-bold tracking-wider mb-2">Friends ({friends.length})</Text>
            {friends.length === 0 ? (
              <View className="bg-tigerCream/50 p-4 rounded-xl items-center border border-dashed border-tigerBrown/20">
                <Ionicons name="people-outline" size={32} color="#5A3E2960" />
                <Text className="text-tigerBrown/50 font-bold mt-2 text-sm">No friends added yet</Text>
              </View>
            ) : (
              friends.map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  onPress={() => viewFriendChildren(friend)}
                  className="bg-tigerCream rounded-xl p-3 mb-2 flex-row items-center justify-between"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="bg-tigerYellow h-10 w-10 rounded-full items-center justify-center mr-3">
                      <Text className="text-tigerBrown font-black text-lg">{friend.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-tigerBrown font-bold text-base">{friend.name}</Text>
                      <Text className="text-tigerBrown/50 text-xs font-bold">{friend.childrenCount} {friend.childrenCount === 1 ? 'child' : 'children'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRemoveFriend(friend.id, friend.name);
                    }}
                    className="bg-red-100 p-2 rounded-lg ml-2"
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

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

      {/* Friend Children Modal */}
      <Modal
        visible={friendModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFriendModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-tigerCream rounded-t-[40px] pb-10 max-h-[80%]">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-tigerBrown/10">
              <View className="flex-1">
                <Text className="text-tigerBrown text-2xl font-black">{selectedFriend?.name || 'Friend'}'s Children</Text>
                <Text className="text-tigerBrown/60 text-sm font-bold">Gamification Stats Only</Text>
              </View>
              <TouchableOpacity
                onPress={() => setFriendModalVisible(false)}
                className="bg-tigerCard p-2 rounded-full"
              >
                <Ionicons name="close" size={24} color="#5A3E29" />
              </TouchableOpacity>
            </View>

            {/* Children List */}
            <ScrollView className="px-6 pt-4" showsVerticalScrollIndicator={false}>
              {friendChildren.length === 0 ? (
                <View className="items-center justify-center py-10">
                  <Ionicons name="happy-outline" size={48} color="#5A3E2960" />
                  <Text className="text-tigerBrown/50 font-bold mt-4">No children to display</Text>
                </View>
              ) : (
                friendChildren.map((child) => (
                  <View key={child.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-tigerCard">
                    {/* Child Header */}
                    <View className="flex-row items-center mb-3">
                      <View className="bg-tigerYellow h-12 w-12 rounded-full items-center justify-center mr-3">
                        <Text className="text-tigerBrown font-black text-xl">{child.name[0]?.toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-tigerBrown font-black text-lg">{child.name}</Text>
                      </View>
                    </View>

                    {/* Stats Grid */}
                    <View className="flex-row bg-tigerCream rounded-xl p-3 justify-between">
                      <View className="items-center flex-1">
                        <Ionicons name="trophy" size={20} color="#FF6E4F" />
                        <Text className="text-tigerBrown font-black text-xl mt-1">{child.totalPoints || 0}</Text>
                        <Text className="text-tigerBrown/50 text-[10px] uppercase font-bold">Points</Text>
                      </View>
                      <View className="items-center flex-1 border-l border-r border-tigerBrown/10">
                        <Ionicons name="flame" size={20} color="#FFC226" />
                        <Text className="text-tigerBrown font-black text-xl mt-1">{child.streak || 0}</Text>
                        <Text className="text-tigerBrown/50 text-[10px] uppercase font-bold">Streak</Text>
                      </View>
                      <View className="items-center flex-1">
                        <Ionicons name="star" size={20} color="#FFD700" />
                        <Text className="text-tigerBrown font-black text-xl mt-1">{child.badges?.length || 0}</Text>
                        <Text className="text-tigerBrown/50 text-[10px] uppercase font-bold">Badges</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ParentDashboardScreen;