'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/supabase/schema'
import { eq, sql, desc } from 'drizzle-orm'

export async function getBlogPost(slug: string) {
    const [post] = await db
        .select()
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.slug, slug))
        .limit(1)

    if (post) {
        // Increment view count (async, don't wait for it)
        db.update(schema.blogPosts)
            .set({ viewCount: post.viewCount + 1 })
            .where(eq(schema.blogPosts.id, post.id))
            .execute()
    }

    return post
}

export async function getPublicBlogPosts() {
    return await db
        .select()
        .from(schema.blogPosts)
        .where(eq(schema.blogPosts.visibility, 'public'))
        .orderBy(sql`${schema.blogPosts.publishedAt} desc`)
}

export async function upsertBlogPost(data: {
    id?: string
    title: string
    slug: string
    content: any
    contentHtml: string
    excerpt?: string
    coverImageUrl?: string
    visibility: 'public' | 'private'
    technologies?: string[]
    resources?: { title: string, url: string }[]
}) {
    const postData = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        contentHtml: data.contentHtml,
        excerpt: data.excerpt,
        coverImageUrl: data.coverImageUrl,
        visibility: data.visibility,
        technologies: data.technologies || [],
        resources: data.resources || [],
        updatedAt: new Date(),
        ...(data.visibility === 'public' && { publishedAt: new Date() })
    }

    if (data.id) {
        return await db
            .update(schema.blogPosts)
            .set(postData)
            .where(eq(schema.blogPosts.id, data.id))
            .returning()
    } else {
        return (await db
            .insert(schema.blogPosts)
            .values({
                ...postData,
                createdAt: new Date(),
                viewCount: 0
            })
            .returning())[0]
    }
}

export async function getBlogPostsForManagement() {
    return await db
        .select()
        .from(schema.blogPosts)
        .orderBy(desc(schema.blogPosts.createdAt))
}

export async function deleteBlogPost(id: string) {
    return await db
        .delete(schema.blogPosts)
        .where(eq(schema.blogPosts.id, id))
}
