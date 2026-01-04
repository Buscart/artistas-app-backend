-- Agregar columna work_experience a la tabla artists

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='artists' AND column_name='work_experience') THEN
        ALTER TABLE artists ADD COLUMN work_experience JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- Verificar que la columna fue agregada
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'artists'
  AND column_name = 'work_experience'
ORDER BY column_name;
