import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useCallback } from "react";

// Query hooks
export function useTasks(contractId: string | null) {
  return useQuery(api.tasks.listByContract, contractId ? { contractId } : "skip");
}

export function useTask(taskId: string | null) {
  return useQuery(api.tasks.get, taskId ? { taskId } : "skip");
}

// Mutation hooks
export function useCreateTask() {
  return useMutation(api.tasks.create);
}

export function useUpdateTaskStatus() {
  return useMutation(api.tasks.updateStatus);
}

export function useDeleteTask() {
  return useMutation(api.tasks.deleteTask);
}

export function useStartTimer() {
  return useMutation(api.tasks.startTimer);
}

export function useStopTimer() {
  return useMutation(api.tasks.stopTimer);
}

// Helper function for creating a task
export function useAddTask() {
  const createTask = useCreateTask();

  return useCallback(async (data: {
    contractId: string;
    title: string;
    description?: string;
    hourlyRate?: number;
  }) => {
    return createTask({
      contractId: data.contractId,
      title: data.title,
      description: data.description,
      hourlyRate: data.hourlyRate,
    });
  }, [createTask]);
}

// Helper function for toggling task completion
export function useToggleTaskComplete() {
  const updateStatus = useUpdateTaskStatus();

  return useCallback(async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    return updateStatus({ taskId, status: newStatus });
  }, [updateStatus]);
}

// Format time spent helper
export function formatTimeSpent(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

// Calculate total time spent on a contract
export function useTotalTimeSpent(contractId: string | null) {
  const tasks = useTasks(contractId);

  const totalSeconds = tasks?.reduce((sum: number, task: any) => {
    return sum + (task.timeSpent || 0);
  }, 0) || 0;

  return formatTimeSpent(totalSeconds);
}

// Calculate total billable amount for a contract
export function useTotalBillable(contractId: string | null) {
  const tasks = useTasks(contractId);

  const total = tasks?.reduce((sum: number, task: any) => {
    if (task.timeSpent && task.hourlyRate) {
      const hours = task.timeSpent / 3600;
      return sum + (hours * task.hourlyRate);
    }
    return sum;
  }, 0) || 0;

  return total.toFixed(2);
}