import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Plus, CheckCircle, X, Trash } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import axios from 'axios';

const API_URL = 'http://192.168.1.6:5000/api';

export default function Future() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { accounts, addTransaction } = useFinance();
  const { unreadCount } = useNotifications();

  const [goals, setGoals] = useState<{
    id: string; title: string; target: number; currentSaved: number; targetMonths: number;
  }[]>([]);

  const [emis, setEmis] = useState<any[]>([]);

  const { user, token, setToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const fetchFutureData = async () => {
    if (token) {
      try {
        const [goalsRes, emisRes] = await Promise.all([
          axios.get(`${API_URL}/goals`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/emis`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setGoals(goalsRes.data);
        setEmis(emisRes.data);
      } catch (err: any) {
        console.error("Error fetching future data:", err);
        if (err.response?.status === 401) setToken(null);
      }
    } else {
      setGoals([]);
      setEmis([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFutureData();
    }, [token])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchFutureData();
    setRefreshing(false);
  }, [token]);

  const [addCashModalVisible, setAddCashModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [payAccountId, setPayAccountId] = useState('');

  const [newGoalModalVisible, setNewGoalModalVisible] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalMonths, setNewGoalMonths] = useState('');

  const [newEmiModalVisible, setNewEmiModalVisible] = useState(false);
  const [newEmiTitle, setNewEmiTitle] = useState('');
  const [newEmiTotal, setNewEmiTotal] = useState('');
  const [newEmiMonthly, setNewEmiMonthly] = useState('');

  const handleAddEmi = async () => {
    if (!newEmiTitle || !newEmiTotal || !newEmiMonthly) return;

    const monthlyAmt = Number(newEmiMonthly);
    const currentEmiTotal = emis.reduce((sum, emi) => sum + emi.monthlyInstallment, 0);
    const salary = user?.monthlySalary || 0;

    if (salary > 0 && (currentEmiTotal + monthlyAmt) > (0.7 * salary)) {
      Alert.alert(
        "Financial Warning ⚠️",
        "Taking this EMI pushes your monthly commitments above 70% of your salary! This is highly risky. Are you sure?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Proceed Anyway", style: "destructive", onPress: submitEmi }
        ]
      );
    } else {
      submitEmi();
    }
  };

  const submitEmi = async () => {
    try {
      const payload = {
        title: newEmiTitle,
        type: 'Personal',
        totalPrincipal: Number(newEmiTotal),
        monthlyInstallment: Number(newEmiMonthly),
        monthsLeft: Math.ceil(Number(newEmiTotal) / Number(newEmiMonthly))
      };
      const res = await axios.post(`${API_URL}/emis/add`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmis([res.data, ...emis]);
      setNewEmiModalVisible(false);
      setNewEmiTitle('');
      setNewEmiTotal('');
      setNewEmiMonthly('');
    } catch (error) {
      console.error("Error adding EMI", error);
    }
  };

  const handlePayEmi = async (id: string) => {
    try {
      const res = await axios.put(`${API_URL}/emis/${id}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmis(prev => prev.map(emi => emi.id === id ? res.data : emi));

      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')} ${today.toLocaleString('en-GB', { month: 'short' })} ${today.getFullYear()}`;
      if (payAccountId) {
        addTransaction({
          title: `EMI Payment: ${res.data.title}`,
          cat: 'EMI/Loan',
          date: dateStr,
          amt: `-₹${res.data.monthlyInstallment.toLocaleString()}`,
          isExpense: true
        }, res.data.monthlyInstallment, payAccountId);
      }

      Alert.alert("Success", "EMI Paid successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Error paying EMI");
    }
  };

  React.useEffect(() => {
    if (accounts.length > 0 && !payAccountId) {
      setPayAccountId(accounts[0].id);
    }
  }, [accounts]);

  const handleAddCash = async () => {
    if (!addAmount || selectedGoalId === null || !payAccountId) return;

    const amount = Number(addAmount);
    const goalToUpdate = goals.find(g => g.id === selectedGoalId);

    try {
      const res = await axios.put(`${API_URL}/goals/${selectedGoalId}/add-cash`, { amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 1. Deduct cash from the chosen global account
      const today = new Date();
      const dateStr = `${today.getDate().toString().padStart(2, '0')} ${today.toLocaleString('en-GB', { month: 'short' })} ${today.getFullYear()}`;
      addTransaction({
        title: `Saved towards: ${goalToUpdate?.title}`,
        cat: 'Shopping', // Used as a general category for savings transfers
        date: dateStr,
        amt: `-₹${amount.toLocaleString()}`,
        isExpense: true
      }, amount, payAccountId);

      // 2. Increase the specific goal's saved amount internally
      setGoals(prev => prev.map(goal => goal.id === selectedGoalId ? res.data : goal));

      setAddCashModalVisible(false);
      setAddAmount('');
      setSelectedGoalId(null);
    } catch (error) {
      console.error("Error adding cash to goal:", error);
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoalTitle || !newGoalTarget) return;
    try {
      const payload = {
        title: newGoalTitle,
        target: Number(newGoalTarget),
        targetMonths: Number(newGoalMonths) || 12
      };

      const res = await axios.post(`${API_URL}/goals/add`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGoals([res.data, ...goals]);
      setNewGoalModalVisible(false);
      setNewGoalTitle('');
      setNewGoalTarget('');
      setNewGoalMonths('');
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/goals/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>SMART FINANCE</Text>
            <Text style={styles.headerTitle}>Savings & Commitments</Text>
          </View>
          <View style={styles.notificationIcon}>
            <Bell color={colors.text} size={24} />
            {unreadCount > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>}
          </View>
        </View>
        <View style={styles.divider} />

        {/* Savings Goals Planner Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Savings Goals Planner</Text>
          <TouchableOpacity onPress={() => setNewGoalModalVisible(true)}>
            <Plus color="#42A5F5" size={24} />
          </TouchableOpacity>
        </View>

        {goals.map(goal => {
          const progressPercent = goal.target > 0 ? Math.min(100, Math.round((goal.currentSaved / goal.target) * 100)) : 0;
          const remaining = goal.target - goal.currentSaved;

          // Static Benchmark calculation so it remains accurate regardless of current progress
          const targetMonths = Math.max(1, goal.targetMonths);
          const daily = Math.max(0, Math.round(goal.target / (targetMonths * 30)));
          const monthly = Math.max(0, Math.round(goal.target / targetMonths));

          return (
            <View key={goal.id} style={[styles.card, progressPercent === 100 && { borderColor: '#4CAF50' }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{goal.title}</Text>
                  <Text style={styles.subText}>Target: ₹{goal.target.toLocaleString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                  <Text style={[styles.targetText, progressPercent === 100 && { color: '#4CAF50' }]}>
                    {progressPercent === 100 ? 'Achieved!' : `Left: ₹${remaining.toLocaleString()}`}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteGoal(goal.id)} style={{ marginLeft: 15, justifyContent: 'center' }}>
                  <Trash color="#F44336" size={18} />
                </TouchableOpacity>
              </View>

              <View style={styles.progressInfo}>
                <Text style={styles.currentSaved}>Current saved: ₹{goal.currentSaved.toLocaleString()}</Text>
                <Text style={[styles.progressPercent, progressPercent === 100 && { color: '#4CAF50' }]}>
                  Progress: {progressPercent}%
                </Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }, progressPercent === 100 && { backgroundColor: '#4CAF50' }]} />
              </View>

              {progressPercent < 100 ? (
                <>
                  <View style={styles.speedBox}>
                    <Text style={styles.speedLabel}>Required Speed ({goal.targetMonths} Mo):</Text>
                    <Text style={styles.speedValue}>D: ₹{daily.toLocaleString()}  |  M: ₹{monthly.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity style={styles.addCashBtn} onPress={() => {
                    setSelectedGoalId(goal.id);
                    setAddAmount(monthly.toString());
                    setAddCashModalVisible(true);
                  }}>
                    <Text style={styles.addCashText}>Add Saved Cash</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={[styles.speedBox, { backgroundColor: 'rgba(76, 175, 80, 0.1)', justifyContent: 'center' }]}>
                  <Text style={[styles.speedLabel, { color: '#4CAF50', fontSize: 14 }]}>Goal Fully Funded! 🎉</Text>
                </View>
              )}
            </View>
          );
        })}

        {/* Monthly Utility Commitments Section */}
        <View style={[styles.sectionHeader, { marginTop: 30 }]}>
          <Text style={styles.sectionTitle}>Monthly Utility Commitments</Text>
          <TouchableOpacity onPress={() => setNewEmiModalVisible(true)}>
            <Plus color="#42A5F5" size={24} />
          </TouchableOpacity>
        </View>

        {emis.map(emi => (
          <View key={emi.id} style={styles.commitmentCard}>
            <View style={[styles.checkCircle, emi.isFinished && { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
              {emi.isFinished ? <CheckCircle color="#4CAF50" size={20} /> : <Text style={{ color: '#fff', fontSize: 12 }}>{emi.monthsLeft} Mo</Text>}
            </View>
            <View style={styles.commitmentDetails}>
              <Text style={styles.commitmentTitle}>{emi.title}</Text>
              <Text style={styles.commitmentSubtitle}>₹{emi.monthlyInstallment.toLocaleString()} / month • Total Left: ₹{emi.remainingBalance.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={emi.isFinished ? styles.paidBadge : styles.payBadge}
              onPress={() => !emi.isFinished && handlePayEmi(emi.id)}
            >
              <Text style={emi.isFinished ? styles.paidText : styles.payText}>{emi.isFinished ? 'PAID OFF' : 'PAY'}</Text>
            </TouchableOpacity>
          </View>
        ))}

      </ScrollView>

      {/* Add Cash Modal */}
      <Modal visible={addCashModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Add Cash to Goal</Text>
              <TouchableOpacity onPress={() => setAddCashModalVisible(false)}><X color={colors.subText} size={24} /></TouchableOpacity>
            </View>

            <Text style={{ color: '#ccc', marginBottom: 20 }}>
              How much are you adding to '{selectedGoal?.title}' today?
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Amount to add (₹)"
              placeholderTextColor="#888"
              keyboardType="numeric"
              value={addAmount}
              onChangeText={setAddAmount}
            />

            <Text style={styles.modalLabel}>Debit Bank / Cash Account</Text>
            <ScrollView style={{ maxHeight: 180, marginBottom: 15 }}>
              {accounts.map(acc => (
                <TouchableOpacity
                  key={acc.id}
                  style={payAccountId === acc.id ? styles.accountOptionActive : styles.accountOption}
                  onPress={() => setPayAccountId(acc.id)}
                >
                  <Text style={styles.accName}>{acc.name}</Text>
                  <Text style={styles.accBal}>Bal: ₹{acc.balance.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={[styles.submitBtn, { width: '100%', marginTop: 10 }]} onPress={handleAddCash}>
              <Text style={styles.submitText}>Confirm Transfer to Goal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Goal Modal */}
      <Modal visible={newGoalModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Create New Savings Goal</Text>
              <TouchableOpacity onPress={() => setNewGoalModalVisible(false)}><X color={colors.subText} size={24} /></TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Goal Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. New Car, Vacation" placeholderTextColor="#888" value={newGoalTitle} onChangeText={setNewGoalTitle} />

            <Text style={styles.modalLabel}>Target Amount (₹)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 500000" placeholderTextColor="#888" keyboardType="numeric" value={newGoalTarget} onChangeText={setNewGoalTarget} />

            <Text style={styles.modalLabel}>Target Timeframe (Months)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 12 (for 1 year)" placeholderTextColor="#888" keyboardType="numeric" value={newGoalMonths} onChangeText={setNewGoalMonths} />

            {Number(newGoalTarget) > 0 && Number(newGoalMonths) > 0 && (
              <View style={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.3)', borderWidth: 1, padding: 15, borderRadius: 10, marginTop: 5, marginBottom: 5 }}>
                <Text style={{ color: '#4CAF50', fontSize: 12, fontWeight: 'bold' }}>Required Monthly Saving</Text>
                <Text style={{ color: '#4CAF50', fontSize: 22, fontWeight: 'bold', marginTop: 5 }}>
                  ₹{Math.ceil(Number(newGoalTarget) / Number(newGoalMonths)).toLocaleString()} <Text style={{ fontSize: 12, fontWeight: 'normal' }}>/ month</Text>
                </Text>
              </View>
            )}

            <TouchableOpacity style={[styles.submitBtn, { width: '100%', marginTop: 15 }]} onPress={handleCreateGoal}>
              <Text style={styles.submitText}>Save Goal & Start Tracking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create EMI Modal */}
      <Modal visible={newEmiModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={styles.modalTitle}>Add EMI / Commitment</Text>
              <TouchableOpacity onPress={() => setNewEmiModalVisible(false)}><X color={colors.subText} size={24} /></TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Commitment Name</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. Personal Loan, Car EMI" placeholderTextColor="#888" value={newEmiTitle} onChangeText={setNewEmiTitle} />

            <Text style={styles.modalLabel}>Total Pending Amount (₹)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 50000" placeholderTextColor="#888" keyboardType="numeric" value={newEmiTotal} onChangeText={setNewEmiTotal} />

            <Text style={styles.modalLabel}>Monthly Installment (₹)</Text>
            <TextInput style={styles.modalInput} placeholder="e.g. 5000" placeholderTextColor="#888" keyboardType="numeric" value={newEmiMonthly} onChangeText={setNewEmiMonthly} />

            {Number(newEmiTotal) > 0 && Number(newEmiMonthly) > 0 && (
              <View style={{ backgroundColor: 'rgba(66, 165, 245, 0.1)', borderColor: 'rgba(66, 165, 245, 0.3)', borderWidth: 1, padding: 15, borderRadius: 10, marginTop: 5, marginBottom: 5 }}>
                <Text style={{ color: '#42A5F5', fontSize: 12, fontWeight: 'bold' }}>Calculated Tracking Duration</Text>
                <Text style={{ color: '#42A5F5', fontSize: 22, fontWeight: 'bold', marginTop: 5 }}>
                  {Math.ceil(Number(newEmiTotal) / Number(newEmiMonthly))} <Text style={{ fontSize: 12, fontWeight: 'normal' }}>Months Left</Text>
                </Text>
              </View>
            )}

            <TouchableOpacity style={[styles.submitBtn, { width: '100%', marginTop: 15, backgroundColor: '#FF7043' }]} onPress={handleAddEmi}>
              <Text style={styles.submitText}>Add Monthly Commitment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: 20, paddingBottom: 140 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  headerSubtitle: { color: '#42A5F5', fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 4 },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: 'bold' },
  notificationIcon: { position: 'relative' },
  badge: { position: 'absolute', top: -5, right: -5, backgroundColor: '#F44336', borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: colors.text, fontSize: 10, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#1e1e1e', marginVertical: 20 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },

  card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  subText: { color: colors.subText, fontSize: 12 },
  targetText: { color: '#42A5F5', fontSize: 14, fontWeight: 'bold' },

  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  currentSaved: { color: '#aaaaaa', fontSize: 13 },
  progressPercent: { color: colors.text, fontSize: 13, fontWeight: 'bold' },

  progressBarContainer: { height: 6, backgroundColor: '#2A2A35', borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#42A5F5', borderRadius: 3 },

  speedBox: { backgroundColor: '#1A1A24', borderRadius: 10, padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  speedLabel: { color: '#aaaaaa', fontSize: 12, fontWeight: 'bold' },
  speedValue: { color: '#42A5F5', fontSize: 12 },

  addCashBtn: { backgroundColor: '#40C4FF', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  addCashText: { color: '#000000', fontSize: 15, fontWeight: 'bold' },

  commitmentCard: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  checkCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(76, 175, 80, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  commitmentDetails: { flex: 1 },
  commitmentTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  commitmentSubtitle: { color: colors.subText, fontSize: 12 },
  paidBadge: { backgroundColor: 'rgba(76, 175, 80, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(76, 175, 80, 0.3)' },
  paidText: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold' },
  payBadge: { backgroundColor: 'rgba(66, 165, 245, 0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#42A5F5' },
  payText: { color: '#42A5F5', fontSize: 10, fontWeight: 'bold' },

  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: colors.cardBackground, borderRadius: 20, padding: 25, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  modalInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 15, color: colors.text, marginBottom: 15 },
  modalLabel: { color: colors.text, fontWeight: 'bold', marginBottom: 10 },
  submitBtn: { backgroundColor: '#42A5F5', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  submitText: { color: '#000', fontWeight: 'bold', fontSize: 16 },

  accountOptionActive: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'rgba(66, 165, 245, 0.1)', borderWidth: 1, borderColor: '#42A5F5', borderRadius: 10, marginBottom: 10 },
  accountOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#1A1A24', borderRadius: 10, marginBottom: 10 },
  accName: { color: colors.text, fontWeight: 'bold' },
  accBal: { color: '#aaa' }
});
