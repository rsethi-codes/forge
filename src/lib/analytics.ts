import { db } from './db'
import * as schema from './supabase/schema'

export async function logAnalyticsEvent(event: string, data: any = {}, userId?: string) {
    try {
        await db.insert(schema.analyticsEvents).values({
            event,
            data,
            userId: userId || null,
        })
    } catch (error) {
        console.error('Failed to log analytics event:', error)
    }
}

// Common event helpers
export const analytics = {
    trackTaskCompleted: (taskId: string, dayId: string) =>
        logAnalyticsEvent('task_completed', { taskId, dayId }),

    trackTopicCompleted: (topicId: string, dayId: string) =>
        logAnalyticsEvent('topic_completed', { topicId, dayId }),

    trackDayStarted: (dayNumber: number | string, dayId: string) =>
        logAnalyticsEvent('day_started', { dayNumber, dayId }),

    trackKCAttempted: (kcId: string, passed: boolean) =>
        logAnalyticsEvent('kc_attempted', { kcId, passed }),

    trackDailyDisciplineCalculated: (score: number, date: string) =>
        logAnalyticsEvent('discipline_calculated', { score, date })
}
