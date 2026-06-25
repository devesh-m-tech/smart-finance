import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Modal, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, LogOut, ChevronDown, X, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

const API_URL = 'http://192.168.1.6:5000/api';

export default function Profile() {
  const router = useRouter();
  const { theme, toggleTheme, colors } = useTheme();
  const { user, token, setToken, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || null);
  const [loading, setLoading] = useState(false);

  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setProfilePic(user.profilePic || null);
    }
  }, [user]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfilePic(base64Image);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`${API_URL}/auth/profile`, { name, profilePic }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return Alert.alert("Error", "Please fill both password fields");
    setPasswordLoading(true);
    try {
      await axios.put(`${API_URL}/auth/change-password`, { oldPassword, newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", "Password updated successfully!");
      setPasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  };

  const getInitials = (name: string) => name ? name.substring(0, 2).toUpperCase() : 'U';

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: 20, paddingBottom: 140 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
    headerSubtitle: { color: colors.primary, fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
    headerTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
    notificationIcon: { position: 'relative' },
    badge: { position: 'absolute', top: -5, right: -5, backgroundColor: colors.danger, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },

    profileCard: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: colors.border },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 15, overflow: 'hidden' },
    avatarImage: { width: 60, height: 60, borderRadius: 30 },
    avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
    profileInfo: { flex: 1 },
    profileName: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    profileEmail: { color: colors.subText, fontSize: 14 },

    sectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
    inputContainer: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, marginBottom: 30 },
    inputLabel: { color: colors.subText, fontSize: 12, marginBottom: 5 },
    input: { color: colors.text, fontSize: 16, fontWeight: '500' },

    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
    toggleLabel: { color: colors.text, fontSize: 14, fontWeight: 'bold' },

    updateBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginBottom: 30 },
    updateBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

    securityBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.cardBackground, borderRadius: 12, padding: 20, marginBottom: 30, borderWidth: 1, borderColor: colors.border },
    securityText: { color: colors.text, fontSize: 14, fontWeight: 'bold' },

    logoutBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', borderRadius: 12, paddingVertical: 15, borderWidth: 1, borderColor: colors.danger },
    logoutText: { color: colors.danger, fontSize: 14, fontWeight: 'bold' },

    modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: colors.border },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
    modalLabel: { color: colors.subText, fontSize: 12, marginBottom: 8, marginTop: 15 },
    modalInput: { backgroundColor: colors.background, color: colors.text, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 15, fontSize: 16 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>SMART FINANCE</Text>
            <Text style={styles.headerTitle}>Account Settings</Text>
          </View>
          <View style={styles.notificationIcon}>
            <Bell color={colors.text} size={24} />
            <View style={styles.badge}><Text style={styles.badgeText}>4</Text></View>
          </View>
        </View>
        <View style={styles.divider} />

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handlePickImage} style={styles.avatar}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            )}
            <View style={{ position: 'absolute', bottom: -5, right: -5, backgroundColor: '#000', borderRadius: 10, padding: 2 }}>
              <Camera color="#fff" size={12} />
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
          </View>
        </View>

        {/* Edit Personal Details */}
        <Text style={styles.sectionTitle}>Edit Personal Details</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Primary User Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.subText}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>System Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: colors.primary }}
            thumbColor={theme === 'dark' ? '#fff' : '#f4f3f4'}
          />
        </View>

        <TouchableOpacity style={styles.updateBtn} onPress={handleUpdateProfile} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnText}>Update Profile</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.securityBox} onPress={() => setPasswordModalVisible(true)}>
          <Text style={styles.securityText}>Security - Change Password</Text>
          <ChevronDown color={colors.text} size={20} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut color={colors.danger} size={18} style={{ marginRight: 10 }} />
          <Text style={styles.logoutText}>Logout Securely</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)}><X color={colors.subText} size={24} /></TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <Text style={styles.modalLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TouchableOpacity style={[styles.updateBtn, { marginTop: 20, marginBottom: 0 }]} onPress={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.updateBtnText}>Save New Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
