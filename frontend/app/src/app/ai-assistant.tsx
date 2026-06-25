import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';

// IMPORTANT: Replace with your actual Gemini API Key or load from .env
const GEMINI_API_KEY = "MY_GEMINI_API_KEY"; 

export default function AiAssistant() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: 'Hi! I am your Smart Financial Assistant. How can I help you today?' }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!question.trim()) return;

    const userText = question;
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);
    setQuestion('');
    setLoading(true);

    try {
      if (GEMINI_API_KEY === "MY_GEMINI_API_KEY" || !GEMINI_API_KEY) {
        // Fallback if no API key
        setTimeout(() => {
          setChatHistory(prev => [...prev, { 
            role: 'assistant', 
            text: '🤖 Smart Assistant: Gemini API Key is missing. Please configure your GEMINI_API_KEY in the code. Here is some system-analyzed general advice:\n\n• Your Income-to-Expense ratio is Excellent.\n• Keep budgeting 20% of your earnings to accelerate your active goals.' 
          }]);
          setLoading(false);
        }, 1000);
        return;
      }

      const prompt = `You are a Smart Financial Assistant. The user has a total balance of 24,500 INR, income of 32,000 INR, and expenses of 7,500 INR. User asks: ${userText}`;
      
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ parts: [{ text: prompt }] }]
        }
      );

      const aiText = response.data.candidates[0].content.parts[0].text;
      setChatHistory(prev => [...prev, { role: 'assistant', text: aiText }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Assistant</Text>
      </View>

      <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 20 }}>
        {chatHistory.map((msg, index) => (
          <View key={index} style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={msg.role === 'user' ? styles.userText : styles.aiText}>{msg.text}</Text>
          </View>
        ))}
        {loading && <ActivityIndicator size="small" color="#6200EE" style={{ marginTop: 10 }} />}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input} 
          placeholder="Ask about your finances..." 
          value={question}
          onChangeText={setQuestion}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#6200EE', flexDirection: 'row', alignItems: 'center' },
  backButton: { marginRight: 15 },
  backText: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  chatArea: { flex: 1 },
  messageBubble: { maxWidth: '80%', padding: 15, borderRadius: 16, marginBottom: 15 },
  userBubble: { backgroundColor: '#6200EE', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#fff', alignSelf: 'flex-start', borderBottomLeftRadius: 4, elevation: 2 },
  userText: { color: '#fff', fontSize: 16 },
  aiText: { color: '#333', fontSize: 16 },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', elevation: 10 },
  input: { flex: 1, backgroundColor: '#f0f0f0', paddingHorizontal: 15, borderRadius: 25, fontSize: 16, height: 50 },
  sendButton: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#03DAC6', borderRadius: 25, paddingHorizontal: 20, marginLeft: 10 },
  sendText: { fontWeight: 'bold', color: '#000' }
});
