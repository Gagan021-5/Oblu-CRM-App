/**
 * Background Sync Service
 *
 * Registers a background task that periodically syncs call logs.
 * Uses expo-background-task + expo-task-manager.
 *
 * Background tasks run in development builds / release builds,
 * not inside standard Expo Go.
 */

import * as TaskManager from "expo-task-manager";
import { Platform } from "react-native";
import { syncCallLogs } from "@/services/callLogSync";

// ── Task name constant ─────────────────────────────────────────────────
export const CALL_LOG_SYNC_TASK = "CALL_LOG_SYNC_TASK";

// ── Lazy import for expo-background-task ────────────────────────────────
let BackgroundTask: any = null;

async function loadBackgroundTask() {
  try {
    BackgroundTask = require("expo-background-task");
  } catch {
    console.warn("expo-background-task not available (running in Expo Go?)");
  }
}

// ── Define the background task ──────────────────────────────────────────
// Must be called at module scope (outside React component tree)

TaskManager.defineTask(CALL_LOG_SYNC_TASK, async () => {
  try {
    console.log("[BackgroundSync] Running call log sync...");
    const result = await syncCallLogs();
    console.log(
      `[BackgroundSync] Done: ${result.synced} synced, ${result.failed} failed`
    );

    if (!BackgroundTask) await loadBackgroundTask();

    if (result.synced > 0 || result.failed > 0) {
      return BackgroundTask?.BackgroundTaskResult?.NewData ?? 1;
    }
    return BackgroundTask?.BackgroundTaskResult?.NoData ?? 2;
  } catch (error) {
    console.error("[BackgroundSync] Error:", error);
    return BackgroundTask?.BackgroundTaskResult?.Failed ?? 3;
  }
});

// ── Registration helper ─────────────────────────────────────────────────

/**
 * Register the background sync task. Call this once after the user
 * grants consent and permissions.
 */
export async function registerBackgroundSync(): Promise<boolean> {
  if (Platform.OS !== "android") {
    console.warn("Background sync only supported on Android");
    return false;
  }

  await loadBackgroundTask();

  if (!BackgroundTask) {
    console.warn("Cannot register background task — module not available");
    return false;
  }

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      CALL_LOG_SYNC_TASK
    );

    if (isRegistered) {
      console.log("Background sync task already registered");
      return true;
    }

    await BackgroundTask.registerTaskAsync(CALL_LOG_SYNC_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
    });

    console.log("Background sync task registered successfully");
    return true;
  } catch (error) {
    console.error("Failed to register background task:", error);
    return false;
  }
}

/**
 * Unregister the background sync task.
 */
export async function unregisterBackgroundSync(): Promise<void> {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      CALL_LOG_SYNC_TASK
    );
    if (isRegistered) {
      await TaskManager.unregisterTaskAsync(CALL_LOG_SYNC_TASK);
      console.log("Background sync task unregistered");
    }
  } catch (error) {
    console.error("Failed to unregister background task:", error);
  }
}
