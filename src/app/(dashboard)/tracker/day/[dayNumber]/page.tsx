import React from 'react'
import { getDayDetail } from '@/lib/actions/day'
import DayDetailClient from './DayDetailClient'
import { notFound } from 'next/navigation'

interface PageProps {
    params: { dayNumber: string };
}

export default async function DayDetailPage({ params }: PageProps) {
    const { dayNumber } = params;

    const data = await getDayDetail(dayNumber);

    if (!data) {
        notFound();
    }

    return <DayDetailClient initialData={data} dayNumber={dayNumber} />;
}
