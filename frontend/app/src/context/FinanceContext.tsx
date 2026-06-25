import axios from 'axios';
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const API_URL = 'http://192.168.1.6:5000/api';

export type Transaction = {
  id: number | string;
  title: string;
  cat: string;
  date: string;
  amt: string;
  isExpense: boolean;
  numericAmount: number;
  sourceAccountName?: string;
};

export type Account = {
  id: string;
  name: string;
  balance: number;
  iconType: string;
  linkedAccountId?: string;
};

type FinanceContextType = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  transactions: Transaction[];
  accounts: Account[];
  addAccount: (name: string, startingBalance: number, iconType: string, linkedAccountId?: string) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'numericAmount' | 'sourceAccountName'>, numericAmount: number, sourceAccountId: string) => void;
  refreshData: () => Promise<void>;
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, setToken } = useAuth();
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Re-fetch from DB whenever the token changes (e.g. after login)
  useEffect(() => {
    if (!token) {
      // Reset state on logout
      setAccounts([]);
      setTransactions([]);
      setMonthlyIncome(0);
      setMonthlyExpense(0);
      return;
    }
    refreshData();
  }, [token]);

  const refreshData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_URL}/finance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccounts(res.data.accounts);
      setTransactions(res.data.transactions);

      let inc = 0; let exp = 0;
      res.data.transactions.forEach((tx: any) => {
        if (tx.isExpense) exp += tx.numericAmount;
        else inc += tx.numericAmount;
      });
      setMonthlyIncome(inc);
      setMonthlyExpense(exp);
    } catch (err: any) {
      console.error("API Error fetching finance data:", err);
      if (err.response?.status === 401) {
        setToken(null);
      }
    }
  }, [token, setToken]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, acc) => sum + acc.balance, 0),
    [accounts]
  );

  const addAccount = async (name: string, startingBalance: number, iconType: string, linkedAccountId?: string) => {
    if (!token) { Alert.alert('Error', 'Not logged in'); return; }
    try {
      const res = await axios.post(`${API_URL}/finance/accounts/add`, {
        name, startingBalance, iconType, linkedAccountId
      }, { headers: { Authorization: `Bearer ${token}` } });
      // Add to state immediately so totalBalance updates
      setAccounts(prev => [...prev, res.data]);
    } catch (err: any) {
      console.error("Error adding account", err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to add account');
    }
  };

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'numericAmount' | 'sourceAccountName'>, numericAmount: number, sourceAccountId: string) => {
    if (!token) return;
    try {
      const res = await axios.post(`${API_URL}/finance/transactions/add`, {
        ...tx, numericAmount, sourceAccountId
      }, { headers: { Authorization: `Bearer ${token}` } });

      const { transaction, updatedAccount } = res.data;
      setTransactions(prev => [transaction, ...prev]);
      setAccounts(prev => prev.map(acc =>
        acc.id === updatedAccount.id ? { ...acc, balance: updatedAccount.balance } : acc
      ));
      if (tx.isExpense) setMonthlyExpense(prev => prev + numericAmount);
      else setMonthlyIncome(prev => prev + numericAmount);
    } catch (err: any) {
      console.error("Error adding transaction", err);
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save transaction');
    }
  };

  return (
    <FinanceContext.Provider value={{ totalBalance, monthlyIncome, monthlyExpense, transactions, accounts, addAccount, addTransaction, refreshData }}>
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used within FinanceProvider");
  return context;
};
