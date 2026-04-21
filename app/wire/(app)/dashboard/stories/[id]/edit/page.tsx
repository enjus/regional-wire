import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import StoryUploadForm from '@/components/stories/story-upload-form'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Edit Story' }

export default async function EditStoryPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentUser } = await supabase
    .from('users')
    .select('organization_id, organizations(name)')
    .eq('id', user.id)
    .single()

  if (!currentUser) redirect('/register')

  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .eq('organization_id', currentUser.organization_id)
    .single()

  if (!story) notFound()

  const orgName =
    (currentUser.organizations as unknown as { name: string } | null)?.name ?? ''

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/wire/dashboard/stories/${id}`}
          className="text-sm text-wire-slate hover:text-wire-navy"
        >
          ← Back to story
        </Link>
        <h2 className="font-serif text-xl font-bold text-wire-navy mt-2">
          Edit Story
        </h2>
      </div>
      <StoryUploadForm
        orgName={orgName}
        initialData={{
          id: story.id,
          title: story.title,
          byline: story.byline,
          canonical_url: story.canonical_url,
          body_html: story.body_html,
          summary: story.summary ?? '',
          special_instructions: story.special_instructions ?? '',
          embargo_lifts_at: story.embargo_lifts_at ?? undefined,
        }}
      />
    </div>
  )
}
