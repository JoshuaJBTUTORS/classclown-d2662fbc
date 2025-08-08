// Development-only logging utility to reduce memory usage in production
const isDevelopment = import.meta.env.DEV;

export const devLog = {
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: any[]) => {
    // Always log errors
    console.error(...args);
  },
  group: (label: string) => {
    if (isDevelopment) {
      console.group(label);
    }
  },
  groupCollapsed: (label: string) => {
    if (isDevelopment) {
      console.groupCollapsed(label);
    }
  },
  groupEnd: () => {
    if (isDevelopment) {
      console.groupEnd();
    }
  }
};

// Memory cleanup utility for large datasets
export const memoryCleanup = {
  clearLargeObjects: () => {
    if (isDevelopment) {
      // Clear console periodically in development to prevent memory buildup
      if (typeof console.clear === 'function') {
        // Only clear if there are too many logs (rough estimate)
        const performanceMemory = (performance as any).memory;
        if (performanceMemory && performanceMemory.usedJSHeapSize > 50 * 1024 * 1024) { // 50MB
          console.clear();
          console.log('🧹 Development console cleared for memory optimization');
        }
      }
    }
  },
  
  garbageCollectionHint: () => {
    // Modern browsers handle GC automatically, but we can suggest cleanup
    if (isDevelopment && 'gc' in window) {
      (window as any).gc();
    }
  }
};