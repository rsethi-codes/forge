'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Code,
    Image as ImageIcon,
    Link as LinkIcon,
    Heading1,
    Heading2,
    Undo,
    Redo
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorProps {
    content: any
    onChange: (json: any, html: string) => void
    placeholder?: string
}

export default function Editor({ content, onChange, placeholder = 'Start writing your breakthrough...' }: EditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                codeBlock: false, // will handle with highlight.js later if needed
            }),
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content,
        onUpdate: ({ editor }) => {
            onChange(editor.getJSON(), editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] p-8',
            },
        },
    })

    if (!editor) return null

    return (
        <div className="border border-border-subtle rounded-3xl overflow-hidden bg-surface">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border-subtle bg-surface-elevated sticky top-0 z-20">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-[1px] h-6 bg-border-subtle mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-[1px] h-6 bg-border-subtle mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-[1px] h-6 bg-border-subtle mx-1" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    active={editor.isActive('code')}
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-[1px] h-6 bg-border-subtle mx-1" />
                <ToolbarButton onClick={() => {
                    const url = window.prompt('URL')
                    if (url) editor.chain().focus().setLink({ href: url }).run()
                }}>
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => {
                    const url = window.prompt('Image URL')
                    if (url) editor.chain().focus().setImage({ src: url }).run()
                }}>
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>
                <div className="flex-1" />
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            <EditorContent editor={editor} />
        </div>
    )
}

function ToolbarButton({ onClick, active, children }: { onClick: () => void, active?: boolean, children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "p-2 rounded-lg transition-colors hover:bg-surface border border-transparent",
                active ? "bg-primary/20 text-primary border-primary/30" : "text-text-secondary hover:text-text-primary"
            )}
        >
            {children}
        </button>
    )
}
