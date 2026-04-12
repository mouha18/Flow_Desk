import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import type { Invoice, LineItem } from "../src/types";

/**
 * Get invoice by contract ID
 */
export function useInvoice(contractId: Id<"contracts"> | undefined) {
  const invoice = useQuery(
    api.invoices.getByContract,
    contractId ? { contractId } : "skip"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (invoice !== undefined) {
      setIsLoading(false);
    }
  }, [invoice]);

  return { invoice, isLoading };
}

/**
 * Get invoice by invoice ID
 */
export function useInvoiceById(invoiceId: Id<"invoices"> | undefined) {
  const invoice = useQuery(
    api.invoices.getById,
    invoiceId ? { invoiceId } : "skip"
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (invoice !== undefined) {
      setIsLoading(false);
    }
  }, [invoice]);

  return { invoice, isLoading };
}

/**
 * List all invoices for freelancer's contracts
 */
export function useInvoicesByFreelancer() {
  const invoices = useQuery(api.invoices.listByFreelancer);
  const isLoading = invoices === undefined;

  return { invoices: invoices ?? [], isLoading };
}

/**
 * Get freelancer earnings summary
 */
export function useFreelancerEarnings() {
  const earnings = useQuery(api.invoices.getFreelancerEarnings);
  const isLoading = earnings === undefined;

  return {
    totalEarnings: earnings?.totalEarnings ?? 0,
    paidInvoicesCount: earnings?.paidInvoicesCount ?? 0,
    isLoading,
  };
}

/**
 * Create invoice mutation
 */
export function useCreateInvoice() {
  const [isCreating, setIsCreating] = useState(false);
  const create = useMutation(api.invoices.create);

  const createInvoice = async (args: {
    contractId: Id<"contracts">;
    lineItems: LineItem[];
    subtotal: number;
    tax: number;
    total: number;
    aiGenerated: boolean;
    notes?: string;
  }) => {
    setIsCreating(true);
    try {
      // Convert LineItem types to match Convex validators (null -> undefined)
      const convexArgs = {
        ...args,
        lineItems: args.lineItems.map((item) => ({
          description: item.description,
          hours: item.hours ?? undefined,
          rate: item.rate ?? undefined,
          amount: item.amount,
        })),
      };
      const invoiceId = await create(convexArgs as any);
      return invoiceId;
    } finally {
      setIsCreating(false);
    }
  };

  return { createInvoice, isCreating };
}

/**
 * Update invoice mutation
 */
export function useUpdateInvoice() {
  const [isUpdating, setIsUpdating] = useState(false);
  const update = useMutation(api.invoices.update);

  const updateInvoice = async (
    invoiceId: Id<"invoices">,
    updates: {
      lineItems?: LineItem[];
      subtotal?: number;
      tax?: number;
      total?: number;
      notes?: string;
    }
  ) => {
    setIsUpdating(true);
    try {
      // Convert LineItem types to match Convex validators (null -> undefined)
      const convexUpdates: Record<string, any> = { ...updates };
      if (convexUpdates.lineItems) {
        convexUpdates.lineItems = convexUpdates.lineItems.map((item: LineItem) => ({
          description: item.description,
          hours: item.hours ?? undefined,
          rate: item.rate ?? undefined,
          amount: item.amount,
        }));
      }
      await update({ invoiceId, ...convexUpdates } as any);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateInvoice, isUpdating };
}

/**
 * Send invoice mutation
 */
export function useSendInvoice() {
  const [isSending, setIsSending] = useState(false);
  const send = useMutation(api.invoices.send);

  const sendInvoice = async (invoiceId: Id<"invoices">) => {
    setIsSending(true);
    try {
      await send({ invoiceId });
    } finally {
      setIsSending(false);
    }
  };

  return { sendInvoice, isSending };
}

/**
 * Simulate payment mutation
 */
export function useSimulatePayment() {
  const [isProcessing, setIsProcessing] = useState(false);
  const pay = useMutation(api.invoices.simulatePayment);

  const simulatePayment = async (invoiceId: Id<"invoices">) => {
    setIsProcessing(true);
    try {
      await pay({ invoiceId });
    } finally {
      setIsProcessing(false);
    }
  };

  return { simulatePayment, isProcessing };
}

/**
 * Simulate upfront payment for Pay Now contracts (no invoice needed)
 */
export function useSimulatePaymentNow() {
  const [isProcessing, setIsProcessing] = useState(false);
  const payNow = useMutation(api.invoices.simulatePaymentNow);

  const simulatePaymentNow = async (contractId: Id<"contracts">) => {
    setIsProcessing(true);
    try {
      await payNow({ contractId });
    } finally {
      setIsProcessing(false);
    }
  };

  return { simulatePaymentNow, isProcessing };
}
