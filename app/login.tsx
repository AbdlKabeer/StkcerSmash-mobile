import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const router = useRouter();
  const { login } = useAuth();

  // Animation styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 800 }),
    transform: [{ translateY: withTiming(translateY.value, { duration: 800 }) }],
  }));

  // Initialize entrance animation
  React.useEffect(() => {
    opacity.value = 1;
    translateY.value = 0;
  }, []);

  const handlePressIn = () => {
    scale.value = 0.95;
  };

  const handlePressOut = () => {
    scale.value = 1;
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Password reset functionality coming soon!');
  };

  const handleSignUp = () => {
    router.push('/register');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0} // Adjust offset for iOS
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[containerAnimatedStyle, styles.container]}>
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="lock-closed" size={32} color="white" />
              </View>
              <Text style={styles.headerTitle}>Welcome Back</Text>
              <Text style={styles.headerSubtitle}>Sign in to continue to your account</Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
                  <TextInput
                    ref={emailInputRef}
                    style={[styles.textInput, emailFocused && styles.textInputFocused]}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => {
                      setEmailFocused(true);
                      emailInputRef.current?.focus();
                    }}
                    onBlur={() => setEmailFocused(false)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <View style={styles.inputIcon} pointerEvents="none">
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={emailFocused ? "#3B82F6" : "#9CA3AF"}
                    />
                  </View>
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
                  <TextInput
                    ref={passwordInputRef}
                    style={[styles.textInput, passwordFocused && styles.textInputFocused, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => {
                      setPasswordFocused(true);
                      passwordInputRef.current?.focus();
                    }}
                    onBlur={() => setPasswordFocused(false)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={passwordFocused ? "#3B82F6" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handleLogin}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              >
                <View style={styles.loginButtonContent}>
                  {loading && (
                    <ActivityIndicator
                      size="small"
                      color="white"
                      style={styles.activityIndicator}
                    />
                  )}
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>Don't have an account?</Text>
              <TouchableOpacity onPress={handleSignUp} style={styles.signUpButton}>
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center', // Center content vertically
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 48,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  inputWrapperFocused: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  textInput: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    color: '#111827',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textInputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  passwordInput: {
    paddingRight: 48, // Space for eye icon
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }], // Center vertically
  },
  passwordIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4, // Smaller touch area
  },
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  loginButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loginButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIndicator: {
    marginRight: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#4B5563',
    fontSize: 16,
  },
  signUpButton: {
    marginLeft: 4,
  },
  signUpButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
});