import { useCallback, useRef, useState } from 'react';

interface UnsavedGuardOptions {
  onClose: () => void;
  onBack?: () => void;
}

export function useUnsavedGuard({ onClose, onBack }: UnsavedGuardOptions) {
  const dirtyRef = useRef(false);
  const pendingAction = useRef<'close' | 'back' | null>(null);
  const [showDiscard, setShowDiscard] = useState(false);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const guardedAction = useCallback(
    (action: 'close' | 'back') => {
      if (dirtyRef.current) {
        pendingAction.current = action;
        setShowDiscard(true);
      } else if (action === 'close') {
        onClose();
      } else {
        onBack?.();
      }
    },
    [onClose, onBack],
  );

  const handleDiscard = useCallback(() => {
    setShowDiscard(false);
    dirtyRef.current = false;
    if (pendingAction.current === 'close') {
      onClose();
    } else {
      onBack?.();
    }
    pendingAction.current = null;
  }, [onClose, onBack]);

  const cancelDiscard = useCallback(() => {
    setShowDiscard(false);
    pendingAction.current = null;
  }, []);

  return {
    dirtyRef,
    showDiscard,
    handleDirtyChange,
    guardedAction,
    handleDiscard,
    cancelDiscard,
  };
}
