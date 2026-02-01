import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import { TaskService, Task } from "../../services/TaskService";

export default function ChildDashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [childData, setChildData] = useState<any>(null);
  const [progressData, setProgressData] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
      checkSession();
    }, [])
  );

  const checkSession = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        const forceLogout = await AuthService.checkChildStatus(currentUser.uid);
        if (forceLogout) {
          await AuthService.logout();
          router.replace("/login");
          Alert.alert("Session Ended", "Your parent has logged you out.");
        }
      }
    } catch (e) {
      console.error("Session check failed", e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const currentUser = await AuthService.getCurrentUser();

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      // Parallel fetch for speed
      const [profile, progress, taskList] = await Promise.all([
        UserService.getProfile(currentUser.uid),
        UserService.getProgress(currentUser.uid),
        TaskService.getChildTasks(currentUser.uid)
      ]);

      setChildData(profile);
      setProgressData(progress);
      setTasks(taskList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskComplete = async (taskId: string, reward: number) => {
    setCompletingTask(taskId);
    try {
      await TaskService.completeTask(taskId);
      Alert.alert("Awesome!", `You completed a task and earned ${reward} stars!`);
      loadData(); // This refreshes the lists and stars
    } catch (e) {
      Alert.alert("Error", "Could not complete task.");
    } finally {
      setCompletingTask(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-tigerCream">
        <ActivityIndicator size="large" color="#FF6E4F" />
      </View>
    );
  }

  if (!user) return <View className="flex-1 bg-tigerCream" />;

  // Default values
  const childName = childData?.name || user.displayName || "Explorer";
  const stars = progressData?.stars || 0;
  const streak = progressData?.streak || 0;
  const totalPoints = progressData?.totalPoints || 0;
  const completedCoursesCount = progressData?.completedCourses?.length || 0;

  const activeTasks = tasks.filter(t => t.status === 'pending');
  // Optional: Show completed ones too? Usually dashboard shows active. 
  // User asked: "Uncompleted tasks will have a blank box while Completed tasks will have a check mark"
  // So we should show list.
  const allTasks = tasks; // All tasks

  return (
    <View className="flex-1 bg-tigerCream">
      {/* Custom Header */}
      <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] flex-row justify-between items-end shadow-sm z-10">
        <View className="mb-2">
          <Text className="text-tigerBrown text-3xl font-black">Welcome back!</Text>
          <Text className="text-tigerBrown/80 text-lg font-bold">{childName} 🐯</Text>
        </View>
        <Image
          source={require('../../assets/tiger.png')}
          className="w-24 h-24"
          resizeMode="contain"
        />
      </View>

      <ScrollView className="flex-1 px-6 pt-8" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* BIG Play Button */}

        {/* Stats Row */}
        <View className="flex-row justify-between mb-8 card-container">
          {/* Stars Card (formerly Trophy) */}
          <View className="bg-tigerCard w-[48%] p-3 rounded-2xl items-center justify-center shadow-sm">
            <Ionicons name="star" size={28} color="#FFD700" />
            <Text className="text-tigerBrown text-xs font-bold mt-1">Stars</Text>
            <Text className="text-tigerBrown text-lg font-black">{totalPoints}</Text>
          </View>

          {/* Fire Card */}
          <View className="bg-tigerCard w-[48%] p-3 rounded-2xl items-center justify-center shadow-sm">
            <Ionicons name="flame" size={28} color="#FF8C00" />
            <Text className="text-tigerBrown text-xs font-bold mt-1">Streak</Text>
            <Text className="text-tigerBrown text-lg font-black">{streak}</Text>
          </View>
        </View>

        {/* Assigned Missions Section */}
        <View className="mb-8">
          <View className="flex-row items-center mb-4">
            <View className="bg-tigerOrange h-8 w-8 rounded-full items-center justify-center mr-2">
              <Ionicons name="flag" size={18} color="white" />
            </View>
            <Text className="text-tigerBrown text-xl font-black">Assigned Missions</Text>
          </View>

          {activeTasks.length === 0 ? (
            <View className="bg-white p-6 rounded-2xl items-center border-2 border-tigerBrown/5 border-dashed">
              <Ionicons name="happy-outline" size={40} color="#5A3E29" className="opacity-40 mb-2" />
              <Text className="text-tigerBrown/60 font-bold text-center">No active missions!</Text>
              <Text className="text-tigerBrown/40 text-xs text-center mt-1">Ask your parent to assign you one.</Text>
            </View>
          ) : (
            activeTasks.map((task) => (
              <TouchableOpacity
                key={task.id}
                onPress={() => {
                  // Navigate to the course. We assume the course exists.
                  // We don't have the color here easily, passing a default.
                  router.push({
                    pathname: "/child/course/[id]",
                    params: {
                      id: task.courseId,
                      title: task.courseName,
                      color: '#FFB74D' // Default
                    }
                  });
                }}
                className="bg-tigerCard p-5 rounded-2xl mb-3 shadow-md border-b-4 border-tigerOrange active:border-b-0 active:mt-1 active:mb-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="bg-tigerBrown/10 h-10 w-10 rounded-full justify-center items-center mr-3">
                      <Ionicons name="rocket" size={20} color="#5A3E29" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-tigerBrown font-black text-lg" numberOfLines={1}>{task.courseName}</Text>
                      <Text className="text-tigerBrown/70 text-sm font-bold">{task.moduleTitle}</Text>
                    </View>
                  </View>
                  <View className="bg-tigerOrange/20 px-3 py-1 rounded-full">
                    <Text className="text-tigerOrange font-black text-xs">GO</Text>
                  </View>
                </View>
                {/* Optional Task completion Trigger (if needed directly here) - Removing as user wants navigation */}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Completed Missions Section */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={{ marginRight: 8 }} />
            <Text className="text-tigerBrown text-xl font-black">Mission History</Text>
          </View>

          {tasks.filter(t => t.status === 'completed').length === 0 ? (
            <Text className="text-tigerBrown/40 font-bold ml-2">No completed missions yet.</Text>
          ) : (
            tasks.filter(t => t.status === 'completed').map((task) => (
              <View key={task.id} className="bg-green-50 p-4 rounded-xl mb-2 flex-row items-center border border-green-100">
                <View className="bg-green-100 h-8 w-8 rounded-full justify-center items-center mr-3">
                  <Ionicons name="trophy" size={16} color="#2E7D32" />
                </View>
                <View className="flex-1">
                  <Text className="text-tigerBrown font-bold text-base opacity-80 decoration-slate-500">{task.courseName}</Text>
                  <Text className="text-tigerBrown/50 text-xs font-bold">{task.moduleTitle}</Text>
                </View>
                <Ionicons name="checkmark-done" size={20} color="#2E7D32" />
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  );
}