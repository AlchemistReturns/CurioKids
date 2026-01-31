import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";
import { FriendsService } from "../services/FriendsService";

interface LeaderboardUser {
  id: string;
  name: string;
  totalPoints: number;
  streak?: number;
  badges?: any[];
  rank?: number; // Helper for display
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [currentUserData, setCurrentUserData] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Loading rankings...");
  const [viewMode, setViewMode] = useState<'global' | 'friends'>('global');

  useEffect(() => {
    loadLeaderboard();
  }, [viewMode]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const user = await AuthService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.uid);
        setRole(user.role || 'child');
      }

      setStatusMessage("Updating scores...");

      let leaderboardData;
      if (viewMode === 'friends') {
        // Load friends-only leaderboard
        leaderboardData = await FriendsService.getFriendsLeaderboard(user.uid);
      } else {
        // Load global leaderboard
        leaderboardData = await UserService.getLeaderboard();

        // Add ranks
        leaderboardData = leaderboardData.map((item: any, index: number) => ({
          ...item,
          rank: index + 1
        }));
      }

      setLeaders(leaderboardData);

      if (user) {
        const myEntry = leaderboardData.find((l: any) => l.id === user.uid);
        if (myEntry) {
          setCurrentUserData(myEntry);
        } else {
          // Fallback: Fetch my profile to at least show points
          const myProfile = await UserService.getProfile(user.uid);
          if (myProfile) {
            setCurrentUserData({
              id: user.uid,
              name: myProfile.name || "You",
              totalPoints: myProfile.totalPoints || 0,
              rank: myProfile.rank || 999
            });
          }
        }
      }

    } catch (error) {
      console.error("Error refreshing leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "#FFD700"; // Gold
      case 1: return "#C0C0C0"; // Silver
      case 2: return "#CD7F32"; // Bronze
      default: return "#5A3E29"; // Tiger Brown
    }
  };

  // Reusable Card Component
  const LeaderCard = ({ item, index, isFooter = false }: { item: LeaderboardUser; index: number, isFooter?: boolean }) => {
    const isMe = item.id === currentUserId;
    const isFriendsMode = viewMode === 'friends';

    if (isFriendsMode) {
      // Enhanced card for Friends mode
      return (
        <View
          className={`mx-4 rounded-3xl shadow-md border-2 mb-4 p-5 ${isMe ? 'bg-tigerYellow border-tigerOrange' : 'bg-white border-tigerCard'
            }`}
        >
          <View className="flex-row items-center mb-3">
            {/* Rank Badge */}
            <View
              className="w-14 h-14 justify-center items-center rounded-full mr-4 bg-tigerCream border-2 border-tigerCard"
            >
              {index < 3 ? (
                <Ionicons name="trophy" size={28} color={getRankColor(index)} />
              ) : (
                <Text className="text-tigerBrown font-black text-xl">
                  {item.rank ? item.rank : index + 1}
                </Text>
              )}
            </View>

            {/* Avatar */}
            <View className="bg-tigerOrange h-16 w-16 rounded-full items-center justify-center mr-4 border-2 border-white shadow-sm">
              <Text className="text-white font-black text-2xl">{item.name[0]?.toUpperCase()}</Text>
            </View>

            {/* Name and Points */}
            <View className="flex-1">
              <Text className="font-black text-xl text-tigerBrown">
                {item.name} {isMe && "(You)"}
              </Text>
              <View className="flex-row items-center mt-1">
                <Ionicons name="trophy" size={16} color="#FF6E4F" />
                <Text className="text-tigerOrange font-black text-lg ml-1">{item.totalPoints} pts</Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View className="flex-row bg-tigerCream rounded-xl p-3 mt-2">
            <View className="flex-1 items-center border-r border-tigerBrown/10">
              <Ionicons name="flame" size={20} color="#FFC226" />
              <Text className="text-tigerBrown font-black text-lg mt-1">{item.streak || 0}</Text>
              <Text className="text-tigerBrown/50 text-[9px] uppercase font-bold">Streak</Text>
            </View>
            <View className="flex-1 items-center">
              <Ionicons name="star" size={20} color="#FFD700" />
              <Text className="text-tigerBrown font-black text-lg mt-1">{item.badges?.length || 0}</Text>
              <Text className="text-tigerBrown/50 text-[9px] uppercase font-bold">Badges</Text>
            </View>
          </View>
        </View>
      );
    }

    // Standard card for Global mode
    return (
      <View
        className={`flex-row items-center p-4 mx-4 rounded-3xl shadow-sm border-2 ${isMe ? 'bg-tigerYellow border-white' : 'bg-white border-white'
          } ${isFooter ? 'mt-0' : 'mb-3'}`}
      >
        <View
          className={`w-12 h-12 justify-center items-center rounded-full mr-4 bg-tigerCream border-2 border-tigerCard`}
        >
          {index < 3 && !isFooter ? (
            <Ionicons name="trophy" size={24} color={getRankColor(index)} />
          ) : (
            <Text className="text-tigerBrown font-bold text-lg">
              {item.rank ? item.rank : index + 1}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="font-black text-lg text-tigerBrown">
            {item.name} {isMe && "(You)"}
          </Text>
        </View>

        <View className="items-end bg-tigerCream px-3 py-1 rounded-xl">
          <Text className="text-tigerBrown font-black text-xl">{item.totalPoints}</Text>
          <Text className="text-tigerBrown/50 text-[10px] font-bold uppercase tracking-widest">PTS</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-tigerCream">
        <ActivityIndicator size="large" color="#FF6E4F" />
        <Text className="text-tigerBrown mt-4 font-bold">{statusMessage}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-tigerCream">
      {/* Custom Header */}
      <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] shadow-sm z-10 mb-4">
        <View className="flex-row justify-between items-end mb-4">
          <View className="mb-2">
            <Text className="text-tigerBrown text-3xl font-black">Leaderboard</Text>
            <Text className="text-tigerBrown/80 text-lg font-bold">Top Scholars</Text>
          </View>
          <Ionicons name="trophy-outline" size={80} color="#5A3E29" style={{ opacity: 0.1, position: 'absolute', right: 20, bottom: -10 }} />
          <Image
            source={require('../assets/tiger.png')}
            className="w-16 h-16"
            resizeMode="contain"
          />
        </View>

        {/* Toggle Switch */}
        <View className="flex-row bg-white/90 rounded-2xl p-1">
          <TouchableOpacity
            onPress={() => setViewMode('global')}
            className={`flex-1 py-2 rounded-xl ${viewMode === 'global' ? 'bg-tigerOrange' : 'bg-transparent'}`}
            activeOpacity={0.7}
          >
            <Text className={`text-center font-black ${viewMode === 'global' ? 'text-white' : 'text-tigerBrown/60'}`}>
              🌍 Global
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('friends')}
            className={`flex-1 py-2 rounded-xl ${viewMode === 'friends' ? 'bg-tigerOrange' : 'bg-transparent'}`}
            activeOpacity={0.7}
          >
            <Text className={`text-center font-black ${viewMode === 'friends' ? 'text-white' : 'text-tigerBrown/60'}`}>
              👥 Friends
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={leaders}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <LeaderCard item={item} index={index} />}
        contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for footer space
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 px-6">
            {viewMode === 'friends' ? (
              <>
                <Ionicons name="people-outline" size={64} color="#5A3E2960" />
                <Text className="text-center text-tigerBrown mt-4 text-xl font-black">No Friends Yet!</Text>
                <Text className="text-center text-tigerBrown/60 mt-2 text-sm font-bold px-4">
                  Ask your parent to add friends to compete with them here!
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="telescope-outline" size={64} color="#5A3E29" />
                <Text className="text-center text-tigerBrown mt-4 text-lg font-bold">No scores yet!</Text>
              </>
            )}
          </View>
        }
      />

      {/* Sticky Footer: Only show if user exists, is a CHILD, AND is NOT in the top 20 list */}
      {currentUserData && role === 'child' && (currentUserData.rank || 0) > 20 && (
        <View className="absolute bottom-0 w-full bg-tigerCream pt-4 pb-8 border-t-2 border-tigerCard shadow-2xl">
          <Text className="text-center text-tigerBrown/50 text-xs uppercase mb-2 font-bold">Your Ranking</Text>
          <LeaderCard
            item={currentUserData}
            index={(currentUserData.rank || 0) - 1} // Pass logical index 
            isFooter={true}
          />
        </View>
      )}
    </View>
  );
}