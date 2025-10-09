-- Supprimer les anciens rôles et profils si existants
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('erousseau@actinidia.fr', 'e.rousseau@ymail.com')
);

DELETE FROM admin_profiles WHERE user_id IN (
  SELECT id FROM auth.users WHERE email IN ('erousseau@actinidia.fr', 'e.rousseau@ymail.com')
);

-- Note: Les comptes utilisateurs doivent être créés manuellement via l'interface Supabase Auth
-- car nous n'avons pas accès direct à auth.users depuis les migrations SQL

-- Fonction helper pour créer les rôles et profils après création des comptes
CREATE OR REPLACE FUNCTION public.setup_user_with_role(
  p_user_id UUID,
  p_role app_role,
  p_max_locations INTEGER DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Créer le rôle
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Si c'est un admin, créer le profil admin
  IF p_role = 'admin' THEN
    INSERT INTO public.admin_profiles (user_id, max_locations, created_by)
    VALUES (p_user_id, COALESCE(p_max_locations, 5), p_user_id)
    ON CONFLICT (user_id) DO UPDATE
    SET max_locations = COALESCE(p_max_locations, admin_profiles.max_locations);
  END IF;
END;
$$;

-- Commentaire pour l'utilisateur :
-- Après avoir créé les comptes dans Supabase Auth UI, exécutez ces commandes SQL :
-- 
-- Pour le superadmin (erousseau@actinidia.fr) :
-- SELECT setup_user_with_role('[USER_ID]'::uuid, 'superadmin'::app_role);
-- 
-- Pour l'admin (e.rousseau@ymail.com) :
-- SELECT setup_user_with_role('[USER_ID]'::uuid, 'admin'::app_role, 10);