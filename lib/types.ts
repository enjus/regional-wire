export type OrgStatus = 'pending' | 'approved' | 'suspended'
export type UserRole = 'admin' | 'editor'
export type StoryStatus = 'available' | 'embargoed' | 'withdrawn'
export type ChangeType = 'update' | 'correction' | 'withdrawal'
export type StorySource = 'manual' | 'feed'
export type FeedType = 'full_text' | 'headline'
export type RequestStatus = 'pending' | 'fulfilled' | 'declined'
export type AssetType = 'image' | 'video' | 'document'

export interface Organization {
  id: string
  name: string
  slug: string
  website_url: string
  email_domain: string
  status: OrgStatus
  description: string | null
  contact_emails: string[]
  republication_guidance: string | null
  created_at: string
}

export interface User {
  id: string
  organization_id: string
  display_name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Story {
  id: string
  organization_id: string
  title: string
  byline: string
  body_html: string
  body_plain: string
  canonical_url: string
  slug: string
  summary: string | null
  special_instructions: string | null
  status: StoryStatus
  source: StorySource
  feed_guid: string | null
  embargo_lifts_at: string | null
  has_correction: boolean
  created_at: string
  published_at: string
  // Joined
  organizations?: Organization
  story_assets?: StoryAsset[]
  republication_log?: RepublicationLogEntry[]
  story_changes?: StoryChange[]
}

export interface StoryAsset {
  id: string
  story_id: string
  asset_type: AssetType
  file_url: string
  caption: string | null
  credit: string | null
  is_primary: boolean
  created_at: string
}

export interface OrgFeed {
  id: string
  organization_id: string
  feed_url: string
  feed_type: FeedType
  last_polled_at: string | null
  is_active: boolean
  created_at: string
}

export interface FeedHeadline {
  id: string
  org_feed_id: string
  organization_id: string
  title: string
  url: string
  summary: string | null
  published_at: string | null
  guid: string
  // Joined
  organizations?: Organization
}

export interface RepublicationRequest {
  id: string
  requesting_org_id: string
  target_org_id: string
  story_id: string | null
  requested_headline: string | null
  requested_url: string | null
  message: string | null
  status: RequestStatus
  decline_reason: string | null
  created_at: string
  updated_at: string
  // Joined
  requesting_org?: Organization
  target_org?: Organization
  story?: Story
}

export interface RepublicationLogEntry {
  id: string
  story_id: string
  republishing_org_id: string
  republished_url: string | null
  downloaded_at: string
  // Joined
  organizations?: Organization
}

export interface StoryChange {
  id: string
  story_id: string
  user_id: string
  change_type: ChangeType
  change_note: string | null
  correction_text: string | null
  withdrawal_reason: string | null
  created_at: string
  // Joined
  users?: User
}

export interface StoryAlert {
  id: string
  user_id: string
  organization_id: string
  keywords: string[] | null
  followed_organization_id: string | null
  is_active: boolean
  created_at: string
  // Joined
  followed_org?: { id: string; name: string } | null
}

export interface UserDigestPrefs {
  user_id: string
  daily_digest_enabled: boolean
  delivery_hour_utc: number
  updated_at: string
}

// Auth context shape
export interface AuthUser {
  id: string
  email: string
  user: User
  org: Organization
}
