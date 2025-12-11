import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { firestore } from "../../../config/firebase";

export default function CourseDetailsScreen() {
    const { id, title, color } = useLocalSearchParams();
    const [modules, setModules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchModules();
        }
    }, [id]);

    const fetchModules = async () => {
        try {
            const modulesRef = collection(firestore, "courses", id as string, "modules");
            const q = query(modulesRef, orderBy("order", "asc"));
            const snapshot = await getDocs(q);

            const modulesData = await Promise.all(snapshot.docs.map(async (doc) => {
                const lessonsRef = collection(firestore, "courses", id as string, "modules", doc.id, "lessons");
                const lessonsQ = query(lessonsRef, orderBy("order", "asc"));
                const lessonsSnapshot = await getDocs(lessonsQ);
                const lessons = lessonsSnapshot.docs.map(lDoc => ({ id: lDoc.id, ...lDoc.data() }));

                return {
                    id: doc.id,
                    ...doc.data(),
                    lessons
                };
            }));

            setModules(modulesData);
        } catch (error) {
            console.error("Error fetching modules:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLessonClick = (lesson: any, moduleId: string) => {
        router.push({
            pathname: "/child/course/lesson/[id]",
            params: {
                courseId: id,
                moduleId: moduleId,
                id: lesson.id,
                title: lesson.title
            }
        });
    }

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-base">
                <ActivityIndicator size="large" color={color as string || "#F0E491"} />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-base">
            {/* Header */}
            <View
                className="pt-12 pb-6 px-6 rounded-b-3xl shadow-lg"
                style={{ backgroundColor: color as string || "#4CAF50" }}
            >
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mb-4 bg-white/20 self-start p-2 rounded-full"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-3xl font-bold">{title}</Text>
                <Text className="text-white/80 text-lg">{modules.length} Modules</Text>
            </View>

            <ScrollView className="flex-1 px-4 mt-4" showsVerticalScrollIndicator={false}>
                {modules.map((module, index) => (
                    <View key={module.id} className="mb-6">
                        <Text className="text-primary text-xl font-bold mb-3 ml-2">
                            {module.title}
                        </Text>

                        <View className="bg-white rounded-2xl overflow-hidden shadow-sm">
                            {module.lessons.map((lesson: any, i: number) => (
                                <TouchableOpacity
                                    key={lesson.id}
                                    className={`flex-row items-center p-4 border-b border-gray-100 ${i === module.lessons.length - 1 ? 'border-b-0' : ''}`}
                                    onPress={() => handleLessonClick(lesson, module.id)}
                                >
                                    <View className="h-10 w-10 rounded-full bg-secondary/20 justify-center items-center mr-4">
                                        <Text className="text-primary font-bold">{i + 1}</Text>
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-gray-800 font-semibold text-lg">{lesson.title}</Text>
                                        <Text className="text-gray-500 text-xs uppercase font-bold tracking-wider">{lesson.type}</Text>
                                    </View>
                                    <Ionicons name="play-circle" size={32} color="#F0E491" />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
                <View className="h-10" />
            </ScrollView>
        </View>
    );
}
