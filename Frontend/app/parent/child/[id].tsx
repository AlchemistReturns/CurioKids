import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CourseService } from "../../../services/CourseService";
import { TaskService, Task } from "../../../services/TaskService";
import { UserService } from "../../../services/UserService";

export default function ChildDetailScreen() {
    const { id } = useLocalSearchParams();
    const [child, setChild] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [selectedModule, setSelectedModule] = useState<any>(null);
    const [assigning, setAssigning] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [id])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            // Fetch Child Profile
            const childData = await UserService.getProfile(id as string);
            setChild(childData);

            // Fetch Tasks
            const taskList = await TaskService.getChildTasks(id as string);
            setTasks(taskList);

            // Fetch Courses for Dropdown
            const courseList = await CourseService.getCourses();

            // Inject Test Course
            const testCourse = {
                id: 'test_course_id_1',
                title: 'TEST',
                description: 'Click to complete instantly!',
                icon: 'flask',
                color: '#9C27B0',
                isTest: true,
                stars: 50
            };
            setCourses([...courseList, testCourse]);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCourseSelect = async (course: any) => {
        setSelectedCourse(course);
        setSelectedModule(null);
        try {
            if (course.isTest) {
                // Mock modules for Test Course
                setModules([
                    { id: 'test_module_1', title: 'Test Module 1' },
                    { id: 'test_module_2', title: 'Test Module 2' }
                ]);
            } else {
                const modulesData = await CourseService.getModules(course.id);
                setModules(modulesData);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleAssign = async () => {
        if (!selectedCourse || !selectedModule) {
            Alert.alert("Error", "Please select both a course and a module.");
            return;
        }

        setAssigning(true);
        try {
            // Needed parentId. Assuming we can get it from child or auth context if stored. 
            // In this simplistic flow, we'll try to get it from child's data (parentUid) or just pass a dummy if missing (backend might need it).
            // Actually, backend requires it. childData usually has parentUid. 
            const parentId = child?.parentUid;

            await TaskService.assignTask({
                parentId: parentId,
                childId: id,
                courseId: selectedCourse.id,
                courseName: selectedCourse.title,
                moduleId: selectedModule.id,
                moduleTitle: selectedModule.title
            });

            Alert.alert("Success", "Task assigned!");
            setAssignModalVisible(false);
            loadData(); // Reload tasks

            // Limit tasks?
            // "Missed task will be added to a list seperately..."
            // We manage active tasks here.
        } catch (e) {
            Alert.alert("Error", "Failed to assign task");
            console.error(e);
        } finally {
            setAssigning(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-tigerCream">
                <ActivityIndicator size="large" color="#FF6E4F" />
            </View>
        );
    }

    // Filter tasks
    const activeTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    // Missed tasks? Backend might handle status update logic later, 
    // but for now let's just show Pending and Completed here.

    return (
        <View className="flex-1 bg-tigerCream">
            <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] flex-row items-center shadow-sm z-10 mb-6">
                <TouchableOpacity onPress={() => router.back()} className="bg-white/30 p-2 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={24} color="#5A3E29" />
                </TouchableOpacity>
                <View>
                    <Text className="text-tigerBrown text-2xl font-black">{child?.name || "Child Details"}</Text>
                    <Text className="text-tigerBrown/70 font-bold">Manage Tasks</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6">

                {/* Active Tasks Section */}
                <View className="flex-row justify-between items-center mb-4">
                    <Text className="text-tigerBrown text-xl font-black">Assigned Tasks</Text>
                    <TouchableOpacity
                        onPress={() => setAssignModalVisible(true)}
                        className="bg-tigerOrange px-4 py-2 rounded-xl flex-row items-center"
                    >
                        <Ionicons name="add" size={20} color="white" />
                        <Text className="text-white font-bold ml-1">Assign Task</Text>
                    </TouchableOpacity>
                </View>

                {activeTasks.length === 0 ? (
                    <View className="bg-white p-6 rounded-2xl items-center border-2 border-tigerBrown/5 mb-6">
                        <Text className="text-tigerBrown font-bold">No tasks assigned.</Text>
                    </View>
                ) : (
                    activeTasks.map((task, index) => (
                        <View key={index} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border-l-4 border-tigerOrange flex-row justify-between items-center">
                            <View className="flex-1">
                                <Text className="text-tigerBrown font-bold text-lg">{task.courseName}</Text>
                                <Text className="text-tigerBrown/70 text-sm">{task.moduleTitle}</Text>
                                {/* <Text className="text-xs text-gray-400 mt-1">Due: {new Date(task.dueDate!).toLocaleDateString()}</Text> */}
                            </View>
                            <View className="flex-row items-center">
                                {/* Empty box for incomplete visual */}
                                <View className="border-2 border-gray-300 w-8 h-8 rounded-lg mr-3" />

                                {/* Trash Icon */}
                                <TouchableOpacity
                                    onPress={() => {
                                        Alert.alert(
                                            "Delete Task",
                                            "Are you sure you want to remove this task?",
                                            [
                                                { text: "Cancel", style: "cancel" },
                                                {
                                                    text: "Delete", style: "destructive", onPress: async () => {
                                                        try {
                                                            await TaskService.deleteTask(task.id);
                                                            loadData();
                                                        } catch (e) {
                                                            Alert.alert("Error", "Failed to delete task");
                                                        }
                                                    }
                                                }
                                            ]
                                        );
                                    }}
                                    className="bg-red-50 p-2 rounded-full"
                                >
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}

                {/* Completed Tasks Section */}
                {completedTasks.length > 0 && (
                    <>
                        <Text className="text-tigerBrown text-xl font-black mb-4 mt-4">Completed Tasks</Text>
                        {completedTasks.map((task, index) => (
                            <View key={index} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border-l-4 border-green-500 flex-row justify-between items-center opacity-70">
                                <View className="flex-1">
                                    <Text className="text-tigerBrown font-bold text-lg line-through">{task.courseName}</Text>
                                    <Text className="text-tigerBrown/70 text-sm line-through">{task.moduleTitle}</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={32} color="green" />
                            </View>
                        ))}
                    </>
                )}

            </ScrollView>

            {/* Assignment Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={assignModalVisible}
                onRequestClose={() => setAssignModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[30px] p-6 h-[80%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-tigerBrown text-2xl font-black">Assign New Task</Text>
                            <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#5A3E29" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* 1. Course Selection */}
                            <Text className="text-tigerBrown font-bold mb-2 text-lg">Select Course</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                                {courses.map((course) => (
                                    <TouchableOpacity
                                        key={course.id}
                                        onPress={() => handleCourseSelect(course)}
                                        className={`mr-3 p-4 rounded-2xl border-2 ${selectedCourse?.id === course.id ? 'bg-tigerOrange border-tigerOrange' : 'bg-white border-gray-200'}`}
                                    >
                                        <Text className={`${selectedCourse?.id === course.id ? 'text-white' : 'text-tigerBrown'} font-bold`}>{course.title}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* 2. Module Selection */}
                            {selectedCourse && (
                                <>
                                    <Text className="text-tigerBrown font-bold mb-2 text-lg">Select Module</Text>
                                    {modules.length === 0 ? (
                                        <ActivityIndicator color="#FF6E4F" />
                                    ) : (
                                        <View className="flex-row flex-wrap">
                                            {modules.map((mod) => (
                                                <TouchableOpacity
                                                    key={mod.id}
                                                    onPress={() => setSelectedModule(mod)}
                                                    className={`mr-2 mb-2 px-4 py-2 rounded-xl border ${selectedModule?.id === mod.id ? 'bg-tigerYellow border-tigerYellow' : 'bg-white border-gray-200'}`}
                                                >
                                                    <Text className="text-tigerBrown font-bold">{mod.title}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </>
                            )}
                        </ScrollView>

                        <View className="mt-4 flex-row justify-between">
                            <TouchableOpacity
                                onPress={() => setAssignModalVisible(false)}
                                className="flex-1 py-4 rounded-xl items-center bg-gray-200 mr-2"
                            >
                                <Text className="text-tigerBrown font-bold text-lg">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAssign}
                                disabled={assigning}
                                className={`flex-1 py-4 rounded-xl items-center ${assigning ? 'bg-gray-300' : 'bg-tigerOrange'} ml-2`}
                            >
                                {assigning ? <ActivityIndicator color="white" /> : (
                                    <Text className="text-white font-bold text-lg">Assign</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
