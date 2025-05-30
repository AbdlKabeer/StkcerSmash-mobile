import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const iconMap = {
  'house.fill': 'home',
  'checkmark.circle.fill': 'checkmark-circle',
  'plus.circle.fill': 'add-circle',
  'person.2.fill': 'people',
  'person.circle.fill': 'person',
};

const CrossPlatformIcon = ({ name, size, color }: { name: string; size: number; color: string }) => {
  if (Platform.OS === 'ios') {
    // @ts-ignore
    return <IconSymbol size={size} name={name} color={color} />;
  }
  // @ts-ignore
  return <Ionicons name={iconMap[name] || 'circle'} size={size} color={color} />;
};

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <CrossPlatformIcon size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color }) => <CrossPlatformIcon size={28} name="checkmark.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => <CrossPlatformIcon size={28} name="plus.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="collaborate"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => <CrossPlatformIcon size={28} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <CrossPlatformIcon size={28} name="person.circle.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}