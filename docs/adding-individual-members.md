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

Once added, the member registers and logs in normally at `/register`. They'll be associated with that org and assigned the `editor` role (or `admin` if they're the first member).

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
