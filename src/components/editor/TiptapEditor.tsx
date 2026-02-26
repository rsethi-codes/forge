'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Code,
    Terminal,
    Image as ImageIcon,
    Link as LinkIcon,
    Heading1,
    Heading2,
    Undo,
    Redo,
    Type,
    Maximize2
} from 'lucide-react'
import { cn } from '@/lib/utils'

const lowlight = createLowlight(common)

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
                codeBlock: false,
            }),
            CodeBlockLowlight.configure({
                lowlight,
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
                class: 'prose prose-invert max-w-none focus:outline-none min-h-[600px] p-10 font-lora text-lg leading-relaxed',
            },
        },
    })

    // Track last externally-set content to avoid fighting the user's own keystrokes
    const lastExternalContent = React.useRef<string | null>(null)
    React.useEffect(() => {
        if (!editor || !content) return

        const nextJson = JSON.stringify(content)
        // Only sync if this is new external content (e.g. from AI apply), not our own editor state
        if (lastExternalContent.current === nextJson) return
        lastExternalContent.current = nextJson

        const currentJson = JSON.stringify(editor.getJSON())
        if (currentJson !== nextJson) {
            editor.commands.setContent(content)
        }
    }, [content, editor])

    if (!editor) return null

    const wordCount = editor.getText().split(/\s+/).filter(Boolean).length

    return (
        <div className="border border-border-subtle rounded-3xl overflow-hidden bg-surface">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-3 border-b border-border-subtle bg-surface-elevated sticky top-0 z-20 backdrop-blur-md bg-opacity-90">
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    tooltip="Bold"
                >
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    tooltip="Italic"
                >
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-[1px] h-6 bg-border-subtle mx-2" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                    tooltip="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    tooltip="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-[1px] h-6 bg-border-subtle mx-2" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    tooltip="Bullet List"
                >
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    tooltip="Ordered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-[1px] h-6 bg-border-subtle mx-2" />
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    tooltip="Quote"
                >
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    active={editor.isActive('code')}
                    tooltip="Inline Code"
                >
                    <Code className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    active={editor.isActive('codeBlock')}
                    tooltip="Code Block"
                >
                    <Terminal className="w-4 h-4" />
                </ToolbarButton>
                <div className="w-[1px] h-6 bg-border-subtle mx-2" />
                <ToolbarButton onClick={() => {
                    const url = window.prompt('URL')
                    if (url) editor.chain().focus().setLink({ href: url }).run()
                }} tooltip="Insert Link">
                    <LinkIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => {
                    const url = window.prompt('Image URL')
                    if (url) editor.chain().focus().setImage({ src: url }).run()
                }} tooltip="Insert Image">
                    <ImageIcon className="w-4 h-4" />
                </ToolbarButton>
                <div className="flex-1" />
                <div className="flex items-center gap-4 px-4 border-l border-border-subtle h-6 ml-2">
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">
                        {wordCount} Words
                    </span>
                    <div className="flex items-center gap-1">
                        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} tooltip="Undo">
                            <Undo className="w-4 h-4" />
                        </ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} tooltip="Redo">
                            <Redo className="w-4 h-4" />
                        </ToolbarButton>
                    </div>
                </div>
            </div>

            <EditorContent editor={editor} />
        </div>
    )
}

function ToolbarButton({ onClick, active, children, tooltip }: { onClick: () => void, active?: boolean, children: React.ReactNode, tooltip?: string }) {
    return (
        <button
            onClick={onClick}
            title={tooltip}
            className={cn(
                "p-2 rounded-lg transition-colors hover:bg-surface border border-transparent",
                active ? "bg-primary/20 text-primary border-primary/30" : "text-text-secondary hover:text-text-primary"
            )}
        >
            {children}
        </button>
    )
}
