import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading, isReady, logout } = useAuth();

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 15, stiffness: 200 }) }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 600 }),
    transform: [{ translateY: withTiming(translateY.value, { duration: 600 }) }],
  }));

  // Initialize entrance animation
  React.useEffect(() => {
    if (isReady) {
      opacity.value = 1;
      translateY.value = 0;
    }
  }, [isReady]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Something went wrong while logging out.');
    }
  };

  const handlePressIn = () => {
    scale.value = 0.95;
  };

  const handlePressOut = () => {
    scale.value = 1;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isReady || loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please log in to view your profile.</Text>
          <Animated.View style={animatedStyle}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => router.push('/login')}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
            >
              <Text style={styles.loginButtonText}>Go to Login</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollView}
      >
        <Animated.View style={containerAnimatedStyle}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="person" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.headerTitle}>My Profile</Text>
            <Text style={styles.headerSubtitle}>Your account details</Text>
          </View>

          {/* Profile Details */}
          <View style={styles.profileContainer}>
            <View style={styles.profileCard}>
              <View style={[styles.profileRow, styles.profileRowBorder]}>
                <Ionicons
                  name={Platform.OS === 'ios' ? 'person' : 'person-outline'}
                  size={20}
                  color="#3B82F6"
                />
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileLabel}>Full Name</Text>
                  <Text style={styles.profileValue}>{user.full_name || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.profileRow, styles.profileRowBorder]}>
                <Ionicons
                  name={Platform.OS === 'ios' ? 'mail' : 'mail-outline'}
                  size={20}
                  color="#3B82F6"
                />
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileLabel}>Email</Text>
                  <Text style={styles.profileValue}>{user.email || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.profileRow, styles.profileRowBorder]}>
                <Ionicons
                  name={Platform.OS === 'ios' ? 'key' : 'key-outline'}
                  size={20}
                  color="#3B82F6"
                />
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileLabel}>User ID</Text>
                  <Text style={styles.profileValue}>{user.id || 'N/A'}</Text>
                </View>
              </View>
              <View style={[styles.profileRow, styles.profileRowBorder]}>
                <Ionicons
                  name={Platform.OS === 'ios' ? 'calendar' : 'calendar-outline'}
                  size={20}
                  color="#3B82F6"
                />
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileLabel}>Created At</Text>
                  <Text style={styles.profileValue}>{user.created_at ? formatDate(user.created_at) : 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.profileRow}>
                <Ionicons
                  name={Platform.OS === 'ios' ? 'time' : 'time-outline'}
                  size={20}
                  color="#3B82F6"
                />
                <View style={styles.profileTextContainer}>
                  <Text style={styles.profileLabel}>Updated At</Text>
                  <Text style={styles.profileValue}>{user.updated_at ? formatDate(user.updated_at) : 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Logout Button */}
            <Animated.View style={animatedStyle}>
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                accessibilityLabel="Log out"
              >
                <View style={styles.buttonContent}>
                  <Ionicons
                    name={Platform.OS === 'ios' ? 'log-out' : 'log-out-outline'}
                    size={24}
                    color="#FFFFFF"
                  />
                  <Text style={styles.buttonText}>Log Out</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    paddingBottom: 24,
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: {
    paddingLeft: 24,
    paddingTop: 32,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  profileContainer: {
    paddingHorizontal: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  profileRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  profileTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 4,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 16,
    marginTop: 8,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});