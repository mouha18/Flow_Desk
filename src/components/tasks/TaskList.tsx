import React from "react";
import { View, StyleSheet, ViewStyle, Text } from "react-native";
import { colors } from "../../constants/colors";
import { spacing } from "../../constants/spacing";
import { Task, Contract } from "../../types/index";
import { TaskItem } from "./TaskItem";
import { CompletionBar } from "./CompletionBar";

interface TaskListProps {
  tasks: Task[];
  contract: Contract | null | undefined;
  completionPercent?: number;
  onTaskPress?: (task: Task) => void;
  onStopTimer?: (task: Task) => void;
  onStartTimer?: (task: Task) => void;
  style?: ViewStyle;
}

export function TaskList({
  tasks,
  contract,
  completionPercent = 0,
  onTaskPress,
  onStopTimer,
  onStartTimer,
  style,
}: TaskListProps) {
  return (
    <View style={[styles.container, style]}>
      <CompletionBar percent={completionPercent} />

      <View style={styles.list}>
        {tasks.map((task) => (
          <TaskItem
            key={task._id}
            task={task}
            contract={contract}
            onPress={onTaskPress}
            onStop={onStopTimer}
            onStart={onStartTimer}
            style={styles.taskItem}
          />
        ))}

        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks yet</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
    gap: spacing[3],
  },
  taskItem: {
    marginBottom: spacing[3],
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[10],
  },
  emptyText: {
    color: colors.gray400,
    fontSize: 16,
  },
});
