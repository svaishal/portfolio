
import { useEffect, useRef, useState } from 'react';

// Hook for auto-saving a single object (e.g., Profile)
export function useAutoSaveObject<T>(
  data: T,
  saveFn: () => Promise<void>,
  delay = 2000,
  shouldSave: (prev: T, curr: T) => boolean = (p, c) => p !== c
) {
  const [isSaving, setIsSaving] = useState(false);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const prevDataRef = useRef<T>(data);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if data changed
    if (shouldSave(prevDataRef.current, data)) {
      setHasPendingChanges(true);
      
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Schedule save
      timeoutRef.current = setTimeout(async () => {
        setIsSaving(true);
        try {
          await saveFn();
          prevDataRef.current = data; // Update ref to avoid double save
          setHasPendingChanges(false);
        } catch (error) {
          console.error('Auto-save failed:', error);
        } finally {
          setIsSaving(false);
        }
      }, delay);
    }
    // Note: We don't update prevDataRef here, only after successful save
    // UNLESS the change was external? No, we assume controlled inputs.
    // Actually, if save fails, we still have pending changes.
    
    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, delay, saveFn, shouldSave]);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges || isSaving) {
        e.preventDefault();
        // e.returnValue is deprecated and not needed for modern browsers
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasPendingChanges, isSaving]);

  return { isSaving, hasPendingChanges };
}

// Hook for auto-saving a list of items (e.g., Experiences)
export function useAutoSaveList<T>(
  items: T[],
  saveFn: (item: T, index: number) => Promise<void>,
  delay = 2000
) {
  const [savingIndices, setSavingIndices] = useState<Set<number>>(new Set());
  const pendingIndices = useRef<Set<number>>(new Set());
  const prevItemsRef = useRef<T[]>(items);
  const timeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    items.forEach((item, index) => {
      const prev = prevItemsRef.current[index];
      
      // If item changed (and exists in both)
      // Note: If item is new (length changed), we might need to handle it.
      // But typically we add item, then edit it.
      if (prev && item !== prev) {
        pendingIndices.current.add(index);

        // Clear existing timeout for this index
        if (timeoutsRef.current.has(index)) {
          clearTimeout(timeoutsRef.current.get(index)!);
        }

        // Schedule save
        const timeout = setTimeout(async () => {
          setSavingIndices(prev => new Set(prev).add(index));
          try {
            await saveFn(item, index);
            pendingIndices.current.delete(index);
          } catch (error) {
            console.error(`Auto-save failed for index ${index}:`, error);
          } finally {
            setSavingIndices(prev => {
              const next = new Set(prev);
              next.delete(index);
              return next;
            });
          }
        }, delay);

        timeoutsRef.current.set(index, timeout);
      }
    });

    prevItemsRef.current = items;

    // Cleanup not needed here as timeouts are managed in ref map?
    // But we need to clear timeouts if component unmounts
  }, [items, delay, saveFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingIndices.current.size > 0 || savingIndices.size > 0) {
        e.preventDefault();
        // e.returnValue is deprecated
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [savingIndices]);

  return { savingIndices };
}
