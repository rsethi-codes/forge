class TelemetryBatcher {
    private queue: any[] = []
    private flushTimer: NodeJS.Timeout | null = null
    private readonly FLUSH_INTERVAL = 3000 // 3 seconds
    private readonly MAX_BATCH_SIZE = 20

    constructor(private endpoint: string) {}

    add(event: any) {
        this.queue.push(event)
        if (this.queue.length >= this.MAX_BATCH_SIZE) {
            this.flush()
        } else {
            this.scheduleFlush()
        }
    }

    private scheduleFlush() {
        if (this.flushTimer) return
        this.flushTimer = setTimeout(() => {
            this.flush()
        }, this.FLUSH_INTERVAL)
    }

    private async flush() {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
            this.flushTimer = null
        }
        if (this.queue.length === 0) return

        const batch = this.queue.splice(0, this.MAX_BATCH_SIZE)
        try {
            await fetch(this.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(batch)
            })
        } catch (err) {
            console.error('Telemetry batch failed:', err)
            // Optionally re-add to queue for retry
            this.queue.unshift(...batch)
        }
    }

    // Force flush on page unload
    destroy() {
        if (this.flushTimer) {
            clearTimeout(this.flushTimer)
            this.flushTimer = null
        }
        this.flush()
    }
}

export const telemetryBatcher = new TelemetryBatcher('/api/docs/events/bulk')
