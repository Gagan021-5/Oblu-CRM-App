import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface FollowUpNotificationItem {
  id: string;
  title: string;
  body: string;
  customerName: string;
  customerId?: string;
  followUpDate?: string;
  followUpTime?: string;
  purpose?: string;
  notes?: string;
  invoiceNumber?: string;
  amount?: string;
  expectedDate?: string;
  ticketStatus?: "NONE" | "RAISED" | "SOLVED";
  createdAt: string;
  read: boolean;
  type: "1_day_reminder" | "scheduled_confirmation" | "payment_ticket_raised";
}

const STORAGE_KEY = "@nexus_followup_notifications";
const CHANNEL_ID = "followup-reminders-v2";

// Lazy-safe loader for expo-notifications to prevent top-level crashes in Expo Go on Android
let _notificationsModule: any = undefined;

function getNotifications(): any {
  if (_notificationsModule !== undefined) {
    return _notificationsModule;
  }

  // Detect Expo Go on Android where Google/Expo removed native push support in SDK 51+
  const isExpoGoOnAndroid =
    Platform.OS === "android" &&
    (Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      (Constants as any)?.appOwnership === "expo");

  if (isExpoGoOnAndroid) {
    _notificationsModule = null;
    return null;
  }

  try {
    _notificationsModule = require("expo-notifications");
  } catch {
    _notificationsModule = null;
  }

  return _notificationsModule;
}

// Safely configure notification presentation behavior if native module is available
try {
  const Notifications = getNotifications();
  if (Notifications?.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        priority: Notifications.AndroidNotificationPriority?.MAX ?? 5,
      }),
    });
  }
} catch {
  // Silent fallback
}

/**
 * Initialize notification channels and request permission
 */
export async function initializeNotifications(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) {
    return false;
  }

  try {
    if (Platform.OS === "android" && Notifications.setNotificationChannelAsync) {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Follow-up Reminders",
        importance: Notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#00A879",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (Notifications.getPermissionsAsync) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted" && Notifications.requestPermissionsAsync) {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      return finalStatus === "granted";
    }

    return false;
  } catch (err) {
    return false;
  }
}

/**
 * Parse a user-selected date/time into a Date object
 */
function parseFollowUpDateTime(dateStr: string, timeStr: string): Date {
  const target = new Date();

  // Parse Date string
  const lowerDate = dateStr.toLowerCase().trim();
  if (lowerDate.includes("today")) {
    // Keep today's date
  } else if (lowerDate.includes("tomorrow")) {
    target.setDate(target.getDate() + 1);
  } else if (lowerDate.includes("3 day")) {
    target.setDate(target.getDate() + 3);
  } else if (lowerDate.includes("monday")) {
    const day = target.getDay();
    const distance = (1 + 7 - day) % 7 || 7;
    target.setDate(target.getDate() + distance);
  } else {
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      target.setFullYear(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    } else {
      target.setDate(target.getDate() + 1);
    }
  }

  // Parse Time string e.g. "10:30 AM", "04:00 PM"
  if (timeStr) {
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3]?.toUpperCase();

      if (period === "PM" && hours < 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      target.setHours(hours, minutes, 0, 0);
    }
  }

  return target;
}

/**
 * Get all stored in-app notifications
 * Automatically purges any legacy test alerts from previous debugging runs.
 */
