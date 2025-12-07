import { auth, firestore } from '@/config/firebase';
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

interface LeaderboardUser {
  id: string;
  name: string;
  totalPoints: number;
  categoryScores?: {
    [key: string]: number;
  };
  rank?: number; // Helper for display
}

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [currentUserData, setCurrentUserData] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("Loading rankings...");

  useEffect(() => {
    if (auth.currentUser) {
        setCurrentUserId(auth.currentUser.uid);
    }
    recalculateAndFetchLeaderboard();
  }, []);

  const recalculateAndFetchLeaderboard = async () => {
    try {
      setStatusMessage("Updating scores...");
      const usersRef = collection(firestore, 'users');
      
      // Fetch ALL children to calculate accurate ranks
      const q = query(usersRef, where("role", "==", "child"));
      const querySnapshot = await getDocs(q);
      
      const allChildren: LeaderboardUser[] = [];
      const batch = writeBatch(firestore);
      let updatesNeeded = false;

      querySnapshot.forEach((document) => {
        const data = document.data();
        const scores = data.categoryScores || {};
        
        // Calculate total
        const calculatedTotal = Object.values(scores).reduce((sum: number, score) => sum + (Number(score) || 0), 0) as number;
        
        // Sync DB if needed
        if (data.totalPoints !== calculatedTotal) {
            const userDocRef = doc(firestore, 'users', document.id);
            batch.update(userDocRef, { totalPoints: calculatedTotal });
            updatesNeeded = true;
        }

        allChildren.push({
          id: document.id,
          name: data.name || "Unknown",
          totalPoints: calculatedTotal,
          categoryScores: scores,
        });
      });

      if (updatesNeeded) {
        await batch.commit();
      }

      // Sort Descending
      allChildren.sort((a, b) => b.totalPoints - a.totalPoints);

      // Assign Ranks and Slice Top 20
      const top20 = allChildren.slice(0, 20);
      setLeaders(top20);

      // Determine User Rank logic
      if (auth.currentUser) {
        const myIndex = allChildren.findIndex(child => child.id === auth.currentUser?.uid);
        if (myIndex !== -1) {
            // Store user data with their actual rank (1-based)
            setCurrentUserData({ ...allChildren[myIndex], rank: myIndex + 1 });
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
            className={`flex-row items-center p-4 mx-4 rounded-2xl shadow-sm ${
                isMe ? 'bg-primary/20 border-2 border-primary' : 'bg-ternary border border-secondary/30'
            } ${isFooter ? 'mt-0' : 'mb-3'}`}
        >
            <View 
                className="w-10 h-10 justify-center items-center rounded-full mr-4 border-2"
                style={{ 
                    backgroundColor: index < 3 && !isFooter ? 'rgba(0,0,0,0.2)' : 'transparent',
                    borderColor: getRankColor(index)
                }}
            >
                {index < 3 && !isFooter ? (
                    <Ionicons name="trophy" size={18} color={getRankColor(index)} />
                ) : (
                    <Text className={isMe ? "text-primary font-bold text-lg" : "text-secondary font-bold text-lg"}>
                        {item.rank ? item.rank : index + 1}
                    </Text>
                )}
            </View>

            <View className="flex-1">
                <Text className={`font-bold text-lg ${isMe ? 'text-primary' : 'text-white'}`}>
                    {item.name} {isMe && "(You)"}
                </Text>
                {/* Show subjects breakdown */}
                <Text className="text-secondary text-xs">
                    {Object.entries(item.categoryScores || {})
                        .slice(0, 3)
                        .map(([subject, score]) => `${subject.charAt(0).toUpperCase() + subject.slice(1)}: ${score}`)
                        .join(' • ')}
                </Text>
            </View>

            <View className="items-end">
                <Text className="text-primary font-black text-2xl">{item.totalPoints}</Text>
                <Text className="text-secondary text-[10px] font-bold uppercase tracking-widest">Total</Text>
            </View>
        </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-base">
        <ActivityIndicator size="large" color="#F0E491" />
        <Text className="text-secondary mt-4 font-medium">{statusMessage}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-base" edges={['top']}>
      <View className="pt-4 pb-6">
        <Text className="text-center text-3xl font-black text-primary mb-2">Leaderboard</Text>
        <Text className="text-center text-secondary text-sm uppercase tracking-widest mb-2">Top 20 Scholars</Text>
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
            <Text className="text-center text-secondary mt-4 text-lg">No scores yet!</Text>
          </View>
        }
      />

      {/* Sticky Footer: Only show if user exists AND is NOT in the top 20 list */}
      {currentUserData && (currentUserData.rank || 0) > 20 && (
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