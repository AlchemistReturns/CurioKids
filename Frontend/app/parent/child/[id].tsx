import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CourseService } from "../../../services/CourseService";
import { TaskService, Task } from "../../../services/TaskService";
import { UserService } from "../../../services/UserService";
import { SessionService, SessionData } from "../../../services/SessionService";

export default function ChildDetailScreen() {
    const { id } = useLocalSearchParams();
    const [child, setChild] = useState<any>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    // Session State
    const [session, setSession] = useState<SessionData | null>(null);
    const [refreshingSession, setRefreshingSession] = useState(false);

    // Modal State
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [courses, setCourses] = useState<any[]>([]);
    const [modules, setModules] = useState<any[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
    const [selectedModule, setSelectedModule] = useState<any>(null);

    // Enrollment Management State
    const [enrollmentModalVisible, setEnrollmentModalVisible] = useState(false);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

    const [assigning, setAssigning] = useState(false);

    // Custom Time Modal State
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [customH, setCustomH] = useState(0);
    const [customM, setCustomM] = useState(30);
    const [customS, setCustomS] = useState(0);

    useFocusEffect(
        useCallback(() => {
            loadData();
            // Poll for session updates every 2s
            const interval = setInterval(fetchSession, 2000);
            return () => clearInterval(interval);
        }, [id])
    );

    const loadData = async () => {
        setLoading(true);
        try {
            // Parallel Fetch
            const [childData, taskList, courseList, sessionData] = await Promise.all([
                UserService.getProfile(id as string),
                TaskService.getChildTasks(id as string),
                CourseService.getCourses(),
                SessionService.getSession(id as string)
            ]);

            setChild(childData);
            setTasks(taskList);
            setSession(sessionData);

            // Fetch Enrollments
            const enrolledIds = await CourseService.getEnrolledCourses(id as string);
            setEnrolledCourseIds(enrolledIds);

            setCourses(courseList);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSession = async () => {
        try {
            const data = await SessionService.getSession(id as string);

            // Apply Pending Action Locally for Display
            // If Child is offline, pendingAction sits in DB. We should show the RESULT of that action.
            if (data.pendingAction) {
                const action = data.pendingAction;
                if (action.type === 'add_time') {
                    data.timeLeft = Math.max(0, data.timeLeft + (action.value * 60));
                    data.isActive = true;
                } else if (action.type === 'set_active') {
                    data.isActive = action.value;
                } else if (action.type === 'reset') {
                    data.timeLeft = action.value;
                    data.isActive = true;
                }
            }
            setSession(data);
        } catch (e) {
            console.log('Session sync failed');
        }
    }

    const sendAction = async (actionFn: () => any) => {
        if (!session) return;
        setRefreshingSession(true);
        try {
            const action = actionFn();
            // Optimistic Update (Guess)
            if (action.type === 'add_time') {
                setSession({ ...session, timeLeft: Math.max(0, session.timeLeft + (action.value * 60)), isActive: true });
            } else if (action.type === 'set_active') {
                setSession({ ...session, isActive: action.value });
            }

            let finalAction = action;

            // MERGE Logic: Check if there's already a pending action of the same type
            // This prevents rapid clicks from overwriting previous ones
            if (session.pendingAction && session.pendingAction.type === 'add_time' && action.type === 'add_time') {
                console.log('Merging Actions:', session.pendingAction.value, '+', action.value);
                finalAction = {
                    ...action,
                    value: session.pendingAction.value + action.value
                };
            }

            await SessionService.updateSession(id as string, {
                pendingAction: { ...finalAction, id: Math.random().toString(36).substring(7) },
                lastUpdatedBy: 'parent'
            });
        } catch (e) {
            Alert.alert("Error", "Failed to send command");
        } finally {
            setRefreshingSession(false);
        }
    };

    const handleAddTime = (minutes: number) => {
        sendAction(() => ({ type: 'add_time', value: minutes }));
    };

    const handleSetCustomTime = () => {
        const totalSeconds = (customH * 3600) + (customM * 60) + customS;
        sendAction(() => ({ type: 'reset', value: totalSeconds }));
        setTimeModalVisible(false);
    };

    const adjustTime = (type: 'h' | 'm' | 's', delta: number) => {
        if (type === 'h') setCustomH(prev => Math.max(0, Math.min(23, prev + delta)));
        if (type === 'm') setCustomM(prev => {
            const next = prev + delta;
            if (next > 59) return 0;
            if (next < 0) return 59;
            return next;
        });
        if (type === 's') setCustomS(prev => {
            const next = prev + delta;
            if (next > 59) return 0;
            if (next < 0) return 59;
            return next;
        });
    };

    const openTimeModal = () => {
        // Pre-fill with current time remaining (optional, or just default to 00:30:00)
        if (session) {
            const h = Math.floor(session.timeLeft / 3600);
            const m = Math.floor((session.timeLeft % 3600) / 60);
            const s = session.timeLeft % 60;
            setCustomH(h);
            setCustomM(m);
            setCustomS(s);
        }
        setTimeModalVisible(true);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatHours = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${hrs}h ${mins}m`;
    };

    const handleCourseSelect = async (course: any) => {
        setSelectedCourse(course);
        setSelectedModule(null);
        try {
            if (course.isTest) {
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

    const handleToggleEnrollment = async (courseId: string) => {
        const isEnrolled = enrolledCourseIds.includes(courseId);
        const newStatus = !isEnrolled;
        try {
            const updatedList = await CourseService.toggleEnrollment(id as string, courseId, newStatus);
            setEnrolledCourseIds(updatedList);
        } catch (e) {
            Alert.alert("Error", "Failed to update enrollment");
        }
    };

    const handleAssign = async () => {
        if (!selectedCourse || !selectedModule) {
            Alert.alert("Error", "Please select both a course and a module.");
            return;
        }

        setAssigning(true);
        try {
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
            loadData();
        } catch (e) {
            Alert.alert("Error", "Failed to assign task");
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

    const activeTasks = tasks.filter(t => t.status === 'pending');
    const completedTasks = tasks.filter(t => t.status === 'completed');

    return (
        <View className="flex-1 bg-tigerCream">
            <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] flex-row items-center shadow-sm z-10 mb-6">
                <TouchableOpacity onPress={() => router.back()} className="bg-white/30 p-2 rounded-full mr-4">
                    <Ionicons name="arrow-back" size={24} color="#5A3E29" />
                </TouchableOpacity>
                <View>
                    <Text className="text-tigerBrown text-2xl font-black">{child?.name || "Child Details"}</Text>
                    <Text className="text-tigerBrown/70 font-bold">Manage & Monitor</Text>
                </View>
            </View>

            <ScrollView className="flex-1 px-6">

                {/* --- Screen Time Controls --- */}
                {session && (
                    <View className="bg-tigerCard rounded-3xl p-6 mb-8 shadow-sm border-2 border-tigerBrown/10">
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-tigerBrown/60 text-sm uppercase font-black tracking-wider">Screen Time & Lumo's Energy</Text>
                            <View className={`px-2 py-1 rounded-full ${session.isActive ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Text className={`text-xs font-bold ${session.isActive ? 'text-green-700' : 'text-red-700'}`}>
                                    {session.isActive ? 'ACTIVE' : 'PAUSED'}
                                </Text>
                            </View>
                        </View>

                        {/* Stats Row */}
                        <View className="flex-row justify-between items-end mb-6">
                            <View>
                                <Text className="text-tigerBrown text-4xl font-black tracking-widest">
                                    {formatTime(session.timeLeft)}
                                </Text>
                                <Text className="text-sm font-bold text-tigerBrown/50">REMAINING</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-tigerBrown text-2xl font-black tracking-widest">
                                    {formatHours(session.totalUsageToday)}
                                </Text>
                                <Text className="text-sm font-bold text-tigerBrown/50">USED TODAY</Text>
                            </View>
                        </View>

                        {/* Controls */}
                        {/* Row 1: Fine Tune +/- 1m */}
                        <View className="flex-row justify-between mb-3">
                            <TouchableOpacity onPress={() => handleAddTime(-1)} className="bg-white flex-1 mr-2 p-3 rounded-xl items-center border border-tigerBrown/10">
                                <Text className="text-tigerBrown font-black">-1m</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleAddTime(1)} className="bg-white flex-1 ml-2 p-3 rounded-xl items-center border border-tigerBrown/10">
                                <Text className="text-tigerBrown font-black">+1m</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row 2: Bulk +/- 15m AND Custom */}
                        <View className="flex-row justify-between mb-4">
                            <TouchableOpacity onPress={() => handleAddTime(-15)} className="bg-white flex-1 mr-2 p-3 rounded-xl items-center border border-tigerBrown/10">
                                <Text className="text-tigerBrown font-black">-15m</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={openTimeModal} className="bg-tigerYellow flex-1 mx-1 p-3 rounded-xl items-center border border-tigerOrange">
                                <Text className="text-tigerBrown font-black">Set Time</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleAddTime(15)} className="bg-white flex-1 ml-2 p-3 rounded-xl items-center border border-tigerBrown/10">
                                <Text className="text-tigerBrown font-black">+15m</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Row 3: Actions */}
                        <View className="flex-row justify-between">
                            <TouchableOpacity
                                onPress={() => sendAction(() => ({ type: 'set_active', value: !session.isActive }))}
                                className={`flex-1 mr-2 p-3 rounded-xl items-center border-2 ${session.isActive ? 'bg-tigerOrange/20 border-tigerOrange' : 'bg-green-100 border-green-500'}`}
                            >
                                <View className="flex-row items-center">
                                    <Ionicons name={session.isActive ? "pause" : "play"} size={20} color={session.isActive ? "#FF6E4F" : "green"} />
                                    <Text className={`font-bold ml-1 ${session.isActive ? 'text-tigerOrange' : 'text-green-700'}`}>
                                        {session.isActive ? "Pause" : "Resume"}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => sendAction(() => ({ type: 'reset', value: 1800 }))}
                                className="bg-tigerBrown flex-1 ml-2 p-3 rounded-xl items-center flex-row justify-center"
                            >
                                <Ionicons name="refresh" size={18} color="#FFF" />
                                <Text className="text-tigerCream font-bold ml-1">Reset</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}


                {/* --- Enrolled Courses Section --- */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-tigerBrown text-xl font-black">Enrolled Courses</Text>
                        <TouchableOpacity
                            onPress={() => setEnrollmentModalVisible(true)}
                            className="bg-tigerYellow px-4 py-2 rounded-xl border border-tigerOrange"
                        >
                            <Text className="text-tigerBrown font-bold">Manage Courses</Text>
                        </TouchableOpacity>
                    </View>

                    {enrolledCourseIds.length === 0 ? (
                        <View className="bg-white p-4 rounded-2xl items-center border border-dashed border-tigerBrown/20">
                            <Text className="text-tigerBrown/60 font-bold">No courses enrolled yet.</Text>
                        </View>
                    ) : (
                        <View className="flex-row flex-wrap">
                            {courses.filter(c => enrolledCourseIds.includes(c.id)).map(course => (
                                <View key={course.id} className="bg-white mr-2 mb-2 px-3 py-1 rounded-full border border-tigerBrown/10">
                                    <Text className="text-tigerBrown text-xs font-bold">{course.title}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

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

                {
                    activeTasks.length === 0 ? (
                        <View className="bg-white p-6 rounded-2xl items-center border-2 border-tigerBrown/5 mb-6">
                            <Text className="text-tigerBrown font-bold">No tasks assigned.</Text>
                        </View>
                    ) : (
                        activeTasks.map((task, index) => (
                            <View key={index} className="bg-white p-4 rounded-2xl mb-3 shadow-sm border-l-4 border-tigerOrange flex-row justify-between items-center">
                                <View className="flex-1">
                                    <Text className="text-tigerBrown font-bold text-lg">{task.courseName}</Text>
                                    <Text className="text-tigerBrown/70 text-sm">{task.moduleTitle}</Text>
                                </View>
                                <View className="flex-row items-center">
                                    <View className="border-2 border-gray-300 w-8 h-8 rounded-lg mr-3" />
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
                    )
                }

                {/* Completed Tasks Section */}
                {
                    completedTasks.length > 0 && (
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
                    )
                }

            </ScrollView >

            {/* Custom Time Picker Modal */}
            < Modal
                animationType="fade"
                transparent={true}
                visible={timeModalVisible}
                onRequestClose={() => setTimeModalVisible(false)
                }
            >
                <View className="flex-1 justify-center items-center bg-black/60 px-6">
                    <View className="bg-white p-6 rounded-3xl w-full shadow-lg">
                        <Text className="text-center text-tigerBrown text-2xl font-black mb-6">Set Timer</Text>

                        <View className="flex-row justify-center items-center mb-8 bg-tigerCream/50 p-4 rounded-2xl">
                            {/* Hours */}
                            <View className="items-center mx-2">
                                <TouchableOpacity onPress={() => adjustTime('h', 1)} className="p-2">
                                    <Ionicons name="chevron-up" size={30} color="#5A3E29" />
                                </TouchableOpacity>
                                <Text className="text-4xl font-black text-tigerOrange my-2 w-16 text-center">
                                    {customH.toString().padStart(2, '0')}
                                </Text>
                                <Text className="text-xs font-bold text-tigerBrown/50 uppercase">hours</Text>
                                <TouchableOpacity onPress={() => adjustTime('h', -1)} className="p-2">
                                    <Ionicons name="chevron-down" size={30} color="#5A3E29" />
                                </TouchableOpacity>
                            </View>

                            <Text className="text-4xl font-black text-tigerBrown/20 -mt-6">:</Text>

                            {/* Minutes */}
                            <View className="items-center mx-2">
                                <TouchableOpacity onPress={() => adjustTime('m', 1)} className="p-2">
                                    <Ionicons name="chevron-up" size={30} color="#5A3E29" />
                                </TouchableOpacity>
                                <Text className="text-4xl font-black text-tigerOrange my-2 w-16 text-center">
                                    {customM.toString().padStart(2, '0')}
                                </Text>
                                <Text className="text-xs font-bold text-tigerBrown/50 uppercase">mins</Text>
                                <TouchableOpacity onPress={() => adjustTime('m', -1)} className="p-2">
                                    <Ionicons name="chevron-down" size={30} color="#5A3E29" />
                                </TouchableOpacity>
                            </View>

                            <Text className="text-4xl font-black text-tigerBrown/20 -mt-6">:</Text>

                            {/* Seconds */}
                            <View className="items-center mx-2">
                                <TouchableOpacity onPress={() => adjustTime('s', 1)} className="p-2">
                                    <Ionicons name="chevron-up" size={30} color="#5A3E29" />
                                </TouchableOpacity>
                                <Text className="text-4xl font-black text-tigerOrange my-2 w-16 text-center">
                                    {customS.toString().padStart(2, '0')}
                                </Text>
                                <Text className="text-xs font-bold text-tigerBrown/50 uppercase">secs</Text>
                                <TouchableOpacity onPress={() => adjustTime('s', -1)} className="p-2">
                                    <Ionicons name="chevron-down" size={30} color="#5A3E29" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View className="flex-row">
                            <TouchableOpacity
                                onPress={() => setTimeModalVisible(false)}
                                className="flex-1 bg-gray-200 py-4 rounded-xl mr-2 items-center"
                            >
                                <Text className="font-bold text-gray-500 text-lg">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSetCustomTime}
                                className="flex-1 bg-tigerOrange py-4 rounded-xl ml-2 items-center"
                            >
                                <Text className="font-bold text-white text-lg">Set Time</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal >

            {/* Assignment Modal */}
            < Modal
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
            </Modal >

            {/* Enrollment Management Modal */}
            < Modal
                animationType="slide"
                transparent={true}
                visible={enrollmentModalVisible}
                onRequestClose={() => setEnrollmentModalVisible(false)}
            >
                <View className="flex-1 justify-end bg-black/50">
                    <View className="bg-white rounded-t-[30px] p-6 h-[70%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-tigerBrown text-2xl font-black">Manage Enrollments</Text>
                            <TouchableOpacity onPress={() => setEnrollmentModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#5A3E29" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-tigerBrown/60 font-bold mb-4">
                            Select courses to make them visible on {child?.name || "your child"}'s dashboard.
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {courses.map(course => {
                                const isEnrolled = enrolledCourseIds.includes(course.id);
                                const isExpanded = expandedCourseId === course.id;

                                return (
                                    <View key={course.id} className="mb-3">
                                        <TouchableOpacity
                                            onPress={() => setExpandedCourseId(isExpanded ? null : course.id)}
                                            className={`flex-row items-center justify-between p-4 rounded-2xl border-2 ${isEnrolled ? 'bg-tigerYellow/10 border-tigerYellow' : 'bg-white border-gray-100'}`}
                                        >
                                            <View className="flex-row items-center flex-1">
                                                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3`} style={{ backgroundColor: course.color || '#ccc' }}>
                                                    <Ionicons name={course.icon || 'school'} size={20} color="white" />
                                                </View>
                                                <View>
                                                    <Text className="text-tigerBrown font-bold text-lg">{course.title}</Text>
                                                    <Text className="text-tigerBrown/50 text-xs font-bold">Age: {course.ageTag || 'All ages'}</Text>
                                                </View>
                                            </View>

                                            {/* Enrollment Checkbox (Separate Touch Area) */}
                                            <TouchableOpacity
                                                onPress={() => handleToggleEnrollment(course.id)}
                                                className={`w-8 h-8 rounded-lg items-center justify-center border-2 ${isEnrolled ? 'bg-tigerOrange border-tigerOrange' : 'border-gray-300'}`}
                                            >
                                                {isEnrolled && <Ionicons name="checkmark" size={20} color="white" />}
                                            </TouchableOpacity>
                                        </TouchableOpacity>

                                        {/* Expandable Description */}
                                        {isExpanded && (
                                            <View className="bg-tigerCream/50 mx-2 p-3 rounded-b-xl -mt-2 border border-t-0 border-tigerBrown/5">
                                                <Text className="text-tigerBrown/70 text-sm">{course.description || "No description available."}</Text>
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </ScrollView>

                        <TouchableOpacity
                            onPress={() => setEnrollmentModalVisible(false)}
                            className="bg-tigerBrown py-4 rounded-xl items-center mt-4"
                        >
                            <Text className="text-white font-bold text-lg">Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal >
        </View >
    );
}
