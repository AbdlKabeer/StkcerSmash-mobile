import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

// Error Boundary Component
type ErrorBoundaryState = {
  hasError: boolean;
  error: any;
};

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error
        ? typeof this.state.error === 'string'
          ? this.state.error
          : this.state.error.message || String(this.state.error)
        : 'An unexpected error occurred';
      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#F9FAFB',
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: '#DC2626',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#6B7280',
              textAlign: 'center',
            }}
          >
            {errorMessage}
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

interface TaskForm {
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  assigned_to: string[];
}

export default function CreateTaskScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Initialize with fallback for user
  const [formData, setFormData] = useState<TaskForm>({
    title: '',
    description: '',
    category: 'Assignment',
    priority: 'Medium',
    dueDate: '',
    assigned_to: user ? [user.id] : ['default-user'],
  });

  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'title' | 'description' | 'dueDate' | null>(null);
  const [errors, setErrors] = useState<Partial<TaskForm>>({});
  const [loading, setLoading] = useState(false);

  const titleInputRef = useRef<TextInput>(null);
  const descriptionInputRef = useRef<TextInput>(null);
  const dueDateInputRef = useRef<TextInput>(null);

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
  useEffect(() => {
    opacity.value = 1;
    translateY.value = 0;
  }, [opacity, translateY]);

  // Debug user state
  useEffect(() => {
    console.log('CreateTaskScreen - User:', user);
  }, [user]);

  const categories = ['Assignment', 'Project', 'Study Group', 'Exam', 'Lab Work', 'Research'];
  const priorities: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];

  // Add task to AsyncStorage
  const addTask = async (task: TaskForm) => {
    try {
      const tasksData = await AsyncStorage.getItem('tasks');
      const tasks = tasksData ? JSON.parse(tasksData) : [];

      const newTask = {
        id: Date.now().toString(),
        ...task,
        status: 'pending' as const,
        created_by: user?.id || 'default-user',
      };

      tasks.push(newTask);
      await AsyncStorage.setItem('tasks', JSON.stringify(tasks));
    } catch (error) {
      console.error('Error adding task:', JSON.stringify(error, null, 2));
      throw error;
    }
  };

  const getCategoryIcon = (category: string): string => {
    const iconMap: { [key: string]: string } = {
      Assignment: 'document-text',
      Project: 'folder',
      'Study Group': 'people',
      Exam: 'school',
      'Lab Work': 'flask',
      Research: 'search',
    };
    return Platform.OS === 'ios' ? iconMap[category] || 'document-text' : `${iconMap[category] || 'document-text'}-outline`;
  };

  const validateForm = () => {
    const newErrors: Partial<TaskForm> = {};
    if (!formData.title.trim()) newErrors.title = 'Task title is required';
    if (!formData.description.trim()) newErrors.description = 'Task description is required';
    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.dueDate)) {
      newErrors.dueDate = 'Date must be in YYYY-MM-DD format';
    } else {
      const selectedDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selectedDate.getTime()) || selectedDate < today) {
        newErrors.dueDate = 'Due date must be a valid future date';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTask = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await addTask({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        priority: formData.priority,
        dueDate: formData.dueDate,
        assigned_to: user ? [user.id] : ['default-user'],
      });

      setFormData({
        title: '',
        description: '',
        category: 'Assignment',
        priority: 'Medium',
        dueDate: '',
        assigned_to: user ? [user.id] : ['default-user'],
      });
      setErrors({});
      Alert.alert('Success', 'Task created successfully!', [
        { text: 'OK', onPress: () => router.push('/tasks') },
      ]);
    } catch (error) {
      console.error('Error creating task:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Something went wrong while creating the task.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateInputChange = (text: string) => {
    setFormData((prev) => ({ ...prev, dueDate: text }));
    if (text && !/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      setErrors((prev) => ({ ...prev, dueDate: 'Date must be in YYYY-MM-DD format' }));
    } else if (text) {
      const selectedDate = new Date(text);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (isNaN(selectedDate.getTime()) || selectedDate < today) {
        setErrors((prev) => ({ ...prev, dueDate: 'Due date must be a valid future date' }));
      } else {
        setErrors((prev) => ({ ...prev, dueDate: undefined }));
      }
    } else {
      setErrors((prev) => ({ ...prev, dueDate: 'Due date is required' }));
    }
  };

  const handlePressIn = () => {
    scale.value = 0.95;
  };

  const handlePressOut = () => {
    scale.value = 1;
  };

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={containerAnimatedStyle}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Ionicons name="add" size={32} color="#FFFFFF" />
                </View>
                <Text style={styles.headerTitle}>Create New Task</Text>
                <Text style={styles.headerSubtitle}>Add a new task to your list</Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Task Title <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedInput === 'title' && styles.inputWrapperFocused]}>
                    <TextInput
                      ref={titleInputRef}
                      style={[styles.textInput, focusedInput === 'title' && styles.textInputFocused]}
                      placeholder="Enter task title..."
                      placeholderTextColor="#9CA3AF"
                      value={formData.title}
                      onChangeText={(text) => {
                        setFormData((prev) => ({ ...prev, title: text }));
                        setErrors((prev) => ({ ...prev, title: undefined }));
                      }}
                      maxLength={100}
                      onFocus={() => setFocusedInput('title')}
                      onBlur={() => setFocusedInput(null)}
                      accessibilityLabel="Task title input"
                    />
                    <View style={styles.inputIcon} pointerEvents="none">
                      <Ionicons
                        name={Platform.OS === 'ios' ? 'document' : 'document-outline'}
                        size={20}
                        color={focusedInput === 'title' ? '#3B82F6' : '#9CA3AF'}
                      />
                    </View>
                  </View>
                  <View style={styles.inputFooter}>
                    <Text style={styles.errorText}>{errors.title || ''}</Text>
                    <Text style={styles.charCount}>{formData.title.length || 0}/100</Text>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Description <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedInput === 'description' && styles.inputWrapperFocused]}>
                    <TextInput
                      ref={descriptionInputRef}
                      style={[styles.textInput, focusedInput === 'description' && styles.textInputFocused, styles.descriptionInput]}
                      placeholder="Describe your task in detail..."
                      placeholderTextColor="#9CA3AF"
                      value={formData.description}
                      onChangeText={(text) => {
                        setFormData((prev) => ({ ...prev, description: text }));
                        setErrors((prev) => ({ ...prev, description: undefined }));
                      }}
                      multiline
                      numberOfLines={4}
                      maxLength={500}
                      textAlignVertical="top"
                      onFocus={() => setFocusedInput('description')}
                      onBlur={() => setFocusedInput(null)}
                      accessibilityLabel="Task description input"
                    />
                    <View style={styles.inputIcon} pointerEvents="none">
                      <Ionicons
                        name={Platform.OS === 'ios' ? 'chatbox' : 'chatbox-outline'}
                        size={20}
                        color={focusedInput === 'description' ? '#3B82F6' : '#9CA3AF'}
                      />
                    </View>
                  </View>
                  <View style={styles.inputFooter}>
                    <Text style={styles.errorText}>{errors.description || ''}</Text>
                    <Text style={styles.charCount}>{formData.description.length || 0}/500</Text>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Category</Text>
                  <Animated.View style={animatedStyle}>
                    <TouchableOpacity
                      style={styles.selector}
                      onPress={() => setShowCategorySelector(!showCategorySelector)}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      accessibilityLabel={`Select category, current: ${formData.category}`}
                    >
                      <View style={styles.selectorContent}>
                        <Ionicons 
                          // @ts-ignore
                          name={getCategoryIcon(formData.category)} size={22} color="#2563EB" />
                        <Text style={styles.selectorText}>{formData.category}</Text>
                        <Ionicons
                          name={Platform.OS === 'ios' ? 'chevron-down' : 'chevron-down-outline'}
                          size={16}
                          color="#9CA3AF"
                        />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                  {showCategorySelector && (
                    <View style={styles.selectorDropdown}>
                      <ScrollView nestedScrollEnabled>
                        {categories.map((category, index) => (
                          <Animated.View key={category} style={animatedStyle}>
                            <TouchableOpacity
                              style={[
                                styles.selectorItem,
                                index < categories.length - 1 && styles.selectorItemBorder,
                              ]}
                              onPress={() => {
                                setFormData((prev) => ({ ...prev, category }));
                                setShowCategorySelector(false);
                              }}
                              onPressIn={handlePressIn}
                              onPressOut={handlePressOut}
                              accessibilityLabel={`Select ${category} category`}
                            >
                              <Ionicons
                              // @ts-ignore
                                name={getCategoryIcon(category)}
                                size={20}
                                color={formData.category === category ? '#2563EB' : '#6B7280'}
                              />
                              <Text
                                style={[
                                  styles.selectorItemText,
                                  formData.category === category && styles.selectorItemTextSelected,
                                ]}
                              >
                                {category}
                              </Text>
                            </TouchableOpacity>
                          </Animated.View>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Priority Level</Text>
                  <View style={styles.priorityContainer}>
                    {priorities.map((priority) => (
                      <Animated.View key={priority} style={[animatedStyle, styles.priorityItem]}>
                        <TouchableOpacity
                          style={[
                            styles.priorityButton,
                            formData.priority === priority && {
                              backgroundColor:
                                priority === 'High' ? '#EF4444' : priority === 'Medium' ? '#F59E0B' : '#10B981',
                            },
                          ]}
                          onPress={() => setFormData((prev) => ({ ...prev, priority }))}
                          onPressIn={handlePressIn}
                          onPressOut={handlePressOut}
                          accessibilityLabel={`Select ${priority} priority`}
                        >
                          <Text
                            style={[
                              styles.priorityText,
                              formData.priority === priority
                                ? styles.priorityTextSelected
                                : {
                                    color:
                                      priority === 'High' ? '#DC2626' : priority === 'Medium' ? '#D97706' : '#059669',
                                  },
                            ]}
                          >
                            {priority}
                          </Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ))}
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>
                    Due Date <Text style={styles.required}>*</Text>
                  </Text>
                  <View style={[styles.inputWrapper, focusedInput === 'dueDate' && styles.inputWrapperFocused]}>
                    <TextInput
                      ref={dueDateInputRef}
                      style={[
                        styles.textInput,
                        focusedInput === 'dueDate' && styles.textInputFocused,
                        errors.dueDate && styles.inputError,
                      ]}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#9CA3AF"
                      value={formData.dueDate}
                      onChangeText={handleDateInputChange}
                      onFocus={() => setFocusedInput('dueDate')}
                      onBlur={() => setFocusedInput(null)}
                      accessibilityLabel="Due date input"
                      keyboardType="numeric"
                    />
                    <View style={styles.inputIcon} pointerEvents="none">
                      <Ionicons
                        name={Platform.OS === 'ios' ? 'calendar' : 'calendar-outline'}
                        size={20}
                        color={focusedInput === 'dueDate' ? '#3B82F6' : '#9CA3AF'}
                      />
                    </View>
                  </View>
                  {errors.dueDate && <Text style={styles.errorText}>{errors.dueDate}</Text>}
                </View>

                {/* Save Button */}
                <Animated.View style={animatedStyle}>
                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                    onPress={handleCreateTask}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    disabled={loading}
                    accessibilityLabel="Save task"
                  >
                    <View style={styles.saveButtonContent}>
                      {loading && <ActivityIndicator size="small" color="#FFFFFF" style={styles.activityIndicator} />}
                      <Ionicons
                        name={Platform.OS === 'ios' ? 'checkmark-circle' : 'checkmark-circle-outline'}
                        size={22}
                        color="#FFFFFF"
                      />
                      <Text style={styles.saveButtonText}>{loading ? 'Saving Task...' : 'Save Task'}</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4B5563',
  },
  form: {
    paddingHorizontal: 24,
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
  required: {
    color: '#EF4444',
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
    borderColor: '#D1D5DB',
  },
  textInputFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#3B82F6',
  },
  descriptionInput: {
    height: 128,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -10 }],
    padding: 4,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    minHeight: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  selector: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  selectorDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    maxHeight: 300,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectorItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectorItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 12,
  },
  selectorItemTextSelected: {
    color: '#2563EB',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  priorityButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityTextSelected: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  activityIndicator: {
    marginRight: 4,
  },
  saveButtonText: {
    padding: 8,
    fontSize: 14,
    color: '#',
    fontWeight: '600',
    marginLeft: 8,
  },
});