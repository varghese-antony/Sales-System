# Super Admin Role Migration Guide

## Overview
The platform now supports a three-tier role system: `customer`, `admin`, and the new `super_admin`. Super admins have unrestricted access to customer management tooling, while regular admins retain access to product and enquiry management. This guide explains how to migrate databases, deploy the codebase, and validate the new permissions safely.

## Database Migration

### Apply Migration
```sql
-- Extend enum with super_admin
ALTER TYPE public.user_type ADD VALUE IF NOT EXISTS 'super_admin';

-- Grant super admin RLS capabilities
DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can view all enquiries" ON public.enquiries;
CREATE POLICY "Super admins can view all enquiries" ON public.enquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins can update all enquiries" ON public.enquiries;
CREATE POLICY "Super admins can update all enquiries" ON public.enquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND user_type = 'super_admin'
    )
  );
```

### Verify Current Admin Users
```sql
SELECT id, email, full_name, user_type
FROM public.profiles
WHERE user_type IN ('admin', 'super_admin')
ORDER BY user_type DESC, email;
```

### Promote or Demote Users
```sql
-- Promote to super_admin
UPDATE public.profiles
SET user_type = 'super_admin'
WHERE email = 'admin@example.com';

-- Demote to admin
UPDATE public.profiles
SET user_type = 'admin'
WHERE email = 'super.admin@example.com';
```

### Rollback (Remove super_admin)
```sql
-- Demote all super_admins to admin first
UPDATE public.profiles
SET user_type = 'admin'
WHERE user_type = 'super_admin';

-- Recreate enum without super_admin (requires recreation)
ALTER TYPE public.user_type RENAME TO user_type_old;
CREATE TYPE public.user_type AS ENUM ('customer', 'admin');
ALTER TABLE public.profiles ALTER COLUMN user_type TYPE public.user_type USING user_type::text::public.user_type;
DROP TYPE public.user_type_old;
```

## Deployment Order
1. Apply the database migration in production.
2. Promote at least one existing admin to `super_admin`.
3. Deploy the updated application code.
4. Clear edge caches (if applicable) to ensure middleware updates propagate.
5. Inform super admin users of the new role capabilities.

## Testing Checklist
- Customer account can access public areas only; admin dashboard redirects to `/unauthorized`.
- Admin account can access general `/admin-dashboard` routes but gets redirected from `/admin-dashboard/manage-customers`.
- Super admin account can access all admin routes including manage customers.
- API endpoints under `/api/admin/customers` reject customers and admins with `403` but allow super admins.
- Middleware response headers include `X-User-Role` reflecting the current user type.
- Navbar displays "Super Admin" badge for super admin accounts.

## Troubleshooting
- **Unexpected 403 for super admin**: Confirm profile record reflects `super_admin` and cache has been cleared.
- **Admin lost access to dashboard**: Validate enum migration succeeded and profile still marked as `admin`.
- **RLS policy conflicts**: Re-run the migration block to ensure policies were recreated.
- **Middleware cache mismatch**: Restart the deployment or invalidate the cache where the key includes `user_type`.

## Security Considerations
- Maintain a minimal list of super admin accounts and audit regularly.
- Update operations on customers are now restricted to super admins at database, middleware, API, and UI layers.
- Keep Supabase service role keys secure; do not expose them client-side.

## Reference SQL Queries
```sql
-- List super admins
SELECT id, email FROM public.profiles WHERE user_type = 'super_admin';

-- Count admins vs super admins
SELECT user_type, COUNT(*) FROM public.profiles
WHERE user_type IN ('admin', 'super_admin')
GROUP BY user_type;
```
