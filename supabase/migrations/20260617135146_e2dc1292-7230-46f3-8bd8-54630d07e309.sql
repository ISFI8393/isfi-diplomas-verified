
-- 1) Update verify_diploma to honor manual unblocks
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

-- 2) Paginated verification history per diploma
CREATE OR REPLACE FUNCTION public.get_verification_history_paginated(
  p_numero text, p_limit int DEFAULT 25, p_offset int DEFAULT 0
)
RETURNS TABLE(id uuid, numero_diplome text, ip text, user_agent text, success boolean, date_verification timestamptz, total_count bigint)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_limit int := greatest(1, least(coalesce(p_limit, 25), 200));
  v_offset int := greatest(0, coalesce(p_offset, 0));
  v_total bigint;
BEGIN
  IF auth.uid() IS NULL
     OR NOT (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(), 'verificateur'::app_role)) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_total
  FROM public.verification_logs v
  WHERE v.numero_diplome = trim(p_numero);

  RETURN QUERY
  SELECT v.id, v.numero_diplome, v.ip, v.user_agent, v.success, v.date_verification, v_total
  FROM public.verification_logs v
  WHERE v.numero_diplome = trim(p_numero)
  ORDER BY v.date_verification DESC
  LIMIT v_limit OFFSET v_offset;
END;
$$;

