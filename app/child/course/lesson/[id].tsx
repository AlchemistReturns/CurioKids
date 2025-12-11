import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from "../../../../config/firebase";
import { ChildProgressService } from "../../../../services/ChildProgressService";

export default function LessonScreen() {
    const { courseId, moduleId, id, title } = useLocalSearchParams();
    const [lesson, setLesson] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        if (auth.currentUser) {
            getDoc(doc(firestore, "users", auth.currentUser.uid)).then(snap => {
                if (snap.exists()) {
                    setRole(snap.data().role);
                }
            });
        }
    }, []);

    useEffect(() => {
        fetchLesson();
    }, [id]);

    const fetchLesson = async () => {
        try {
            const docRef = doc(
                firestore,
                "courses",
                courseId as string,
                "modules",
                moduleId as string,
                "lessons",
                id as string
            );
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setLesson(docSnap.data());
            } else {
                Alert.alert("Error", "Lesson not found");
                router.back();
            }
        } catch (error) {
            console.error("Error fetching lesson:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        if (!auth.currentUser) return;
        setCompleting(true);
        try {
            const points = lesson.points || 10;
            const stars = lesson.stars || 1;

            await ChildProgressService.markItemComplete(
                auth.currentUser.uid,
                id as string,
                points,
                stars
            );

            Alert.alert(
                "Great Job!",
                `You earned ${points} Points and ${stars} Star!`,
                [
                    { text: "Continue", onPress: () => router.back() }
                ]
            );

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not save progress. Try again.");
        } finally {
            setCompleting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-base">
                <ActivityIndicator size="large" color="#F0E491" />
            </View>
        );
    }

    if (!lesson) return null;

    return (
        <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
            <View className="flex-row items-center px-4 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-4">
                    <Ionicons name="close" size={28} color="#333" />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1 text-center mr-8">{title}</Text>
            </View>

            <ScrollView className="flex-1 px-6 py-8">
                {/* Content Display */}
                <View className="mb-10">
                    {lesson.type === 'lesson' && (
                        <Text className="text-2xl font-medium leading-10 text-gray-800 text-center">
                            {lesson.content}
                        </Text>
                    )}

                    {lesson.type === 'exercise' && (
                        <View>
                            <Text className="text-2xl font-bold text-center mb-8">{lesson.question}</Text>
                            {/* Placeholder Input/Interaction for now simply displaying Answer button */}
                            <View className="bg-gray-100 p-6 rounded-xl">
                                <Text className="text-gray-500 text-center italic">Answer: {lesson.answer}</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* Rewards Preview */}
                <View className="flex-row justify-center space-x-8 mb-10">
                    <View className="items-center">
                        <Ionicons name="trophy" size={32} color="#F0E491" />
                        <Text className="font-bold text-gray-600 mt-1">+{lesson.points} Pts</Text>
                    </View>
                    <View className="items-center">
                        <Ionicons name="star" size={32} color="#F0E491" />
                        <Text className="font-bold text-gray-600 mt-1">+{lesson.stars} Star</Text>
                    </View>
                </View>
            </ScrollView>

            <View className="p-6 border-t border-gray-100">
                {role === 'parent' ? (
                    <View className="bg-gray-100 py-4 rounded-xl">
                        <Text className="text-gray-500 text-center font-bold text-lg">
                            Parent View Only
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        className="bg-secondary py-4 rounded-xl shadow-sm active:bg-secondary/80"
                        onPress={handleComplete}
                        disabled={completing}
                    >
                        {completing ? (
                            <ActivityIndicator color="#primary" />
                        ) : (
                            <Text className="text-primary text-center font-bold text-xl uppercase tracking-wider">
                                Complete
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}
