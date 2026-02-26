
import { getPublicProfile } from '@/lib/actions/profile'
import { notFound } from 'next/navigation'
import PublicProfileClient from './PublicProfileClient'
import { Metadata } from 'next'

interface PageProps {
    params: {
        handle: string
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const data = await getPublicProfile(params.handle)
    if (!data) return { title: 'Profile Not Found' }

    return {
        title: `${data.profile.fullName} | The Forge Archive`,
        description: data.profile.headline || `Check out ${data.profile.fullName}'s engineering profile and technical grind on The Forge.`,
        openGraph: {
            title: `${data.profile.fullName} | Forge Verified Profile`,
            description: data.profile.bio || 'Architecting high-performance systems.',
            images: data.profile.avatarUrl ? [data.profile.avatarUrl] : [],
        }
    }
}

export default async function PublicProfilePage({ params }: PageProps) {
    const data = await getPublicProfile(params.handle)

    if (!data) {
        notFound()
    }

    return <PublicProfileClient data={data} />
}
