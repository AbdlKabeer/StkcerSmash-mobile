import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useContext } from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';
import 'react-native-reanimated';

import {  useAuth } from '../../context/AuthContext';
import { useColorScheme } from '../../hooks/useColorScheme';



  const isLoggedIn = true

export default function ProtectedLayout() {

  const authState = useAuth()

  const colorScheme = useColorScheme();

  if(!authState.isReady){
    return null
  }

  if(!authState.isLoggedIn){
    console.log('Herre')
    return <Redirect href="/login" />
  }


  console.log('Login')

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack> 
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
  },
});