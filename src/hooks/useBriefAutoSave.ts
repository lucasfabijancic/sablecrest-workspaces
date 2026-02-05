import { useEffect, useRef } from 'react';

interface UseBriefAutoSaveOptions {
  enabled: boolean;
  signature: string;
  onSave: (signature: string) => Promise<boolean>;
  delayMs?: number;
}

interface UseBriefAutoSaveResult {
  markSignatureAsSaved: (signature: string) => void;
}

export function useBriefAutoSave({
  enabled,
  signature,
  onSave,
  delayMs = 1500,
}: UseBriefAutoSaveOptions): UseBriefAutoSaveResult {
  const lastSavedSignatureRef = useRef('');
  const queuedSignatureRef = useRef('');
  const isSavingRef = useRef(false);

  useEffect(() => {
    if (!enabled || !signature) {
      return;
    }

    if (signature === lastSavedSignatureRef.current) {
      return;
    }

    const timerId = window.setTimeout(async () => {
      queuedSignatureRef.current = signature;

      if (isSavingRef.current) {
        return;
      }

      isSavingRef.current = true;
      while (queuedSignatureRef.current) {
        const nextSignature = queuedSignatureRef.current;
        queuedSignatureRef.current = '';
        const didSave = await onSave(nextSignature);
        if (didSave) {
          lastSavedSignatureRef.current = nextSignature;
        }
      }
      isSavingRef.current = false;
    }, delayMs);

    return () => window.clearTimeout(timerId);
  }, [delayMs, enabled, onSave, signature]);

  return {
    markSignatureAsSaved: (savedSignature: string) => {
      lastSavedSignatureRef.current = savedSignature;
    },
  };
}
