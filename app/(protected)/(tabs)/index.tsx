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
import * as Progress from 'react-native-progress';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';

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

  // Initialize entrance animation and fetch tasks
  useEffect(() => {
    opacity.value = 1;
    translateY.value = 0;
    if (user) {
      fetchTasks();
    } else {
      setLoading(false);
      Alert.alert('Error', 'You must be logged in to view tasks.');
    }
  }, [user]);

  // Update today and overdue tasks when tasks change
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTodayTasks(tasks.filter((task) => task.dueDate === today));
    setOverdueTasks(tasks.filter((task) => task.dueDate < today));
  }, [tasks]);

  // Fetch tasks from AsyncStorage
  const fetchTasks = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const tasksData = await AsyncStorage.getItem('tasks');
      const allTasks: Task[] = tasksData ? JSON.parse(tasksData) : [];

      // Filter tasks: created by or assigned to the current user
      const userTasks = allTasks.filter(
        (task) => task.created_by === user.id || task.assigned_to.includes(user.id)
      );

      setTasks(userTasks);
    } catch (error) {
      console.error('Unexpected error fetching tasks:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Something went wrong while loading tasks.');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const inProgress = tasks.filter((t) => t.status === 'in-progress').length;
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
      case 'High': return { backgroundColor: '#EF4444' }; // bg-red-500
      case 'Medium': return { backgroundColor: '#F59E0B' }; // bg-yellow-500
      case 'Low': return { backgroundColor: '#10B981' }; // bg-green-500
      default: return { backgroundColor: '#6B7280' }; // bg-gray-500
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { backgroundColor: '#DCFCE7', color: '#15803D' }; // bg-green-100, text-green-700
      case 'in-progress':
        return { backgroundColor: '#DBEAFE', color: '#1D4ED8' }; // bg-blue-100, text-blue-700
      default:
        return { backgroundColor: '#FEF3C7', color: '#B45309' }; // bg-yellow-100, text-yellow-700
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

  return (
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
                <Text style={styles.headerTitle}>
                  {getGreeting()}
                </Text>
                <Text style={styles.headerSubtitle}>
                  
                </Text>
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

          {/* Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statCardTotal}>
                <Text style={styles.statNumber}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total Tasks</Text>
              </View>
              <View style={styles.statCardCompleted}>
                <View style={styles.progressCircle}>
                  <Progress.Circle
                    size={50}
                    progress={stats.completionRate}
                    thickness={4}
                    color="#ffffff"
                    unfilledColor="rgba(255,255,255,0.3)"
                    borderWidth={0}
                    showsText
                    textStyle={styles.progressText}
                  />
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
                      
                      <Ionicons name={action.icon} size={24} color={action.color} />
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB', // bg-gray-50
  },
  scrollView: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: '#FFFFFF', // bg-white
    paddingHorizontal: 24, // px-6
    paddingTop: 36, // pt-4
    paddingBottom: 24, // pb-6
    borderBottomLeftRadius: 24, // rounded-b-3xl
    borderBottomRightRadius: 24,
    shadowColor: '#000', // shadow-sm
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 24, // mb-6
  },
  headerContent: {
    flexDirection: 'row', // flex-row
    justifyContent: 'space-between', // justify-between
    alignItems: 'flex-start', // items-start
    marginBottom: 16, // mb-4
  },
  headerTextContainer: {
    flex: 1, // flex-1
  },
  headerTitle: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 4, // mb-1
  },
  headerSubtitle: {
    fontSize: 16, // text-base
    color: '#4B5563', // text-gray-600
  },
  logoutButton: {
    backgroundColor: '#FEF2F2', // bg-red-50
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderRadius: 12, // rounded-xl
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
  },
  logoutButtonContent: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
  },
  logoutButtonText: {
    color: '#DC2626', // text-red-600
    fontWeight: '500', // font-medium
    marginLeft: 8, // ml-2
  },
  statsContainer: {
    paddingHorizontal: 24, // px-6
    marginBottom: 32, // mb-8
  },
  statsRow: {
    flexDirection: 'row', // flex-row
    marginBottom: 12, // mb-3
  },
  statCardTotal: {
    flex: 1, // flex-1
    backgroundColor: '#2563EB', // bg-blue-600
    padding: 20, // p-5
    borderRadius: 16, // rounded-2xl
    marginRight: 12, // mr-3
    alignItems: 'center', // items-center
  },
  statCardCompleted: {
    flex: 1, // flex-1
    backgroundColor: '#16A34A', // bg-green-600
    padding: 20, // p-5
    borderRadius: 16, // rounded-2xl
    marginLeft: 12, // ml-3
    alignItems: 'center', // items-center
  },
  statCardOverdue: {
    flex: 1, // flex-1
    backgroundColor: '#DC2626', // bg-red-600
    padding: 20, // p-5
    borderRadius: 16, // rounded-2xl
    marginRight: 12, // mr-3
    alignItems: 'center', // items-center
  },
  statCardInProgress: {
    flex: 1, // flex-1
    backgroundColor: '#9333EA', // bg-purple-600
    padding: 20, // p-5
    borderRadius: 16, // rounded-2xl
    marginLeft: 12, // ml-3
    alignItems: 'center', // items-center
  },
  statNumber: {
    fontSize: 30, // text-3xl
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
    marginBottom: 4, // mb-1
  },
  statLabel: {
    fontSize: 14, // text-sm
    fontWeight: '600', // font-semibold
    color: 'rgba(255,255,255,0.9)', // text-blue-100, text-green-100, etc.
  },
  progressCircle: {
    marginBottom: 8, // mb-2
  },
  progressText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tasksContainer: {
    paddingHorizontal: 24, // px-6
    marginBottom: 32, // mb-8
  },
  tasksHeader: {
    flexDirection: 'row', // flex-row
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
    marginBottom: 16, // mb-4
  },
  tasksTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600', // font-semibold
    color: '#2563EB', // text-blue-600
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF', // bg-white
    padding: 32, // p-8
    borderRadius: 12, // rounded-xl
    alignItems: 'center', // items-center
  },
  loadingText: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#4B5563', // text-gray-600
    marginTop: 12, // mt-3
  },
  noTasksContainer: {
    backgroundColor: '#FFFFFF', // bg-white
    padding: 32, // p-8
    borderRadius: 12, // rounded-xl
    alignItems: 'center', // items-center
  },
  noTasksTitle: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#4B5563', // text-gray-600
    marginTop: 12, // mt-3
    marginBottom: 4, // mb-1
  },
  noTasksSubtitle: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
    textAlign: 'center', // text-center
  },
  taskCard: {
    backgroundColor: '#FFFFFF', // bg-white
    padding: 16, // p-4
    borderRadius: 12, // rounded-xl
    marginBottom: 12, // mb-3
    shadowColor: '#000', // shadow-sm
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskContent: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    marginBottom: 12, // mb-3
  },
  priorityIndicator: {
    width: 4, // w-1
    height: 40, // h-10
    borderRadius: 9999, // rounded-full
    marginRight: 12, // mr-3
  },
  taskDetails: {
    flex: 1, // flex-1
  },
  taskTitle: {
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
    marginBottom: 4, // mb-1
  },
  taskCategory: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
  },
  taskFooter: {
    flexDirection: 'row', // flex-row
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
  },
  taskDueDate: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
  },
  statusBadge: {
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: 9999, // rounded-full
  },
  statusText: {
    fontSize: 12, // text-xs
    fontWeight: '600', // font-semibold
  },
  overdueContainer: {
    paddingHorizontal: 24, // px-6
    marginBottom: 32, // mb-8
  },
  overdueTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#DC2626', // text-red-600
    marginBottom: 16, // mb-4
  },
  overdueTaskCard: {
    backgroundColor: '#FFFFFF', // bg-white
    borderLeftWidth: 4, // border-l-4
    borderLeftColor: '#DC2626', // border-red-500
    padding: 16, // p-4
    borderRadius: 12, // rounded-xl
    marginBottom: 12, // mb-3
    shadowColor: '#000', // shadow-sm
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  priorityIndicatorOverdue: {
    width: 4, // w-1
    height: 40, // h-10
    borderRadius: 9999, // rounded-full
    backgroundColor: '#DC2626', // bg-red-500
    marginRight: 12, // mr-3
  },
  overdueText: {
    fontSize: 14, // text-sm
    color: '#DC2626', // text-red-600
    fontWeight: '500', // font-medium
  },
  quickActionsContainer: {
    paddingHorizontal: 24, // px-6
    marginBottom: 32, // mb-8
  },
  quickActionsTitle: {
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 16, // mb-4
  },
  quickActionsRow: {
    flexDirection: 'row', // flex-row
    justifyContent: 'space-between', // justify-between
  },
  quickActionCard: {
    flex: 1, // flex-1
    marginHorizontal: 4, // mx-1
  },
  quickActionButton: {
    padding: 16, // p-4
    borderRadius: 12, // rounded-xl
    alignItems: 'center', // items-center
  },
  quickActionIcon: {
    width: 48, // w-12
    height: 48, // h-12
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    marginBottom: 8, // mb-2
  },
  quickActionText: {
    fontSize: 12, // text-xs
    fontWeight: '600', // font-semibold
    color: '#374151', // text-gray-700
    textAlign: 'center', // text-center
  },
  fab: {
    position: 'absolute', // absolute
    bottom: 24, // bottom-6
    right: 24, // right-6
    width: 56, // w-14
    height: 56, // h-14
    backgroundColor: '#2563EB', // bg-blue-600
    borderRadius: 9999, // rounded-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    shadowColor: '#000', // shadow-lg
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  fabButton: {
    width: '100%', // w-full
    height: '100%', // h-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
});