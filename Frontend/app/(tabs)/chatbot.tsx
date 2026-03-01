import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

type Message = {
    id: string;
    text: string;
    sender: 'user' | 'ai';
};

export default function ChatbotScreen() {
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', text: 'Hello! I am your AI assistant. How can I help you today?', sender: 'ai' }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const sendMessage = async () => {
        if (!inputText.trim()) return;

        const newUserMessage: Message = { id: Date.now().toString(), text: inputText, sender: 'user' };
        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);
        setInputText('');
        setIsLoading(true);

        try {
            // Build conversation history for Gemini
            const contents = updatedMessages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            }));

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents,
                    systemInstruction: {
                        parts: [{ text: 'You are a friendly, helpful AI assistant for kids on the CurioKids learning platform. Keep your answers simple, fun, and age-appropriate. Use emojis occasionally to make the conversation engaging. If asked about inappropriate topics, gently redirect to fun and educational subjects. Return raw response without any formatting' }],
                    },
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: aiText,
                sender: 'ai'
            };
            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error("Error communicating with Gemini:", error);
            const errorResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: `Oops! Something went wrong 😅. Please try again later.`,
                sender: 'ai'
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
                    {item.text}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>CurioKids Assistant</Text>
                </View>

                <FlatList
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.chatContainer}
                />

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Ask me anything..."
                        placeholderTextColor="#999"
                        multiline
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Ionicons name="send" size={20} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF9E6',
    },
    keyboardContainer: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: Platform.OS === 'android' ? 40 : 20,
        backgroundColor: '#FFC226',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#EAEAEE',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#5A3E29',
    },
    chatContainer: {
        padding: 15,
        paddingBottom: 20,
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 15,
        borderRadius: 20,
        marginBottom: 10,
    },
    userBubble: {
        backgroundColor: '#FFC226',
        alignSelf: 'flex-end',
        borderBottomRightRadius: 0,
    },
    aiBubble: {
        backgroundColor: '#FFFFFF',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 0,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2.00,
        elevation: 2,
    },
    messageText: {
        fontSize: 16,
    },
    userText: {
        color: '#5A3E29',
    },
    aiText: {
        color: '#333333',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 15,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#EAEAEE',
        alignItems: 'center',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 10,
        fontSize: 16,
        marginRight: 10,
        color: '#333',
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: '#FFC226',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
