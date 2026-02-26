import React from 'react'
import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, ne, and } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getBlogPost, getPublicBlogPosts } from '@/lib/actions/blog'
import BlogPostClient from './BlogPostClient'

// ISR: Regenerate individual blog posts every 60 seconds
export const revalidate = 60

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
    const [post] = await db
        .select()
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.slug, params.slug))
        .limit(1)

    if (!post) return { title: 'Post Not Found' }

    const excerpt = post.excerpt || `Read ${post.title} on the FORGE Dev Blog.`
    return {
        title: `${post.title} | FORGE War Logs`,
        description: excerpt,
        openGraph: {
            title: post.title,
            description: excerpt,
            images: post.coverImageUrl ? [post.coverImageUrl] : [],
            type: 'article',
            publishedTime: post.publishedAt?.toISOString(),
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: excerpt,
            images: post.coverImageUrl ? [post.coverImageUrl] : [],
        }
    }
}

export default async function BlogPostDetail({
    params,
}: {
    params: { slug: string }
}) {
    const post = await getBlogPost(params.slug)

    if (!post) {
        notFound()
    }

    // Fetch up to 3 related posts (same tech tags first, else anything public)
    const allPublic = await getPublicBlogPosts()
    const postTechs = (post.technologies as string[]) || []

    const relatedPosts = allPublic
        .filter((p: any) => p.slug !== params.slug)
        .sort((a: any, b: any) => {
            // Prioritise posts sharing at least one tech tag
            const aScore = (a.technologies as string[] || []).filter((t: string) => postTechs.includes(t)).length
            const bScore = (b.technologies as string[] || []).filter((t: string) => postTechs.includes(t)).length
            return bScore - aScore
        })
        .slice(0, 3)

    return <BlogPostClient post={post} relatedPosts={relatedPosts} />
}
