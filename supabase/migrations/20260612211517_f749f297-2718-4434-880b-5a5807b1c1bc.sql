
-- student-photos
CREATE POLICY "auth read student photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'student-photos');
CREATE POLICY "admin manage student photos"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'student-photos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'student-photos' AND public.has_role(auth.uid(), 'admin'));

-- teacher-photos
CREATE POLICY "auth read teacher photos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'teacher-photos');
CREATE POLICY "admin manage teacher photos"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'teacher-photos' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'teacher-photos' AND public.has_role(auth.uid(), 'admin'));

-- diplomas: lecture publique (vérification), écriture admin
CREATE POLICY "public read diplomas"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'diplomas');
CREATE POLICY "admin manage diplomas files"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'diplomas' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'diplomas' AND public.has_role(auth.uid(), 'admin'));
