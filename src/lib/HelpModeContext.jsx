import { createContext, useContext, useState, useEffect } from 'react';

const HelpModeContext = createContext({ helpMode: false, setHelpMode: () => {} });

export function HelpModeProvider({ children }) {
  const [helpMode, setHelpMode] = useState(() => {
    try { return localStorage.getItem('carecall_help_mode') === 'true'; }
    catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('carecall_help_mode', helpMode ? 'true' : 'false'); }
    catch {}
  }, [helpMode]);

  return (
    <HelpModeContext.Provider value={{ helpMode, setHelpMode }}>
      {children}
    </HelpModeContext.Provider>
  );
}

export function useHelpMode() {
  return useContext(HelpModeContext);
}
