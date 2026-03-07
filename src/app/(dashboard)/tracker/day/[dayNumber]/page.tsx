import React from 'react'
import { getDayDetail } from '@/lib/actions/day'
import DayDetailClient from './DayDetailClient'
import { notFound } from 'next/navigation'
import { getQnAsForDay } from '@/lib/actions/qna'
import type { QnAEntry } from '@/lib/actions/qna'
import { getDocsEngagementForDay, getDocsSectionHeatmapForDay } from '@/lib/actions/docs'

interface PageProps {
    params: { dayNumber: string };
}

export default async function DayDetailPage({ params }: PageProps) {
    const { dayNumber } = params;

    const [data, allQnAs] = await Promise.all([
        getDayDetail(dayNumber),
        // Temporarily get day data first, then get QnAs
        // We'll fetch qnas after we have the dayId
        Promise.resolve([] as QnAEntry[])
    ])

    if (!data) {
        notFound();
    }

    // Fetch all QnAs for this day
    const dayQnAs = await getQnAsForDay(data.day.id)

    const docsEngagement = await getDocsEngagementForDay(data.day.id)
    const docsHeatmap = await getDocsSectionHeatmapForDay(data.day.id, `day_${String(dayNumber)}_plan`)

    // Group by topicId — null/undefined topicId goes under '' key for day-level
    const qnasByTopic: Record<string, QnAEntry[]> = {}
    for (const qna of dayQnAs) {
        const key = qna.topicId || ''
        if (!qnasByTopic[key]) qnasByTopic[key] = []
        qnasByTopic[key].push(qna)
    }

    return <DayDetailClient initialData={data} dayNumber={dayNumber} initialQnAs={qnasByTopic} initialDocsEngagement={docsEngagement} initialDocsHeatmap={docsHeatmap} />;
}
