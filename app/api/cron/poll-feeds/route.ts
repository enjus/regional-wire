import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import Parser from 'rss-parser'
import { slugify } from '@/lib/utils'

// This route is called via crontab every 15 minutes.
// For AWS: use EventBridge rule to trigger a Lambda on the same schedule.
// The Lambda invokes this endpoint via an HTTP request with CRON_SECRET header,
// or replicate the logic directly in the Lambda handler using the same Supabase
// service role key and rss-parser package.

export const maxDuration = 300 // 5 minutes max execution

type FeedItem = {
  guid?: string
  link?: string
  title?: string
  contentEncoded?: string
  content?: string
  contentSnippet?: string
  summary?: string
  pubDate?: string
  isoDate?: string
  creator?: string
  author?: string
}

const parser = new Parser<Record<string, unknown>, FeedItem>({
  customFields: {
    item: [['content:encoded', 'contentEncoded'], ['dc:creator', 'creator']],
  },
})

export async function GET(request: NextRequest) {
  // Verify this is called by Vercel Cron or an authorized system
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  const { data: feeds } = await supabase
    .from('org_feeds')
    .select('*, organizations(id, status)')
    .eq('is_active', true)

  if (!feeds?.length) {
    return NextResponse.json({ ok: true, processed: 0 })
  }

  let processed = 0
  const errors: string[] = []

  for (const feed of feeds) {
    const org = feed.organizations as { id: string; status: string } | null
    if (org?.status !== 'approved') continue

    try {
      const result = await parser.parseURL(feed.feed_url)

      for (const item of result.items) {
        const guid = item.guid || item.link
        if (!guid) continue

        if (feed.feed_type === 'full_text') {
          // Check if already ingested
          const { data: existing } = await supabase
            .from('stories')
            .select('id')
            .eq('feed_guid', guid)
            .single()

          if (existing) continue

          const bodyHtml = item.contentEncoded || item.content || ''
          const bodyPlain =
            item.contentSnippet ||
            bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

          if (!bodyHtml) {
            console.log(`[poll-feeds] Empty body for ${guid} — skipping`)
            continue
          }

          const title = item.title ?? 'Untitled'
          const slug = slugify(title)

          const { data: story, error: storyError } = await supabase
            .from('stories')
            .insert({
              organization_id: org.id,
              title,
              byline: result.title ?? org.id,
              body_html: bodyHtml,
              body_plain: bodyPlain,
              canonical_url: item.link ?? guid,
              slug: `${slug}-${Date.now()}`,
              status: 'available',
              source: 'feed',
              feed_guid: guid,
              published_at: item.isoDate || item.pubDate || new Date().toISOString(),
            })
            .select()
            .single()

          if (storyError) {
            console.error(`[poll-feeds] Failed to insert story for ${guid}:`, storyError)
          } else if (story) {
            processed++
          }
        } else if (feed.feed_type === 'headline') {
          // Upsert into feed_headlines
          await supabase
            .from('feed_headlines')
            .upsert(
              {
                org_feed_id: feed.id,
                organization_id: org.id,
                title: item.title ?? 'Untitled',
                url: item.link ?? guid,
                summary: item.contentSnippet || item.summary || null,
                published_at: item.isoDate || item.pubDate || null,
                author: item.creator || item.author || null,
                guid,
              },
              { onConflict: 'org_feed_id,guid' }
            )
          processed++
        }
      }

      // Update last_polled_at
      await supabase
        .from('org_feeds')
        .update({ last_polled_at: new Date().toISOString() })
        .eq('id', feed.id)
    } catch (err) {
      const msg = `Feed ${feed.id} (${feed.feed_url}): ${err instanceof Error ? err.message : 'Unknown error'}`
      console.error('[poll-feeds]', msg)
      errors.push(msg)
      // Never crash the cron — log and continue
    }
  }

  // ----------------------------------------------------------------
  // Embargo enforcement: lift embargoes that have expired
  // ----------------------------------------------------------------
  const { data: expiredEmbargoes } = await supabase
    .from('stories')
    .select('id')
    .eq('status', 'embargoed')
    .lt('embargo_lifts_at', new Date().toISOString())

  if (expiredEmbargoes?.length) {
    for (const story of expiredEmbargoes) {
      await supabase
        .from('stories')
        .update({ status: 'available' })
        .eq('id', story.id)
    }
    console.log(`[poll-feeds] Lifted ${expiredEmbargoes.length} embargo(es)`)
  }

  return NextResponse.json({ ok: true, processed, errors })
}
