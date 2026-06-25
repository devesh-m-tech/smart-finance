import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { FinanceProvider } from '../context/FinanceContext';
import { ThemeProvider } from '../context/ThemeContext';
import { NotificationProvider } from '../context/NotificationContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <FinanceProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="ai-assistant" options={{ presentation: 'modal' }} />
            </Stack>
          </FinanceProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}


