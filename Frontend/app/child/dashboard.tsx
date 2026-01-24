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
        <TouchableOpacity
          className="bg-tigerCard py-6 px-6 rounded-3xl flex-row items-center justify-between mb-8 shadow-sm"
          onPress={() => router.push("/(tabs)/courses")}
        >
          <View>
            <Text className="text-tigerBrown text-2xl font-black uppercase tracking-widest mb-1">Fun with Numbers</Text>
            <Text className="text-tigerBrown/70 font-bold">Continue Learning</Text>
          </View>
          <View className="bg-tigerBrown h-12 w-12 rounded-full justify-center items-center">
            <Ionicons name="play" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Stats Row */}
        <View className="flex-row justify-between mb-8 card-container">
          {/* Stars Card (formerly Trophy) */}
          <View className="bg-tigerCard w-[31%] p-3 rounded-2xl items-center justify-center shadow-sm">
            <Ionicons name="star" size={28} color="#FFD700" />
            <Text className="text-tigerBrown text-xs font-bold mt-1">Stars</Text>
            <Text className="text-tigerBrown text-lg font-black">{totalPoints}</Text>
          </View>

          {/* Courses Completed Card (formerly Star) */}
          <View className="bg-tigerCard w-[31%] p-3 rounded-2xl items-center justify-center shadow-sm">
            <Ionicons name="ribbon" size={28} color="#5A3E29" />
            <Text className="text-tigerBrown text-xs font-bold mt-1">Courses</Text>
            <Text className="text-tigerBrown text-lg font-black">{completedCoursesCount}</Text>
          </View>

          {/* Fire Card */}
          <View className="bg-tigerCard w-[31%] p-3 rounded-2xl items-center justify-center shadow-sm">
            <Ionicons name="flame" size={28} color="#FF8C00" />
            <Text className="text-tigerBrown text-xs font-bold mt-1">Streak</Text>
            <Text className="text-tigerBrown text-lg font-black">{streak}</Text>
          </View>
        </View>

        {/* Tasks Section */}
        <Text className="text-tigerBrown text-xl font-bold mb-4">My Tasks</Text>

        {allTasks.length === 0 ? (
          <View className="bg-white p-6 rounded-2xl items-center border-2 border-tigerBrown/5 mb-8">
            <Ionicons name="happy" size={32} color="#5A3E29" className="opacity-50 mb-2" />
            <Text className="text-tigerBrown font-bold">No tasks assigned yet!</Text>
            <Text className="text-tigerBrown/60 text-xs">Ask your parent for a mission.</Text>
          </View>
        ) : (
          allTasks.map((task) => (
            <View key={task.id} className="bg-tigerCard p-5 rounded-2xl flex-row items-center mb-4 shadow-sm border-2 border-tigerBrown/5">
              <View className="bg-tigerBrown/10 h-10 w-10 rounded-full justify-center items-center mr-4">
                <Ionicons name="rocket" size={20} color="#5A3E29" />
              </View>
              <View className="flex-1">
                <Text className="text-tigerBrown font-bold text-lg">{task.courseName}</Text>
                <Text className="text-tigerBrown/70 text-sm font-bold">{task.moduleTitle}</Text>
              </View>

              {task.status === 'completed' ? (
                <View className="bg-green-100 p-2 rounded-full">
                  <Ionicons name="checkmark" size={24} color="green" />
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleTaskComplete(task.id, task.starsReward || 50)}
                  disabled={completingTask === task.id}
                  className="bg-white border-2 border-tigerBrown/20 w-10 h-10 rounded-xl justify-center items-center"
                >
                  {completingTask === task.id && <ActivityIndicator color="#5A3E29" />}
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

      </ScrollView>
    </View>
  );
}