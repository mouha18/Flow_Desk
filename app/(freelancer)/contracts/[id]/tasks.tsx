import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Alert } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Heading, Typography, Screen, Card, Badge, Button } from "@/components/ui";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import { useTasks, useCreateTask, useUpdateTaskStatus, useStartTimer, useStopTimer, formatTimeSpent } from "@/hooks/use-tasks";
import { useContract } from "@/hooks/use-contracts";
import { useState } from "react";

export default function FreelancerTasksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { contract } = useContract(id || null);
  const { tasks, isLoading } = useTasks(id || null);
  const { createTask } = useCreateTask();
  const { updateStatus } = useUpdateTaskStatus();
  const { startTimer } = useStartTimer();
  const { stopTimer } = useStopTimer();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return colors.success;
      case "running": return colors.warning;
      case "pending": return colors.gray500;
      default: return colors.gray500;
    }
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !id) return;
    setIsCreating(true);
    try {
      await createTask({
        contractId: id,
        title: newTaskTitle.trim(),
      });
      setNewTaskTitle("");
    } catch (error) {
      Alert.alert("Error", "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (task: any) => {
    try {
      if (task.status === "completed") {
        await updateStatus({ taskId: task._id, status: "pending" });
      } else {
        await updateStatus({ taskId: task._id, status: "completed" });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update task");
    }
  };

  const handleStartTimer = async (taskId: string) => {
    try {
      await startTimer(taskId as any);
    } catch (error) {
      Alert.alert("Error", "Failed to start timer");
    }
  };

  const handleStopTimer = async (taskId: string) => {
    try {
      await stopTimer(taskId as any);
    } catch (error) {
      Alert.alert("Error", "Failed to stop timer");
    }
  };

  const renderTask = ({ item }: { item: any }) => (
    <Card style={styles.taskCard}>
      <TouchableOpacity 
        onPress={() => handleToggleStatus(item)}
        style={styles.taskContent}
      >
        <View style={styles.taskHeader}>
          <View style={styles.checkbox}>
            {item.status === "completed" && (
              <View style={styles.checkboxChecked} />
            )}
          </View>
          <Typography 
            variant="body" 
            style={[
              styles.taskTitle,
              item.status === "completed" && styles.completedTask
            ]}
          >
            {item.title}
          </Typography>
          <Badge label={item.status} color={getStatusColor(item.status)} />
        </View>
        
        <View style={styles.taskDetails}>
          {item.timeSpent !== null && (
            <Typography variant="caption" color={colors.gray500}>
              Time: {formatTimeSpent(item.timeSpent)}
            </Typography>
          )}
          {item.hourlyRate && (
            <Typography variant="caption" color={colors.gray500}>
              ${item.hourlyRate}/hr
            </Typography>
          )}
        </View>

        {item.status === "running" && item.startedAt && (
          <View style={styles.timerActions}>
            <Button 
              label="Stop Timer" 
              onPress={() => handleStopTimer(item._id)}
              variant="secondary"
              size="small"
            />
          </View>
        )}

        {item.status !== "running" && item.status !== "completed" && (
          <View style={styles.timerActions}>
            <Button 
              label="Start Timer" 
              onPress={() => handleStartTimer(item._id)}
              variant="primary"
              size="small"
            />
          </View>
        )}
      </TouchableOpacity>
    </Card>
  );

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: "Tasks" }} />
        <Screen style={styles.container}>
          <ActivityIndicator size="large" color={colors.primary} />
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: `Tasks - ${contract?.title || "Contract"}`,
        }} 
      />
      <Screen style={styles.container}>
        <View style={styles.createTaskContainer}>
          <TextInput
            style={styles.input}
            placeholder="New task title..."
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholderTextColor={colors.gray400}
          />
          <Button 
            label={isCreating ? "Adding..." : "Add Task"} 
            onPress={handleCreateTask}
            variant="primary"
            disabled={!newTaskTitle.trim() || isCreating}
          />
        </View>

        {tasks && tasks.length > 0 ? (
          <FlatList
            data={tasks}
            renderItem={renderTask}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
          />
        ) : (
          <Card style={styles.emptyState}>
            <Typography variant="body" color={colors.gray500}>
              No tasks yet. Add your first task above.
            </Typography>
          </Card>
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  createTaskContainer: {
    flexDirection: "row",
    gap: spacing[2],
    marginBottom: spacing[4],
    padding: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: 8,
    padding: spacing[3],
    fontSize: 16,
    color: colors.gray900,
  },
  list: {
    padding: spacing[4],
  },
  taskCard: {
    marginBottom: spacing[3],
    padding: spacing[3],
  },
  taskContent: {
    width: "100%",
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.gray400,
    borderRadius: 4,
    marginRight: spacing[2],
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    width: 12,
    height: 12,
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  taskTitle: {
    flex: 1,
    marginRight: spacing[2],
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: colors.gray500,
  },
  taskDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: spacing[6],
    marginBottom: spacing[2],
  },
  timerActions: {
    marginLeft: spacing[6],
  },
  emptyState: {
    alignItems: "center",
    padding: spacing[8],
    margin: spacing[4],
  },
});