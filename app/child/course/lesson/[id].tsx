import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    LayoutAnimation,
    Platform,
    Text,
    TouchableOpacity,
    UIManager,
    View
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from "../../../../config/firebase";
import { ChildProgressService } from "../../../../services/ChildProgressService";

// --- 🔊 AUDIO MANAGER ---
// Make sure this path is correct based on your folder structure!
import { audioManager } from "@/components/LessonEngine/AudioManager";

// Game Components
import BalanceScaleGame from "@/components/LessonEngine/BalanceScaleGame";
import BubblePopGame from "@/components/LessonEngine/BubblePopGame";
import TracingGame, { GameResult } from "@/components/LessonEngine/TracingGame";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

// --- 🤖 LUMO THE ROBOT COMPONENT ---
const LumoAvatar = ({ mood }: { mood: 'happy' | 'thinking' | 'sad' | 'success' }) => {
    const bounce = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (mood === 'success') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounce, { toValue: -20, duration: 300, useNativeDriver: true }),
                    Animated.timing(bounce, { toValue: 0, duration: 300, useNativeDriver: true })
                ]),
                { iterations: 2 }
            ).start();
        } else if (mood === 'thinking') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(bounce, { toValue: -5, duration: 1000, useNativeDriver: true }),
                    Animated.timing(bounce, { toValue: 0, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        } else {
            bounce.setValue(0);
        }
    }, [mood]);

    const getIcon = () => {
        switch (mood) {
            case 'success': return "happy";
            case 'sad': return "sad";
            case 'thinking': return "bulb";
            default: return "happy-outline";
        }
    };

    return (
        <Animated.View style={{ transform: [{ translateY: bounce }] }} className="items-center justify-center z-50">
            <View className={`w-24 h-24 rounded-full justify-center items-center shadow-lg border-4 ${mood === 'success' ? 'bg-yellow-300 border-yellow-500' : 'bg-white border-purple-500'}`}>
                <Ionicons name={getIcon()} size={50} color="#673AB7" />
            </View>
            <View className="bg-purple-600 px-3 py-1 rounded-full -mt-3 border-2 border-white">
                <Text className="text-white font-bold text-xs">LUMO</Text>
            </View>
        </Animated.View>
    );
};

export default function LessonScreen() {
    const { courseId, moduleId, id, title } = useLocalSearchParams();
    
    // Data State
    const [lesson, setLesson] = useState<any>(null);
    const [currentModuleOrder, setCurrentModuleOrder] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const hasExited = useRef(false);
    
    // Game Logic State
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean>(false);
    const [lumoMood, setLumoMood] = useState<'happy' | 'thinking' | 'sad' | 'success'>('thinking');
    
    // Sequencing State
    const [sequenceStep, setSequenceStep] = useState<number>(0);
    const [completedSequence, setCompletedSequence] = useState<string[]>([]);

    // --- ANIMATION VALUES ---
    const shakeAnim = useRef(new Animated.Value(0)).current; 
    
    useEffect(() => { 
        audioManager.loadSounds(); // Ensure SFX are loaded
        fetchLesson(); 
    }, [id]);

    const fetchLesson = async () => {
        setLoading(true);
        hasExited.current = false; // Reset exit flag for new lesson
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
        setLumoMood('thinking');
        setSequenceStep(0);
        setCompletedSequence([]);
        shakeAnim.setValue(0);
    };

    // --- ANIMATION & SOUND FUNCTIONS ---
    const triggerShake = () => {
        setLumoMood('sad');
        audioManager.play('boing'); // 🔊 Fail Sound
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -15, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 15, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
        ]).start(() => setLumoMood('thinking'));
    };

    const triggerSuccess = () => {
        setLumoMood('success');
        audioManager.play('correct'); // 🔊 Success Sound
        LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
    };

    // --- LOGIC HANDLERS ---
    const handlePatternSelect = (option: string) => {
        if (isCorrect) return;

        if (option === lesson.data.correctAnswer) {
            setSelectedOption(option);
            setIsCorrect(true);
            triggerSuccess();
        } else {
            triggerShake();
        }
    };

    const handleSortingSelect = (item: string) => {
        if (isCorrect) return;

        if (item === lesson.data.correctAnswer) {
            setSelectedOption(item);
            setIsCorrect(true);
            triggerSuccess();
        } else {
            triggerShake();
        }
    };

    const handleSequencingSelect = (item: string) => {
        const correctItem = lesson.data.correctOrder[sequenceStep];
        if (item === correctItem) {
            const newSequence = [...completedSequence, item];
            setCompletedSequence(newSequence);
            setSequenceStep(sequenceStep + 1);

            if (newSequence.length === lesson.data.correctOrder.length) {
                setIsCorrect(true);
                triggerSuccess();
            } else {
                setLumoMood('happy');
                audioManager.play('pop'); // 🔊 Pop sound for partial steps
                setTimeout(() => setLumoMood('thinking'), 800);
            }
        } else {
            triggerShake();
        }
    };

