"use client";

import { useEffect, useCallback } from "react";

export interface DraftRecord<T> {
  data: T;
  updatedAt: string;
}

export function useDraftAutoSave<T>(key: string, data: T, isDirty: boolean) {
  const storageKey = `minsu_draft_${key}`;

  useEffect(() => {
    if (!isDirty) return;
    try {
      const record: DraftRecord<T> = {
        data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(record));
    } catch (e) {
      console.warn("Draft auto-save quota exceeded or storage unavailable", e);
    }
  }, [storageKey, data, isDirty]);

  const getSavedDraft = useCallback((): DraftRecord<T> | null => {
    try {
      const item = localStorage.getItem(storageKey);
      if (!item) return null;
      return JSON.parse(item) as DraftRecord<T>;
    } catch {
      return null;
    }
  }, [storageKey]);

  const clearSavedDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn("Could not clear saved draft", e);
    }
  }, [storageKey]);

  return { getSavedDraft, clearSavedDraft };
}

