import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Platform,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
  created_by: string;
  assigned_to?: string[];
}

export default function TasksScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState<'category' | 'priority' | 'dueDate' | null>(null);
  const [selectedFilterValue, setSelectedFilterValue] = useState<string | null>(null);
  const scale = useSharedValue(1);

  // Filter options
  const filterOptions = {
    category: ['All', 'Assignment', 'Project', 'Study Group', 'Exam', 'Lab Work', 'Research'],
    priority: ['All', 'High', 'Medium', 'Low'],
    dueDate: ['All', 'Today', 'This Week', 'This Month', 'Overdue'],
  };

  // Fetch tasks when the screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        fetchTasks();
      } else {
        setLoading(false);
        Alert.alert('Error', 'You must be logged in to view tasks.');
      }
    }, [user])
  );

  // Filter tasks when search or filters change
  useEffect(() => {
    filterTasks();
  }, [searchQuery, selectedFilterType, selectedFilterValue, tasks]);

  // Fetch tasks from AsyncStorage
  const fetchTasks = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const tasksData = await AsyncStorage.getItem('tasks');
      const allTasks: Task[] = tasksData ? JSON.parse(tasksData) : [];

      const userTasks = allTasks.filter(
        (task) => task.created_by === user.id || (task.assigned_to && task.assigned_to.includes(user.id))
      );

      setTasks(userTasks);
    } catch (error) {
      console.error('Error fetching tasks:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Something went wrong while loading tasks.');
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on search and selected filter
  const filterTasks = () => {
    let filtered = tasks;

    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedFilterType && selectedFilterValue && selectedFilterValue !== 'All') {
      if (selectedFilterType === 'category') {
        filtered = filtered.filter((task) => task.category === selectedFilterValue);
      } else if (selectedFilterType === 'priority') {
        filtered = filtered.filter((task) => task.priority === selectedFilterValue);
      } else if (selectedFilterType === 'dueDate') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        filtered = filtered.filter((task) => {
          const taskDueDate = new Date(task.dueDate);
          taskDueDate.setHours(0, 0, 0, 0);

          if (selectedFilterValue === 'Today') {
            return taskDueDate.getTime() === today.getTime();
          } else if (selectedFilterValue === 'This Week') {
            const weekEnd = new Date(today);
            weekEnd.setDate(today.getDate() + 7);
            return taskDueDate >= today && taskDueDate <= weekEnd;
          } else if (selectedFilterValue === 'This Month') {
            const monthEnd = new Date(today);
            monthEnd.setMonth(today.getMonth() + 1);
            monthEnd.setDate(0);
            return taskDueDate >= today && taskDueDate <= monthEnd;
          } else if (selectedFilterValue === 'Overdue') {
            return taskDueDate < today && task.status !== 'completed';
          }
          return true;
        });
      }
    }

    setFilteredTasks(filtered);
  };

  // Update task in AsyncStorage
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const tasksData = await AsyncStorage.getItem('tasks');
      let allTasks: Task[] = tasksData ? JSON.parse(tasksData) : [];

      allTasks = allTasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      );

      await AsyncStorage.setItem('tasks', JSON.stringify(allTasks));
      setTasks(allTasks.filter(
        // @ts-ignore
        (task) => task.created_by === user?.id || (task.assigned_to && task.assigned_to.includes(user?.id))
      ));
    } catch (error) {
      console.error('Error updating task:', JSON.stringify(error, null, 2));
      throw error;
    }
  };

  // Delete task from AsyncStorage
  const deleteTask = async (taskId: string) => {
    try {
      const tasksData = await AsyncStorage.getItem('tasks');
      let allTasks: Task[] = tasksData ? JSON.parse(tasksData) : [];

      allTasks = allTasks.filter((task) => task.id !== taskId);

      await AsyncStorage.setItem('tasks', JSON.stringify(allTasks));
      setTasks(allTasks.filter(
        // @ts-ignore
        (task) => task.created_by === user?.id || (task.assigned_to && task.assigned_to.includes(user?.id))
      ));
    } catch (error) {
      console.error('Error deleting task:', JSON.stringify(error, null, 2));
      throw error;
    }
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

  const getPriorityBadgeColor = (priority: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#DCFCE7', text: '#15803D' };
      case 'in-progress':
        return { bg: '#DBEAFE', text: '#1D4ED8' };
      case 'pending':
        return { bg: '#FEF3C7', text: '#B45309' };
      default:
        return { bg: '#F3F4F6', text: '#4B5563' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const updateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Error updating task status:', JSON.stringify(error, null, 2));
      Alert.alert('Error', 'Something went wrong while updating the task status.');
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(taskId);
          } catch (error) {
            Alert.alert('Error', 'Something went wrong while deleting the task.');
          }
        },
      },
    ]);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  const handlePressIn = () => {
    scale.value = 0.95;
  };

  const handlePressOut = () => {
    scale.value = 1;
  };

  // Handle filter selection
  const handleFilterSelect = (type: 'category' | 'priority' | 'dueDate') => {
    setSelectedFilterType(type);
  };

  const handleFilterValueSelect = (value: string) => {
    setSelectedFilterValue(value);
    setFilterModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <Text style={styles.headerSubtitle}>
          {loading ? 'Loading...' : `${filteredTasks.length} task(s) found`}
        </Text>
      </View>

      {/* Search Bar and Filter Button */}
      <View style={styles.searchFilterContainer}>
        <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
          <Ionicons
            name={Platform.OS === 'ios' ? 'search' : 'search-outline'}
            size={20}
            color="#6B7280"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Ionicons
              name={Platform.OS === 'ios' ? 'filter' : 'filter-outline'}
              size={20}
              color="#FFFFFF"
            />
            <Text style={styles.filterButtonText}>Filter</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Filter</Text>
            {!selectedFilterType ? (
              <View>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleFilterSelect('category')}
                >
                  <Text style={styles.modalOptionText}>Category</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleFilterSelect('priority')}
                >
                  <Text style={styles.modalOptionText}>Priority</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalOption}
                  onPress={() => handleFilterSelect('dueDate')}
                >
                  <Text style={styles.modalOptionText}>Due Date</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filterOptions[selectedFilterType]}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => handleFilterValueSelect(item)}
                  >
                    <Text style={styles.modalOptionText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            )}
            <TouchableOpacity
              style={[styles.modalOption, styles.modalCancel]}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={[styles.modalOptionText, { color: '#EF4444' }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tasks List */}
      <ScrollView style={styles.taskList} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <Animated.View key={task.id} style={animatedStyle}>
              <View style={styles.taskCard}>
                <View style={styles.taskContent}>
                  <View style={[styles.priorityIndicator, getPriorityColor(task.priority)]} />
                  <View style={styles.taskDetails}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <Text style={styles.taskDescription}>{task.description}</Text>
                    <View style={styles.taskMeta}>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Category:</Text>
                        <Text style={styles.metaValue}>{task.category}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Priority:</Text>
                        <View style={[styles.priorityBadge, getPriorityBadgeColor(task.priority)]}>
                          <Text style={styles.priorityText}>{task.priority}</Text>
                        </View>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Due Date:</Text>
                        <Text style={styles.metaValue}>{formatDate(task.dueDate)}</Text>
                      </View>
                      <View style={styles.metaRow}>
                        <Text style={styles.metaLabel}>Status:</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.status).bg }]}>
                          <Text style={[styles.statusText, { color: getStatusColor(task.status).text }]}>
                            {task.status.replace('-', ' ').toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => {
                      const nextStatus =
                        task.status === 'pending'
                          ? 'in-progress'
                          : task.status === 'in-progress'
                          ? 'completed'
                          : 'pending';
                      updateTaskStatus(task.id, nextStatus);
                    }}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Ionicons
                      name={Platform.OS === 'ios' ? 'arrow-forward-circle' : 'arrow-forward-circle-outline'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionText}>Update Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: '#EF4444' }]}
                    onPress={() => handleDeleteTask(task.id)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  >
                    <Ionicons
                      name={Platform.OS === 'ios' ? 'trash' : 'trash-outline'}
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.actionText}>Delete Task</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))
        ) : (
          <View style={styles.noTasksContainer}>
            <Ionicons
              name={Platform.OS === 'ios' ? 'archive' : 'archive-outline'}
              size={48}
              color="#E5E7EB"
            />
            <Text style={styles.noTasksTitle}>No tasks found</Text>
            <Text style={styles.noTasksSubtitle}>
              Try adjusting your filters or create a new task
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View style={[animatedStyle, styles.fab]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => router.push('/create')}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Ionicons
            name={Platform.OS === 'ios' ? 'add' : 'add-outline'}
            size={32}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
    fontWeight: '500',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 12,
    gap: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchContainerFocused: {
    borderColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  filterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  taskList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
  },
  noTasksContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 40,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
  },
  noTasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 4,
  },
  noTasksSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 9999,
    marginRight: 12,
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  taskDescription: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 24,
    fontWeight: '500',
  },
  taskMeta: {
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  metaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  metaValue: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  taskActions: {
    flexDirection: 'column',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  modalOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  modalCancel: {
    borderBottomWidth: 0,
    marginTop: 12,
    alignItems: 'center',
  },
});