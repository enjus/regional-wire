export type MemberOrg = {
  initials: string
  name: string
  location: string
  color: string
  url?: string
  logo?: string  // path relative to /public (e.g. '/logos/foo.svg'); overrides initials when provided
}

export const MEMBER_ORGS: MemberOrg[] = [
  { initials: 'H', 	name: 'The Herald',     		location: 'Northfield',		color: '#2D5A8B',	url: 'https://google.com' },
  { initials: 'DG', name: 'Daily Gazette',          location: 'Angel Grove',	color: '#8B3A3A' },
  { initials: 'RV', name: 'River Valley Report',    location: 'Millersberg',	color: '#4A7C59' },
  { initials: 'WC', name: 'Westchester Courier',    location: 'Westchester',	color: '#8B5E3C' },
  { initials: 'SL', name: 'Star-Leader',            location: 'Jefferson',		color: '#5A4A8B' },
  { initials: 'BR', name: 'Blue Ridge Review',      location: 'Graphite',		color: '#3A5A8B' },
  { initials: 'MT', name: 'Mountain Tribune',       location: 'Blueston',		color: '#8B7A3A' },
  { initials: 'CP', name: 'Capital Press',          location: 'Green Graze',	color: '#6B3A8B' },
  { initials: 'EJ', name: 'Eastern Journal',        location: 'Fuschia',		color: '#3A8B6B' },
  { initials: 'NR', name: 'Northern Record',        location: 'Billingston',	color: '#8B3A6B' },
  { initials: 'LW', name: 'Lakewood Wire',          location: 'Stefans',		color: '#3A7A8B' },
  { initials: 'PH', name: 'Prairie Herald',         location: 'Grove',			color: '#6B8B3A' },
]
