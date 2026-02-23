import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
    const cookieStore = cookies()
    cookieStore.delete('forge_admin_token')

    return NextResponse.json({ success: true })
}
