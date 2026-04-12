import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "../../constants/colors";
import { fontSizes, fontWeights } from "../../constants/typography";
import { borderRadius, spacing } from "../../constants/spacing";
import { Task, TaskStatus, Contract } from "../../types/index";
import { Badge } from "../ui/badge";

interface TaskItemProps {
  task: Task;
  contract: Contract | null | undefined;
  onPress?: (task: Task) => void;
  onStop?: (task: Task) => void;
  onStart?: (task: Task) => void;
  onComplete?: (task: Task) => void;
  style?: ViewStyle;
}

const statusBadgeVariant: Record<TaskStatus, "default" | "success" | "warning"> = {
  pending: "warning",
  running: "default",
  completed: "success",
};

const statusLabels: Record<TaskStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Done",
};

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

// Calculate live elapsed time including current running period
function calculateLiveTime(task: Task): number {
  let totalTime = task.timeSpent || 0;
  
  // If timer is currently running, add elapsed time since startedAt
  if (task.status === "running" && task.startedAt) {
    totalTime += Date.now() - task.startedAt;
  }
  
  return totalTime;
}

export function TaskItem({ task, contract, onPress, onStop, onStart, onComplete, style }: TaskItemProps) {
  const isRunning = task.status === "running";
  const isPending = task.status === "pending";
  const isCompleted = task.status === "completed";

  // Live time state that updates every second when timer is running
  const [liveTime, setLiveTime] = useState<number>(() => calculateLiveTime(task));
  
  // Use ref to always access current task in interval without stale closures
  const taskRef = useRef(task);
  taskRef.current = task;

  // Update live time every second when timer is running
  useEffect(() => {
    // If not running, just show stored time
    if (taskRef.current.status !== "running") {
      setLiveTime(taskRef.current.timeSpent || 0);
      return;
    }

    // Immediately update to current live time
    setLiveTime(calculateLiveTime(taskRef.current));

    // Update every second
    const interval = setInterval(() => {
      setLiveTime(calculateLiveTime(taskRef.current));
    }, 1000);

    return () => clearInterval(interval);
  }, [task.status, task.startedAt]); // Re-run when status or start time changes

  // Handle click to cycle status
  const handlePress = () => {
    if (isPending) {
      // Start timer -> running
      onStart?.(task);
    } else if (isRunning) {
      // Stop timer -> completed
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onStop?.(task);
    } else if (isCompleted) {
      // Could show details or allow editing
      onPress?.(task);
    } else {
      onPress?.(task);
    }
  };

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={handlePress}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {task.title}
          </Text>
          <Badge
            label={statusLabels[task.status]}
            variant={statusBadgeVariant[task.status]}
          />
        </View>

        {contract?.pricingType === 'hourly' && (
          <>
            <View style={styles.footer}>
              <View style={styles.timer}>
                <View style={[styles.timerIcon, isRunning && styles.timerIconActive]}>
                  <Text style={styles.timerIconText}>⏱</Text>
                </View>
                <Text style={[styles.timerText, isRunning && styles.timerTextActive]}>
                  {formatTime(liveTime)}
                </Text>
              </View>

              {contract.hourlyRate != null && (
                <Text style={styles.rate}>
                  ${contract.hourlyRate.toFixed(2)}/hr
                </Text>
              )}
            </View>

            {isPending && (
              <Text style={styles.hint}>Tap to start timer</Text>
            )}
            {isRunning && (
              <Text style={styles.hintRunning}>Tap to stop & complete</Text>
            )}
          </>
        )}
      </View>

      <View style={styles.indicator}>
        <View
          style={[
            styles.indicatorDot,
            isRunning && styles.indicatorDotActive,
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: colors.gray200,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[3],
  },
  title: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    color: colors.gray900,
    flex: 1,
    marginRight: spacing[3],
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerIcon: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing[2],
  },
  timerIconActive: {
    backgroundColor: colors.warning + "20",
  },
  timerIconText: {
    fontSize: fontSizes.xs,
  },
  timerText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    fontFamily: "monospace",
    color: colors.gray600,
  },
  timerTextActive: {
    color: colors.warning,
  },
  rate: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    color: colors.gray500,
  },
  hint: {
    fontSize: fontSizes.xs,
    color: colors.gray400,
    marginTop: spacing[2],
  },
  hintRunning: {
    fontSize: fontSizes.xs,
    color: colors.warning,
    marginTop: spacing[2],
  },
  indicator: {
    marginLeft: spacing[3],
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray300,
  },
  indicatorDotActive: {
    backgroundColor: colors.success,
  },
});
