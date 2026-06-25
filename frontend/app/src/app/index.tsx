import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { token, isReady } = useAuth() as any;

  if (isReady === false) return <View style={{flex:1, justifyContent:'center', backgroundColor:'#121212'}}><ActivityIndicator size="large" color="#BB86FC"/></View>;
  
  if (token) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
