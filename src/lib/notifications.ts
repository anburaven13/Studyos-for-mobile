import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { parse, set, isAfter, subMinutes } from 'date-fns';

export interface RoutineBlock {
  id: string;
  title: string;
  start: string;
  end: string;
  completed?: boolean;
}

export async function requestNotificationPermissions() {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch (e) {
    console.error("Failed to request notification permissions", e);
    return false;
  }
}

function stringToNumericId(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; 
  }
  return Math.abs(hash) % 1000000000; // Ensure it stays well within signed 32-bit max
}

export async function syncRoutineNotifications(blocks: RoutineBlock[]) {
  if (!Capacitor.isNativePlatform()) return;
  
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  // Create high-importance channel for Android 8.0+ to ensure heads-up banners appear
  try {
    await LocalNotifications.createChannel({
      id: 'studyos-reminders',
      name: 'Study Routines',
      description: 'Reminders for your scheduled study blocks',
      importance: 5, // High importance (pop-up banner)
      visibility: 1
    });
  } catch (e) {
    console.error("Failed to create notification channel", e);
  }

  // Clear all previously scheduled notifications
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
  } catch (e) {
    console.error("Failed to cancel pending notifications", e);
  }

  const notificationsToSchedule: any[] = [];
  const now = new Date();

  blocks.forEach((block) => {
    // Parse start time today
    const startParsed = parse(block.start, 'HH:mm', new Date());
    let startDate = set(new Date(), { hours: startParsed.getHours(), minutes: startParsed.getMinutes(), seconds: 0, milliseconds: 0 });
    
    // Parse end time today
    const endParsed = parse(block.end, 'HH:mm', new Date());
    let endDate = set(new Date(), { hours: endParsed.getHours(), minutes: endParsed.getMinutes(), seconds: 0, milliseconds: 0 });

    // Handle overnight blocks
    if (isAfter(startDate, endDate)) {
       endDate = set(endDate, { date: endDate.getDate() + 1 });
    }
    
    const baseId = stringToNumericId(block.id);

    // Notification 1: 10 mins before start
    const tenMinsBefore = subMinutes(startDate, 10);
    if (isAfter(tenMinsBefore, now)) {
      notificationsToSchedule.push({
        id: baseId + 1, // Start reminder ID
        title: 'StudyOS Reminder',
        body: `Get ready! Your study block "${block.title}" is starting soon (${block.start} - ${block.end}).`,
        schedule: { at: tenMinsBefore },
        channelId: 'studyos-reminders'
      });
    }

    // Notification 2: At the end of the block (only if not completed)
    if (!block.completed && isAfter(endDate, now)) {
      notificationsToSchedule.push({
        id: baseId + 2, // End reminder ID
        title: 'StudyOS Reminder',
        body: `Your scheduled study block "${block.title}" (${block.start} - ${block.end}) just finished, but you haven't checked it off.`,
        schedule: { at: endDate },
        channelId: 'studyos-reminders'
      });
    }
  });

  if (notificationsToSchedule.length > 0) {
    try {
      await LocalNotifications.schedule({ notifications: notificationsToSchedule });
    } catch (e) {
      console.error("Failed to schedule notifications", e);
    }
  }
}
