import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Plus, Search, ArrowUpRight, ArrowDownRight, X } from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';

export default function Expenses() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { transactions, addTransaction, accounts, refreshData } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, INCOME, EXPENSE
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  // Form State
  const [isExpenseType, setIsExpenseType] = useState(true);
  const [newAmount, setNewAmount] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Food');
  const [newSource, setNewSource] = useState('');

  React.useEffect(() => {
    if (accounts.length > 0 && !newSource) {
      setNewSource(accounts[0].id);
    }
  }, [accounts]);

  const categories = ['ALL', 'Food', 'Travel', 'Shopping', 'Bills', 'Entertainment'];
  const modalCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Entertainment', 'Others'];

  const handleAddTransaction = async () => {
    if (!newAmount || !newTitle) {
      Alert.alert('Missing Info', 'Please enter amount and a title/note.');
      return;
    }
    if (!newSource) {
      Alert.alert('No Account', 'Please add a bank/wallet account first from the Home screen.');
      return;
    }
    
    const numericAmt = Number(newAmount);
    if (isNaN(numericAmt) || numericAmt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    const today = new Date();
    const timeStr = today.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = `${today.getDate().toString().padStart(2, '0')} ${today.toLocaleString('en-GB', { month: 'short' })} ${today.getFullYear()} at ${timeStr}`;
    
    await addTransaction({
      title: newTitle,
      cat: isExpenseType ? newCategory : 'Income',
      date: dateStr,
      amt: isExpenseType ? `-₹${numericAmt.toLocaleString()}` : `+₹${numericAmt.toLocaleString()}`,
      isExpense: isExpenseType
    }, numericAmt, newSource);

    setModalVisible(false);
    setNewAmount('');
    setNewTitle('');
    setIsExpenseType(true);
  };

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === 'INCOME' && tx.isExpense) return false;
    if (activeTab === 'EXPENSE' && !tx.isExpense) return false;
    if (activeCategory !== 'ALL' && tx.cat !== activeCategory) return false;
    if (searchQuery && !tx.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
            <Text style={styles.headerTitle}>Track Expenses</Text>
          </View>
          <View style={styles.notificationIcon}>
            <Bell color={colors.text} size={24} />
            <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
          </View>
        </View>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.recordBtn} onPress={() => setModalVisible(true)}>
          <Plus color="#000" size={20} style={{marginRight: 8}} />
          <Text style={styles.recordBtnText}>Record Income / Expense installment</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search color={colors.subText} size={20} style={{marginRight: 10}} />
          <TextInput 
            placeholder="Search transactions..." 
            placeholderTextColor="#888" 
            style={styles.searchInput} 
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.catBtn, activeCategory === cat && { backgroundColor: 'rgba(187, 134, 252, 0.2)' }]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, activeCategory === cat && { color: '#BB86FC', fontWeight: 'bold' }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filters */}
        <View style={styles.filters}>
          {['ALL', 'INCOME', 'EXPENSE'].map(tab => (
            <TouchableOpacity 
              key={tab}
              style={[styles.filterBtn, activeTab === tab && styles.filterActive]} 
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.filterText, activeTab === tab && styles.filterTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <Text style={{color: '#888', textAlign: 'center', marginTop: 40}}>No transactions found.</Text>
        ) : (
          filteredTransactions.map((tx) => (
            <View key={tx.id} style={styles.txCard}>
              <View style={[styles.txIconContainer, !tx.isExpense && { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                {tx.isExpense ? <ArrowUpRight color="#F44336" size={20} /> : <ArrowDownRight color="#4CAF50" size={20} />}
              </View>
              <View style={styles.txDetails}>
                <Text style={styles.txTitle}>{tx.title}</Text>
                <Text style={styles.txSub}>{tx.cat} • {tx.date}</Text>
              </View>
              <Text style={[styles.txAmt, !tx.isExpense && { color: '#4CAF50' }]}>{tx.amt}</Text>
            </View>
          ))
        )}

      </ScrollView>

      {/* Record Transaction Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
              <Text style={styles.modalTitle}>Record Transaction</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><X color={colors.subText} size={24} /></TouchableOpacity>
            </View>
            
            <View style={styles.typeToggle}>
              <TouchableOpacity 
                style={[styles.typeBtn, isExpenseType ? { backgroundColor: '#F44336' } : { backgroundColor: '#2A2A35' }]}
                onPress={() => setIsExpenseType(true)}
              >
                <Text style={isExpenseType ? styles.typeTextActive : styles.typeText}>EXPENSE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.typeBtn, !isExpenseType ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#2A2A35' }]}
                onPress={() => setIsExpenseType(false)}
              >
                <Text style={!isExpenseType ? styles.typeTextActive : styles.typeText}>INCOME</Text>
              </TouchableOpacity>
            </View>

            <TextInput 
              style={styles.modalInput} 
              placeholder="Amount (₹)" 
              placeholderTextColor="#888" 
              keyboardType="numeric" 
              value={newAmount}
              onChangeText={setNewAmount}
            />
            <TextInput 
              style={styles.modalInput} 
              placeholder="Short note/tag (e.g. Starbucks)" 
              placeholderTextColor="#888" 
              value={newTitle}
              onChangeText={setNewTitle}
            />

            {isExpenseType && (
              <>
                <Text style={styles.modalLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15, maxHeight: 40}}>
                  {modalCategories.map(cat => (
                    <TouchableOpacity 
                      key={cat}
                      style={[styles.catBtn, newCategory === cat && { backgroundColor: 'rgba(187, 134, 252, 0.2)' }]}
                      onPress={() => setNewCategory(cat)}
                    >
                      <Text style={[styles.catText, newCategory === cat && { color: '#BB86FC' }]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.modalLabel}>Debit Bank / Cash Account</Text>
            <ScrollView style={{maxHeight: 180, marginBottom: 15}}>
              {accounts.map(acc => (
                <TouchableOpacity 
                  key={acc.id} 
                  style={newSource === acc.id ? styles.accountOptionActive : styles.accountOption}
                  onPress={() => setNewSource(acc.id)}
                >
                  <Text style={styles.accName}>{acc.name}</Text>
                  <Text style={styles.accBal}>Bal: ₹{acc.balance.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.submitBtn} onPress={handleAddTransaction}>
              <Text style={styles.submitText}>Save & Record Details</Text>
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
  
  recordBtn: { backgroundColor: '#42A5F5', borderRadius: 12, paddingVertical: 15, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  recordBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  
  searchBar: { flexDirection: 'row', backgroundColor: colors.cardBackground, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.border, marginBottom: 20 },
  searchInput: { flex: 1, color: colors.text, fontSize: 16 },
  
  categories: { flexDirection: 'row', marginBottom: 20 },
  catBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.cardBackground, borderWidth: 1, borderColor: colors.border, marginRight: 10 },
  catText: { color: colors.subText },
  
  filters: { flexDirection: 'row', marginBottom: 20 },
  filterBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: colors.border },
  filterActive: { borderBottomColor: '#42A5F5' },
  filterText: { color: colors.subText, fontWeight: 'bold' },
  filterTextActive: { color: '#42A5F5' },
  
  txCard: { backgroundColor: colors.cardBackground, borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 15, borderWidth: 1, borderColor: colors.border },
  txIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(244, 67, 54, 0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  txDetails: { flex: 1 },
  txTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  txSub: { color: colors.subText, fontSize: 12 },
  txAmt: { color: '#F44336', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { width: '100%', backgroundColor: colors.cardBackground, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 30, paddingBottom: 50, borderWidth: 1, borderColor: colors.border },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: 'bold' },
  typeToggle: { flexDirection: 'row', marginBottom: 25 },
  typeBtn: { flex: 1, paddingVertical: 12, borderRadius: 25, alignItems: 'center', marginHorizontal: 5 },
  typeTextActive: { color: colors.text, fontWeight: 'bold' },
  typeText: { color: '#aaa', fontWeight: 'bold' },
  modalInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 15, color: colors.text, marginBottom: 20 },
  modalLabel: { color: colors.text, fontWeight: 'bold', marginBottom: 12 },
  submitBtn: { backgroundColor: '#42A5F5', paddingVertical: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  
  accountOptionActive: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: 'rgba(66, 165, 245, 0.1)', borderWidth: 1, borderColor: '#42A5F5', borderRadius: 10, marginBottom: 10 },
  accountOption: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, backgroundColor: '#1A1A24', borderRadius: 10, marginBottom: 10 },
  accName: { color: colors.text, fontWeight: 'bold' },
  accBal: { color: '#aaa' }
});
