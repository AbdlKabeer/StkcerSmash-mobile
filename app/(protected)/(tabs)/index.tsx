import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
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
  error: any; // Use `any` to handle various error types
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

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  created_by: string;
  assigned_to: string[];
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);

  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  // Animation styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(opacity.value, { duration: 600 }),
    transform: [{ translateY: withTiming(translateY.value, { duration: 600 }) }],
  }));

  // Log platform and user for debugging
  useEffect(() => {
    console.log('Platform:', Platform.OS);
    console.log('User:', user);
    console.log('Window dimensions:', Dimensions.get('window'));
  }, []);

  // Initialize entrance animation and fetch tasks
  useEffect(() => {
    opacity.value = 1;
    translateY.value = 0;
    fetchTasks();
  }, [user]);

  // Update today and overdue tasks when tasks change
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayTasks(tasks.filter((task) => task.dueDate === today) || []);
    setOverdueTasks(tasks.filter((task) => task.dueDate < today) || []);
  }, [tasks]);

  // Fetch tasks from AsyncStorage
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await AsyncStorage.getItem('tasks');
      console.log('Raw AsyncStorage tasks:', tasksData);
      const allTasks: Task[] = tasksData ? JSON.parse(tasksData) : [];
      if (user) {
        const userTasks = allTasks.filter(
          (task) => task.created_by === user.id || task.assigned_to.includes(user.id)
        );
        setTasks(userTasks || []);
      } else {
        setTasks(allTasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const total = tasks.length || 0;
    const completed = tasks.filter((t) => t.status === 'completed').length || 0;
    const pending = tasks.filter((t) => t.status === 'pending').length || 0;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length || 0;
    const completionRate = total > 0 ? completed / total : 0;

    return { total, completed, pending, inProgress, completionRate };
  };

  const stats = getStats();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning! ☀️';
    if (hour < 18) return 'Good Afternoon! 🌞';
    return 'Good Evening! 🌙';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return { backgroundColor: '#EF4444' };
      case 'Medium':
        return { backgroundColor: '#F59E0B' };
      case 'Low':
        return { backgroundColor: '#10B981' };
      default:
        return { backgroundColor: '#6B7280' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: '#DCFCE7', color: '#15803D' };
      case 'in-progress':
        return { backgroundColor: '#DBEAFE', color: '#1D4ED8' };
      default:
        return { backgroundColor: '#FEF3C7', color: '#B45309' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const handlePressIn = () => {
    scale.value = 0.95;
  };

  const handlePressOut = () => {
    scale.value = 1;
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Failed to log out.');
    } finally {
      setLoading(false);
    }
  };

  // Fallback UI if no user
  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, color: '#111827' }}>Please log in to view the dashboard.</Text>
          <TouchableOpacity
            onPress={() => router.push('/login')}
            style={{ marginTop: 16, backgroundColor: '#2563EB', padding: 12, borderRadius: 8 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main Dashboard UI
  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollView}
        >
          <Animated.View style={containerAnimatedStyle}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle}>{getGreeting()}</Text>
                  <Text style={styles.headerSubtitle}>{user?.name || 'User'}</Text>
                </View>
                <TouchableOpacity
                  onPress={handleLogout}
                  disabled={loading}
                  style={styles.logoutButton}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <View style={styles.logoutButtonContent}>
                      <Ionicons name="log-out-outline" size={16} color="#DC2626" />
                      <Text style={styles.logoutButtonText}>Logout</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Grid (Modified to Avoid Progress.Circle) */}
            <View style={styles.statsContainer}>
              <View style={styles.statsRow}>
                <View style={styles.statCardTotal}>
                  <Text style={styles.statNumber}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total Tasks</Text>
                </View>
                <View style={styles.statCardCompleted}>
                  <View style={styles.progressCircle}>
                    <Text style={styles.progressText}>
                      {Math.round(stats.completionRate * 100)}% Complete
                    </Text>
                  </View>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCardOverdue}>
                  <Text style={styles.statNumber}>{overdueTasks.length}</Text>
                  <Text style={styles.statLabel}>Overdue</Text>
                </View>
                <View style={styles.statCardInProgress}>
                  <Text style={styles.statNumber}>{stats.inProgress}</Text>
                  <Text style={styles.statLabel}>In Progress</Text>
                </View>
              </View>
            </View>

            {/* Today's Tasks */}
            <View style={styles.tasksContainer}>
              <View style={styles.tasksHeader}>
                <Text style={styles.tasksTitle}>Today's Tasks</Text>
                <TouchableOpacity onPress={() => router.push('/tasks')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text style={styles.loadingText}>Loading tasks...</Text>
                </View>
              ) : todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <Animated.View key={task.id} style={buttonAnimatedStyle}>
                    <TouchableOpacity
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      onPress={() => router.push('/tasks')}
                      style={styles.taskCard}
                    >
                      <View style={styles.taskContent}>
                        <View style={[styles.priorityIndicator, getPriorityColor(task.priority)]} />
                        <View style={styles.taskDetails}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <Text style={styles.taskCategory}>{task.category}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                      </View>
                      <View style={styles.taskFooter}>
                        <Text style={styles.taskDueDate}>Due: {formatDate(task.dueDate)}</Text>
                        <View style={[styles.statusBadge, getStatusStyle(task.status)]}>
                          <Text style={[styles.statusText, { color: getStatusStyle(task.status).color }]}>
                            {task.status.replace('-', ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                ))
              ) : (
                <View style={styles.noTasksContainer}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#E5E7EB" />
                  <Text style={styles.noTasksTitle}>No tasks due today!</Text>
                  <Text style={styles.noTasksSubtitle}>Great job staying on top of your work</Text>
                </View>
              )}
            </View>

            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <View style={styles.overdueContainer}>
                <Text style={styles.overdueTitle}>Overdue Tasks ⚠️</Text>
                {overdueTasks.slice(0, 3).map((task) => (
                  <Animated.View key={task.id} style={buttonAnimatedStyle}>
                    <TouchableOpacity
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      onPress={() => router.push('/tasks')}
                      style={styles.overdueTaskCard}
                    >
                      <View style={styles.taskContent}>
                        <View style={styles.priorityIndicatorOverdue} />
                        <View style={styles.taskDetails}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          <Text style={styles.taskCategory}>{task.category}</Text>
                        </View>
                        <Ionicons name="alert-circle" size={16} color="#DC2626" />
                      </View>
                      <Text style={styles.overdueText}>
                        Overdue by{' '}
                        {Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))}{' '}
                        day(s)
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.quickActionsRow}>
                {[
                  { name: 'Create Task', icon: 'add-circle-outline', color: '#2563EB', bgColor: '#EFF6FF', route: '/create' },
                ].map((action, index) => (
                  <Animated.View key={index} style={[buttonAnimatedStyle, styles.quickActionCard]}>
                    <TouchableOpacity
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      // @ts-ignore
                      onPress={() => action.route && router.push(action.route)}
                      style={[styles.quickActionButton, { backgroundColor: action.bgColor }]}
                    >
                      <View style={styles.quickActionIcon}>
                        <Ionicons 
                        // @ts-ignore
                        name={action.icon} size={24} color={action.color} />
                      </View>
                      <Text style={styles.quickActionText}>{action.name}</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Floating Action Button */}
        <Animated.View style={[buttonAnimatedStyle, styles.fab]}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => router.push('/create')}
            style={styles.fabButton}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#4B5563',
  },
  logoutButton: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#DC2626',
    fontWeight: '500',
    marginLeft: 8,
  },
  statsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCardTotal: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 20,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  statCardCompleted: {
    flex: 1,
    backgroundColor: '#16A34A',
    padding: 20,
    borderRadius: 16,
    marginLeft: 12,
    alignItems: 'center',
  },
  statCardOverdue: {
    flex: 1,
    backgroundColor: '#DC2626',
    padding: 20,
    borderRadius: 16,
    marginRight: 12,
    alignItems: 'center',
  },
  statCardInProgress: {
    flex: 1,
    backgroundColor: '#9333EA',
    padding: 20,
    borderRadius: 16,
    marginLeft: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  progressCircle: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
  },
  tasksContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
  },
  noTasksContainer: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  noTasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 12,
    marginBottom: 4,
  },
  noTasksSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 9999,
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 14,
    color: '#6B7280',
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDueDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  overdueContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  overdueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 16,
  },
  overdueTaskCard: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityIndicatorOverdue: {
    width: 4,
    height: 40,
    borderRadius: 9999,
    backgroundColor: '#DC2626',
    marginRight: 12,
  },
  overdueText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  quickActionButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    backgroundColor: '#2563EB',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabButton: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});