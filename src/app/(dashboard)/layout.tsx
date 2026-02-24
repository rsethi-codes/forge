import Shell from '@/components/Shell'
import Celebration from '@/components/milestones/Celebration'

import { isAdmin } from '@/lib/auth-utils'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // If admin is browsing regular dashboard, push them to admin land
    if (await isAdmin()) {
        redirect('/admin')
    }

    return (
        <Shell>
            {children}
            <Celebration />
        </Shell>
    )
}
