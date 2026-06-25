import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = 'http://192.168.1.6:5000/api';

export default function Register() {
  const router = useRouter();
  const { setToken } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert("Error", "Please fill all fields");
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password });
      setToken(response.data.token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert("Registration Failed", error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <Image 
          source={require('../../../assets/images/icon.png')} 
          style={{ width: 100, height: 100, marginBottom: 20, borderRadius: 20 }} 
          resizeMode="contain"
        />
        <Text style={styles.title}>Create Account</Text>
      </View>
      
      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#aaa" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry placeholderTextColor="#aaa" value={password} onChangeText={setPassword} />
      
      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.btnText}>Register</Text>}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center', padding: 20 },
  title: { color: '#fff', fontSize: 32, fontWeight: 'bold', marginBottom: 30 },
  input: { backgroundColor: '#1e1e1e', color: '#fff', padding: 15, borderRadius: 10, marginBottom: 15 },
  btn: { backgroundColor: '#03DAC6', padding: 15, borderRadius: 10, alignItems: 'center', height: 55, justifyContent: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 16 },
  link: { color: '#03DAC6', marginTop: 20, textAlign: 'center' }
});
