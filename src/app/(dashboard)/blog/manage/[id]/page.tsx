import React from 'react'
import { getBlogPostById } from '@/lib/actions/blog'
import EditorContainer from '../EditorContainer'
import { notFound } from 'next/navigation'

export default async function EditPostPage({ params }: { params: { id: string } }) {
    const post = await getBlogPostById(params.id)

    if (!post) {
        notFound()
    }

    return <EditorContainer initialData={post} />
}
