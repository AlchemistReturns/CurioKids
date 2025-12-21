import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    PanResponder,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from "../../../../config/firebase";
import { ChildProgressService } from "../../../../services/ChildProgressService";

// Game Components
import BalanceScaleGame from "@/components/LessonEngine/BalanceScaleGame";
import BubblePopGame from "@/components/LessonEngine/BubblePopGame";
import TracingGame, { GameResult } from "@/components/LessonEngine/TracingGame";

const { width } = Dimensions.get("window");

export default function LessonScreen() {
    const { courseId, moduleId, id, title } = useLocalSearchParams();
    
    // Data State
    const [lesson, setLesson] = useState<any>(null);
    const [currentModuleOrder, setCurrentModuleOrder] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const hasExited = useRef(false);
    
    // Drag Game State
    const [draggedItem, setDraggedItem] = useState<string | null>(null);
    const dragPosition = useRef(new Animated.ValueXY()).current;
    
    // Game Logic State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [feedbackMsg, setFeedbackMsg] = useState<string>("");
    
    // Sequencing State
    const [sequenceStep, setSequenceStep] = useState<number>(0);
    const [completedSequence, setCompletedSequence] = useState<string[]>([]);

    // --- ANIMATION VALUES ---
    const shakeAnim = useRef(new Animated.Value(0)).current; 
    const scaleAnim = useRef(new Animated.Value(1)).current; 
    const lumoPosition = useRef(new Animated.Value(-100)).current; 
    
    const isBridgeLevel = lesson?.title?.toLowerCase().includes("bridge");

    useEffect(() => { fetchLesson(); }, [id]);

    const panResponder = useMemo(() => PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: Animated.event(
            [null, { dx: dragPosition.x, dy: dragPosition.y }],
            { useNativeDriver: false }
        ),
        onPanResponderRelease: (_, gesture) => {
            if (!lesson?.data) return;

            if (gesture.dy < -80) {
                if (draggedItem === lesson.data.correctAnswer) {
                    setIsCorrect(true);
                    setFeedbackMsg(lesson.data.successText || "Awesome!");
                    triggerSuccess();
                } else {
                    triggerShake();
                }
            }

            Animated.spring(dragPosition, {
                toValue: { x: 0, y: 0 },
                useNativeDriver: false
            }).start();
        }
    }), [lesson, draggedItem, isCorrect]);

    const getRandomEncouragement = () => {
        const phrases = ["Awesome!", "You're a Star! 🌟", "Super Brain! 🧠", "Way to go!", "Perfect!", "Smart Kid! 🎓"];
        return phrases[Math.floor(Math.random() * phrases.length)];
    };

    const fetchLesson = async () => {
        setLoading(true);
        try {
            const cId = courseId as string;
            const mId = moduleId as string;
            const lId = id as string;

            const lessonRef = doc(firestore, "courses", cId, "modules", mId, "lessons", lId);
            const lessonSnap = await getDoc(lessonRef);
            
            const moduleRef = doc(firestore, "courses", cId, "modules", mId);
            const moduleSnap = await getDoc(moduleRef);

            if (lessonSnap.exists() && moduleSnap.exists()) {
                setLesson(lessonSnap.data());
                setCurrentModuleOrder(moduleSnap.data().order);
                resetGameState();
            } else {
                router.back();
            }
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    const resetGameState = () => {
        setSelectedOption(null);
        setIsCorrect(false);
        setFeedbackMsg("");
        setSequenceStep(0);
        setCompletedSequence([]);
        shakeAnim.setValue(0);
        scaleAnim.setValue(1);
        lumoPosition.setValue(-100); 
    };

    // --- ANIMATION FUNCTIONS ---
    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start();
    };

    const triggerSuccess = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.5, duration: 150, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true })
        ]).start();

        if (isBridgeLevel) {
            Animated.timing(lumoPosition, {
                toValue: width, 
                duration: 3000, 
                easing: Easing.linear,
                useNativeDriver: true
            }).start();
        }
    };

    // --- LOGIC HANDLERS ---
    const handlePatternSelect = (option: string) => {
        setSelectedOption(option);
        if (option === lesson.data.correctAnswer) {
            setIsCorrect(true);
            setFeedbackMsg(getRandomEncouragement());
            triggerSuccess();
        } else {
            setIsCorrect(false);
            setFeedbackMsg("Oops! Try again!");
            triggerShake();
        }
    };

    const handleSortingSelect = (item: string) => {
        setSelectedOption(item);
        if (item === lesson.data.correctAnswer) {
            setIsCorrect(true);
            setFeedbackMsg(lesson.data.explanation || getRandomEncouragement());
            triggerSuccess();
        } else {
            setIsCorrect(false);
            setFeedbackMsg("Look closely!");
            triggerShake();
        }
    };

    const handleSequencingSelect = (item: string) => {
        const correctItem = lesson.data.correctOrder[sequenceStep];
        if (item === correctItem) {
            const newSequence = [...completedSequence, item];
            setCompletedSequence(newSequence);
            setSequenceStep(sequenceStep + 1);
            triggerSuccess(); 

            if (newSequence.length === lesson.data.correctOrder.length) {
                setIsCorrect(true);
                setFeedbackMsg("🌟 Perfect Order! You did it!");
            }
        } else {
            triggerShake();
            Alert.alert("Try Again", "That comes later! What happens first?");
        }
    };

    // --- TRACING HANDLER ---
    const handleTracingComplete = async (result: GameResult) => {
        if (!auth.currentUser || hasExited.current) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(
                auth.currentUser.uid, 
                id as string, 
                result.score || lesson.points, 
                result.stars || 3
            );
            setIsCorrect(true);
            await navigateToNextLesson();
        } catch (error) {
            console.error("Tracing Save Error:", error);
            Alert.alert("Error", "Could not save progress");
        } finally {
            setCompleting(false);
        }
    };

    // --- BUBBLE GAME HANDLER ---
    const handleBubbleComplete = async (score: number, stars: number) => {
        if (!auth.currentUser || hasExited.current) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(
                auth.currentUser.uid,
                id as string,
                score || 50,
                stars || 3
            );
            setIsCorrect(true);
            await navigateToNextLesson();
        } catch (error) {
            console.error("Bubble Save Error:", error);
            Alert.alert("Error", "Could not save progress");
        } finally {
            setCompleting(false);
        }
    };

    // --- BALANCE SCALE HANDLER ---
    const handleBalanceComplete = async (score: number, stars: number) => {
        if (!auth.currentUser || hasExited.current) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(
                auth.currentUser.uid,
                id as string,
                score || lesson.points || 50,
                stars || lesson.stars || 3
            );
            setIsCorrect(true);
            await navigateToNextLesson();
        } catch (error) {
            console.error("Balance Scale Save Error:", error);
            Alert.alert("Error", "Could not save progress");
        } finally {
            setCompleting(false);
        }
    };

    const navigateToNextLesson = async () => {
        try {
            const cId = courseId as string;
            const mId = moduleId as string;

            // If it's story_outro, navigate differently based on module
            if (lesson.type === 'story_outro') {
                if (currentModuleOrder === 4) {
                    // Last module - go back to courses tab
                    router.replace({
                        pathname: "/(tabs)/courses"
                    });
                    return;
                } else {
                    // Modules 1, 2, 3 - go to next module's first lesson
                    const nextModuleOrder = currentModuleOrder + 1;
                    const modulesRef = collection(firestore, "courses", cId, "modules");
                    const moduleQ = query(modulesRef, where("order", "==", nextModuleOrder), limit(1));
                    const moduleSnap = await getDocs(moduleQ);

                    if (!moduleSnap.empty) {
                        const nextModuleDoc = moduleSnap.docs[0];
                        const nextModuleId = nextModuleDoc.id;
                        const nextModLessonsRef = collection(firestore, "courses", cId, "modules", nextModuleId, "lessons");
                        const firstLessonQ = query(nextModLessonsRef, orderBy("order", "asc"), limit(1));
                        const firstLessonSnap = await getDocs(firstLessonQ);

                        if (!firstLessonSnap.empty) {
                            const firstLessonDoc = firstLessonSnap.docs[0];
                            router.replace({
                                pathname: "/child/course/lesson/[id]",
                                params: { courseId: cId, moduleId: nextModuleId, id: firstLessonDoc.id, title: firstLessonDoc.data().title }
                            });
                            return;
                        }
                    }
                }
            }

            const nextLessonOrder = lesson.order + 1;
            const lessonsRef = collection(firestore, "courses", cId, "modules", mId, "lessons");
            const lessonQ = query(lessonsRef, where("order", "==", nextLessonOrder), limit(1));
            const lessonSnap = await getDocs(lessonQ);

            if (!lessonSnap.empty) {
                const nextDoc = lessonSnap.docs[0];
                router.replace({
                    pathname: "/child/course/lesson/[id]",
                    params: { courseId: cId, moduleId: mId, id: nextDoc.id, title: nextDoc.data().title }
                });
                return;
            }

            // No more lessons in this module - go back to course modules list
            Alert.alert("Module Complete! 🏆", "Great work! Ready for the next challenge?",
                [{ 
                    text: "Continue", 
                    onPress: () => {
                        router.replace({
                            pathname: "/child/course/[id]",
                            params: { id: cId, title: title as string }
                        });
                    }
                }]
            );
        } catch (error) { 
            console.error("Navigation Error", error);
            // Fallback to course page on error
            router.replace({
                pathname: "/child/course/[id]",
                params: { id: courseId as string, title: title as string }
            });
        }
    };

    const handleComplete = async () => {
        if (!auth.currentUser) return;
        const isGame = ['logic_pattern', 'logic_sorting', 'logic_sequencing'].includes(lesson.type);
        if (isGame && !isCorrect) { triggerShake(); return; }

        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(auth.currentUser.uid, id as string, lesson.points || 10, lesson.stars || 1);
            await navigateToNextLesson();
        } catch (error) { console.error(error); } finally { setCompleting(false); }
    };

    if (loading) return <ActivityIndicator size="large" className="flex-1 bg-white justify-center items-center" />;
    if (!lesson) return null;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
                
                {/* Hide Header for Full Screen Games */}
                {lesson.type !== 'tracing' && lesson.type !== 'bubble_pop' && lesson.type !== 'balance_scale' && (
                    <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white z-10">
                        <TouchableOpacity onPress={() => { hasExited.current = true; router.back(); }} className="mr-4">
                            <Ionicons name="close" size={28} color="#333" />
                        </TouchableOpacity>
                        <Text className="text-xl font-bold flex-1 text-center mr-8 text-primary">{lesson.title}</Text>
                    </View>
                )}

                {/* --- RENDER CONTENT --- */}
                {lesson.type === 'tracing' ? (
                    <View className="flex-1 bg-[#edf0f7]">
                        <TracingGame 
                            key={id as string} 
                            data={lesson.data} 
                            onComplete={handleTracingComplete}
                            onExit={() => { hasExited.current = true; router.back(); }}
                        />
                        {completing && (
                             <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
                                <ActivityIndicator size="large" color="#FFD700" />
                                <Text className="text-white font-bold mt-4">Saving...</Text>
                            </View>
                        )}
                    </View>
                ) : lesson.type === 'bubble_pop' ? (
                    <View className="flex-1 bg-[#E0F7FA]">
                        <BubblePopGame 
                            onComplete={handleBubbleComplete}
                            onExit={() => { hasExited.current = true; router.back(); }}
                        />
                         {completing && (
                             <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
                                <ActivityIndicator size="large" color="#FFD700" />
                                <Text className="text-white font-bold mt-4">Great Job! Saving...</Text>
                            </View>
                        )}
                    </View>
                ) : lesson.type === 'balance_scale' ? (
                    <View className="flex-1 bg-[#FFF8E1]">
                        <BalanceScaleGame
                            leftTotal={lesson.data?.leftTotal || 10}
                            rightTotal={lesson.data?.rightTotal}
                            availableWeights={lesson.data?.availableWeights || [5, 10]}
                            theme={lesson.data?.theme}
                            mascot={lesson.data?.mascot}
                            mode={lesson.data?.mode}
                            mysterySlots={lesson.data?.mysterySlots}
                            fruitConversion={lesson.data?.fruitConversion}
                            leftDisplay={lesson.data?.leftDisplay}
                            hint={lesson.data?.hint}
                            onComplete={handleBalanceComplete}
                            onExit={() => { hasExited.current = true; router.back(); }}
                        />
                        {completing && (
                            <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
                                <ActivityIndicator size="large" color="#FFD700" />
                                <Text className="text-white font-bold mt-4">Perfect Balance! Saving...</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    // --- STANDARD LOGIC GAMES ---
                    <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
                        {isBridgeLevel && (
                            <View className="h-40 bg-sky-200 relative overflow-hidden mb-4 w-full">
                                <View className="absolute top-4 left-10"><Ionicons name="cloud" size={40} color="white" /></View>
                                <View className="absolute top-10 right-20"><Ionicons name="cloud" size={30} color="white" /></View>
                                <View className="absolute bottom-0 w-full h-12 bg-blue-400" />
                                <Animated.View style={{ position: 'absolute', bottom: 15, left: lumoPosition, zIndex: 10 }}>
                                    <Ionicons name="happy" size={50} color="#673AB7" />
                                </Animated.View>
                            </View>
                        )}

                        <View className="px-6 py-4">
                            {/* STORY INTRO */}
                            {lesson.type === 'story_intro' && (
                                <View className="items-center mt-4">
                                    <View className="bg-purple-100 p-8 rounded-full mb-6 border-4 border-purple-200 shadow-sm">
                                        <Ionicons name="happy" size={80} color="#673AB7" />
                                    </View>
                                    <Text className="text-2xl font-medium text-center mt-2 leading-9 text-gray-800">{lesson.content}</Text>
                                </View>
                            )}

                            {/* STORY OUTRO */}
                            {lesson.type === 'story_outro' && (
                                <View className="items-center mt-4">
                                    <View className="bg-yellow-100 p-8 rounded-full mb-6 border-4 border-yellow-300 shadow-sm">
                                        <Ionicons name="trophy" size={80} color="#FFD700" />
                                    </View>
                                    <Text className="text-2xl font-medium text-center mt-2 leading-9 text-gray-800">{lesson.content}</Text>
                                </View>
                            )}

                            {/* LOGIC PATTERN */}
                            {lesson.type === 'logic_pattern' && lesson.data && (
                                <View>
                                    <Text className="text-2xl font-bold text-center mb-6">{lesson.question}</Text>
                                    <View className={`flex-row justify-center items-end p-4 rounded-xl mb-10 flex-wrap min-h-[100px] ${isBridgeLevel ? 'bg-transparent' : 'bg-gray-50 border-2 border-dashed border-gray-200'}`}>
                                        {lesson.data.sequence.map((item: string, index: number) => (
                                            <View key={index} className="m-1 items-center">
                                                {item === "?" ? (
                                                    <Animated.View style={{ transform: [{ scale: isCorrect ? scaleAnim : 1 }] }}>
                                                        <View className={`w-16 h-16 rounded-lg justify-center items-center shadow-sm border-b-4 ${isCorrect ? 'bg-green-400 border-green-600' : 'bg-gray-200 border-gray-300 border-dashed'}`}>
                                                            <Text className="text-4xl">{isCorrect ? lesson.data.correctAnswer : "?"}</Text>
                                                        </View>
                                                    </Animated.View>
                                                ) : (
                                                    <View className={`w-16 h-16 rounded-lg justify-center items-center shadow-sm border-b-4 bg-white border-gray-300`}>
                                                        <Text className="text-4xl">{item}</Text>
                                                    </View>
                                                )}
                                                {isBridgeLevel && <View className="h-4 w-2 bg-gray-400 mt-[-2px]" />} 
                                            </View>
                                        ))}
                                    </View>
                                    <View className="flex-row justify-center gap-4">
                                        {lesson.data.options.map((option: string, index: number) => {
                                            const isSelected = selectedOption === option;
                                            const isThisCorrect = option === lesson.data.correctAnswer;
                                            const animatedStyle = (isSelected && !isThisCorrect) ? { transform: [{ translateX: shakeAnim }] } : {};
                                            return (
                                                <Animated.View key={index} style={animatedStyle}>
                                                    <TouchableOpacity onPress={() => handlePatternSelect(option)} disabled={isCorrect}
                                                        className={`w-20 h-20 rounded-xl justify-center items-center border-b-4 shadow-md ${isSelected ? (isThisCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500') : 'bg-white border-gray-200'}`}>
                                                        <Text className="text-4xl">{option}</Text>
                                                    </TouchableOpacity>
                                                </Animated.View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* LOGIC SORTING */}
                            {lesson.type === 'logic_sorting' && lesson.data && (
                                <View>
                                    <Text className="text-2xl font-bold text-center mb-8">{lesson.question}</Text>
                                    <View className="flex-row flex-wrap justify-center gap-4">
                                        {lesson.data.items.map((item: string, index: number) => {
                                            const isSelected = selectedOption === item;
                                            const isThisCorrect = item === lesson.data.correctAnswer;
                                            const animatedStyle = (isSelected && !isThisCorrect) ? { transform: [{ translateX: shakeAnim }] } : {};
                                            return (
                                                <Animated.View key={index} style={animatedStyle}>
                                                    <TouchableOpacity onPress={() => handleSortingSelect(item)}
                                                        className={`w-20 h-20 rounded-xl justify-center items-center border-b-4 ${isSelected ? (isThisCorrect ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500') : 'bg-white border-gray-200'}`}>
                                                        <Text className="text-4xl">{item}</Text>
                                                    </TouchableOpacity>
                                                </Animated.View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {/* LOGIC DRAG */}
                            {lesson.type === "logic_drag" && lesson.data && (
                                <View>
                                    <Text className="text-2xl font-bold text-center mb-6">{lesson.question}</Text>
                                    <View className="flex-row justify-center mb-12">
                                        {lesson.data.sequence.map((item: string, index: number) => (
                                            <View key={index} className={`w-16 h-16 mx-1 rounded-lg justify-center items-center border-2 ${item === "?" ? "border-dashed border-gray-400" : "bg-white border-gray-300"}`}>
                                                <Text className="text-4xl">{item === "?" && isCorrect ? lesson.data.correctAnswer : item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <View className="flex-row justify-center gap-6">
                                        {lesson.data.draggableOptions.map((option: string) =>
                                            draggedItem === option || draggedItem === null ? (
                                                <Animated.View key={option} {...panResponder.panHandlers} style={[dragPosition.getLayout(), { opacity: isCorrect ? 0.5 : 1 }]}>
                                                    <TouchableOpacity disabled={isCorrect} onPressIn={() => setDraggedItem(option)} className="w-20 h-20 rounded-xl bg-yellow-100 border-b-4 border-yellow-400 justify-center items-center shadow-md">
                                                        <Text className="text-4xl">{option}</Text>
                                                    </TouchableOpacity>
                                                </Animated.View>
                                            ) : null
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* LOGIC SEQUENCING */}
                            {lesson.type === 'logic_sequencing' && lesson.data && (
                                <View>
                                    <Text className="text-xl font-bold text-center mb-4">{lesson.question}</Text>
                                    <View className="flex-row justify-center mb-8 bg-gray-50 p-4 rounded-xl flex-wrap gap-2">
                                        {lesson.data.correctOrder.map((_: any, index: number) => (
                                            <Animated.View key={index} style={{ transform: [{ scale: completedSequence[index] ? scaleAnim : 1 }] }}>
                                                <View className={`w-16 h-16 rounded-xl justify-center items-center border-2 ${completedSequence[index] ? 'bg-green-100 border-green-500' : 'border-dashed border-gray-300'}`}>
                                                    <Text className="text-3xl">{completedSequence[index] || (index + 1)}</Text>
                                                </View>
                                            </Animated.View>
                                        ))}
                                    </View>
                                    <View className="flex-row justify-center gap-4 flex-wrap">
                                        {lesson.data.scrambled.map((item: string, index: number) => {
                                            const isUsed = completedSequence.includes(item);
                                            return (
                                                <Animated.View key={index} style={(!isUsed && !isCorrect) ? { transform: [{ translateX: shakeAnim }] } : {}}> 
                                                    <TouchableOpacity onPress={() => handleSequencingSelect(item)} disabled={isUsed || isCorrect}
                                                        className={`w-16 h-16 rounded-xl justify-center items-center shadow-sm border-b-4 ${isUsed ? 'bg-gray-100 opacity-50 border-gray-200' : 'bg-white border-blue-200'}`}>
                                                        <Text className="text-3xl">{item}</Text>
                                                    </TouchableOpacity>
                                                </Animated.View>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}

                            {feedbackMsg ? (
                                <View className={`p-4 rounded-xl mt-6 border-b-4 ${isCorrect ? 'bg-green-100 border-green-200' : 'bg-orange-100 border-orange-200'}`}>
                                    <Text className={`text-center font-bold text-lg ${isCorrect ? 'text-green-700' : 'text-orange-700'}`}>{feedbackMsg}</Text>
                                </View>
                            ) : null}
                        </View>
                    </ScrollView>
                )}

                {/* Footer Logic */}
                {lesson.type !== 'tracing' && lesson.type !== 'bubble_pop' && lesson.type !== 'balance_scale' && (
                    <View className="p-6 border-t border-gray-100 bg-white">
                        <TouchableOpacity
                            className={`py-4 rounded-xl shadow-md border-b-4 active:border-b-0 active:translate-y-1 ${(lesson.type === 'story_intro' || lesson.type === 'story_outro' || isCorrect) ? 'bg-secondary border-yellow-500' : 'bg-gray-200 border-gray-300'}`}
                            onPress={handleComplete}
                            disabled={(!isCorrect && lesson.type !== 'story_intro' && lesson.type !== 'story_outro') || completing}
                        >
                            {completing ? <ActivityIndicator color="#000" /> : <Text className={`text-center font-bold text-xl uppercase tracking-wider ${(lesson.type === 'story_intro' || lesson.type === 'story_outro' || isCorrect) ? 'text-primary' : 'text-gray-400'}`}>{lesson.type === 'story_intro' ? "Start Adventure 🚀" : lesson.type === 'story_outro' ? (currentModuleOrder === 4 ? "Return to Courses 🏠" : "Onto the Next Adventure! ➡️") : (isCorrect ? "Next Activity ➡️" : "Solve to Continue")}</Text>}
                        </TouchableOpacity>
                    </View>
                )}
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}