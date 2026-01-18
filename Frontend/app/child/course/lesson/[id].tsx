import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
import { AuthService } from "../../../../services/AuthService";
import { ChildProgressService } from "../../../../services/ChildProgressService";
import { CourseService } from "../../../../services/CourseService";

// --- 🔊 AUDIO MANAGER ---
import { audioManager } from "@/components/LessonEngine/AudioManager";

// Game Components
import BalanceScaleGame from "@/components/LessonEngine/BalanceScaleGame";
import BubblePopGame from "@/components/LessonEngine/BubblePopGame";
import TracingGame, { GameResult } from "@/components/LessonEngine/TracingGame";
import TigerMascot, { TigerSpeechBubble } from "@/components/LessonEngine/TigerMascot";

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");

// Tiger mood type for the mascot
type TigerMood = 'happy' | 'thinking' | 'sad' | 'success';

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

    // Speak the question when lesson loads (for logic games)
    const speakCurrentQuestion = () => {
        if (lesson?.question) {
            audioManager.speakQuestion(lesson.question);
        }
    };

    useEffect(() => {
        audioManager.loadSounds(); // Ensure SFX are loaded
        fetchLesson();

        // Cleanup TTS on unmount
        return () => {
            audioManager.stopSpeaking();
        };
    }, [id]);

    // Auto-speak question when a logic game lesson loads
    useEffect(() => {
        if (lesson && !loading) {
            const isLogicGame = ['logic_pattern', 'logic_sorting', 'logic_sequencing', 'logic_drag'].includes(lesson.type);
            if (isLogicGame && lesson.question) {
                // Short delay to let the UI render first
                const timer = setTimeout(() => {
                    audioManager.speakQuestion(lesson.question);
                }, 500);
                return () => clearTimeout(timer);
            }
        }
    }, [lesson, loading]);

    const fetchLesson = async () => {
        setLoading(true);
        hasExited.current = false; // Reset exit flag for new lesson
        try {
            const cId = courseId as string;
            const mId = moduleId as string;
            const lId = id as string;

            // Fetch Lesson Data
            const lessonData = await CourseService.getLesson(cId, mId, lId);

            // We also need module info for order...
            // Optimization: Maybe fetch all modules once? 
            // For now, let's fetch modules to find current module order (inefficient but strict on no DB)
            const modules = await CourseService.getModules(cId);
            const currentModule = modules.find((m: any) => m.id === mId);

            if (lessonData && currentModule) {
                setLesson(lessonData);
                setCurrentModuleOrder(currentModule.order);
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

            // 1. Get all lessons in current module to find next one
            const lessons = await CourseService.getLessons(cId, mId);
            const sortedLessons = lessons.sort((a: any, b: any) => a.order - b.order);
            const currentIndex = sortedLessons.findIndex((l: any) => l.id === id);

            if (currentIndex !== -1 && currentIndex < sortedLessons.length - 1) {
                const nextLesson = sortedLessons[currentIndex + 1];
                router.replace({
                    pathname: "/child/course/lesson/[id]",
                    params: { courseId: cId, moduleId: mId, id: nextLesson.id, title: nextLesson.title }
                });
                return;
            }

            // 2. Next Module
            const modules = await CourseService.getModules(cId);
            const sortedModules = modules.sort((a: any, b: any) => a.order - b.order);
            const currentModIndex = sortedModules.findIndex((m: any) => m.id === mId);

            if (currentModIndex !== -1 && currentModIndex < sortedModules.length - 1) {
                const nextModule = sortedModules[currentModIndex + 1];
                // Get first lesson of next module
                const nextModLessons = await CourseService.getLessons(cId, nextModule.id);
                if (nextModLessons.length > 0) {
                    const firstLesson = nextModLessons.sort((a: any, b: any) => a.order - b.order)[0];
                    router.replace({
                        pathname: "/child/course/lesson/[id]",
                        params: { courseId: cId, moduleId: nextModule.id, id: firstLesson.id, title: firstLesson.title }
                    });
                    return;
                }
            }

            // Course complete - navigate to courses menu in nav bar
            router.dismissTo("/(tabs)/courses");
        } catch (error) { console.error("Navigation Error", error); }
    };


    const handleComplete = async () => {
        const user = await AuthService.getCurrentUser();
        if (!user) return;

        // Ensure Logic games are actually solved
        const isGame = ['logic_pattern', 'logic_sorting', 'logic_sequencing', 'logic_drag'].includes(lesson.type);
        if (isGame && !isCorrect) { triggerShake(); return; }

        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(user.uid, id as string, lesson.points || 10, lesson.stars || 1);
            await navigateToNextLesson();
        } catch (error) { console.error(error); } finally { setCompleting(false); }
    };

    // --- EXTERNAL GAME HANDLERS ---
    const handleTracingComplete = async (result: GameResult) => {
        const user = await AuthService.getCurrentUser();
        if (!user || hasExited.current) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(user.uid, id as string, result.score || lesson.points, result.stars || 3);
            await navigateToNextLesson();
        } catch (e) { console.error(e); } finally { setCompleting(false); }
    };

    const handleBubbleComplete = async (score: number, stars: number) => {
        const user = await AuthService.getCurrentUser();
        if (!user || hasExited.current) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(user.uid, id as string, score || 50, stars || 3);
            await navigateToNextLesson();
        } catch (e) { console.error(e); } finally { setCompleting(false); }
    };

    const handleBalanceComplete = async (score: number, stars: number) => {
        const user = await AuthService.getCurrentUser();
        if (!user || hasExited.current || completing) return;
        setCompleting(true);
        try {
            await ChildProgressService.markItemComplete(user.uid, id as string, score || 50, stars || 3);
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
            <SafeAreaView className="flex-1 bg-[#FFF8E1]" edges={['top', 'bottom']}>
                {/* Peeping Tiger at Top */}
                <View className="absolute top-12 left-1/2 -ml-10 z-20">
                    <TigerMascot mood="peeping" size="small" />
                </View>

                {/* Header with Warm Design */}
                <View
                    className="pt-14 pb-4 px-4"
                    style={{ backgroundColor: '#FFB74D' }}
                >
                    <View className="flex-row justify-between items-center">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="bg-white/30 p-2.5 rounded-full"
                        >
                            <Ionicons name="arrow-back" size={24} color="#5D4037" />
                        </TouchableOpacity>
                        <View className="bg-white/40 px-4 py-1.5 rounded-full">
                            <Text className="text-[#5D4037] font-bold">Level {lesson.order}</Text>
                        </View>
                        {/* Repeat Question Button */}
                        <TouchableOpacity
                            onPress={speakCurrentQuestion}
                            className="bg-white/30 p-2.5 rounded-full"
                        >
                            <Ionicons name="volume-high" size={24} color="#5D4037" />
                        </TouchableOpacity>
                    </View>

                    {/* Title */}
                    <Text
                        className="text-2xl font-bold text-center mt-3"
                        style={{ color: '#3E2723' }}
                    >
                        {lesson.title}
                    </Text>
                </View>

                {/* Wavy Separator */}
                <View
                    className="h-4 w-full"
                    style={{
                        backgroundColor: '#FFB74D',
                        borderBottomLeftRadius: 50,
                        borderBottomRightRadius: 50,
                    }}
                />

                {/* Main Game Area */}
                <View className="flex-1 w-full relative px-4 pt-4">
                    {/* Tiger Mascot with Speech Bubble */}
                    <View className="absolute top-2 right-2 z-10 flex-row items-start">
                        <TigerSpeechBubble text={lesson.question} position="left" />
                        <TigerMascot mood={lumoMood as TigerMood} size="small" />
                    </View>

                    {/* Game Content */}
                    <View className="flex-1 mt-32">
                        {(lesson.type === 'logic_pattern' || lesson.type === 'logic_drag') && renderPatternGame()}
                        {lesson.type === 'logic_sorting' && renderSortingGame()}
                        {lesson.type === 'logic_sequencing' && renderSequencingGame()}
                    </View>
                </View>

                {/* Footer */}
                <View className="p-4">
                    {isCorrect ? (
                        <TouchableOpacity
                            onPress={handleComplete}
                            disabled={completing}
                            className="w-full py-4 rounded-2xl shadow-xl flex-row justify-center items-center"
                            style={{ backgroundColor: '#4CAF50' }}
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
                            <Text className="text-[#8D6E63] text-sm">Tap an answer to help Lumo!</Text>
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
                    {isLogicLandCourse && <TigerMascot mood={lesson.type === 'story_outro' ? 'success' : 'happy'} size="medium" />}
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
