
-- 1) Étendre l'enum app_role en le recréant (impossible d'ajouter une valeur dans une transaction)
-- Drop dependent function (sera recréée)
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role) CASCADE;
DROP FUNCTION IF EXISTS public.prevent_self_role_grant() CASCADE;

ALTER TABLE public.user_roles ALTER COLUMN role TYPE text USING role::text;
DROP TYPE public.app_role;
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','scolarite','verificateur','teacher','student');
ALTER TABLE public.user_roles ALTER COLUMN role TYPE public.app_role USING role::public.app_role;

-- Recréer has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: any admin level (super_admin OR admin)
CREATE OR REPLACE FUNCTION public.is_admin_level(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin')
  )
$$;

-- Recréer le trigger anti-élévation
CREATE OR REPLACE FUNCTION public.prevent_self_role_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.user_id = auth.uid()
     AND NOT public.is_admin_level(auth.uid()) THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS prevent_self_role_grant_trg ON public.user_roles;
CREATE TRIGGER prevent_self_role_grant_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_grant();

-- 2) Mettre à jour les politiques pour utiliser is_admin_level
-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "View own or admin sees all roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin_level(auth.uid()));
CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin_level(auth.uid()))
  WITH CHECK (public.is_admin_level(auth.uid()));

-- profiles: admins peuvent tout voir/gérer
DROP POLICY IF EXISTS "Admins view all profiles" ON public.profiles;
CREATE POLICY "Admins view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin_level(auth.uid()));
DROP POLICY IF EXISTS "Admins manage profiles" ON public.profiles;
CREATE POLICY "Admins manage profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin_level(auth.uid()))
  WITH CHECK (public.is_admin_level(auth.uid()));

-- programs
DROP POLICY IF EXISTS "Admins manage programs" ON public.programs;
CREATE POLICY "Admins manage programs"
  ON public.programs FOR ALL TO authenticated
  USING (public.is_admin_level(auth.uid()))
  WITH CHECK (public.is_admin_level(auth.uid()));

-- teachers
DROP POLICY IF EXISTS "Admins manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "View teachers admin or self" ON public.teachers;
CREATE POLICY "Admins manage teachers"
  ON public.teachers FOR ALL TO authenticated
  USING (public.is_admin_level(auth.uid()))
  WITH CHECK (public.is_admin_level(auth.uid()));
CREATE POLICY "View teachers admin or self"
  ON public.teachers FOR SELECT TO authenticated
  USING (public.is_admin_level(auth.uid()) OR auth.uid() = user_id);

-- students
DROP POLICY IF EXISTS "Admins manage students" ON public.students;
DROP POLICY IF EXISTS "Students view own record" ON public.students;
CREATE POLICY "Admins or scolarite manage students"
  ON public.students FOR ALL TO authenticated
  USING (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite'))
  WITH CHECK (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite'));
CREATE POLICY "Students view own record"
  ON public.students FOR SELECT TO authenticated
  USING (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite') OR auth.uid() = user_id);

-- diplomas
DROP POLICY IF EXISTS "Admins manage diplomas" ON public.diplomas;
CREATE POLICY "Admin scolarite manage diplomas"
  ON public.diplomas FOR ALL TO authenticated
  USING (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite'))
  WITH CHECK (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite'));

-- verification_logs : admins/verificateur peuvent lire
DROP POLICY IF EXISTS "Admins view verification logs" ON public.verification_logs;
CREATE POLICY "Admins or verificateur view verif logs"
  ON public.verification_logs FOR SELECT TO authenticated
  USING (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'verificateur'));

-- Storage buckets : update policies to include scolarite for diplomas, super_admin via is_admin_level
DROP POLICY IF EXISTS "admin manage student photos" ON storage.objects;
CREATE POLICY "admin manage student photos"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'student-photos' AND (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite')))
  WITH CHECK (bucket_id = 'student-photos' AND (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite')));

DROP POLICY IF EXISTS "admin manage teacher photos" ON storage.objects;
CREATE POLICY "admin manage teacher photos"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'teacher-photos' AND public.is_admin_level(auth.uid()))
  WITH CHECK (bucket_id = 'teacher-photos' AND public.is_admin_level(auth.uid()));

DROP POLICY IF EXISTS "admin manage diplomas files" ON storage.objects;
CREATE POLICY "admin manage diplomas files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'diplomas' AND (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite')))
  WITH CHECK (bucket_id = 'diplomas' AND (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(),'scolarite')));

-- 3) Table de journalisation des connexions
CREATE TABLE IF NOT EXISTS public.auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  event TEXT NOT NULL, -- login_success, login_failed, logout, password_reset, user_created, user_deleted, user_updated, role_assigned
  metadata JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.auth_audit_logs TO authenticated;
GRANT ALL ON public.auth_audit_logs TO service_role;
ALTER TABLE public.auth_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view auth logs"
  ON public.auth_audit_logs FOR SELECT TO authenticated
  USING (public.is_admin_level(auth.uid()));

-- 4) Création automatique du compte SUPER_ADMIN principal
-- Idempotent: ne crée que si l'email n'existe pas déjà
DO $$
DECLARE
  v_user_id uuid;
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM auth.users WHERE email = 'admin@isfi-verify.sn';
  IF v_existing IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin,
      confirmation_token, email_change, email_change_token_new, recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'admin@isfi-verify.sn',
      crypt('Azerty10@', gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"first_name":"Super","last_name":"Admin"}'::jsonb,
      false, '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_user_id,
      jsonb_build_object('sub', v_user_id::text, 'email', 'admin@isfi-verify.sn'),
      'email',
      v_user_id::text,
      now(), now(), now()
    );
  ELSE
    v_user_id := v_existing;
  END IF;

  -- S'assurer du rôle super_admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'super_admin'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- S'assurer du profil
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (v_user_id, 'admin@isfi-verify.sn', 'Super', 'Admin')
  ON CONFLICT (id) DO NOTHING;
END $$;
