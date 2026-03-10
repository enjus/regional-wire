import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StoryUploadForm from '@/components/stories/story-upload-form'

export const metadata = { title: 'Upload Story' }

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ headline?: string; url?: string; requestId?: string }>
}) {
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

  const orgName = (currentUser.organizations as unknown as { name: string } | null)?.name ?? ''

  const { headline, url, requestId } = await searchParams
  const initialData = headline || url ? { title: headline ?? '', canonical_url: url ?? '' } : undefined

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-serif text-xl font-bold text-wire-navy">
          Upload Story for Republication
        </h2>
        <p className="text-wire-slate text-sm mt-1">
          Uploading this story makes it available to all member newsrooms for
          republication.
        </p>
      </div>
      <StoryUploadForm orgName={orgName} initialData={initialData} requestId={requestId} />
    </div>
  )
}
