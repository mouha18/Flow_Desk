import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { Task, TaskStatus } from "../src/types";
import { cacheTasks } from "../lib/sqlite";

export function useTasks(contractId: Id<"contracts"> | undefined) {
  const tasks = useQuery(
    api.tasks.list,
    contractId ? { contractId } : "skip"
  );
  const isLoading = tasks === undefined;

  const createTask = useMutation(api.tasks.create);
  const updateStatus = useMutation(api.tasks.updateStatus);
  const startTimer = useMutation(api.tasks.startTimer);
  const stopTimer = useMutation(api.tasks.stopTimer);
  const setHourlyRate = useMutation(api.tasks.setHourlyRate);
  const deleteTask = useMutation(api.tasks.deleteTask);

  // Compute completion percentage
  const taskList = (tasks ?? []) as Task[];
  const totalTasks = taskList.length;
  const completedTasks = taskList.filter((t: Task) => t.status === "completed").length;
  const completionPercent = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Cache tasks to SQLite for offline access
  useEffect(() => {
    if (tasks && contractId) {
      (async () => {
        await cacheTasks(contractId as string, tasks as Task[]);
      })();
    }
  }, [tasks, contractId]);

  return {
    tasks: taskList,
    isLoading,
    completionPercent,
    createTask,
    updateStatus,
    startTimer,
    stopTimer,
    setHourlyRate,
    deleteTask,
  };
}
