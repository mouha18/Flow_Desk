import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useCallback } from "react";

// Query hooks
export function useContracts() {
  return useQuery(api.contracts.list);
}

export function useClientContracts() {
  return useQuery(api.contracts.listByClient);
}

export function useContract(contractId: string | null) {
  return useQuery(api.contracts.get, contractId ? { contractId } : "skip");
}

export function useContractStats() {
  return useQuery(api.contracts.stats);
}

// Mutation hooks
export function useCreateContract() {
  return useMutation(api.contracts.create);
}

export function useAcceptContract() {
  return useMutation(api.contracts.accept);
}

export function useDeclineContract() {
  return useMutation(api.contracts.decline);
}

export function useCompleteContract() {
  return useMutation(api.contracts.complete);
}

export function useCancelContract() {
  return useMutation(api.contracts.cancel);
}

// Helper function for creating a contract (freelancer creates for client to accept)
export function useFreelancerCreateContract() {
  const createContract = useCreateContract();

  return useCallback(async (data: {
    clientId: string;
    title: string;
    description: string;
    budget: number;
    deadline?: number;
  }) => {
    return createContract({
      clientId: data.clientId,
      title: data.title,
      description: data.description,
      budget: data.budget,
      deadline: data.deadline,
    });
  }, [createContract]);
}

// Helper function for accepting a contract (client accepts freelancer's proposal)
export function useClientAcceptContract() {
  const acceptContract = useAcceptContract();

  return useCallback(async (contractId: string) => {
    return acceptContract({ contractId });
  }, [acceptContract]);
}

// Helper function for declining a contract (client declines)
export function useClientDeclineContract() {
  const declineContract = useDeclineContract();

  return useCallback(async (contractId: string) => {
    return declineContract({ contractId });
  }, [declineContract]);
}

// Helper function for completing a contract (either party can mark as completed)
export function useMarkContractComplete() {
  const completeContract = useCompleteContract();

  return useCallback(async (contractId: string) => {
    return completeContract({ contractId });
  }, [completeContract]);
}

// Helper to calculate contract progress
export function useContractProgress(contractId: string | null) {
  const contract = useContract(contractId);
  const tasks = useQuery(api.tasks.listByContract, contractId ? { contractId } : "skip");

  const progress = tasks && contract 
    ? Math.round((tasks.filter((t: any) => t.status === "completed").length / tasks.length) * 100)
    : 0;

  return { progress, totalTasks: tasks?.length || 0, completedTasks: tasks?.filter((t: any) => t.status === "completed").length || 0 };
}