import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const targetUrl = searchParams.get('url')
    
    if (!targetUrl) {
        return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }
    
    try {
        console.log('Proxying request to:', targetUrl)
        
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
        })
        
        if (!response.ok) {
            console.log('Proxy response status:', response.status)
            return NextResponse.json({ 
                error: `Failed to fetch URL: ${response.status} ${response.statusText}` 
            }, { status: response.status })
        }
        
        const html = await response.text()
        console.log('Proxy response length:', html.length)
        
        return new NextResponse(html, {
            status: 200,
            headers: {
                'Content-Type': 'text/html',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        })
    } catch (error) {
        console.error('Proxy error:', error)
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
