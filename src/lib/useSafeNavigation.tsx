import { useEffect, useRef } from 'react';
import { router } from 'expo-router';

/**
 * Safe navigation hook that ensures navigation operations only happen
 * when the navigation context is available and after a component is mounted
 */
export function useSafeNavigation() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeNavigate = (path: string, options?: { replace?: boolean }) => {
    // Use requestAnimationFrame to ensure navigation happens after render
    requestAnimationFrame(() => {
      if (isMountedRef.current) {
        try {
          if (options?.replace) {
            router.replace(path);
          } else {
            router.push(path);
          }
        } catch (error) {
          // Navigation context not ready, retry after a delay
          setTimeout(() => {
            if (isMountedRef.current) {
              try {
                if (options?.replace) {
                  router.replace(path);
                } else {
                  router.push(path);
                }
              } catch (e) {
                console.warn('Navigation failed:', e);
              }
            }
          }, 100);
        }
      }
    });
  };

  return { safeNavigate };
}