-- Script para actualizar las políticas RLS de la tabla flows
-- ==================================================================================

-- Habilitar RLS en la tabla flows (si no está habilitado ya)
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas correctamente
DROP POLICY IF EXISTS "Users can view their own flows" ON public.flows;
DROP POLICY IF EXISTS "Users can create their own flows" ON public.flows;
DROP POLICY IF EXISTS "Users can update their own flows" ON public.flows;
DROP POLICY IF EXISTS "Users can delete their own flows" ON public.flows;
DROP POLICY IF EXISTS "Permitir SELECT a usuarios autenticados para sus propios flujos" ON public.flows;
DROP POLICY IF EXISTS "Permitir INSERT a usuarios autenticados" ON public.flows;
DROP POLICY IF EXISTS "Permitir UPDATE a usuarios autenticados para sus propios flujos" ON public.flows;
DROP POLICY IF EXISTS "Permitir DELETE a usuarios autenticados para sus propios flujos" ON public.flows;

-- NOTA IMPORTANTE:
-- Verificar que auth.uid() devuelve el mismo valor que auth.jwt() ->> 'sub'
-- Si no coinciden, ajustar las políticas para usar el valor correcto
-- Si auth.jwt() ->> 'sub' es lo que Clerk usa, entonces necesitamos incluir ambos

-- Verificar los valores actuales para diagnóstico
DO $$
DECLARE
    auth_uid text;
    auth_jwt_sub text;
BEGIN
    -- Capturar valores (esto funcionará solo si se ejecuta autenticado)
    BEGIN
        auth_uid := auth.uid()::text;
        EXCEPTION WHEN OTHERS THEN
            auth_uid := NULL;
    END;
    
    BEGIN
        auth_jwt_sub := (auth.jwt() ->> 'sub')::text;
        EXCEPTION WHEN OTHERS THEN
            auth_jwt_sub := NULL;
    END;

    -- Registrar resultados
    RAISE NOTICE 'Verificación de autenticación:';
    RAISE NOTICE '- auth.uid() = %', auth_uid;
    RAISE NOTICE '- auth.jwt() ->> ''sub'' = %', auth_jwt_sub;
    
    -- Verificar coincidencia
    IF auth_uid IS NOT NULL AND auth_jwt_sub IS NOT NULL THEN
        IF auth_uid = auth_jwt_sub THEN
            RAISE NOTICE '✅ Los valores coinciden. La autenticación debería funcionar correctamente.';
        ELSE
            RAISE NOTICE '❌ Los valores NO coinciden. Se usarán políticas que acepten ambos valores.';
        END IF;
    ELSE
        RAISE NOTICE '❓ No se pudo determinar coincidencia. Ejecute este script autenticado para diagnóstico completo.';
    END IF;
END $$;

-- POLÍTICA 1: Permitir SELECT (lectura) de flujos propios
CREATE POLICY "Permitir SELECT a usuarios autenticados para sus propios flujos"
ON public.flows
FOR SELECT
USING (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'sub')::text = user_id
);

-- POLÍTICA 2: Permitir INSERT (creación) de flujos propios
CREATE POLICY "Permitir INSERT a usuarios autenticados"
ON public.flows
FOR INSERT
WITH CHECK (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'sub')::text = user_id
);

-- POLÍTICA 3: Permitir UPDATE (actualización) de flujos propios
CREATE POLICY "Permitir UPDATE a usuarios autenticados para sus propios flujos"
ON public.flows
FOR UPDATE
USING (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'sub')::text = user_id
)
WITH CHECK (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'sub')::text = user_id
);

-- POLÍTICA 4: Permitir DELETE (eliminación) de flujos propios
CREATE POLICY "Permitir DELETE a usuarios autenticados para sus propios flujos"
ON public.flows
FOR DELETE
USING (
    auth.uid()::text = user_id OR
    (auth.jwt() ->> 'sub')::text = user_id
);

-- Verificar las políticas creadas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    tablename = 'flows'
ORDER BY
    policyname; 