'use client'

import React, { useEffect, useRef } from 'react'
import { notFound } from 'next/navigation'
import { getDayDetail } from '@/lib/actions/day'
import DocsReaderClient from './reader'

interface PageProps {
    params: { dayNumber: string }
}


function ensureViewportMeta(html: string) {
    // Ensure a safe viewport meta tag exists in <head> for responsive layout inside iframe
    if (/<meta\s+name=["']viewport["']/i.test(html)) return html
    const headClose = /<\/head>/i
    if (headClose.test(html)) {
        return html.replace(headClose, '<meta name="viewport" content="width=device-width, initial-scale=1"></head>')
    }
    // If no <head>, inject after <html> or at top
    const htmlOpen = /<html[^>]*>/i
    if (htmlOpen.test(html)) {
        return html.replace(htmlOpen, '$&<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>')
    }
    return '<head><meta name="viewport" content="width=device-width, initial-scale=1"></head>' + html
}

function rewriteRelativeUrls(html: string, baseUrl: string) {
    const base = baseUrl.replace(/\/$/, '')

    // Keep <base href> if present and safe (same-origin or relative), to preserve relative CSS/JS resolution
    // Only remove if it points to a different origin (security)
    let out = html.replace(/<base\b[^>]*>/gi, (match) => {
        const hrefMatch = match.match(/href\s*=\s*["']([^"']+)["']/i)
        if (hrefMatch) {
            const href = hrefMatch[1]
            if (/^(https?:)?\/\//i.test(href) && !href.startsWith(baseUrl)) {
                // Remove cross-origin base
                return ''
            }
        }
        // Keep safe base tag
        return match
    })

    // Rewrite href/src that are relative (do not start with scheme, //, #, mailto, tel, data)
    out = out.replace(/\b(href|src)\s*=\s*(["'])([^"']+)\2/gi, (m, attr, q, val) => {
        const v = String(val)
        if (!v) return m
        if (v.startsWith('#')) return m
        if (/^(https?:)?\/\//i.test(v)) return m
        if (/^(mailto:|tel:|data:)/i.test(v)) return m
        if (v.startsWith('/')) return `${attr}=${q}${base}${v}${q}`
        // Relative: join with baseUrl, preserving path
        const joined = new URL(v, `${base}/`).toString()
        return `${attr}=${q}${joined}${q}`
    })
    return out
}

function readDocMetaFromHtml(html: string): any {
    const m = html.match(/<!--\s*DOC_META:\s*({[\s\S]*?})\s*-->/i)
    if (!m) return null
    try {
        const parsed = JSON.parse(m[1])
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
        return parsed
    } catch {
        return null
    }
}

/**
 * Injects a minimal scroll-handler script into the HTML that will run inside the
 * iframe's own execution context. This is the only reliable way to handle TOC
 * hash-link clicks in a srcDoc iframe — cross-frame event interception via the
 * parent loses to the browser's default srcDoc reload behaviour.
 *
 * The injected script:
 *  1. Intercepts all <a href="#..."> clicks at the capture phase.
 *  2. Calls e.preventDefault() so the browser won't reload the srcDoc.
 *  3. Smoothly scrolls to the target element by ID or name.
 */
function injectDocScrollScript(html: string): string {
    const script = `<script>
(function() {
  document.addEventListener('click', function(e) {
    var el = e.target;
    while (el && el.tagName !== 'A') el = el.parentElement;
    if (!el || el.tagName !== 'A') return;
    var href = el.getAttribute('href') || '';
    // Only intercept pure hash links or same-page hash links
    if (!href) return;
    var isHashOnly = href.charAt(0) === '#';
    var hashIdx = href.indexOf('#');
    var isSamePage = hashIdx > 0 && href.substring(0, hashIdx) === location.pathname.split('/').pop();
    if (!isHashOnly && !isSamePage) return;
    e.preventDefault();
    var id = href.substring(hashIdx + 1);
    var target = document.getElementById(id) || document.querySelector('[name="' + id + '"]');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, true);
})();
<\/script>`

    // Inject right before </body> if present, otherwise before </html>, otherwise append
    if (/<\/body>/i.test(html)) {
        return html.replace(/<\/body>/i, script + '</body>')
    }
    if (/<\/html>/i.test(html)) {
        return html.replace(/<\/html>/i, script + '</html>')
    }
    return html + script
}


export default function DocsPageWrapper({ params }: PageProps) {
    return (
        <DocsPageClientWrapper params={params} />
    )
}

function DocsPageClientWrapper({ params }: { params: { dayNumber: string } }) {
    // TEMP: Disable navigation blocking to test TOC scrolling
    // Less aggressive navigation blocking - only block specific TOC navigation attempts
    useEffect(() => {
        console.log('Navigation blocking temporarily disabled for TOC testing')
        // TODO: Re-enable if needed after TOC is fixed
        /*
        let isBlocking = false
        
        const originalPushState = window.history.pushState
        const originalReplaceState = window.history.replaceState
        
        // Only block very specific navigation patterns that indicate TOC escape
        window.history.pushState = function(state, title, url) {
            if (typeof url === 'string' && isBlocking && 
                url.includes('/tracker/day/') && 
                !url.includes('/docs')) {
                console.warn('Blocked TOC navigation:', url)
                isBlocking = false // Reset after blocking
                return
            }
            return originalPushState.call(window.history, state, title, url)
        }
        
        window.history.replaceState = function(state, title, url) {
            if (typeof url === 'string' && isBlocking && 
                url.includes('/tracker/day/') && 
                !url.includes('/docs')) {
                console.warn('Blocked TOC navigation:', url)
                isBlocking = false
                return
            }
            return originalReplaceState.call(window.history, state, title, url)
        }
        
        // Only block hashchange if it's clearly a TOC escape attempt
        const onHashChange = (e: HashChangeEvent) => {
            const newPath = window.location.pathname
            if (isBlocking && !newPath.includes('/docs') && newPath.includes('/tracker/day/')) {
                e.preventDefault()
                window.history.pushState(null, '', `/tracker/day/${params.dayNumber}/docs`)
                isBlocking = false
            }
        }
        
        // Allow all popstate events (browser back/forward)
        const onPopState = (e: PopStateEvent) => {
            isBlocking = false // Reset blocking on any navigation
        }
        
        window.addEventListener('hashchange', onHashChange)
        window.addEventListener('popstate', onPopState)
        
        return () => {
            window.history.pushState = originalPushState
            window.history.replaceState = originalReplaceState
            window.removeEventListener('hashchange', onHashChange)
            window.removeEventListener('popstate', onPopState)
        }
        */
    }, [params.dayNumber])

    return <DocsPageContent params={params} />
}

function DocsPageContent({ params }: PageProps) {
    const [data, setData] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [html, setHtml] = React.useState('')
    const iframeRef = useRef<HTMLIFrameElement>(null)

    React.useEffect(() => {
        let isMounted = true
        async function loadData() {
            try {
                console.log('Loading data for day:', params.dayNumber)
                const result = await getDayDetail(params.dayNumber)
                if (!isMounted) return // Prevent state updates if unmounted

                if (!result) {
                    console.log('No data found for day:', params.dayNumber)
                    notFound()
                    return
                }
                console.log('Day data loaded:', result)
                setData(result)

                // Fetch HTML content with simpler approach
                const docsBaseUrl: string = (result.metadata?.docsBaseUrl || 'https://rsethi-codes.github.io/skill-up-docs-26/full-stack-plan').replace(/\/$/, '')
                const docUrl = `${docsBaseUrl}/day-${params.dayNumber}-plan.html`
                console.log('Fetching docs from:', docUrl)

                try {
                    console.log('Fetching via server proxy:', docUrl)
                    const proxyResponse = await fetch(`/api/proxy-docs?url=${encodeURIComponent(docUrl)}`)
                    if (proxyResponse.ok) {
                        const htmlContent = await proxyResponse.text()
                        console.log('Proxy HTML length:', htmlContent.length)
                        setHtml(htmlContent)
                    } else {
                        console.log('Proxy failed:', proxyResponse.status)
                        setHtml('')
                    }
                } catch (fetchError) {
                    console.error('Fetch error:', fetchError)
                    setHtml('')
                }
            } catch (error) {
                console.error('Failed to load day data:', error)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }
        loadData()

        return () => {
            isMounted = false // Cleanup
        }
    }, [params.dayNumber])

    if (loading || !data) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary">Loading docs...</p>
                </div>
            </div>
        )
    }

    const docsBaseUrl: string = (data.metadata?.docsBaseUrl || 'https://rsethi-codes.github.io/skill-up-docs-26/full-stack-plan').replace(/\/$/, '')
    const docUrl = `${docsBaseUrl}/day-${params.dayNumber}-plan.html`

    const docId = `day_${String(params.dayNumber)}_plan`
    const docMeta = html ? readDocMetaFromHtml(html) : null

    if (!html) {
        return (
            <DocsReaderClient
                dayNumber={String(params.dayNumber)}
                dayTitle={data.day.title}
                dayId={data.day.id}
                docId={docId}
                docMeta={docMeta}
                html={null}
                externalUrl={docUrl}
            />
        )
    }

    let processed = html
    // DON'T sanitize — sanitizeHtml strips <style> blocks and inline styles,
    // breaking all CSS. The docs are fetched from a trusted GitHub Pages source
    // via our own server proxy, so sanitization is not needed.
    // We only rewrite relative resource URLs so CSS/images load inside the iframe,
    // inject a viewport meta for responsive layout, and inject the TOC scroll handler.
    try {
        processed = rewriteRelativeUrls(html, docUrl)
        processed = ensureViewportMeta(processed)
        processed = injectDocScrollScript(processed)
    } catch (err) {
        console.error('HTML processing error, using raw HTML:', err)
    }
    console.log('Processed HTML for reader:', {
        dayNumber: params.dayNumber,
        hasHtml: !!processed,
        htmlLength: processed.length,
        docMeta,
    })
    return (
        <DocsReaderClient
            dayNumber={params.dayNumber}
            dayTitle={data.day.title}
            dayId={data.day.id}
            docId={docId}
            docMeta={docMeta}
            html={processed}
            externalUrl={docUrl}
            iframeRef={iframeRef}
            tasks={data.tasks || []}
            topics={data.topics || []}
            progress={data.progress}
        />
    )
}
