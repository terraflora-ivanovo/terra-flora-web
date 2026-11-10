-- Разрешаем добавлять, изменять и удалять фото в бакете product-images
CREATE POLICY "Allow public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
CREATE POLICY "Allow public update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
CREATE POLICY "Allow public delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');