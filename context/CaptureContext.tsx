import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  PendingCapture,
  getPendingQueue,
  enqueuePendingCapture,
  dequeueFirstCapture,
} from "../lib/storage";
import { getMerchantMemory, getCategoryUsage } from "../lib/storage";
import { MOCK_INCOMING, processCapture } from "../lib/captureEngine";
import { useApp } from "./AppContext";
import TransactionCaptureModal from "../components/TransactionCaptureModal";

interface CaptureContextType {
  pendingCount: number;
  currentCapture: PendingCapture | null;
  simulateIncoming: (mockTx?: { rawMerchant: string; amount: number; cardName: string }) => Promise<void>;
  confirmCapture: (category: string) => Promise<void>;
  dismissCapture: () => Promise<void>;
}

const CaptureContext = createContext<CaptureContextType | null>(null);

export function useCaptureContext(): CaptureContextType {
  const ctx = useContext(CaptureContext);
  if (!ctx) throw new Error("useCaptureContext must be used within CaptureProvider");
  return ctx;
}

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [currentCapture, setCurrentCapture] = useState<PendingCapture | null>(null);
  const { addTransaction } = useApp();

  const loadQueue = useCallback(async () => {
    const queue = await getPendingQueue();
    setPendingCount(queue.length);
    if (queue.length > 0 && !currentCapture) {
      setCurrentCapture(queue[0]);
    }
  }, [currentCapture]);

  useEffect(() => {
    loadQueue();
  }, []);

  const simulateIncoming = useCallback(
    async (mockTx?: { rawMerchant: string; amount: number; cardName: string }) => {
      const memory = await getMerchantMemory();
      const usageMap = await getCategoryUsage();
      const raw = mockTx || MOCK_INCOMING[Math.floor(Math.random() * MOCK_INCOMING.length)];
      const capture = processCapture(raw, memory, usageMap);
      await enqueuePendingCapture(capture);
      await loadQueue();
    },
    [loadQueue]
  );

  const confirmCapture = useCallback(
    async (category: string) => {
      if (!currentCapture) return;
      const tx = {
        id: `tx_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        amount: currentCapture.amount,
        category,
        timestamp: currentCapture.timestamp,
        merchant: currentCapture.cleanedMerchant,
      };
      await addTransaction(tx);
      await dequeueFirstCapture();
      setCurrentCapture(null);
      await loadQueue();
    },
    [currentCapture, addTransaction, loadQueue]
  );

  const dismissCapture = useCallback(async () => {
    if (!currentCapture) return;
    await dequeueFirstCapture();
    setCurrentCapture(null);
    await loadQueue();
  }, [currentCapture, loadQueue]);

  return (
    <CaptureContext.Provider
      value={{ pendingCount, currentCapture, simulateIncoming, confirmCapture, dismissCapture }}
    >
      {children}
      {currentCapture && (
        <TransactionCaptureModal
          capture={currentCapture}
          onConfirm={confirmCapture}
          onDismiss={dismissCapture}
        />
      )}
    </CaptureContext.Provider>
  );
}
