-- Script para verificar el mecanismo de autenticación y las políticas RLS en Supabase
-- ==================================================================================

-- 1. Verificar si auth.uid() y auth.jwt() -> 'sub' devuelven el mismo valor
DO $$
DECLARE
    auth_uid text;
    auth_jwt_sub text;
BEGIN
    -- Este código debe ejecutarse con un token de autenticación válido
    -- Capturar los valores actuales (si se ejecuta autenticado)
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

    -- Registrar los resultados
    RAISE NOTICE 'Verificación de autenticación:';
    RAISE NOTICE '- auth.uid() = %', auth_uid;
    RAISE NOTICE '- auth.jwt() ->> ''sub'' = %', auth_jwt_sub;
    
    -- Comprobar si coinciden
    IF auth_uid IS NOT NULL AND auth_jwt_sub IS NOT NULL THEN
        IF auth_uid = auth_jwt_sub THEN
            RAISE NOTICE '✅ Los valores coinciden. La autenticación debería funcionar correctamente.';
        ELSE
            RAISE NOTICE '❌ Los valores NO coinciden. Esto podría causar problemas con las políticas RLS.';
        END IF;
    ELSE
        RAISE NOTICE '❓ No se pudo determinar si los valores coinciden. Este script debe ejecutarse autenticado.';
    END IF;
END $$;

-- 2. Mostrar todas las políticas RLS existentes en las tablas relevantes
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    p.polname AS policy_name,
    pg_get_expr(p.polqual, p.polrelid) AS policy_definition,
    CASE
        WHEN p.polpermissive THEN 'PERMISSIVE'
        ELSE 'RESTRICTIVE'
    END AS policy_type,
    CASE
        WHEN p.polcmd = 'r' THEN 'SELECT'
        WHEN p.polcmd = 'a' THEN 'INSERT'
        WHEN p.polcmd = 'w' THEN 'UPDATE'
        WHEN p.polcmd = 'd' THEN 'DELETE'
        WHEN p.polcmd = '*' THEN 'ALL'
    END AS command
FROM pg_policy p
JOIN pg_class c ON p.polrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
    AND c.relname IN ('flows', 'public_flow_shares')
ORDER BY n.nspname, c.relname, p.polname;

-- 3. Verificar si RLS está habilitado en las tablas relevantes
SELECT
    n.nspname AS schema_name,
    c.relname AS table_name,
    CASE
        WHEN c.relrowsecurity THEN '✅ Habilitado'
        ELSE '❌ Deshabilitado'
    END AS row_level_security,
    CASE
        WHEN c.relforcerowsecurity THEN '✅ Forzado para propietario'
        ELSE '❌ No forzado para propietario'
    END AS force_row_security
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
    AND c.relname IN ('flows', 'public_flow_shares')
ORDER BY n.nspname, c.relname;

-- 4. Verificar la estructura de la tabla flows
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'flows'
ORDER BY
    ordinal_position;

-- 5. Verificar la estructura de la tabla public_flow_shares
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_schema = 'public'
    AND table_name = 'public_flow_shares'
ORDER BY
    ordinal_position; 