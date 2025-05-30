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

export default function RegisterScreen() {
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [agreeToTerms, setAgreeToTerms] = React.useState(false);

  const [fullNameFocused, setFullNameFocused] = React.useState(false);
  const [emailFocused, setEmailFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = React.useState(false);

  const fullNameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const router = useRouter();
  const { setUser } = useAuth();

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    if (!password) {
      Alert.alert('Error', 'Please enter a password');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    if (!agreeToTerms) {
      Alert.alert('Error', 'Please agree to the Terms of Service and Privacy Policy');
      return false;
    }
    return true;
  };

  const clearForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgreeToTerms(false);
  };

  const showAlert = (title: string, message: string, onPress?: () => void) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
      if (onPress) onPress();
    } else {
      Alert.alert(title, message, [{ text: 'OK', onPress }]);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const existingUsers = await AsyncStorage.getItem('users');
      const users = existingUsers ? JSON.parse(existingUsers) : [];
      if (users.some((u: any) => u.email === email.trim())) {
        setLoading(false);
        showAlert('Error', 'Email already registered.');
        return;
      }

      const newUser = {
        id: Date.now().toString(),
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));

      setUser({
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
      });

      clearForm();
      setLoading(false);
      showAlert(
        'Registration Successful',
        'Your account has been created successfully!',
        // @ts-ignore
        () => router.replace('/(tabs)')
      );
    } catch (error: any) {
      console.error('Unexpected error during registration:', JSON.stringify(error, null, 2));
      setLoading(false);
      showAlert('Error', error.message || 'Something went wrong. Please try again.');
    }
  };

  const handleSignIn = () => {
    router.push('/login');
  };

  const handleTerms = () => {
    showAlert('Terms of Service', 'Terms of Service functionality coming soon!');
  };

  const handlePrivacy = () => {
    showAlert('Privacy Policy', 'Privacy Policy functionality coming soon!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
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
                <Ionicons name="person-add" size={32} color="white" />
              </View>
              <Text style={styles.headerTitle}>Create Account</Text>
              <Text style={styles.headerSubtitle}>Sign up to get started with your new account</Text>
            </View>

            {/* Form Section */}
            <View style={styles.form}>
              {/* Full Name Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={[styles.inputWrapper, fullNameFocused && styles.inputWrapperFocused]}>
                  <TextInput
                    ref={fullNameInputRef}
                    style={[styles.textInput, fullNameFocused && styles.textInputFocused]}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    onFocus={() => {
                      setFullNameFocused(true);
                      fullNameInputRef.current?.focus();
                    }}
                    onBlur={() => setFullNameFocused(false)}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  <View style={styles.inputIcon} pointerEvents="none">
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={fullNameFocused ? "#10B981" : "#9CA3AF"}
                    />
                  </View>
                </View>
              </View>

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
                      color={emailFocused ? "#10B981" : "#9CA3AF"}
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
                    placeholder="Create a password"
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
                      color={passwordFocused ? "#10B981" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>Must be at least 6 characters</Text>
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[styles.inputWrapper, confirmPasswordFocused && styles.inputWrapperFocused]}>
                  <TextInput
                    ref={confirmPasswordInputRef}
                    style={[styles.textInput, confirmPasswordFocused && styles.textInputFocused, styles.passwordInput]}
                    placeholder="Confirm your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => {
                      setConfirmPasswordFocused(true);
                      confirmPasswordInputRef.current?.focus();
                    }}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordIcon}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color={confirmPasswordFocused ? "#10B981" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <TouchableOpacity
                  onPress={() => setAgreeToTerms(!agreeToTerms)}
                  style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}
                >
                  {agreeToTerms && (
                    <Ionicons name="checkmark" size={14} color="white" />
                  )}
                </TouchableOpacity>
                <View style={styles.termsTextContainer}>
                  <Text style={styles.termsText}>
                    I agree to the{' '}
                    <Text onPress={handleTerms} style={styles.termsLink}>
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text onPress={handlePrivacy} style={styles.termsLink}>
                      Privacy Policy
                    </Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* Register Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handleRegister}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={loading}
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              >
                <View style={styles.registerButtonContent}>
                  {loading && (
                    <ActivityIndicator
                      size="small"
                      color="white"
                      style={styles.activityIndicator}
                    />
                  )}
                  <Text style={styles.registerButtonText}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Text>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account?</Text>
              <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
                <Text style={styles.signInButtonText}>Sign In</Text>
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
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    marginBottom: 32,
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
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  textInputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
  },
  passwordInput: {
    paddingRight: 48,
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  passwordIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#3B82F6',
    borderColor: '#10B981',
  },
  termsTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  termsText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  termsLink: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  registerButton: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  registerButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  registerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIndicator: {
    marginRight: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: '#4B5563',
    fontSize: 16,
  },
  signInButton: {
    marginLeft: 4,
  },
  signInButtonText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
});