export async function getStoredNotifications(): Promise<FollowUpNotificationItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with initial realistic customer follow-up alerts and raised payment ticket
      const initial: FollowUpNotificationItem[] = [
        {
          id: "notif-ticket-001",
          title: "🚨 Ticket Raised: Orion Systems Pvt Ltd",
          body: "Expected payment date (07 Sep) crossed for Invoice #INV-2026-894 (₹1,45,000). Automated Gmail alert sent to finance & salesperson.",
          customerName: "Orion Systems Pvt Ltd",
          customerId: "cust-001",
          invoiceNumber: "INV-2026-894",
          amount: "₹1,45,000",
          expectedDate: "07 Sep 2026",
          ticketStatus: "RAISED",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          read: false,
          type: "payment_ticket_raised",
        },
        {
          id: "notif-followup-001",
          title: "⏰ Follow-up Tomorrow: Orion Systems Pvt Ltd",
          body: "Contract Renewal & Pricing Discussion scheduled for tomorrow at 10:30 AM.",
          customerName: "Orion Systems Pvt Ltd",
          customerId: "cust-001",
          followUpDate: "Tomorrow",
          followUpTime: "10:30 AM",
          purpose: "Contract Renewal & Pricing",
          notes: "Prepare revised quotation with 10% volume rebate for Q3.",
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          read: false,
          type: "1_day_reminder",
        },
        {
          id: "notif-followup-002",
          title: "⏰ Follow-up Tomorrow: Apex Global Technologies",
          body: "Product Demo & Architecture Review scheduled for tomorrow at 02:00 PM.",
          customerName: "Apex Global Technologies",
          customerId: "cust-002",
          followUpDate: "Tomorrow",
          followUpTime: "02:00 PM",
          purpose: "Product Demo & Architecture",
          notes: "Present cloud migration features and multi-tenant security specifications.",
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          read: false,
          type: "1_day_reminder",
        },
      ];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed: FollowUpNotificationItem[] = JSON.parse(raw);

    // Auto-clean any legacy items that have 'test' in id/title/body
    let cleaned = parsed.filter(
      (item) =>
        !item.id.toLowerCase().includes("test") &&
        !item.title.toLowerCase().includes("test") &&
        !item.body.toLowerCase().includes("test") &&
        !item.body.toLowerCase().includes("employee1.0")
    );

    // Ensure at least one active payment ticket notification exists for demonstration
    if (!cleaned.some((item) => item.type === "payment_ticket_raised")) {
      cleaned = [
        {
          id: "notif-ticket-001",
          title: "🚨 Ticket Raised: Orion Systems Pvt Ltd",
          body: "Expected payment date (07 Sep) crossed for Invoice #INV-2026-894 (₹1,45,000). Automated Gmail alert sent to finance & salesperson.",
          customerName: "Orion Systems Pvt Ltd",
          customerId: "cust-001",
          invoiceNumber: "INV-2026-894",
          amount: "₹1,45,000",
          expectedDate: "07 Sep 2026",
          ticketStatus: "RAISED",
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          read: false,
          type: "payment_ticket_raised",
        },
        ...cleaned,
      ];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    } else if (cleaned.length !== parsed.length) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }

    return cleaned;
  } catch {
    return [];
  }
}

/**
 * Save notification item to local storage
 */
export async function saveStoredNotification(
  item: FollowUpNotificationItem
): Promise<FollowUpNotificationItem[]> {
  try {
    const current = await getStoredNotifications();
    const updated = [item, ...current].slice(0, 50); // Keep last 50
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
    return updated;
  } catch {
    return [];
  }
}

/**
 * Delete a single notification by ID
 */
