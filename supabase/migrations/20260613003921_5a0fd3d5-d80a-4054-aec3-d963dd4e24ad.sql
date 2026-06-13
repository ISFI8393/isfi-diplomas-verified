
-- 1) Restrict diplomas public read: drop anon-readable policy
DROP POLICY IF EXISTS "Public can verify diplomas" ON public.diplomas;

-- 2) Create a SECURITY DEFINER RPC to verify a single diploma by exact number,
--    and log the verification atomically. Returns only the fields needed for display.
CREATE OR REPLACE FUNCTION public.verify_diploma(p_numero text)
RETURNS TABLE (
  numero_diplome text,
  nom_complet text,
  date_naissance date,
  nom_diplome text,
  option text,
  mention text,
  annee_academique text,
  etablissement text,
  date_obtention date,
  date_delivrance date,
  photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_key text := trim(p_numero);
  v_found boolean := false;
BEGIN
  IF v_key IS NULL OR length(v_key) = 0 OR length(v_key) > 100 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT d.numero_diplome, d.nom_complet, d.date_naissance, d.nom_diplome,
         d.option, d.mention, d.annee_academique, d.etablissement,
         d.date_obtention, d.date_delivrance, d.photo_url
  FROM public.diplomas d
  WHERE d.numero_diplome = v_key AND d.is_valid = true
  LIMIT 1;

  GET DIAGNOSTICS v_found = ROW_COUNT;

  INSERT INTO public.verification_logs (numero_diplome, success)
  VALUES (v_key, v_found);
END;
$$;

REVOKE ALL ON FUNCTION public.verify_diploma(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_diploma(text) TO anon, authenticated;

-- 3) Lock down verification_logs inserts: only the RPC (definer) can insert.
DROP POLICY IF EXISTS "Anyone can log a verification" ON public.verification_logs;

-- 4) Teachers: restrict SELECT to admins and the teacher's own record
DROP POLICY IF EXISTS "Authenticated can view teachers" ON public.teachers;
CREATE POLICY "View teachers admin or self"
ON public.teachers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);

-- 5) Storage: remove public read on diplomas bucket (signed URLs only)
DROP POLICY IF EXISTS "public read diplomas" ON storage.objects;

-- 6) Defense in depth: prevent users from inserting/altering their own user_roles
--    even if a policy were misconfigured later. Admin actions bypass via has_role.
CREATE OR REPLACE FUNCTION public.prevent_self_role_grant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.user_id = auth.uid()
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Users cannot assign roles to themselves';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.prevent_self_role_grant() FROM PUBLIC;

DROP TRIGGER IF EXISTS prevent_self_role_grant_trg ON public.user_roles;
CREATE TRIGGER prevent_self_role_grant_trg
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_grant();
