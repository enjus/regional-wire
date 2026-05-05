# Adding individual members by email

Some members may use personal email addresses (e.g. Gmail) that don't match their organization's domain. Use the `allowed_emails` column to grant access to specific addresses without opening registration to an entire domain.

## Add an email address

Run this in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

```sql
UPDATE organizations
SET allowed_emails = array_append(allowed_emails, 'person@gmail.com')
WHERE id = '<org_uuid>';
```

Replace `person@gmail.com` with the member's address and `<org_uuid>` with the org's ID.

**To find an org's UUID:**
```sql
SELECT id, name, email_domain FROM organizations WHERE name ILIKE '%newsroom name%';
```

Once added, the member registers and logs in normally at `/register`. They'll be associated with that org and assigned the `editor` role. **Note:** if the org already has active members, the new user will land in a `pending` state and require org admin approval before gaining access. To skip the approval step and grant immediate access, use an org invite instead (see below).

## Give immediate access via org invite

An `org_invites` row guarantees the user is set to `status = 'active'` the moment they complete registration — no admin approval needed. Use this instead of (or in addition to) `allowed_emails` when you want the member in right away:

```sql
INSERT INTO org_invites (org_id, email, invited_by, used_at)
VALUES ('<org_uuid>', 'person@gmail.com', NULL, NULL);
```

The invite is consumed (marked `used_at`) the first time they log in. It can coexist with an `allowed_emails` entry — both checks happen during registration.

## Remove an email address

```sql
UPDATE organizations
SET allowed_emails = array_remove(allowed_emails, 'person@gmail.com')
WHERE id = '<org_uuid>';
```

## View current allowed emails for all orgs

```sql
SELECT id, name, email_domain, allowed_emails
FROM organizations
WHERE allowed_emails <> '{}'
ORDER BY name;
```

## Notes

- Addresses are matched case-insensitively
- The org must have `status = 'approved'` — pending or suspended orgs won't work
- Domain-based registration is unaffected; `allowed_emails` is only a fallback
- Removing an address doesn't affect users who have already registered — it only prevents new signups from that address
