import { NextResponse } from 'next/server'
import { getDayDetail } from '@/lib/actions/day'

export async function GET(
    request: Request,
    { params }: { params: { dayNumber: string } }
) {
    try {
        const dayNumber = parseInt(params.dayNumber)
        if (isNaN(dayNumber) || dayNumber < 1) {
            return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
        }

        const data = await getDayDetail(dayNumber)
        if (!data) {
            return NextResponse.json({ error: 'Day not found' }, { status: 404 })
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Day data API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
