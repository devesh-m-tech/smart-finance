import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Dimensions, Animated, Easing, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Wallet, Landmark, LayoutGrid, X, Settings, AlertTriangle, Calendar, Info, Plus, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import axios from 'axios';

const API_URL = 'http://192.168.1.6:5000/api';

const { width: screenWidth } = Dimensions.get('window');

const getIcon = (type: string, color: string = "#42A5F5") => {
  switch (type) {
    case 'Wallet': return <Wallet color={color} size={24} style={{ marginBottom: 0 }} />;
    case 'Landmark': return <Landmark color={color} size={24} style={{ marginBottom: 0 }} />;
    case 'LayoutGrid': return <LayoutGrid color={color} size={24} style={{ marginBottom: 0 }} />;
    default: return <Wallet color={color} size={24} style={{ marginBottom: 0 }} />;
  }
};

export default function Dashboard() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [addAccountModalVisible, setAddAccountModalVisible] = useState(false);
  const { notifications, unreadCount, markAllRead, clearLogs } = useNotifications();
  const { user, token } = useAuth();
  const [salaryModalVisible, setSalaryModalVisible] = useState(false);
  const [newSalary, setNewSalary] = useState('');

  const [newAccName, setNewAccName] = useState('');
  const [newAccBalance, setNewAccBalance] = useState('');
  const [newAccIcon, setNewAccIcon] = useState('Landmark');

  const { totalBalance, monthlyIncome, monthlyExpense, accounts, addAccount, transactions, refreshData } = useFinance();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideCardsAnim = useRef(new Animated.Value(100)).current;
  const scrollX = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [historyAnims] = useState(() => Array(5).fill(0).map(() => new Animated.Value(50)));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideCardsAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.stagger(150,
        historyAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          })
        )
      )
    ]).start();
  }, []);

  const handleAddAccount = () => {
    if (!newAccName || !newAccBalance) return;
    addAccount(newAccName, Number(newAccBalance) || 0, newAccIcon, undefined);
    setAddAccountModalVisible(false);
    setNewAccName('');
    setNewAccBalance('');
  };

  const handleSaveSalary = async () => {
    try {
      await axios.put(`${API_URL}/auth/profile`, { monthlySalary: Number(newSalary) }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (user) {
        user.monthlySalary = Number(newSalary);
      }
      setSalaryModalVisible(false);
    } catch (err) {
      Alert.alert("Error", "Could not save salary");
    }
  };

  const cardColors = ['#1E88E5', '#AB47BC', '#00897B', '#F4511E', '#3949AB'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View>
            <Text style={styles.headerSubtitle}>SMART FINANCE</Text>
            <Text style={styles.headerTitle}>Hello, Devesh M</Text>
          </View>
          <TouchableOpacity style={styles.notificationIcon} onPress={() => { setNotifModalVisible(true); markAllRead(); }}>
            <Bell color={colors.text} size={24} />
            {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
          </TouchableOpacity>
        </Animated.View>

        {/* Swipeable Balance Cards */}
        <Animated.View style={{
          marginBottom: 25,
          opacity: fadeAnim,
          transform: [{ translateX: slideCardsAnim }]
        }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 10, marginLeft: 5 }}>Swipe to view bank balances 👉</Text>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={screenWidth - 30}
            decelerationRate="fast"
            contentContainerStyle={{ paddingRight: 20 }}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {[{ id: 'total' }, ...accounts].map((card, idx) => {
              const inputRange = [
                (idx - 1) * (screenWidth - 30),
                idx * (screenWidth - 30),
                (idx + 1) * (screenWidth - 30)
              ];

              const scale = scrollX.interpolate({
                inputRange,
                outputRange: [0.85, 1, 0.85],
                extrapolate: 'clamp',
              });

              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.5, 1, 0.5],
                extrapolate: 'clamp',
              });

              const rotateY = scrollX.interpolate({
                inputRange,
                outputRange: ['-90deg', '0deg', '90deg'],
                extrapolate: 'clamp',
              });

              if (card.id === 'total') {
                return (
                  <Animated.View key="total" style={[styles.balanceCard, { width: screenWidth - 50, opacity, transform: [{ perspective: 1000 }, { rotateY }, { scale }] }]}>
                    <View style={styles.balanceHeader}>
                      <Text style={styles.balanceLabel}>Total Net Worth</Text>
                      <View style={styles.percentBadge}><Text style={styles.percentText}>LIVE</Text></View>
                    </View>
                    <Text style={styles.balanceAmount}>₹{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>

                    <View style={styles.balanceRow}>
                      <View style={styles.balanceBox}>
                        <Text style={styles.boxLabel}>MONTHLY INCOME</Text>
                        <Text style={styles.boxAmount}>₹{monthlyIncome.toLocaleString()}</Text>
                      </View>
                      <View style={styles.balanceBox}>
                        <Text style={styles.boxLabel}>EXPENSES</Text>
                        <Text style={styles.boxAmount}>₹{monthlyExpense.toLocaleString()}</Text>
                      </View>
                    </View>
                  </Animated.View>
                );
              } else {
                const acc = card as any;
                const displayBal = acc.balance;

                return (
                  <Animated.View key={acc.id} style={[styles.balanceCard, { width: screenWidth - 50, backgroundColor: cardColors[(idx - 1) % cardColors.length], opacity, transform: [{ perspective: 1000 }, { rotateY }, { scale }] }]}>
                    <View style={styles.balanceHeader}>
                      <View>
                        <Text style={styles.balanceLabel}>{acc.name}</Text>
                      </View>
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 6, borderRadius: 10 }}>
                        {getIcon(acc.iconType, "#fff")}
                      </View>
                    </View>
                    <Text style={styles.balanceAmount}>₹{displayBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>

                    <View style={styles.balanceRow}>
                      <View style={[styles.balanceBox, { backgroundColor: 'rgba(0,0,0,0.15)', flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                        <View>
                          <Text style={styles.boxLabel}>STATUS</Text>
                          <Text style={[styles.boxAmount, { fontSize: 14 }]}>Active Bank</Text>
                        </View>
                        <ChevronRight color="rgba(255,255,255,0.5)" size={20} />
                      </View>
                    </View>
                  </Animated.View>
                );
              }
            })}
          </Animated.ScrollView>
        </Animated.View>

        {/* Quick Add Bank Section */}
        <Animated.View style={{ opacity: fadeAnim, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
          <TouchableOpacity style={[styles.recordBtn, { flex: 1, marginRight: 10, marginTop: 0 }]} onPress={() => setAddAccountModalVisible(true)}>
            <Plus color="#000" size={18} style={{ marginRight: 6 }} />
            <Text style={[styles.recordBtnText, { fontSize: 13 }]}>New Bank</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.recordBtn, { flex: 1.5, backgroundColor: '#BB86FC', marginTop: 0 }]} onPress={() => { setNewSalary(user?.monthlySalary?.toString() || ''); setSalaryModalVisible(true); }}>
            <Plus color="#000" size={18} style={{ marginRight: 6 }} />
            <Text style={[styles.recordBtnText, { fontSize: 13 }]} numberOfLines={1}>Salary: ₹{(user?.monthlySalary || 0).toLocaleString()}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.row, { marginTop: 25, opacity: fadeAnim }]}>
          <View style={styles.healthCard}>
            <Text style={styles.cardTitle}>Health Score</Text>
            <View style={styles.circle}>
              <View style={styles.innerCircle}>
                <Text style={styles.scoreText}>100%</Text>
                <Text style={styles.scoreSub}>Good</Text>
              </View>
            </View>
          </View>

          <View style={styles.loanCard}>
            <Text style={styles.loanLabel}>Next Due Loan</Text>
            <Text style={styles.loanTitle}>HDFC Auto Loan EMI</Text>
            <Text style={styles.loanAmount}>₹12,500.00 Due</Text>
            <Text style={styles.loanDate}>Day 5 of month</Text>
          </View>
        </Animated.View>

        {/* Recent Transactions History */}
        <Animated.View style={[styles.sectionHeader, { marginTop: 25, opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Recent Transactions History</Text>
        </Animated.View>

        {transactions.slice(0, 5).map((tx, i) => (
          <Animated.View key={tx.id} style={[styles.txCard, { opacity: fadeAnim, transform: [{ translateY: historyAnims[i] || new Animated.Value(0) }] }]}>
            <View style={[styles.txIconContainer, !tx.isExpense && { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              {tx.isExpense ? <ArrowUpRight color="#F44336" size={20} /> : <ArrowDownRight color="#4CAF50" size={20} />}
            </View>
            <View style={styles.txDetails}>
              <Text style={styles.txTitle}>{tx.title}</Text>
              <Text style={styles.txSub}>Via: {tx.sourceAccountName || 'Bank'} • {tx.date}</Text>
            </View>
            <Text style={[styles.txAmt, !tx.isExpense && { color: '#4CAF50' }]}>{tx.amt}</Text>
          </Animated.View>
        ))}

      </ScrollView>

      {/* Add Account Modal */}
      {/* Add Account Modal */}
      <Modal visible={addAccountModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Add New Bank / Wallet</Text>
              <TouchableOpacity onPress={() => setAddAccountModalVisible(false)}><X color={colors.subText} size={24} /></TouchableOpacity>
            </View>

            <TextInput style={styles.modalInput} placeholder="Account Name (e.g. Amazon Pay)" placeholderTextColor="#888" value={newAccName} onChangeText={setNewAccName} />

            <TextInput style={styles.modalInput} placeholder="Starting Balance (₹)" placeholderTextColor="#888" keyboardType="numeric" value={newAccBalance} onChangeText={setNewAccBalance} />

            <Text style={{ color: '#fff', fontWeight: 'bold', marginBottom: 10 }}>Select Icon</Text>
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              {['Landmark', 'Wallet', 'LayoutGrid'].map(icon => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconSelectBtn, newAccIcon === icon && { borderColor: '#42A5F5', backgroundColor: 'rgba(66, 165, 245, 0.2)' }]}
                  onPress={() => setNewAccIcon(icon)}
                >
                  {icon === 'Landmark' && <Landmark color={newAccIcon === icon ? "#42A5F5" : "#888"} size={24} />}
                  {icon === 'Wallet' && <Wallet color={newAccIcon === icon ? "#42A5F5" : "#888"} size={24} />}
                  {icon === 'LayoutGrid' && <LayoutGrid color={newAccIcon === icon ? "#42A5F5" : "#888"} size={24} />}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddAccount}>
              <Text style={styles.submitText}>Add & Link Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Salary Modal */}
      <Modal visible={salaryModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Set Monthly Salary</Text>
              <TouchableOpacity onPress={() => setSalaryModalVisible(false)}><X color={colors.subText} size={24} /></TouchableOpacity>
            </View>
            <Text style={{color: '#888', marginBottom: 15}}>We use this to calculate your EMI health capacity (70% Rule).</Text>
            
            <TextInput style={styles.modalInput} placeholder="Salary Amount (₹)" placeholderTextColor="#888" keyboardType="numeric" value={newSalary} onChangeText={setNewSalary} />
            
            <TouchableOpacity style={[styles.submitBtn, {backgroundColor: '#BB86FC'}]} onPress={handleSaveSalary}>
              <Text style={styles.submitText}>Save Salary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal visible={notifModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Push Notification Logs</Text>
              <TouchableOpacity onPress={() => setNotifModalVisible(false)}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalActionsRow}>
              <TouchableOpacity onPress={markAllRead}><Text style={styles.markReadText}>Mark all read</Text></TouchableOpacity>
              <TouchableOpacity onPress={clearLogs}><Text style={styles.clearLogsText}>Clear logs</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <Text style={{color: colors.subText, textAlign: 'center', marginTop: 20}}>No notifications yet</Text>
              ) : (
                notifications.map((notif) => (
                  <View key={notif.id} style={[styles.notifCard, !notif.read && { borderColor: '#42A5F5', borderWidth: 1 }]}>
                    <View style={styles.notifHeader}>
                      <Bell color={colors.subText} size={16} style={{ marginRight: 8 }} />
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                    </View>
                    <Text style={styles.notifDesc}>{notif.body}</Text>
                    <Text style={styles.notifTime}>{notif.date}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>



    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 140 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 20 },
  headerSubtitle: { color: '#42A5F5', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  notificationIcon: { position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#F44336', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: 'bold' },

  balanceCard: { backgroundColor: '#29B6F6', borderRadius: 20, padding: 20, marginRight: 20 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  balanceLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 'bold' },
  percentBadge: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  percentText: { color: colors.text, fontSize: 10, fontWeight: 'bold' },
  balanceAmount: { color: colors.text, fontSize: 36, fontWeight: 'bold', marginBottom: 20 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  balanceBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 15, marginRight: 10 },
  boxLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold', marginBottom: 5 },
  boxAmount: { color: colors.text, fontSize: 16, fontWeight: 'bold' },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  healthCard: { flex: 1, backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  circle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.cardBackground, borderWidth: 6, borderColor: '#00E676', justifyContent: 'center', alignItems: 'center' },
  innerCircle: { justifyContent: 'center', alignItems: 'center' },
  scoreText: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  scoreSub: { color: colors.subText, fontSize: 12 },

  loanCard: { flex: 1.2, backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, marginLeft: 10, justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  loanLabel: { color: '#42A5F5', fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  loanTitle: { color: colors.text, fontSize: 14, fontWeight: 'bold', marginBottom: 15 },
  loanAmount: { color: '#F44336', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  loanDate: { color: colors.subText, fontSize: 12 },

  recordBtn: { backgroundColor: '#42A5F5', borderRadius: 12, paddingVertical: 18, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  recordBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },

  txCard: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  txIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(244, 67, 54, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  txDetails: { flex: 1 },
  txTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  txSub: { color: colors.subText, fontSize: 12 },
  txAmt: { color: '#F44336', fontSize: 16, fontWeight: 'bold' },

  accIcon: { marginBottom: 0 },

  linkBtn: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 10, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border, marginRight: 10 },
  linkBtnActive: { backgroundColor: 'rgba(66, 165, 245, 0.2)', borderColor: '#42A5F5' },
  linkText: { color: colors.subText },
  linkTextActive: { color: '#42A5F5', fontWeight: 'bold' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', backgroundColor: colors.cardBackground, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50, borderWidth: 1, borderColor: colors.border },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  modalActionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  markReadText: { color: '#42A5F5', fontSize: 14, fontWeight: 'bold' },
  clearLogsText: { color: '#F44336', fontSize: 14, fontWeight: 'bold' },
  notifCard: { backgroundColor: '#1A1A24', borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#42A5F5', borderLeftWidth: 4 },
  notifHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  notifTitle: { color: colors.text, fontSize: 14, fontWeight: 'bold' },
  notifDesc: { color: '#ccc', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  notifTime: { color: '#42A5F5', fontSize: 11 },

  modalInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 15, color: colors.text, marginBottom: 20 },
  iconSelectBtn: { padding: 15, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginRight: 10 },
  submitBtn: { backgroundColor: '#42A5F5', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#000', fontWeight: 'bold', fontSize: 16 }
});
