import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../services/AuthService";
import { UserService } from "../services/UserService";

interface LeaderboardUser {
  id: string;
  name: string;
  totalPoints: number;

  rank?: number; // Helper for display
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [currentUserData, setCurrentUserData] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Loading rankings...");

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const user = await AuthService.getCurrentUser();
      if (user) {
        setCurrentUserId(user.uid);
        setRole(user.role || 'child');
      }

      setStatusMessage("Updating scores...");
      const leaderboardData = await UserService.getLeaderboard();

      // Add ranks
      const rankedLeaders = leaderboardData.map((item: any, index: number) => ({
        ...item,
        rank: index + 1
      }));

      setLeaders(rankedLeaders);

      if (user) {
        const myEntry = rankedLeaders.find((l: any) => l.id === user.uid);
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
      <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] flex-row justify-between items-end shadow-sm z-10 mb-4">
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

      <FlatList
        data={leaders}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <LeaderCard item={item} index={index} />}
        contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for footer space
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 opacity-50">
            <Ionicons name="telescope-outline" size={64} color="#5A3E29" />
            <Text className="text-center text-tigerBrown mt-4 text-lg font-bold">No scores yet!</Text>
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