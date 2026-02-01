import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { CourseService } from "../../services/CourseService";
import { ChildProgressService } from "../../services/ChildProgressService";
import { AuthService } from "../../services/AuthService";
import { UserService } from "../../services/UserService";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    TextInput,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
} from "react-native";

export default function Courses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Age Filter State
    const [childAge, setChildAge] = useState<string>("");
    const [modalVisible, setModalVisible] = useState(false);

    // Assign to Child State
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [children, setChildren] = useState<any[]>([]);
    const [selectedCourseToAssign, setSelectedCourseToAssign] = useState<any>(null);
    const [userRole, setUserRole] = useState<'parent' | 'child' | null>(null);

    // Purchase State
    const [purchasedCourseIds, setPurchasedCourseIds] = useState<string[]>([]);
    const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
    const [courseToPurchase, setCourseToPurchase] = useState<any>(null);
    const [parentUid, setParentUid] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (!childAge.trim()) {
            setFilteredCourses(courses);
        } else {
            const age = parseInt(childAge, 10);
            if (isNaN(age)) {
                setFilteredCourses(courses);
            } else {
                setFilteredCourses(courses.filter(c => {
                    // Check if age falls within course range
                    return age >= c.minAge && age <= c.maxAge;
                }));
            }
        }
    }, [childAge, courses]);

    const fetchCourses = async () => {
        setLoading(true);
        try {
            const user = await AuthService.getCurrentUser();
            const role = user?.role;
            setUserRole(role);

            // 1. Fetch ALL Courses (Service handles parsing & mocking)
            const allCourses = await CourseService.getCourses();

            // 2. Role-Specific Data Fetching
            let enrolledIds: string[] = [];

            if (role === 'parent' && user) {
                // Parent: Fetch children for assignment modal AND purchased courses
                const [kids, profile] = await Promise.all([
                    UserService.getChildren(user.uid),
                    UserService.getProfile(user.uid)
                ]);
                setChildren(kids);
                setPurchasedCourseIds(profile?.purchasedCourses || []);
                setParentUid(user.uid);
            } else if (role === 'child' && user) {
                // Child: Fetch enrollments
                enrolledIds = await CourseService.getEnrolledCourses(user.uid);
            }

            // 3. Filter Courses based on Role
            let displayedCourses = allCourses;

            if (role === 'child') {
                // Children only see what is enrolled
                displayedCourses = allCourses.filter(c => enrolledIds.includes(c.id));
            }
            // Parents see EVERYTHING (displayedCourses remains allCourses)

            setCourses(displayedCourses);
            setFilteredCourses(displayedCourses);

        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleTestComplete = async (course: any) => {
        try {
            const user = await AuthService.getCurrentUser();
            if (!user) return;

            Alert.alert("TEST Course", "Completing...", [{ text: "OK" }]);
            await ChildProgressService.completeCourse(user.uid, course.id, course.title, course.stars);
            Alert.alert("Success!", "You earned stars and a badge!");
            // Optionally refresh user stats here or via context
        } catch (error) {
            Alert.alert("Error", "Failed to complete test course");
        }
    };

    const openAssignModal = (course: any) => {
        setSelectedCourseToAssign(course);
        setAssignModalVisible(true);
    };

    const handleAssignToChild = async (childId: string) => {
        if (!selectedCourseToAssign) return;
        try {
            // Note: CourseService.toggle now requires (parentId, childId, courseId, targetState)
            // But getEnrolledCourses returns list.
            // Let's assume we want to ENROLL (Add).

            // Re-fetch current state to be safe, or just call enrollChild directly?
            // UserService.enrollChild handles the check.
            if (parentUid) {
                await UserService.enrollChild(parentUid, childId, selectedCourseToAssign.id);
                Alert.alert("Success", "Enrolled successfully!");
                setAssignModalVisible(false);
            }
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to update enrollment");
        }
    };

    const initiatePurchase = (course: any) => {
        setCourseToPurchase(course);
        setPurchaseModalVisible(true);
    };

    const confirmPurchase = async () => {
        if (!courseToPurchase || !parentUid) return;
        try {
            await UserService.purchaseCourse(parentUid, courseToPurchase.id);
            setPurchasedCourseIds(prev => [...prev, courseToPurchase.id]);
            setPurchaseModalVisible(false);
            Alert.alert("Success", "Course purchased! You can now enroll your children.");
        } catch (e: any) {
            Alert.alert("Error", e.message || "Failed to purchase course");
        }
    };

    const renderCourseItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            className="bg-white mb-4 rounded-3xl overflow-hidden shadow-sm border-2 border-tigerCream"
            onPress={() => {
                if (item.isTest) {
                    handleTestComplete(item);
                } else {
                    // Access Control
                    if (userRole === 'parent') {
                        const isPurchased = purchasedCourseIds.includes(item.id);
                        if (isPurchased) {
                            router.push({ pathname: "/child/course/[id]", params: { id: item.id, title: item.title, color: item.color } });
                        } else {
                            initiatePurchase(item);
                        }
                    } else {
                        // Children only see enrolled courses, so they can access.
                        router.push({ pathname: "/child/course/[id]", params: { id: item.id, title: item.title, color: item.color } });
                    }
                }
            }}
        >
            <View
                className="h-32 justify-center items-center"
                style={{ backgroundColor: item.color || "#FF6E4F" }}
            >
                <Ionicons name={item.icon || "school"} size={64} color="white" />
                {item.isTest && <Text className="text-white font-bold mt-2">CLICK ME</Text>}
            </View>
            <View className="p-4">
                <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                        <Text className="text-xl font-black text-tigerBrown mb-1">
                            {item.title}
                        </Text>
                        <Text className="text-tigerBrown/70 text-sm font-bold" numberOfLines={2}>
                            {item.description}
                        </Text>
                    </View>
                    {/* Stars Display */}
                    <View className="bg-tigerYellow/30 px-3 py-1 rounded-full flex-row items-center border border-tigerYellow">
                        <Ionicons name="star" size={16} color="#FF9800" style={{ marginRight: 4 }} />
                        <Text className="text-tigerBrown font-bold text-xs">
                            {item.stars || 100} Stars
                        </Text>
                    </View>
                </View>

                {/* Age Tag Badge */}
                <View className="self-start bg-tigerBrown/10 px-2 py-0.5 rounded-md mt-2">
                    <Text className="text-tigerBrown/60 text-xs font-bold uppercase">Age: {item.ageTag}</Text>
                </View>

                <View className="mt-4 flex-row items-center justify-between">
                    <View className="flex-row items-center">
                        <Text className="text-tigerOrange font-black mr-1 text-base">
                            {item.isTest ? "Complete Now" : (userRole === 'parent' ? "Check Course Contents" : "Start Learning")}
                        </Text>
                        <Ionicons name="arrow-forward" size={18} color="#FF6E4F" />
                    </View>

                    {/* Assign Button for Parents */}
                    {userRole === 'parent' && (
                        purchasedCourseIds.includes(item.id) || item.isTest ? (
                            <TouchableOpacity
                                disabled={true}
                                className="bg-yellow-200 px-4 py-2 rounded-xl border-2 border-yellow-400 ml-2"
                            >
                                <Text className="text-yellow-800 font-bold text-xs uppercase">Purchased</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => initiatePurchase(item)}
                                className="bg-green-500 px-4 py-2 rounded-xl border-b-4 border-green-700 ml-2"
                            >
                                <Text className="text-white font-black text-xs uppercase">Get Free</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-tigerCream">
                <ActivityIndicator size="large" color="#FF6E4F" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-tigerCream">
            {/* Custom Header */}
            <View className="bg-tigerYellow pt-12 pb-6 px-6 rounded-b-[40px] flex-row justify-between items-end shadow-sm z-10 mb-4">
                <View className="mb-2 flex-1">
                    <Text className="text-tigerBrown text-3xl font-black">Learning Path</Text>
                    <Text className="text-tigerBrown/80 text-lg font-bold">Choose your adventure</Text>
                </View>

                <View className="flex-row items-center">
                    {/* Filter Button */}
                    <TouchableOpacity
                        className={`p-3 rounded-full mr-4 border border-tigerBrown/10 ${filteredCourses.length !== courses.length ? 'bg-tigerOrange' : 'bg-white'}`}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="filter" size={24} color={filteredCourses.length !== courses.length ? "white" : "#5A3E29"} />
                    </TouchableOpacity>

                    <Image
                        source={require('../../assets/tiger_sitting.png')}
                        className="w-16 h-16"
                        resizeMode="contain"
                    />
                </View>
            </View>

            <View className="px-6 flex-1">
                {/* Applied Filter Indicator */}
                {childAge !== "" && (
                    <View className="flex-row items-center justify-between mb-4 bg-white p-3 rounded-xl border border-tigerOrange/20">
                        <Text className="text-tigerBrown font-bold">
                            Showing for age: <Text className="text-tigerOrange">{childAge}</Text>
                        </Text>
                        <TouchableOpacity
                            onPress={() => setChildAge("")}
                            className="bg-tigerBrown/10 p-1 rounded-full"
                        >
                            <Ionicons name="close" size={16} color="#5A3E29" />
                        </TouchableOpacity>
                    </View>
                )}

                <FlatList
                    data={filteredCourses}
                    renderItem={renderCourseItem}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    ListEmptyComponent={
                        <View className="items-center mt-10 px-8">
                            <Ionicons name="school-outline" size={48} color="#B0A090" />
                            <Text className="text-tigerBrown/40 font-bold mt-2 text-center">
                                No courses yet! Ask your parent to enroll you from their dashboard.
                            </Text>
                        </View>
                    }
                />
            </View>

            {/* Age Filter Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
                    <View className="bg-white p-6 rounded-[32px] w-5/6 shadow-lg items-center">
                        <View className="bg-tigerYellow/20 p-4 rounded-full mb-4">
                            <Ionicons name="happy" size={48} color="#FF9800" />
                        </View>

                        <Text className="text-2xl font-black text-tigerBrown mb-2">
                            {userRole === 'parent' ? "How old is your child?" : "How old are you?"}
                        </Text>
                        <Text className="text-tigerBrown/60 text-center mb-6 font-bold">
                            {userRole === 'parent'
                                ? "Enter their age so we can show the perfect courses!"
                                : "Enter your age so we can show the perfect courses for you!"}
                        </Text>

                        <TextInput
                            className="bg-tigerCream w-full p-4 rounded-2xl text-center text-3xl font-black text-tigerBrown border-2 border-tigerBrown/10 mb-6"
                            placeholder="Age"
                            placeholderTextColor="#D0C0B0"
                            keyboardType="numeric"
                            maxLength={2}
                            value={childAge}
                            onChangeText={setChildAge}
                        />

                        <TouchableOpacity
                            className="bg-tigerOrange w-full py-4 rounded-2xl mb-3 shadow-sm active:bg-tigerOrange/80"
                            onPress={() => setModalVisible(false)}
                        >
                            <Text className="text-white text-center font-black text-lg">Show Courses</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="py-2"
                            onPress={() => {
                                setChildAge("");
                                setModalVisible(false);
                            }}
                        >
                            <Text className="text-tigerBrown/40 font-bold">Show All Courses</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Assign Course Modal (Parent Only) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={assignModalVisible}
                onRequestClose={() => setAssignModalVisible(false)}
            >
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View className="bg-white rounded-t-[40px] p-8 h-[50%]">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-black text-tigerBrown">Enroll Child</Text>
                            <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                                <Ionicons name="close-circle" size={32} color="#E0E0E0" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-tigerBrown/60 font-bold mb-4">
                            Select a child to enroll in <Text className="text-tigerOrange">{selectedCourseToAssign?.title}</Text>
                        </Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {children.map((child, index) => (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => handleAssignToChild(child.id)}
                                    className="bg-tigerCream mb-3 p-4 rounded-2xl flex-row items-center border-2 border-transparent active:border-tigerOrange"
                                >
                                    <View className="h-12 w-12 bg-tigerOrange/20 rounded-full justify-center items-center mr-4">
                                        <Ionicons name="person" size={24} color="#FF6E4F" />
                                    </View>
                                    <Text className="text-lg font-black text-tigerBrown">{child.name}</Text>
                                    <View className="flex-1 items-end">
                                        <Ionicons name="add-circle" size={28} color="#FF6E4F" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                            {children.length === 0 && (
                                <Text className="text-center text-tigerBrown/40 font-bold mt-4">
                                    No children found. Link a child account first!
                                </Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Purchase Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={purchaseModalVisible}
                onRequestClose={() => setPurchaseModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/60 px-8">
                    <View className="bg-white p-6 rounded-3xl w-full shadow-lg items-center">
                        <View className="bg-yellow-100 p-4 rounded-full mb-4">
                            <Ionicons name="cart" size={40} color="#F59E0B" />
                        </View>
                        <Text className="text-center text-tigerBrown text-2xl font-black mb-2">Unlock Course?</Text>
                        <Text className="text-center text-tigerBrown/60 font-bold mb-6">
                            Add "{courseToPurchase?.title}" to your library for free?
                        </Text>

                        <View className="flex-row w-full">
                            <TouchableOpacity
                                onPress={() => setPurchaseModalVisible(false)}
                                className="flex-1 bg-gray-200 py-4 rounded-xl mr-2 items-center"
                            >
                                <Text className="font-bold text-gray-500 text-lg">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={confirmPurchase}
                                className="flex-1 bg-yellow-400 py-4 rounded-xl ml-2 items-center shadow-md"
                            >
                                <Text className="font-bold text-tigerBrown text-lg">Yes, Get It!</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
