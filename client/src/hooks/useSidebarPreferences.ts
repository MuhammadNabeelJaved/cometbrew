/**
 * useSidebarPreferences
 *
 * Persists per-role sidebar preferences in localStorage:
 *   - `order`  – custom drag order (array of paths)
 *   - `pinned` – starred/pinned paths (always float to top)
 *
 * Usage:
 *   const { getOrderedLinks, isPinned, togglePin,
 *           handleDragStart, handleDragOver, handleDrop } = useSidebarPreferences('admin', links);
 */
import { useState, useRef, useCallback } from 'react';

export interface SidebarLinkDef {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface Prefs {
  order:  string[];
  pinned: string[];
}

function loadPrefs(key: string, defaultPaths: string[]): Prefs {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as Prefs;
      const validSet = new Set(defaultPaths);
      // Keep only known paths; append new ones that weren't saved yet
      const saved = (parsed.order || []).filter(p => validSet.has(p));
      const fresh = defaultPaths.filter(p => !saved.includes(p));
      return {
        order:  [...saved, ...fresh],
        pinned: (parsed.pinned || []).filter(p => validSet.has(p)),
      };
    }
  } catch {}
  return { order: [...defaultPaths], pinned: [] };
}

function savePrefs(key: string, prefs: Prefs) {
  try { localStorage.setItem(key, JSON.stringify(prefs)); } catch {}
}

export function useSidebarPreferences(roleKey: string, defaultLinks: SidebarLinkDef[]) {
  const storageKey   = `${roleKey}-sidebar-prefs`;
  const defaultPaths = defaultLinks.map(l => l.path);
  const draggedPath  = useRef<string | null>(null);

  const [prefs, setPrefs] = useState<Prefs>(() => loadPrefs(storageKey, defaultPaths));

  /**
   * Given the currently visible links (after any visibility filtering),
   * returns { pinned, rest, all } in persisted order.
   * Pinned items always come first.
   */
  const getOrderedLinks = useCallback((visibleLinks: SidebarLinkDef[]) => {
    const map          = new Map(visibleLinks.map(l => [l.path, l]));
    const visiblePaths = new Set(visibleLinks.map(l => l.path));

    // Order: saved order filtered to visible, then any new visible paths appended
    const orderedPaths = prefs.order.filter(p => visiblePaths.has(p));
    visibleLinks.forEach(l => { if (!orderedPaths.includes(l.path)) orderedPaths.push(l.path); });

    const ordered = orderedPaths.map(p => map.get(p)!).filter(Boolean);
    const pinned  = ordered.filter(l => prefs.pinned.includes(l.path));
    const rest    = ordered.filter(l => !prefs.pinned.includes(l.path));
    return { pinned, rest, all: [...pinned, ...rest] };
  }, [prefs]);

  const isPinned = useCallback((path: string) => prefs.pinned.includes(path), [prefs.pinned]);

  const togglePin = useCallback((path: string) => {
    setPrefs(prev => {
      const pinned = prev.pinned.includes(path)
        ? prev.pinned.filter(p => p !== path)
        : [...prev.pinned, path];
      const next = { ...prev, pinned };
      savePrefs(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const handleDragStart = useCallback((path: string) => {
    draggedPath.current = path;
  }, []);

  const handleDrop = useCallback((targetPath: string) => {
    const from = draggedPath.current;
    draggedPath.current = null;
    if (!from || from === targetPath) return;

    setPrefs(prev => {
      const order   = [...prev.order];
      const fromIdx = order.indexOf(from);
      const toIdx   = order.indexOf(targetPath);
      // If either path isn't in the order array yet, append and retry
      if (fromIdx === -1 || toIdx === -1) return prev;
      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, from);
      const next = { ...prev, order };
      savePrefs(storageKey, next);
      return next;
    });
  }, [storageKey]);

  return { getOrderedLinks, isPinned, togglePin, handleDragStart, handleDrop };
}
