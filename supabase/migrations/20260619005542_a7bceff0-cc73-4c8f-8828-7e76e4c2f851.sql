CREATE OR REPLACE FUNCTION public.verify_diploma(p_numero text, p_ip text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS TABLE(numero_diplome text, nom_complet text, date_naissance date, nom_diplome text, option text, mention text, annee_academique text, etablissement text, date_obtention date, date_delivrance date, photo_url text, pdf_url text, diploma_pdf_url text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_key text := trim(p_numero);
  v_ip  text := NULLIF(trim(coalesce(p_ip, '')), '');
  v_ua  text := NULLIF(trim(coalesce(p_user_agent, '')), '');
  v_found boolean := false;
  v_recent int;
  v_hourly int;
  v_last_block timestamptz;
  v_last_unblock timestamptz;
BEGIN
  IF v_key IS NULL OR length(v_key) = 0 OR length(v_key) > 100 THEN
    RETURN;
  END IF;

  IF v_ip IS NOT NULL THEN
    SELECT count(*) INTO v_recent
      FROM public.verification_logs
     WHERE ip = v_ip AND numero_diplome NOT IN ('__BLOCKED__','__UNBLOCK__')
       AND date_verification > now() - interval '1 minute';

    SELECT count(*) INTO v_hourly
      FROM public.verification_logs
     WHERE ip = v_ip AND numero_diplome NOT IN ('__BLOCKED__','__UNBLOCK__')
       AND date_verification > now() - interval '1 hour';

    SELECT max(date_verification) INTO v_last_block
      FROM public.verification_logs
     WHERE ip = v_ip AND numero_diplome = '__BLOCKED__';

    SELECT max(date_verification) INTO v_last_unblock
      FROM public.verification_logs
     WHERE ip = v_ip AND numero_diplome = '__UNBLOCK__';

    IF (v_last_block IS NOT NULL
        AND v_last_block > now() - interval '10 minutes'
        AND (v_last_unblock IS NULL OR v_last_unblock < v_last_block))
       OR v_recent >= 10 OR v_hourly >= 100 THEN
      INSERT INTO public.verification_logs (numero_diplome, success, ip, user_agent)
      VALUES ('__BLOCKED__', false, v_ip, v_ua);
      RAISE EXCEPTION 'rate_limited' USING ERRCODE = 'P0001';
    END IF;
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
  VALUES (v_key, v_found, v_ip, v_ua);
END;
$$;