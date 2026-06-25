import { Tabs } from 'expo-router';
import { Home, PieChart, CreditCard, PiggyBank, Bot, User } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarStyle: { 
        position: 'absolute',
        bottom: 35,
        left: 15,
        right: 15,
        backgroundColor: colors.cardBackground, 
        borderRadius: 25,
        borderTopWidth: 0,
        height: 70, 
        paddingBottom: 10, 
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5
      }, 
      tabBarActiveTintColor: colors.text, 
      tabBarInactiveTintColor: colors.subText,
      tabBarLabelStyle: { fontSize: 11, marginTop: 4 }
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Home color={color} size={22} /> }} />
      <Tabs.Screen name="expenses" options={{ title: 'Expense', tabBarIcon: ({ color }) => <PieChart color={color} size={22} /> }} />
      <Tabs.Screen name="emi" options={{ title: 'EMIs', tabBarIcon: ({ color }) => <CreditCard color={color} size={22} /> }} />
      <Tabs.Screen name="future" options={{ title: 'Future', tabBarIcon: ({ color }) => <PiggyBank color={color} size={22} /> }} />
      <Tabs.Screen name="ai" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <User color={color} size={22} /> }} />
      <Tabs.Screen name="savings" options={{ href: null }} />
    </Tabs>
  );
}