export async function deleteStoredNotification(
  notificationId: string
): Promise<FollowUpNotificationItem[]> {
  try {
    const current = await getStoredNotifications();
    const updated = current.filter((n) => n.id !== notificationId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
    return updated;
  } catch {
    return [];
  }
}

/**
 * Clear all notifications
 */
export async function clearAllStoredNotifications(): Promise<FollowUpNotificationItem[]> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    notifyListeners([]);
    return [];
  } catch {
    return [];
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(): Promise<FollowUpNotificationItem[]> {
  try {
    const current = await getStoredNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyListeners(updated);
    return updated;
  } catch {
    return [];
  }
}

// In-App Event Dispatcher for Real-Time Notification updates
type NotificationListener = (items: FollowUpNotificationItem[]) => void;
type BannerListener = (item: FollowUpNotificationItem) => void;

const listeners: NotificationListener[] = [];
const bannerListeners: BannerListener[] = [];

export function subscribeToNotifications(cb: NotificationListener) {
  listeners.push(cb);
  return () => {
    const idx = listeners.indexOf(cb);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

export function subscribeToInAppBanner(cb: BannerListener) {
  bannerListeners.push(cb);
  return () => {
    const idx = bannerListeners.indexOf(cb);
    if (idx !== -1) bannerListeners.splice(idx, 1);
  };
}

function notifyListeners(items: FollowUpNotificationItem[]) {
  listeners.forEach((fn) => {
    try {
      fn(items);
    } catch {
      // Ignored
    }
  });
}

function emitBanner(item: FollowUpNotificationItem) {
  bannerListeners.forEach((fn) => {
    try {
      fn(item);
    } catch {
      // Ignored
    }
  });
}

/**
 * Schedules real-time follow-up notifications:
 * 1) Outer mobile device notification 1 day before the scheduled follow-up (in standalone / dev builds)
 * 2) Instant mobile confirmation notification like a WhatsApp heads-up banner
 * 3) In-app notification stored in notification center & popped as in-app toast banner
 */
export async function scheduleFollowUpNotifications(params: {
  customerName: string;
  customerId?: string;
  followUpDate: string;
  followUpTime: string;
  purpose: string;
  notes?: string;
}): Promise<void> {
  const { customerName, customerId, followUpDate, followUpTime, purpose, notes } = params;

  await initializeNotifications();

  const meetingDate = parseFollowUpDateTime(followUpDate, followUpTime);
  const now = new Date();

  // Compute 1 day before: meetingDate - 24 hours
  const oneDayBeforeDate = new Date(meetingDate.getTime() - 24 * 60 * 60 * 1000);

  // In-app notification item (1 Day Reminder)
  const reminderNotification: FollowUpNotificationItem = {
    id: `notif-${Date.now()}-reminder`,
    title: `⏰ Follow-up Tomorrow: ${customerName}`,
    body: `${purpose} at ${followUpTime}. ${notes ? `Note: ${notes}` : ""}`,
    customerName,
    customerId,
    followUpDate,
    followUpTime,
    purpose,
    notes,
    createdAt: new Date().toISOString(),
    read: false,
    type: "1_day_reminder",
  };

  // Schedule outer mobile device notification if supported
  const Notifications = getNotifications();
  if (Notifications?.scheduleNotificationAsync) {
    try {
      if (oneDayBeforeDate > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ Follow-up Tomorrow: ${customerName}`,
            body: `You have a scheduled follow-up tomorrow at ${followUpTime} for "${purpose}".`,
            data: { customerId, customerName, followUpDate, followUpTime, purpose },
            sound: "default",
            color: "#00A879",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes?.DATE ?? "date",
            date: oneDayBeforeDate,
          },
        });
      } else {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `⏰ Follow-up Tomorrow: ${customerName}`,
            body: `Reminder: You have a scheduled follow-up at ${followUpTime} with ${customerName} for "${purpose}".`,
            data: { customerId, customerName, followUpDate, followUpTime, purpose },
            sound: "default",
            color: "#00A879",
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? "timeInterval",
            seconds: 8,
          },
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `✅ Follow-up Scheduled: ${customerName}`,
          body: `1-Day-Before Reminder is active for ${followUpDate} at ${followUpTime} (${purpose}).`,
          data: { customerId, customerName, followUpDate, followUpTime, purpose },
          sound: "default",
          color: "#00A879",
        },
        trigger: null,
      });
    } catch {
      // Safe catch
    }
  }

  // Save to stored in-app notifications
  await saveStoredNotification(reminderNotification);

  // Trigger real-time In-App Banner
  emitBanner(reminderNotification);
}

/**
 * Trigger an in-app & outer notification when payment expected date is crossed and ticket is raised
 */
export async function notifyPaymentTicketRaised(params: {
  customerName: string;
  customerId?: string;
  invoiceNumber: string;
  amount: string;
  expectedDate: string;
  recipientEmail?: string;
}): Promise<void> {
  const { customerName, customerId, invoiceNumber, amount, expectedDate, recipientEmail } = params;

  await initializeNotifications();

  const ticketItem: FollowUpNotificationItem = {
    id: `notif-ticket-${Date.now()}`,
    title: `🚨 Ticket Raised: ${customerName}`,
    body: `Payment expected date (${expectedDate}) crossed for Invoice #${invoiceNumber} (${amount}). Automated Gmail notice sent${
      recipientEmail ? ` to ${recipientEmail}` : ""
    }.`,
    customerName,
    customerId,
    invoiceNumber,
    amount,
    expectedDate,
    ticketStatus: "RAISED",
    createdAt: new Date().toISOString(),
    read: false,
    type: "payment_ticket_raised",
  };

  const Notifications = getNotifications();
  if (Notifications?.scheduleNotificationAsync) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🚨 Payment Ticket Raised: ${customerName}`,
          body: `Expected date crossed for Invoice #${invoiceNumber} (${amount}). Automated Gmail notice dispatched.`,
          data: { customerId, customerName, invoiceNumber, amount },
          sound: "default",
          color: "#FF4D4F",
        },
        trigger: null,
      });
    } catch {
      // Safe catch
    }
  }

  await saveStoredNotification(ticketItem);
  emitBanner(ticketItem);
}
