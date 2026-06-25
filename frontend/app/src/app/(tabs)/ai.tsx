import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AI() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI Chat Coming Soon</Text>
    </View>
  );
}
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }, title: { color: '#fff', fontSize: 24 } });
