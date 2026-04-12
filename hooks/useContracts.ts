import { useEffect, useCallback, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { Contract, Task, TaskStatus } from "../src/types";
import { cacheContracts } from "../lib/sqlite";

export function useContracts() {
  const [refreshing, setRefreshing] = useState(false);
  const contracts = useQuery(api.contracts.list);
  const isLoading = contracts === undefined;

  const refetch = useCallback(async () => {
    setRefreshing(true);
    // Convex uses subscriptions - the data auto-updates
    // Wait a brief moment to show refresh indicator, then stop
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  }, []);

  const createContract = useMutation(api.contracts.create);
  const acceptContract = useMutation(api.contracts.accept);
  const declineContract = useMutation(api.contracts.decline);

  // Cache contracts to SQLite for offline access
  useEffect(() => {
    if (contracts) {
      (async () => {
        await cacheContracts(contracts as Contract[]);
      })();
    }
  }, [contracts]);

  return {
    contracts: contracts ?? [],
    isLoading,
    refreshing,
    refetch,
    createContract,
    acceptContract,
    declineContract,
  };
}

export function useContractById(contractId: Id<"contracts"> | undefined) {
  const contract = useQuery(
    api.contracts.getById,
    contractId ? { contractId } : "skip"
  );

  return {
    contract,
    isLoading: contract === undefined,
  };
}