import Shell from '@/components/Shell'
import Celebration from '@/components/milestones/Celebration'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <Shell>
            {children}
            <Celebration />
        </Shell>
    )
}
