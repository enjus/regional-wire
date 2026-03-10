export type MemberOrg = {
  initials: string
  name: string
  type: string
  color: string
}

export const MEMBER_ORGS: MemberOrg[] = [
  { initials: 'NH', name: 'Northfield Herald',     type: 'Daily newspaper',      color: '#2D5A8B' },
  { initials: 'DG', name: 'Daily Gazette',          type: 'Daily newspaper',      color: '#8B3A3A' },
  { initials: 'RV', name: 'River Valley Report',    type: 'Nonprofit newsroom',   color: '#4A7C59' },
  { initials: 'WC', name: 'Westchester Courier',    type: 'Weekly newspaper',     color: '#8B5E3C' },
  { initials: 'SL', name: 'Star-Ledger',            type: 'Regional newspaper',   color: '#5A4A8B' },
  { initials: 'BR', name: 'Blue Ridge Review',      type: 'Nonprofit newsroom',   color: '#3A5A8B' },
  { initials: 'MT', name: 'Mountain Tribune',       type: 'Weekly newspaper',     color: '#8B7A3A' },
  { initials: 'CP', name: 'Capital Press',          type: 'Daily newspaper',      color: '#6B3A8B' },
  { initials: 'EJ', name: 'Eastern Journal',        type: 'Digital outlet',       color: '#3A8B6B' },
  { initials: 'NR', name: 'Northern Record',        type: 'Weekly newspaper',     color: '#8B3A6B' },
  { initials: 'LW', name: 'Lakewood Wire',          type: 'Nonprofit newsroom',   color: '#3A7A8B' },
  { initials: 'PH', name: 'Prairie Herald',         type: 'Daily newspaper',      color: '#6B8B3A' },
]
