
-- Rate limiting + analytics RPCs for verification

CREATE OR REPLACE FUNCTION public.verify_diploma(p_numero text, p_ip text DEFAULT NULL, p_user_agent text DEFAULT NULL)
RETURNS TABLE(numero_diplome text, nom_complet text, date_naissance date, nom_diplome text, option text, mention text, annee_academique text, etablissement text, date_obtention date, date_delivrance date, photo_url text, pdf_url text, diploma_pdf_url text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_key text := trim(p_numero);
  v_ip  text := NULLIF(trim(coalesce(p_ip, '')), '');
  v_ua  text := NULLIF(trim(coalesce(p_user_agent, '')), '');
  v_found boolean := false;
  v_recent int;
  v_hourly int;
  v_block_until timestamptz;
BEGIN
  IF v_key IS NULL OR length(v_key) = 0 OR length(v_key) > 100 THEN
    RETURN;
  END IF;

  -- Rate limit by IP: max 10 req / minute and 100 req / hour. Block 10 minutes when exceeded.
  IF v_ip IS NOT NULL THEN
    SELECT count(*) INTO v_recent
      FROM public.verification_logs
     WHERE ip = v_ip AND date_verification > now() - interval '1 minute';

    SELECT count(*) INTO v_hourly
      FROM public.verification_logs
     WHERE ip = v_ip AND date_verification > now() - interval '1 hour';

    -- Existing block window (within last 10 minutes of an explicit block log)
    SELECT max(date_verification) + interval '10 minutes' INTO v_block_until
      FROM public.verification_logs
     WHERE ip = v_ip AND numero_diplome = '__BLOCKED__';

    IF (v_block_until IS NOT NULL AND v_block_until > now())
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

-- Stats: top diplomas by verification count
CREATE OR REPLACE FUNCTION public.get_verification_stats_per_diploma(p_limit int DEFAULT 50)
RETURNS TABLE(numero_diplome text, total bigint, success_count bigint, last_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL
     OR NOT (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(), 'verificateur'::app_role)) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT v.numero_diplome,
         count(*)::bigint AS total,
         count(*) FILTER (WHERE v.success)::bigint AS success_count,
         max(v.date_verification) AS last_at
  FROM public.verification_logs v
  WHERE v.numero_diplome <> '__BLOCKED__'
  GROUP BY v.numero_diplome
  ORDER BY total DESC
  LIMIT greatest(1, least(coalesce(p_limit, 50), 500));
END;
$$;

-- Stats: daily trend over N days
CREATE OR REPLACE FUNCTION public.get_verification_daily_trend(p_days int DEFAULT 30)
RETURNS TABLE(day date, total bigint, success_count bigint, blocked_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_days int := greatest(1, least(coalesce(p_days, 30), 365));
BEGIN
  IF auth.uid() IS NULL
     OR NOT (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(), 'verificateur'::app_role)) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH days AS (
    SELECT (current_date - g)::date AS day
    FROM generate_series(0, v_days - 1) g
  ), agg AS (
    SELECT date_trunc('day', v.date_verification)::date AS day,
           count(*) FILTER (WHERE v.numero_diplome <> '__BLOCKED__')::bigint AS total,
           count(*) FILTER (WHERE v.success AND v.numero_diplome <> '__BLOCKED__')::bigint AS success_count,
           count(*) FILTER (WHERE v.numero_diplome = '__BLOCKED__')::bigint AS blocked_count
    FROM public.verification_logs v
    WHERE v.date_verification >= current_date - (v_days - 1) * interval '1 day'
    GROUP BY 1
  )
  SELECT d.day,
         coalesce(a.total, 0)::bigint,
         coalesce(a.success_count, 0)::bigint,
         coalesce(a.blocked_count, 0)::bigint
  FROM days d LEFT JOIN agg a USING (day)
  ORDER BY d.day ASC;
END;
$$;
