import { useState } from "react";
import { StyleSheet, View, Alert } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { Typography, Screen, Card, Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { TaskList } from "@/components/tasks/TaskList";
import { useTasks } from "@/hooks/useTasks";
import { useContractById } from "@/hooks/useContracts";
import { colors } from "@/constants/colors";
import { spacing } from "@/constants/spacing";
import type { Id } from "@/convex/_generated/dataModel";
import type { Task } from "@/types";

export default function FreelancerContractTasksScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const contractId = id as Id<"contracts"> | undefined;
  const { contract } = useContractById(contractId);
  const { tasks, isLoading, completionPercent, createTask, updateStatus, deleteTask, startTimer, stopTimer } = useTasks(contractId);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !contractId) {
      Alert.alert("Error", "Please enter a task title");
      return;
    }
    try {
      setIsCreating(true);
      await createTask({
        contractId,
        title: newTaskTitle.trim(),
      });
      setNewTaskTitle("");
      setShowAddForm(false);
    } catch (error) {
      Alert.alert("Error", "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const handleTaskPress = async (task: Task) => {
    // Pending task: start timer to begin work
    if (task.status === "pending") {
      await startTimer({ taskId: task._id as Id<"tasks"> });
    }
  };

  const handleStopTimer = async (task: Task) => {
    // Running task: stop timer to complete
    if (task.status === "running") {
      await stopTimer({ taskId: task._id as Id<"tasks"> });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      "Delete Task",
      "Are you sure you want to delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteTask({ taskId: taskId as Id<"tasks"> });
            } catch (error) {
              Alert.alert("Error", "Failed to delete task");
            }
          },
        },
      ]
    );
  };

  if (!contractId) {
    return (
      <>
        <Stack.Screen options={{ title: "Tasks" }} />
        <Screen style={styles.container}>
          <Card style={styles.errorCard}>
            <Typography variant="bodySmall" color={colors.error}>
              Contract not found
            </Typography>
          </Card>
        </Screen>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "Tasks",
          headerLargeTitle: false,
        }}
      />
      <Screen style={styles.container}>
        {isLoading ? (
          <Card style={styles.loadingCard}>
            <Typography variant="bodySmall" color={colors.gray500}>
              Loading tasks...
            </Typography>
          </Card>
        ) : (
            <TaskList
              contract={contract}
              tasks={tasks as Task[]}
              completionPercent={completionPercent}
              onTaskPress={handleTaskPress}
              onStopTimer={handleStopTimer}
              onStartTimer={handleTaskPress}
              style={styles.taskList}
            />
        )}
        
        {showAddForm ? (
          <Card style={styles.addForm}>
            <Typography variant="label" style={styles.formLabel}>
              New Task
            </Typography>
            <Input
              placeholder="Task title"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              containerStyle={styles.inputContainer}
            />
            {contract?.pricingType === "hourly" && contract?.hourlyRate && (
              <View style={styles.rateDisplay}>
                <Typography variant="bodySmall" color={colors.gray500}>
                  Rate: ${contract.hourlyRate}/hr (from contract)
                </Typography>
              </View>
            )}
            <View style={styles.formButtons}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => {
                  setShowAddForm(false);
                  setNewTaskTitle("");
                }}
                style={styles.formButton}
              />
              <Button
                title="Add"
                variant="primary"
                onPress={handleAddTask}
                loading={isCreating}
                style={styles.formButton}
              />
            </View>
          </Card>
        ) : (
          <Button
            title="+ Add Task"
            variant="primary"
            onPress={() => setShowAddForm(true)}
            style={styles.addButton}
          />
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.gray50,
  },
  loadingCard: {
    alignItems: "center",
    padding: spacing[8],
  },
  errorCard: {
    alignItems: "center",
    padding: spacing[8],
  },
  taskList: {
    flex: 1,
  },
  addForm: {
    margin: spacing[4],
    padding: spacing[4],
  },
  formLabel: {
    marginBottom: spacing[2],
  },
  inputContainer: {
    marginBottom: spacing[3],
  },
  rateDisplay: {
    padding: spacing[3],
    backgroundColor: colors.gray50,
    borderRadius: 8,
    marginBottom: spacing[2],
  },
  formButtons: {
    flexDirection: "row",
    gap: spacing[3],
    marginTop: spacing[2],
  },
  formButton: {
    flex: 1,
  },
  addButton: {
    margin: spacing[4],
  },
});
