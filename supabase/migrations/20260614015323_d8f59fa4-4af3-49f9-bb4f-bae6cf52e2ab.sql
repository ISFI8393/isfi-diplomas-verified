
-- Add column for uploaded original diploma PDF (distinct from generated pdf_url)
ALTER TABLE public.diplomas
  ADD COLUMN IF NOT EXISTS diploma_pdf_url TEXT;

-- Update verify_diploma RPC to also return pdf_url + diploma_pdf_url so the public
-- verification page can offer a download link.
DROP FUNCTION IF EXISTS public.verify_diploma(text);

CREATE OR REPLACE FUNCTION public.verify_diploma(p_numero text)
 RETURNS TABLE(
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
   photo_url text,
   pdf_url text,
   diploma_pdf_url text
 )
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

  INSERT INTO public.verification_logs (numero_diplome, success)
  VALUES (v_key, v_found);
END;
$function$;
