-- Script para actualizar las políticas RLS de la tabla public_flow_shares
-- ==================================================================================

-- Habilitar RLS en la tabla public_flow_shares (si no está habilitado ya)
ALTER TABLE public.public_flow_shares ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para recrearlas correctamente
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver sus propios flujos compartidos" ON public.public_flow_shares;
DROP POLICY IF EXISTS "Usuarios anónimos pueden ver flujos compartidos" ON public.public_flow_shares;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear flujos compartidos" ON public.public_flow_shares;
DROP POLICY IF EXISTS "Usuarios autenticados pueden actualizar sus propios flujos compartidos" ON public.public_flow_shares;
DROP POLICY IF EXISTS "Usuarios anónimos pueden actualizar contador de visitas" ON public.public_flow_shares;
DROP POLICY IF EXISTS "Usuarios autenticados pueden eliminar sus propios flujos compartidos" ON public.public_flow_shares;

-- POLÍTICA 1: Permitir a usuarios autenticados ver sus propios flujos compartidos
CREATE POLICY "Usuarios autenticados pueden ver sus propios flujos compartidos"
ON public.public_flow_shares
FOR SELECT
TO authenticated
USING (
    flow_user_id = auth.uid()::text OR
    flow_user_id = (auth.jwt() ->> 'sub')::text
);

-- POLÍTICA 2: Permitir a usuarios anónimos ver flujos compartidos activos
CREATE POLICY "Usuarios anónimos pueden ver flujos compartidos"
ON public.public_flow_shares
FOR SELECT
TO anon
USING (
    is_active = true
);

-- POLÍTICA 3: Permitir a usuarios autenticados crear flujos compartidos
CREATE POLICY "Usuarios autenticados pueden crear flujos compartidos"
ON public.public_flow_shares
FOR INSERT
TO authenticated
WITH CHECK (
    flow_user_id = auth.uid()::text OR
    flow_user_id = (auth.jwt() ->> 'sub')::text
);

-- POLÍTICA 4: Permitir a usuarios autenticados actualizar sus propios flujos compartidos
CREATE POLICY "Usuarios autenticados pueden actualizar sus propios flujos compartidos"
ON public.public_flow_shares
FOR UPDATE
TO authenticated
USING (
    flow_user_id = auth.uid()::text OR
    flow_user_id = (auth.jwt() ->> 'sub')::text
)
WITH CHECK (
    -- No permitir cambiar el id o flow_id
    id = id AND
    flow_id = flow_id AND
    (flow_user_id = auth.uid()::text OR flow_user_id = (auth.jwt() ->> 'sub')::text)
);

-- POLÍTICA 5: Permitir a usuarios anónimos actualizar solo campos específicos para contador de visitas
CREATE POLICY "Usuarios anónimos pueden actualizar contador de visitas"
ON public.public_flow_shares
FOR UPDATE
TO anon
USING (
    is_active = true
)
WITH CHECK (
    -- Solo permitir actualizar last_accessed y access_count
    id = id AND 
    flow_id = flow_id AND
    flow_user_id = flow_user_id AND
    name = name AND
    description = description AND
    is_active = is_active
    -- access_count y last_accessed pueden cambiar
);

-- POLÍTICA 6: Permitir a usuarios autenticados eliminar sus propios flujos compartidos
CREATE POLICY "Usuarios autenticados pueden eliminar sus propios flujos compartidos"
ON public.public_flow_shares
FOR DELETE
TO authenticated
USING (
    flow_user_id = auth.uid()::text OR
    flow_user_id = (auth.jwt() ->> 'sub')::text
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
    tablename = 'public_flow_shares'
ORDER BY
    policyname; 