const navigateToNextLesson = async () => {
        try {
            const cId = courseId as string;
            const mId = moduleId as string;

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
                    // Navigate directly to next module without alert
                    router.replace({
                        pathname: "/child/course/lesson/[id]",
                        params: { courseId: cId, moduleId: nextModuleId, id: firstLessonDoc.id, title: firstLessonDoc.data().title }
                    });
                    return;
                }
            }

            // Course complete - navigate to courses menu in nav bar
            router.dismissTo("/(tabs)/courses");
        } catch (error) { console.error("Navigation Error", error); }
    };

    const handleComplete = async () => {
        if (!auth.currentUser) return;
        
        // Ensure Logic games are actually solved
        const isGame = ['logic_pattern', 'logic_sorting', 'logic_sequencing', 'logic_drag'].includes(lesson.type);
        if (isGame && !isCorrect) { triggerShake(); return; }

        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(auth.currentUser.uid, id as string, lesson.points || 10, lesson.stars || 1);
            await navigateToNextLesson();
        } catch (error) { console.error(error); } finally { setCompleting(false); }
    };

    // --- EXTERNAL GAME HANDLERS ---
    const handleTracingComplete = async (result: GameResult) => {
        if (!auth.currentUser || hasExited.current) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(auth.currentUser.uid, id as string, result.score || lesson.points, result.stars || 3);
            await navigateToNextLesson();
        } catch (e) { console.error(e); } finally { setCompleting(false); }
    };

    const handleBubbleComplete = async (score: number, stars: number) => {
        if (!auth.currentUser || hasExited.current) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(auth.currentUser.uid, id as string, score || 50, stars || 3);
            await navigateToNextLesson();
        } catch (e) { console.error(e); } finally { setCompleting(false); }
    };

    const handleBalanceComplete = async (score: number, stars: number) => {
        if (!auth.currentUser || hasExited.current || completing) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(auth.currentUser.uid, id as string, score || 50, stars || 3);
            await navigateToNextLesson();
        } catch (e) { console.error(e); } finally { setCompleting(false); }
    };


    if (loading) return <ActivityIndicator size="large" className="flex-1 bg-white justify-center items-center" />;
    if (!lesson) return null;

    // ==========================================
    // 🎮 GAME MODE RENDERERS (THE LUMO THEME)
    // ==========================================

    const renderPatternGame = () => {
        // Support both "options" (Pattern) and "draggableOptions" (Drag converted to Tap)
        const currentOptions = lesson.data.options || lesson.data.draggableOptions || [];
        
        return (
            <View className="flex-1 items-center justify-center">
                <View className="flex-row gap-2 mb-10 p-4 bg-white/30 rounded-2xl flex-wrap justify-center min-h-[100px]">
                    {lesson.data.sequence.map((item: string, index: number) => {
                        const isMissingSlot = item === "?";
                        return (
                            <View key={index} className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl justify-center items-center shadow-sm 
                                ${isMissingSlot 
                                    ? (isCorrect ? 'bg-green-400 border-b-4 border-green-600' : 'bg-black/10 border-2 border-dashed border-white') 
                                    : 'bg-white border-b-4 border-gray-200'}`}>
                                <Text className="text-4xl">
                                    {isMissingSlot ? (isCorrect ? lesson.data.correctAnswer : "?") : item}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Options Dock */}
                <View className="flex-row gap-4 flex-wrap justify-center">
                    {currentOptions.map((option: string, index: number) => {
                        if (isCorrect && option === lesson.data.correctAnswer) return <View key={index} className="w-20 h-20" />; // Invisible placeholder

                        return (
                            <TouchableOpacity 
                                key={index} 
                                onPress={() => handlePatternSelect(option)}
                                disabled={isCorrect}
                                activeOpacity={0.7}
                            >
                                <Animated.View 
                                    style={{ transform: [{ translateX: shakeAnim }] }}
                                    className="w-20 h-20 bg-white rounded-2xl justify-center items-center shadow-lg border-b-4 border-purple-200"
                                >
                                    <Text className="text-5xl">{option}</Text>
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    const renderSortingGame = () => (
        <View className="flex-1 items-center justify-center w-full px-4">
            <View className="flex-row flex-wrap justify-center gap-4">
                {lesson.data.items.map((item: string, index: number) => {
                    const isSelected = selectedOption === item;
                    const isTarget = item === lesson.data.correctAnswer;
                    
                    if (isCorrect && !isTarget) return <View key={index} className="w-24 h-24 opacity-20 bg-gray-200 rounded-xl m-2" />;

                    return (
                        <TouchableOpacity 
                            key={index} 
                            onPress={() => handleSortingSelect(item)}
                            disabled={isCorrect}
                            className="m-2"
                        >
                            <Animated.View 
                                style={{ transform: [{ translateX: isSelected && !isTarget ? shakeAnim : 0 }, { scale: isCorrect && isTarget ? 1.2 : 1 }] }}
                                className={`w-24 h-24 rounded-2xl justify-center items-center shadow-lg border-b-4 
                                ${isCorrect && isTarget ? 'bg-green-400 border-green-600' : 'bg-white border-blue-200'}`}
                            >
                                <Text className="text-5xl">{item}</Text>
                            </Animated.View>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View className="mt-8 bg-white/20 p-4 rounded-xl">
                 <Text className="text-white text-lg font-bold text-center">
                     {isCorrect ? lesson.data.explanation : "Tap the one that fits the question!"}
                 </Text>
            </View>
        </View>
    );

    const renderSequencingGame = () => (
        <View className="flex-1 items-center justify-center w-full">
            <View className="flex-row gap-2 mb-12">
                {lesson.data.correctOrder.map((_: any, index: number) => {
                    const filledItem = completedSequence[index];
                    return (
                        <View key={index} className="items-center">
                            <View className={`w-20 h-20 rounded-xl justify-center items-center border-2 
                                ${filledItem ? 'bg-white border-purple-400' : 'bg-black/10 border-dashed border-white'}`}>
                                <Text className="text-4xl">{filledItem || index + 1}</Text>
                            </View>
                            {lesson.data.labels && (
                                <Text className="text-white font-bold mt-2 text-xs">
                                    {filledItem ? lesson.data.labels[lesson.data.correctOrder.indexOf(filledItem)] : "..."}
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>

            <View className="flex-row gap-4">
                {lesson.data.scrambled.map((item: string, index: number) => {
                    const isUsed = completedSequence.includes(item);
                    if (isUsed) return <View key={index} className="w-20 h-20" />;

                    return (
                        <TouchableOpacity 
                            key={index}
                            onPress={() => handleSequencingSelect(item)}
                        >
                            <Animated.View 
                                style={{ transform: [{ translateX: shakeAnim }] }}
                                className="w-20 h-20 bg-white rounded-2xl justify-center items-center shadow-lg border-b-4 border-orange-300"
                            >
                                <Text className="text-4xl">{item}</Text>
                            </Animated.View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    // ==========================================
    // 🌈 MAIN RENDER SWITCH
    // ==========================================

    // 1. TRACING GAME
    if (lesson.type === 'tracing') {
        return (
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
        );
    }

    // 2. BUBBLE POP GAME
    if (lesson.type === 'bubble_pop') {
        return (
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
        );
    }

    // 3. BALANCE SCALE GAME
    if (lesson.type === 'balance_scale') {
        return (
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
        );
    }

    // 4. LOGIC GAMES (THE GAME ARENA / LUMO THEME)
    const isLogicGame = ['logic_pattern', 'logic_sorting', 'logic_sequencing', 'logic_drag'].includes(lesson.type);

    if (isLogicGame) {
        return (
            <SafeAreaView className="flex-1 bg-[#673AB7]" edges={['top', 'bottom']}> 
                {/* Header */}
                <View className="flex-row justify-between items-center px-4 py-2">
                    <TouchableOpacity onPress={() => router.back()} className="bg-white/20 p-2 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <View className="bg-white/20 px-4 py-1 rounded-full">
                        <Text className="text-white font-bold">Level {lesson.order}</Text>
                    </View>
                    <View className="w-10" /> 
                </View>

                {/* Question */}
                <View className="px-6 py-4 min-h-[100px] justify-center items-center">
                    <Text className="text-white text-2xl font-bold text-center leading-8 shadow-black shadow-sm">
                        {lesson.question}
                    </Text>
                </View>

                {/* Main Game Area */}
                <View className="flex-1 w-full relative">
                    <View className="absolute top-0 right-4 z-10">
                        <LumoAvatar mood={lumoMood} />
                    </View>
                    
                    {(lesson.type === 'logic_pattern' || lesson.type === 'logic_drag') && renderPatternGame()}
                    {lesson.type === 'logic_sorting' && renderSortingGame()}
                    {lesson.type === 'logic_sequencing' && renderSequencingGame()}
                </View>

                {/* Footer */}
                <View className="p-6">
                    {isCorrect ? (
                        <TouchableOpacity 
                            onPress={handleComplete}
                            disabled={completing}
                            className="bg-green-400 w-full py-4 rounded-2xl border-b-4 border-green-600 shadow-xl flex-row justify-center items-center"
                        >
                            {completing ? <ActivityIndicator color="white" /> : (
                                <>
                                    <Text className="text-white text-xl font-bold uppercase tracking-widest mr-2">Continue</Text>
                                    <Ionicons name="arrow-forward" size={24} color="white" />
                                </>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <View className="h-14 justify-center items-center">
                            <Text className="text-white/60 text-sm">Solve the puzzle to help Lumo!</Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    // 5. STORY MODE (WITH CONDITIONAL LUMO INTEGRATION)
    const isLogicLandCourse = courseId === 'logic_lumo';
    const isBalanceBuddiesCourse = courseId === 'balance_buddies';
    
    // Get module-specific colors for Balance Buddies
    const getModuleBackgroundColor = () => {
        if (isBalanceBuddiesCourse) {
            switch (currentModuleOrder) {
                case 1: return 'bg-green-50'; // Light green for Module 1
                case 2: return 'bg-sky-50'; // Sky color for Module 2
                case 3: return 'bg-orange-50'; // Light brown for Module 3
                case 4: return 'bg-yellow-50'; // Yellow for Module 4
                default: return 'bg-red-50';
            }
        }
        return isLogicLandCourse ? 'bg-purple-50' : 'bg-gray-50';
    };
    
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
                <View className="flex-row items-center px-4 py-4 border-b border-gray-100 bg-white z-10">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="close" size={28} color="#333" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold flex-1 text-center mr-8 text-primary">{lesson.title}</Text>
                </View>

                <View className={`flex-1 items-center justify-center p-8 ${getModuleBackgroundColor()}`}>
                    {isLogicLandCourse && <LumoAvatar mood={lesson.type === 'story_outro' ? 'success' : 'happy'} />}
                    <View className={`bg-white p-6 rounded-2xl shadow-sm ${isLogicLandCourse ? 'mt-8 border border-purple-100' : isBalanceBuddiesCourse ? 'border border-red-100' : 'border border-gray-100'}`}>
                        <Text className="text-2xl text-center text-gray-800 leading-9">{lesson.content}</Text>
                    </View>
                    <TouchableOpacity 
                        onPress={handleComplete} 
                        disabled={completing}
                        className={`mt-10 px-10 py-4 rounded-full shadow-lg border-b-4 active:translate-y-1 ${isLogicLandCourse ? 'bg-purple-600 border-purple-800' : isBalanceBuddiesCourse ? 'bg-red-600 border-red-800' : 'bg-blue-600 border-blue-800'}`}
                    >
                         {completing ? <ActivityIndicator color="white" /> : (
                            <Text className="text-white text-xl font-bold">
                                {lesson.type === 'story_outro' 
                                    ? (isBalanceBuddiesCourse && currentModuleOrder === 4 
                                        ? 'Return to courses 📚' 
                                        : 'Next Adventure! →') 
                                    : 'Start adventure 🚀'}
                            </Text>
                         )}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}
