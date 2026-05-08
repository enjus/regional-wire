import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export const maxDuration = 300

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const errors: string[] = []
  let assetsDeleted = 0
  let storiesDeleted = 0
  let headlinesDeleted = 0

  const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  // Pass 1: Delete storage files and story_assets rows for stories older than 30 days.
  // Stories themselves are kept until the 90-day pass below.
  try {
    const { data: oldStories, error: storiesQueryError } = await supabase
      .from('stories')
      .select('id')
      .lt('published_at', cutoff30)

    if (storiesQueryError) {
      errors.push(`Old stories query failed: ${storiesQueryError.message}`)
    } else if (oldStories && oldStories.length > 0) {
      const storyIds = oldStories.map((s: { id: string }) => s.id)

      const { data: assets, error: assetsError } = await supabase
        .from('story_assets')
        .select('id, file_url')
        .in('story_id', storyIds)

      if (assetsError) {
        errors.push(`Asset query failed: ${assetsError.message}`)
      } else if (assets && assets.length > 0) {
        const filePaths = assets
          .map((a: { file_url: string }) => a.file_url)
          .filter(Boolean)

        // Remove files from Storage in batches of 100
        for (let i = 0; i < filePaths.length; i += 100) {
          const batch = filePaths.slice(i, i + 100)
          const { error: storageError } = await supabase.storage.from('story-assets').remove(batch)
          if (storageError) {
            errors.push(`Storage removal failed (batch ${i / 100 + 1}): ${storageError.message}`)
          }
        }

        const assetIds = assets.map((a: { id: string }) => a.id)
        const { error: deleteError } = await supabase
          .from('story_assets')
          .delete()
          .in('id', assetIds)

        if (deleteError) {
          errors.push(`story_assets delete failed: ${deleteError.message}`)
        } else {
          assetsDeleted = assets.length
          console.log(`[cleanup] Deleted ${assetsDeleted} asset rows`)
        }
      }
    }
  } catch (err) {
    errors.push(`Asset purge error: ${String(err)}`)
  }

  // Pass 2: Hard-delete story rows older than 90 days.
  // Cascades: story_assets (any remaining), story_changes.
  // Sets null: republication_log.story_id, republication_requests.story_id.
  try {
    const { data: deleted, error: storyError } = await supabase
      .from('stories')
      .delete()
      .lt('published_at', cutoff90)
      .select('id')

    if (storyError) {
      errors.push(`Story delete failed: ${storyError.message}`)
    } else {
      storiesDeleted = deleted?.length ?? 0
      console.log(`[cleanup] Deleted ${storiesDeleted} stories`)
    }
  } catch (err) {
    errors.push(`Story purge error: ${String(err)}`)
  }

  // Pass 3: Delete feed_headlines older than 30 days.
  try {
    const { data: deleted, error: headlineError } = await supabase
      .from('feed_headlines')
      .delete()
      .or(`published_at.lt.${cutoff30},published_at.is.null`)
      .select('id')

    if (headlineError) {
      errors.push(`Headline delete failed: ${headlineError.message}`)
    } else {
      headlinesDeleted = deleted?.length ?? 0
      console.log(`[cleanup] Deleted ${headlinesDeleted} feed headlines`)
    }
  } catch (err) {
    errors.push(`Headline purge error: ${String(err)}`)
  }

  if (errors.length > 0) {
    console.error('[cleanup] Errors:', errors)
  }

  return NextResponse.json({ ok: true, assetsDeleted, storiesDeleted, headlinesDeleted, errors })
}
