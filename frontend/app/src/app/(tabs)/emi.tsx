import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Plus } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = 'http://192.168.1.6:5000/api';

export default function EMI() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { accounts, addTransaction } = useFinance();

  const [payModalVisible, setPayModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [payAccountId, setPayAccountId] = useState('');

  // New Loan Form State
  const [loanType, setLoanType] = useState('Personal');
  const [newTitle, setNewTitle] = useState('');
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newMonthly, setNewMonthly] = useState('');
  const [newMonths, setNewMonths] = useState('');

  // EMI Loans State
  const [loans, setLoans] = useState<{
    id: string; title: string; type: string; monthlyInstallment: number;
    remainingBalance: number; totalPrincipal: number; monthsLeft: number; isFinished: boolean;
  }[]>([]);



  const { token, setToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const fetchEmis = async () => {
    if (token) {
      try {
        const res = await axios.get(`${API_URL}/emis`, { headers: { Authorization: `Bearer ${token}` } });
        setLoans(res.data);
      } catch (err: any) {
        console.error("Error fetching EMIs:", err);
        if (err.response?.status === 401) setToken(null);
      }
    } else {
      setLoans([]);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEmis();
    }, [token])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await fetchEmis();
    setRefreshing(false);
  }, [token]);

  React.useEffect(() => {
    if (accounts.length > 0 && !payAccountId) {
      setPayAccountId(accounts[0].id);
    }
  }, [accounts]);

  const handlePayment = async () => {
    if (selectedLoanId === null || !payAccountId) return;
    
    const loanToPay = loans.find(l => l.id === selectedLoanId);
    if (!loanToPay) return;

    try {
      const res = await axios.put(`${API_URL}/emis/${selectedLoanId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedLoan = res.data;

      // 1. Update EMI Loan State
      setLoans(prevLoans => prevLoans.map(loan => 
        loan.id === selectedLoanId ? updatedLoan : loan
      ));

      // 2. Add to global transactions and deduct from global balances
      const today = new Date();
      const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = `${today.getDate().toString().padStart(2, '0')} ${today.toLocaleString('en-GB', { month: 'short' })} ${today.getFullYear()} at ${timeStr}`;
      
      addTransaction({
        title: `EMI Payment: ${loanToPay.title}`,
        cat: 'Bills',
        date: dateStr,
        amt: `-₹${loanToPay.monthlyInstallment.toLocaleString()}`,
        isExpense: true
      }, loanToPay.monthlyInstallment, payAccountId);

      setPayModalVisible(false);
      setSelectedLoanId(null);
    } catch (error) {
      console.error("Error paying EMI:", error);
    }
  };

  const handleAddEMI = async () => {
    try {
      const payload = {
        title: newTitle || 'New Loan EMI',
        type: loanType,
        totalPrincipal: Number(newPrincipal) || 0,
        monthlyInstallment: Number(newMonthly) || 0,
        monthsLeft: Number(newMonths) || 0
      };
      
      const res = await axios.post(`${API_URL}/emis/add`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLoans(prev => [res.data, ...prev]);
      setAddModalVisible(false);
      setNewTitle(''); setNewPrincipal(''); setNewMonthly(''); setNewMonths('');
    } catch (error) {
      console.error("Error adding EMI:", error);
    }
  };

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

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
            <Text style={styles.headerTitle}>EMI Loan Manager</Text>
          </View>
          <View style={styles.notificationIcon}>
            <Bell color={colors.text} size={24} />
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </View>
        </View>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.recordBtn} onPress={() => setAddModalVisible(true)}>
          <Plus color="#000" size={20} style={{marginRight: 8}} />
          <Text style={styles.recordBtnText}>Register New Loan EMI</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Active Managed Loan EMIs</Text>

        {loans.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 20 }}>
            <Text style={{ fontSize: 40, marginBottom: 15 }}>💳</Text>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>No EMI Loans Yet</Text>
            <Text style={{ color: '#888', textAlign: 'center', lineHeight: 20 }}>
              Tap "Register New Loan EMI" above to start tracking your loan installments.
            </Text>
          </View>
        ) : (
          loans.map(loan => {
            const progressPercent = loan.totalPrincipal > 0 
              ? Math.min(100, Math.round(((loan.totalPrincipal - loan.remainingBalance) / loan.totalPrincipal) * 100))
              : 0;

            return (
              <View key={loan.id} style={[styles.card, loan.isFinished && { borderColor: '#4CAF50' }]}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>{loan.title}</Text>
                    <Text style={styles.cardType}>Type: {loan.type}</Text>
                  </View>
                  <View style={[styles.activeBadge, loan.isFinished && { backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: 'rgba(76, 175, 80, 0.3)' }]}>
                    <Text style={[styles.activeText, loan.isFinished && { color: '#4CAF50' }]}>
                      {loan.isFinished ? 'FINISHED' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.rowInfo}>
                  <View>
                    <Text style={styles.label}>Monthly Installment</Text>
                    <Text style={styles.amount}>₹{loan.monthlyInstallment.toLocaleString()}</Text>
                  </View>
                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.label}>Remaining Balance</Text>
                    <Text style={styles.remAmount}>₹{loan.remainingBalance.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.progressInfo}>
                  <Text style={styles.progressText}>Loan cleared: {progressPercent}%</Text>
                  <Text style={styles.monthsLeft}>{loan.monthsLeft} months left</Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBarFill, { width: `${progressPercent}%` as any }, loan.isFinished && { backgroundColor: '#4CAF50' }]} />
                </View>

                {!loan.isFinished ? (
                  <TouchableOpacity style={styles.payBtn} onPress={() => { setSelectedLoanId(loan.id); setPayModalVisible(true); }}>
                    <Text style={styles.payBtnText}>Pay Monthly EMI Installment</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.payBtn, { backgroundColor: '#1A1A24' }]}>
                    <Text style={[styles.payBtnText, { color: '#4CAF50' }]}>Loan Fully Completed 🎉</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

      </ScrollView>

      {/* Pay Modal */}
      <Modal visible={payModalVisible} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Installment Payment</Text>
            <Text style={styles.modalDesc}>
              You are paying ₹{selectedLoan?.monthlyInstallment.toLocaleString()} for your '{selectedLoan?.title}' loan.
            </Text>

            <Text style={styles.modalLabel}>Debit Bank / Cash Account</Text>
            
            <ScrollView style={{maxHeight: 180, marginBottom: 15}}>
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

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handlePayment}>
                <Text style={styles.submitText}>Confirm Debit & Settle</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add EMI Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.addModalContent}>
            <Text style={styles.modalTitle}>Add Loan EMI</Text>
            
            <TextInput style={styles.modalInput} placeholder="Emi / Loan Name (e.g. Home Loan)" placeholderTextColor="#888" value={newTitle} onChangeText={setNewTitle} />
            
            <Text style={styles.modalLabel}>Loan Type</Text>
            <View style={styles.typeChips}>
              {['Personal', 'Home', 'Auto', 'Education'].map(type => (
                <TouchableOpacity 
                  key={type} 
                  style={[styles.chip, loanType === type && styles.chipActive]}
                  onPress={() => setLoanType(type)}
                >
                  <Text style={[styles.chipText, loanType === type && styles.chipTextActive]}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput style={styles.modalInput} placeholder="Total Loan Principal (₹)" placeholderTextColor="#888" keyboardType="numeric" value={newPrincipal} onChangeText={setNewPrincipal} />
            <TextInput style={styles.modalInput} placeholder="Monthly Installment EMI Amount (₹)" placeholderTextColor="#888" keyboardType="numeric" value={newMonthly} onChangeText={setNewMonthly} />
            <TextInput style={styles.modalInput} placeholder="Tenure duration (Months)" placeholderTextColor="#888" keyboardType="numeric" value={newMonths} onChangeText={setNewMonths} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleAddEMI}>
                <Text style={styles.submitText}>Add EMI Tracker</Text>
              </TouchableOpacity>
            </View>
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
  
  recordBtn: { backgroundColor: '#42A5F5', borderRadius: 12, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 25 },
  recordBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  
  card: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardType: { color: '#42A5F5', fontSize: 12 },
  activeBadge: { backgroundColor: 'rgba(66, 165, 245, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(66, 165, 245, 0.3)' },
  activeText: { color: '#42A5F5', fontSize: 10, fontWeight: 'bold' },
  
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  label: { color: colors.subText, fontSize: 12, marginBottom: 5 },
  amount: { color: colors.text, fontSize: 18, fontWeight: 'bold' },
  remAmount: { color: '#F44336', fontSize: 18, fontWeight: 'bold' },
  
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressText: { color: colors.text, fontSize: 12, fontWeight: 'bold' },
  monthsLeft: { color: '#42A5F5', fontSize: 12 },
  
  progressBarContainer: { height: 6, backgroundColor: '#2A2A35', borderRadius: 3, marginBottom: 20, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#42A5F5', borderRadius: 3 },
  
  payBtn: { backgroundColor: '#42A5F5', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  payBtnText: { color: '#000', fontSize: 14, fontWeight: 'bold' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: colors.cardBackground, borderRadius: 20, padding: 25, borderWidth: 1, borderColor: colors.border },
  addModalContent: { width: '90%', backgroundColor: colors.cardBackground, borderRadius: 20, padding: 25, borderWidth: 1, borderColor: colors.border, elevation: 10 },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  modalDesc: { color: '#ccc', fontSize: 14, marginBottom: 20, lineHeight: 20 },
  modalLabel: { color: colors.text, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  
  accountOptionActive: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'rgba(66, 165, 245, 0.1)', borderWidth: 1, borderColor: '#42A5F5', borderRadius: 10, marginBottom: 10 },
  accountOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#1A1A24', borderRadius: 10, marginBottom: 10 },
  accName: { color: colors.text, fontWeight: 'bold' },
  accBal: { color: '#aaa' },
  
  modalInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 15, color: colors.text, marginBottom: 15 },
  
  typeChips: { flexDirection: 'row', marginBottom: 15 },
  chip: { backgroundColor: '#1A1A24', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: 'rgba(187, 134, 252, 0.2)', borderColor: '#BB86FC' },
  chipText: { color: colors.subText, fontWeight: 'bold' },
  chipTextActive: { color: '#BB86FC' },

  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 15 },
  cancelBtn: { padding: 15, marginRight: 10 },
  cancelText: { color: '#42A5F5', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#42A5F5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25 },
  submitText: { color: '#000', fontWeight: 'bold' }
});
