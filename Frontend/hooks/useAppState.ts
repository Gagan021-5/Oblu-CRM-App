/**
 * useAppState hook — triggers callback on app foreground/resume.
 */

import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Calls `onForeground` whenever the app transitions from background to active.
 */
export function useAppForeground(onForeground: () => void) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const callbackRef = useRef(onForeground);

  useEffect(() => {
    callbackRef.current = onForeground;
  }, [onForeground]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextAppState === "active"
        ) {
          callbackRef.current?.();
        }
        appState.current = nextAppState;
      }
    );

    return () => subscription.remove();
  }, []);
}
