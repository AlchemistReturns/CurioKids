import { firestore } from '@/config/firebase';
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

interface LeaderboardUser {
  id: string;
  name: string;
  totalPoints: number;
  categoryScores?: {
    math?: number;
    science?: number;
  };
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const usersRef = collection(firestore, 'users');
      // Query: Get 'child' accounts, order by points, limit to top 50
      const q = query(
        usersRef, 
        where("role", "==", "child"), 
        orderBy("totalPoints", "desc"), 
        limit(50) 
      );

      const querySnapshot = await getDocs(q);
      
      const fetchedLeaders: LeaderboardUser[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedLeaders.push({
          id: doc.id,
          name: data.name || "Unknown",
          totalPoints: data.totalPoints || 0,
          categoryScores: data.categoryScores || {},
        });
      });

      setLeaders(fetchedLeaders);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0: return "#FFD700"; // Gold
      case 1: return "#C0C0C0"; // Silver
      case 2: return "#CD7F32"; // Bronze
      default: return "#BBC863"; // Secondary (Olive) for others
    }
  };

  const renderLeaderItem = ({ item, index }: { item: LeaderboardUser; index: number }) => (
    <View className="flex-row items-center bg-ternary p-4 mb-3 mx-4 rounded-2xl border border-secondary/30 shadow-sm">
      
      {/* Rank Circle */}
      <View 
        className="w-10 h-10 justify-center items-center rounded-full mr-4 border-2"
        style={{ 
            backgroundColor: index < 3 ? 'rgba(0,0,0,0.2)' : 'transparent',
            borderColor: getRankColor(index)
        }}
      >
        {index < 3 ? (
            <Ionicons name="trophy" size={18} color={getRankColor(index)} />
        ) : (
            <Text className="text-secondary font-bold text-lg">{index + 1}</Text>
        )}
      </View>

      {/* User Info */}
      <View className="flex-1">
        <Text className="text-white font-bold text-lg">{item.name}</Text>
        <Text className="text-secondary text-xs">
          Math: {item.categoryScores?.math || 0} • Science: {item.categoryScores?.science || 0}
        </Text>
      </View>

      {/* Points */}
      <View className="items-end">
        <Text className="text-primary font-black text-2xl">{item.totalPoints}</Text>
        <Text className="text-secondary text-[10px] font-bold uppercase tracking-widest">Points</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <ActivityIndicator size="large" color="#F0E491" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <View className="pt-4 pb-6">
        <Text className="text-center text-3xl font-black text-primary mb-2">Leaderboard</Text>
        <Text className="text-center text-secondary text-sm uppercase tracking-widest mb-6">Global Rankings</Text>
      </View>

      <FlatList
        data={leaders}
        keyExtractor={(item) => item.id}
        renderItem={renderLeaderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center justify-center mt-20 opacity-50">
            <Ionicons name="telescope-outline" size={64} color="#BBC863" />
            <Text className="text-center text-secondary mt-4 text-lg">No scores yet!</Text>
            <Text className="text-center text-secondary/60 text-sm">Be the first to play.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}