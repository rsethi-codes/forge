import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'
import pdf from 'pdf-parse'
import { parseRoadmapText, saveParsedRoadmapToDb } from '@/lib/parsing/roadmap-parser'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ message: 'No file uploaded' }, { status: 400 })
        }

        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        let rawText = ''

        // 1. Extract Text
        let jsonMetadata: any = null
        if (file.name.endsWith('.docx')) {
            const result = await mammoth.extractRawText({ buffer })
            rawText = result.value
        } else if (file.name.endsWith('.pdf')) {
            const data = await pdf(buffer)
            rawText = data.text
        } else if (file.name.endsWith('.json')) {
            rawText = buffer.toString('utf8')
            jsonMetadata = JSON.parse(rawText)
        } else {
            return NextResponse.json({ message: 'Unsupported file type. Use DOCX, PDF, or JSON.' }, { status: 400 })
        }

        // 2. Upload to Supabase Storage
        const { createAdminClient } = await import('@/lib/supabase/server')
        const supabaseAdmin = createAdminClient()
        const filename = `${Date.now()}-${file.name}`
        const { error: uploadError } = await supabaseAdmin.storage
            .from('roadmap-files')
            .upload(filename, buffer)

        if (uploadError) {
            console.error('Storage Upload Error:', uploadError)
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from('roadmap-files')
            .getPublicUrl(filename)

        // 3. Parse hierarchy
        const { parseRoadmapText, parseRoadmapJson, saveParsedRoadmapToDb } = await import('@/lib/parsing/roadmap-parser')

        const roadmap = jsonMetadata
            ? parseRoadmapJson(jsonMetadata)
            : parseRoadmapText(rawText)

        // 4. Save to DB
        const { getCurrentUser } = await import('@/lib/auth-utils')
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
        }

        const program = await saveParsedRoadmapToDb(user.id, roadmap, rawText, publicUrl, jsonMetadata)

        return NextResponse.json({
            message: 'Roadmap parsed and saved successfully',
            programId: program?.id
        })

    } catch (error: any) {
        console.error('Parsing Error:', error)
        return NextResponse.json({
            message: 'Failed to parse roadmap',
            error: error.message
        }, { status: 500 })
    }
}
