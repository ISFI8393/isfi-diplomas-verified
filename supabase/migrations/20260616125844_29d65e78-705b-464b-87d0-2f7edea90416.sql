
-- Update verify_diploma to accept IP and user agent
CREATE OR REPLACE FUNCTION public.verify_diploma(
  p_numero text,
  p_ip text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
 RETURNS TABLE(numero_diplome text, nom_complet text, date_naissance date, nom_diplome text, option text, mention text, annee_academique text, etablissement text, date_obtention date, date_delivrance date, photo_url text, pdf_url text, diploma_pdf_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
         d.date_obtention, d.date_delivrance, d.photo_url,
         d.pdf_url, d.diploma_pdf_url
  FROM public.diplomas d
  WHERE d.numero_diplome = v_key AND d.is_valid = true
  LIMIT 1;

  GET DIAGNOSTICS v_found = ROW_COUNT;

  INSERT INTO public.verification_logs (numero_diplome, success, ip, user_agent)
  VALUES (v_key, v_found, NULLIF(trim(coalesce(p_ip, '')), ''), NULLIF(trim(coalesce(p_user_agent, '')), ''));
END;
$function$;

-- History function restricted to admins and verificateurs
CREATE OR REPLACE FUNCTION public.get_verification_history(p_numero text)
 RETURNS TABLE(id uuid, numero_diplome text, ip text, user_agent text, success boolean, date_verification timestamptz)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL
     OR NOT (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(), 'verificateur'::app_role)) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT v.id, v.numero_diplome, v.ip, v.user_agent, v.success, v.date_verification
  FROM public.verification_logs v
  WHERE v.numero_diplome = trim(p_numero)
  ORDER BY v.date_verification DESC
  LIMIT 200;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_verification_history(text) TO authenticated;
