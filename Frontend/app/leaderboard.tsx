import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
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

      // Backend returns top 20, but we might want to ensure sorting here just in case? 
      // Backend already sorts.

      // Add ranks
      const rankedLeaders = leaderboardData.map((item: any, index: number) => ({
        ...item,
        rank: index + 1
      }));

      setLeaders(rankedLeaders);

      // Find current user in the list or assume they are below top 20?
      // Note: The original code fetched ALL users to find the exact rank.
      // Fetching ALL users is expensive and bad for scalability.
      // For now, if user is not in top 20, we may not know their exact rank unless we have a specific "getMyRank" endpoint.
      // I will implement "if in top 20, show rank". If not, just show user data (points) without specific rank > 20 for now OR
      // ideally, I should add `getUserRank` endpoint later.
      // For this refactor, let's keep it simple: If in top 20, highlight. 

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
              rank: myProfile.rank || 999 // Placeholder indicating > 20
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
      default: return "#BBC863"; // Secondary
    }
  };

  // Reusable Card Component
  const LeaderCard = ({ item, index, isFooter = false }: { item: LeaderboardUser; index: number, isFooter?: boolean }) => {
    const isMe = item.id === currentUserId;

    return (
      <View
        className={`flex-row items-center p-4 mx-4 rounded-2xl shadow-sm ${isMe ? 'bg-primary' : 'bg-primary'
          } ${isFooter ? 'mt-0' : 'mb-3'}`}
      >
        <View
          className="w-10 h-10 justify-center items-center rounded-full mr-4 border border-secondary"
        >
          {index < 3 && !isFooter ? (
            <Ionicons name="trophy" size={18} color={getRankColor(index)} />
          ) : (
            <Text className={isMe ? "text-white font-bold text-lg" : "text-secondary font-bold text-lg"}>
              {item.rank ? item.rank : index + 1}
            </Text>
          )}
        </View>

        <View className="flex-1">
          <Text className={`font-bold text-lg ${isMe ? 'text-white' : 'text-white'}`}>
            {item.name} {isMe && "(You)"}
          </Text>
          {/* Show subjects breakdown */}
        </View>

        <View className="items-end">
          <Text className="text-white font-black text-2xl">{item.totalPoints}</Text>
          <Text className="text-secondary text-[10px] font-bold uppercase tracking-widest">Total</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text className="text-primary mt-4 font-medium">{statusMessage}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <View className="pt-4 pb-6">
        <Text className="text-center text-3xl font-black text-primary mb-2">Leaderboard</Text>
        <Text className="text-center text-primary text-sm uppercase tracking-widest mb-2">Top 20 Scholars</Text>
      </View>

      <FlatList
        data={leaders}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <LeaderCard item={item} index={index} />}
        contentContainerStyle={{ paddingBottom: 100 }} // Extra padding for footer space
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 opacity-50">
            <Ionicons name="telescope-outline" size={64} color="#BBC863" />
            <Text className="text-center text-primary mt-4 text-lg">No scores yet!</Text>
          </View>
        }
      />

      {/* Sticky Footer: Only show if user exists, is a CHILD, AND is NOT in the top 20 list */}
      {currentUserData && role === 'child' && (currentUserData.rank || 0) > 20 && (
        <View className="absolute bottom-0 w-full bg-base pt-4 pb-8 border-t-2 border-ternary shadow-2xl">
          <Text className="text-center text-secondary text-xs uppercase mb-2">Your Ranking</Text>
          <LeaderCard
            item={currentUserData}
            index={(currentUserData.rank || 0) - 1} // Pass logical index 
            isFooter={true}
          />
        </View>
      )}
    </SafeAreaView>
  );
}