import { createContext, useCallback, useContext, useState } from 'react';
import { BusinessClientSheet } from '../components/BusinessClientSheet.js';

interface ClientSheetContextValue {
  openClientSheet: (id: string) => void;
}

const ClientSheetContext = createContext<ClientSheetContextValue | null>(null);

export function useClientSheet() {
  const ctx = useContext(ClientSheetContext);
  if (!ctx) throw new Error('useClientSheet must be used within ClientSheetProvider');
  return ctx;
}

export function ClientSheetProvider({ children }: { children: React.ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const openClientSheet = useCallback((id: string) => {
    setClientId(id);
    setOpen(true);
  }, []);

  return (
    <ClientSheetContext.Provider value={{ openClientSheet }}>
      {children}
      {clientId && <BusinessClientSheet open={open} onOpenChange={setOpen} clientId={clientId} />}
    </ClientSheetContext.Provider>
  );
}
