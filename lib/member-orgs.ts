export type MemberOrg = {
  initials: string
  name: string
  location: string
  color: string
  url?: string
  logo?: string  // path relative to /public (e.g. '/logos/foo.svg'); overrides initials when provided
}

export const MEMBER_ORGS: MemberOrg[] = [
  { initials: 'NH', name: 'Northfield Herald',     location: 'Daily newspaper',      color: '#2D5A8B' },
  { initials: 'DG', name: 'Daily Gazette',          location: 'Daily newspaper',      color: '#8B3A3A' },
  { initials: 'RV', name: 'River Valley Report',    location: 'Nonprofit newsroom',   color: '#4A7C59' },
  { initials: 'WC', name: 'Westchester Courier',    location: 'Weekly newspaper',     color: '#8B5E3C' },
  { initials: 'SL', name: 'Star-Ledger',            location: 'Regional newspaper',   color: '#5A4A8B' },
  { initials: 'BR', name: 'Blue Ridge Review',      location: 'Nonprofit newsroom',   color: '#3A5A8B' },
  { initials: 'MT', name: 'Mountain Tribune',       location: 'Weekly newspaper',     color: '#8B7A3A' },
  { initials: 'CP', name: 'Capital Press',          location: 'Daily newspaper',      color: '#6B3A8B' },
  { initials: 'EJ', name: 'Eastern Journal',        location: 'Digital outlet',       color: '#3A8B6B' },
  { initials: 'NR', name: 'Northern Record',        location: 'Weekly newspaper',     color: '#8B3A6B' },
  { initials: 'LW', name: 'Lakewood Wire',          location: 'Nonprofit newsroom',   color: '#3A7A8B' },
  { initials: 'PH', name: 'Prairie Herald',         location: 'Daily newspaper',      color: '#6B8B3A' },
]
