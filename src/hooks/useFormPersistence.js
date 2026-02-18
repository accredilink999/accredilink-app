import { useState, useEffect, useRef, useCallback } from 'react';

const DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function loadDraft(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (Date.now() - savedAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveDraft(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function clearAllDrafts() {
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith('draft:')) {
      localStorage.removeItem(key);
    }
  }
}

export function useFormPersistence(key, initialData) {
  const [formData, setFormDataRaw] = useState(initialData);
  const [hasDraft, setHasDraft] = useState(false);
  const [savingEnabled, setSavingEnabled] = useState(false);
  const dataRef = useRef(formData);
  const keyRef = useRef(key);
  const saveTimerRef = useRef(null);

  // Keep refs in sync
  dataRef.current = formData;
  keyRef.current = key;

  // On mount / key change: check for existing draft
  useEffect(() => {
    const existing = loadDraft(key);
    if (existing) {
      setHasDraft(true);
      setSavingEnabled(false); // Don't overwrite draft until user decides
    } else {
      setHasDraft(false);
      setSavingEnabled(true);
    }
  }, [key]);

  // Flush helper — writes current data to localStorage immediately
  const flush = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveDraft(keyRef.current, dataRef.current);
  }, []);

  // Debounced auto-save whenever formData changes
  useEffect(() => {
    if (!savingEnabled) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveDraft(key, formData);
    }, 1000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [formData, key, savingEnabled]);

  // Flush on visibility change (screen lock) and page hide
  useEffect(() => {
    if (!savingEnabled) return;

    const handleVisibility = () => {
      if (document.hidden) flush();
    };
    const handlePageHide = () => flush();

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pagehide', handlePageHide);

    // Capacitor native app lifecycle
    let appStateListener = null;
    try {
      const { App } = require('@capacitor/app');
      if (App?.addListener) {
        App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) flush();
        }).then(l => { appStateListener = l; });
      }
    } catch {
      // Not in Capacitor environment
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pagehide', handlePageHide);
      if (appStateListener?.remove) appStateListener.remove();
    };
  }, [flush, savingEnabled]);

  const setFormData = useCallback((valueOrUpdater) => {
    setFormDataRaw(valueOrUpdater);
  }, []);

  const restoreDraft = useCallback(() => {
    const existing = loadDraft(keyRef.current);
    if (existing) {
      setFormDataRaw(existing);
    }
    setHasDraft(false);
    setSavingEnabled(true);
  }, []);

  const discardDraft = useCallback(() => {
    localStorage.removeItem(keyRef.current);
    setHasDraft(false);
    setSavingEnabled(true);
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(keyRef.current);
    setHasDraft(false);
  }, []);

  return { formData, setFormData, hasDraft, restoreDraft, discardDraft, clearDraft };
}