-- 3) Stats per diploma with filters (period, programme, status, search)
CREATE OR REPLACE FUNCTION public.get_verification_stats_filtered(
  p_days int DEFAULT 30,
  p_program_id uuid DEFAULT NULL,
  p_status text DEFAULT NULL, -- 'authentic' | 'not_authentic' | NULL
  p_search text DEFAULT NULL,
  p_limit int DEFAULT 100
)
RETURNS TABLE(numero_diplome text, nom_complet text, program_id uuid, total bigint, success_count bigint, fail_count bigint, last_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_days int := greatest(1, least(coalesce(p_days, 30), 365));
  v_limit int := greatest(1, least(coalesce(p_limit, 100), 500));
  v_search text := NULLIF(trim(coalesce(p_search, '')), '');
BEGIN
  IF auth.uid() IS NULL
     OR NOT (public.is_admin_level(auth.uid()) OR public.has_role(auth.uid(), 'verificateur'::app_role)) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH logs AS (
    SELECT v.numero_diplome, v.success, v.date_verification
    FROM public.verification_logs v
    WHERE v.numero_diplome NOT IN ('__BLOCKED__','__UNBLOCK__')
      AND v.date_verification >= now() - (v_days || ' days')::interval
  ), agg AS (
    SELECT l.numero_diplome,
           count(*)::bigint AS total,
           count(*) FILTER (WHERE l.success)::bigint AS success_count,
           count(*) FILTER (WHERE NOT l.success)::bigint AS fail_count,
           max(l.date_verification) AS last_at
    FROM logs l
    GROUP BY l.numero_diplome
  )
  SELECT a.numero_diplome, d.nom_complet, d.program_id,
         a.total, a.success_count, a.fail_count, a.last_at
  FROM agg a
  LEFT JOIN public.diplomas d ON d.numero_diplome = a.numero_diplome
  WHERE (p_program_id IS NULL OR d.program_id = p_program_id)
    AND (p_status IS NULL
         OR (p_status = 'authentic' AND a.success_count > 0)
         OR (p_status = 'not_authentic' AND a.fail_count > 0))
    AND (v_search IS NULL
         OR a.numero_diplome ILIKE '%' || v_search || '%'
         OR coalesce(d.nom_complet, '') ILIKE '%' || v_search || '%')
  ORDER BY a.total DESC
  LIMIT v_limit;
END;
$$;

-- 4) Blocked IPs list + unblock
CREATE OR REPLACE FUNCTION public.get_blocked_ips()
RETURNS TABLE(ip text, total_blocks bigint, last_block timestamptz, last_unblock timestamptz, is_active boolean, last_user_agent text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_level(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  WITH blocks AS (
    SELECT v.ip,
           count(*)::bigint AS total_blocks,
           max(v.date_verification) AS last_block,
           (SELECT v2.user_agent FROM public.verification_logs v2
             WHERE v2.ip = v.ip AND v2.numero_diplome = '__BLOCKED__'
             ORDER BY v2.date_verification DESC LIMIT 1) AS last_user_agent
    FROM public.verification_logs v
    WHERE v.numero_diplome = '__BLOCKED__' AND v.ip IS NOT NULL
    GROUP BY v.ip
  ), unblocks AS (
    SELECT v.ip, max(v.date_verification) AS last_unblock
    FROM public.verification_logs v
    WHERE v.numero_diplome = '__UNBLOCK__' AND v.ip IS NOT NULL
    GROUP BY v.ip
  )
  SELECT b.ip, b.total_blocks, b.last_block, u.last_unblock,
         (b.last_block > now() - interval '10 minutes'
            AND (u.last_unblock IS NULL OR u.last_unblock < b.last_block)) AS is_active,
         b.last_user_agent
  FROM blocks b
  LEFT JOIN unblocks u USING (ip)
  ORDER BY b.last_block DESC
  LIMIT 500;
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_ip(p_ip text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ip text := NULLIF(trim(coalesce(p_ip, '')), '');
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_level(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF v_ip IS NULL THEN
    RAISE EXCEPTION 'IP required';
  END IF;

  INSERT INTO public.verification_logs (numero_diplome, success, ip, user_agent)
  VALUES ('__UNBLOCK__', true, v_ip, 'admin:' || auth.uid()::text);
END;
$$;

-- 5) Admin alerts table + trigger
CREATE TABLE IF NOT EXISTS public.admin_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,                  -- 'ip_blocked' | 'spike'
  ip text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  notified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.admin_alerts TO authenticated;
GRANT ALL ON public.admin_alerts TO service_role;

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read alerts" ON public.admin_alerts
  FOR SELECT TO authenticated
  USING (public.is_admin_level(auth.uid()));

CREATE POLICY "Admins update alerts" ON public.admin_alerts
  FOR UPDATE TO authenticated
  USING (public.is_admin_level(auth.uid()))
  WITH CHECK (public.is_admin_level(auth.uid()));

CREATE INDEX IF NOT EXISTS admin_alerts_created_at_idx ON public.admin_alerts (created_at DESC);

CREATE OR REPLACE FUNCTION public.tg_verification_logs_alerts()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_recent int;
BEGIN
  IF NEW.numero_diplome = '__BLOCKED__' THEN
    INSERT INTO public.admin_alerts (kind, ip, details)
    VALUES ('ip_blocked', NEW.ip, jsonb_build_object('user_agent', NEW.user_agent));
  ELSIF NEW.numero_diplome NOT IN ('__UNBLOCK__','__BLOCKED__') THEN
    -- Spike detection: >200 verifications in last 5 minutes globally
    SELECT count(*) INTO v_recent
      FROM public.verification_logs
     WHERE date_verification > now() - interval '5 minutes'
       AND numero_diplome NOT IN ('__BLOCKED__','__UNBLOCK__');
    IF v_recent >= 200 AND NOT EXISTS (
      SELECT 1 FROM public.admin_alerts
      WHERE kind = 'spike' AND created_at > now() - interval '15 minutes'
    ) THEN
      INSERT INTO public.admin_alerts (kind, details)
      VALUES ('spike', jsonb_build_object('count_5m', v_recent));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_logs_alerts ON public.verification_logs;
CREATE TRIGGER verification_logs_alerts
AFTER INSERT ON public.verification_logs
FOR EACH ROW EXECUTE FUNCTION public.tg_verification_logs_alerts();

-- Admin function to list alerts
CREATE OR REPLACE FUNCTION public.get_admin_alerts(p_limit int DEFAULT 100)
RETURNS TABLE(id uuid, kind text, ip text, details jsonb, notified boolean, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin_level(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT a.id, a.kind, a.ip, a.details, a.notified, a.created_at
  FROM public.admin_alerts a
  ORDER BY a.created_at DESC
  LIMIT greatest(1, least(coalesce(p_limit, 100), 500));
END;
$$;
