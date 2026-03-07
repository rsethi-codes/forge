import { NextResponse } from 'next/server'
import { getDocsEngagementForDay, getDocsSectionHeatmapForDay } from '@/lib/actions/docs'

export async function GET(
    request: Request,
    { params }: { params: { dayId: string } }
) {
    try {
        const { dayId } = params
        if (!dayId) {
            return NextResponse.json({ error: 'dayId is required' }, { status: 400 })
        }

        const [engagement, heatmap] = await Promise.all([
            getDocsEngagementForDay(dayId),
            getDocsSectionHeatmapForDay(dayId),
        ])

        return NextResponse.json({ engagement, heatmap }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            }
        })
    } catch (error) {
        console.error('Docs engagement API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
