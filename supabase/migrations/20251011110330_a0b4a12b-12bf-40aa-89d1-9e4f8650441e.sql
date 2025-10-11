-- Ensure roles and admin profile for the two specified accounts by email
-- 1) Upsert roles based on auth.users email
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'superadmin'::app_role
FROM auth.users u
WHERE u.email = 'erousseau@actinidia.fr'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email = 'e.rousseau@ymail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- 2) Ensure admin_profiles exists for the admin with a sane max_locations
INSERT INTO public.admin_profiles (user_id, max_locations, created_by)
SELECT u.id, 10, u.id
FROM auth.users u
WHERE u.email = 'e.rousseau@ymail.com'
ON CONFLICT (user_id) DO UPDATE SET max_locations = EXCLUDED.max_locations;

-- Optional cleanup: remove incorrect extra roles for these users (keep only desired one)
DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND u.email = 'erousseau@actinidia.fr'
  AND ur.role <> 'superadmin'::app_role;

DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND u.email = 'e.rousseau@ymail.com'
  AND ur.role <> 'admin'::app_role;