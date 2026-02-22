import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function createBuckets() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const buckets = ['roadmap-files', 'blog-images']

    for (const bucket of buckets) {
        console.log(`Checking bucket: ${bucket}`)
        const { data, error } = await supabase.storage.getBucket(bucket)

        if (error) {
            console.log(`Creating bucket: ${bucket}`)
            const { error: createError } = await supabase.storage.createBucket(bucket, {
                public: true,
            })
            if (createError) console.error(`Error creating ${bucket}:`, createError)
            else console.log(`Bucket ${bucket} created successfully.`)
        } else {
            console.log(`Bucket ${bucket} already exists.`)
        }
    }
}

createBuckets()
