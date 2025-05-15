-- Migración: Sistema de colaboración en flujos
-- Descripción: Establece las tablas, funciones y políticas para colaboración en tiempo real

------------------------------------------------------------------------------
-- TABLAS
------------------------------------------------------------------------------

-- Tabla para gestionar colaboradores de flujos
CREATE TABLE IF NOT EXISTS public.flow_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- ID del usuario de la tabla profiles
  email TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'comment', 'edit')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ,
  UNIQUE (flow_id, user_id) -- Evitar duplicados
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_flow_collaborators_flow_id ON public.flow_collaborators(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_collaborators_user_id ON public.flow_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_collaborators_email ON public.flow_collaborators(email);

-- Tabla para seguimiento de presencia en tiempo real
CREATE TABLE IF NOT EXISTS public.flow_collaborators_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- ID del usuario de la tabla profiles
  current_position JSONB, -- Posición actual del cursor {x,y}
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (flow_id, user_id) -- Un registro por usuario por flujo
);

-- Índices para optimizar consultas de presencia
CREATE INDEX IF NOT EXISTS idx_flow_collaborators_presence_flow_id ON public.flow_collaborators_presence(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_collaborators_presence_user_id ON public.flow_collaborators_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_collaborators_presence_last_active ON public.flow_collaborators_presence(last_active);

-- Tabla para comentarios en flujos
CREATE TABLE IF NOT EXISTS public.flow_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, -- ID del usuario de la tabla profiles
  content TEXT NOT NULL,
  position JSONB NOT NULL, -- Posición del comentario {x,y}
  parent_id UUID REFERENCES public.flow_comments(id) ON DELETE CASCADE, -- Para comentarios anidados
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para optimizar consultas de comentarios
CREATE INDEX IF NOT EXISTS idx_flow_comments_flow_id ON public.flow_comments(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_comments_user_id ON public.flow_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_flow_comments_parent_id ON public.flow_comments(parent_id);

------------------------------------------------------------------------------
-- MODIFICACIONES A LA TABLA FLOWS
------------------------------------------------------------------------------

-- Añadir campos para seguimiento de cambios colaborativos
ALTER TABLE public.flows 
ADD COLUMN IF NOT EXISTS last_collaborative_edit TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_updated_by TEXT,
ADD COLUMN IF NOT EXISTS change_id TEXT;

-- Trigger para actualizar el timestamp de último cambio colaborativo
CREATE OR REPLACE FUNCTION update_last_collaborative_edit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.last_collaborative_edit = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_collaborative_edit_trigger ON public.flows;
CREATE TRIGGER update_collaborative_edit_trigger
BEFORE UPDATE ON public.flows
FOR EACH ROW
WHEN (NEW.last_updated_by IS NOT NULL)
EXECUTE FUNCTION update_last_collaborative_edit();

------------------------------------------------------------------------------
-- SEGURIDAD RLS
------------------------------------------------------------------------------

-- Activar RLS en todas las tablas
ALTER TABLE public.flow_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_collaborators_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_comments ENABLE ROW LEVEL SECURITY;

-- Función auxiliar para obtener el ID del usuario actual desde profiles
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  jwt_user_id TEXT;
  profile_exists BOOLEAN;
BEGIN
  -- Obtener el ID de usuario desde el JWT
  jwt_user_id := (SELECT auth.jwt() ->> 'sub');
  
  -- Verificar si existe un perfil para este usuario
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = jwt_user_id
  ) INTO profile_exists;
  
  -- Si existe un perfil, usamos ese ID, de lo contrario devolvemos el ID del JWT
  IF profile_exists THEN
    RETURN jwt_user_id;
  ELSE
    -- Registrar que no encontramos un perfil (para diagnósticos)
    RAISE WARNING 'No profile found for user ID %, using JWT ID', jwt_user_id;
    RETURN jwt_user_id;
  END IF;
END;
$$;

-- Políticas para flow_collaborators

-- Los propietarios del flujo pueden ver todos los colaboradores de sus flujos
CREATE POLICY "Flow owners can view collaborators"
ON public.flow_collaborators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.flows
    WHERE id = flow_collaborators.flow_id
    AND user_id = get_current_profile_id()
  )
);

-- Los propietarios del flujo pueden añadir colaboradores
CREATE POLICY "Flow owners can add collaborators"
ON public.flow_collaborators
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flows
    WHERE id = flow_collaborators.flow_id
    AND user_id = get_current_profile_id()
  )
);

-- Los propietarios del flujo pueden actualizar colaboradores
CREATE POLICY "Flow owners can update collaborators"
ON public.flow_collaborators
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.flows
    WHERE id = flow_collaborators.flow_id
    AND user_id = get_current_profile_id()
  )
);

-- Los propietarios del flujo pueden eliminar colaboradores
CREATE POLICY "Flow owners can delete collaborators"
ON public.flow_collaborators
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.flows
    WHERE id = flow_collaborators.flow_id
    AND user_id = get_current_profile_id()
  )
);

-- Los colaboradores pueden ver a otros colaboradores del mismo flujo
CREATE POLICY "Collaborators can view other collaborators"
ON public.flow_collaborators
FOR SELECT
USING (
  flow_id IN (
    SELECT flow_id FROM public.flow_collaborators
    WHERE user_id = get_current_profile_id()
  )
);

-- Políticas para flow_collaborators_presence

-- Los colaboradores pueden ver la presencia de otros en el mismo flujo
CREATE POLICY "Collaborators can view presence"
ON public.flow_collaborators_presence
FOR SELECT
USING (
  flow_id IN (
    SELECT flow_id FROM public.flow_collaborators
    WHERE user_id = get_current_profile_id()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.flows
    WHERE id = flow_collaborators_presence.flow_id
    AND user_id = get_current_profile_id()
  )
);

-- Los colaboradores pueden registrar/actualizar su propia presencia
CREATE POLICY "Users can update their own presence"
ON public.flow_collaborators_presence
FOR INSERT
WITH CHECK (
  user_id = get_current_profile_id()
  AND (
    flow_id IN (
      SELECT flow_id FROM public.flow_collaborators
      WHERE user_id = get_current_profile_id()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.flows
      WHERE id = flow_collaborators_presence.flow_id
      AND user_id = get_current_profile_id()
    )
  )
);

-- Los colaboradores pueden actualizar su propia presencia
CREATE POLICY "Users can update their own presence record"
ON public.flow_collaborators_presence
FOR UPDATE
USING (
  user_id = get_current_profile_id()
);

-- Políticas para flow_comments

-- Los propietarios y colaboradores pueden ver comentarios
CREATE POLICY "Flow owners and collaborators can view comments"
ON public.flow_comments
FOR SELECT
USING (
  flow_id IN (
    SELECT flow_id FROM public.flow_collaborators
    WHERE user_id = get_current_profile_id()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.flows
    WHERE id = flow_comments.flow_id
    AND user_id = get_current_profile_id()
  )
);

-- Los colaboradores con permiso al menos de comentar pueden añadir comentarios
CREATE POLICY "Collaborators can add comments"
ON public.flow_comments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flow_collaborators
    WHERE flow_id = flow_comments.flow_id
    AND user_id = get_current_profile_id()
    AND permission_level IN ('comment', 'edit')
  )
  OR
  EXISTS (
    SELECT 1 FROM public.flows
    WHERE id = flow_comments.flow_id
    AND user_id = get_current_profile_id()
  )
);

-- Los usuarios pueden editar sus propios comentarios
CREATE POLICY "Users can edit their own comments"
ON public.flow_comments
FOR UPDATE
USING (
  user_id = get_current_profile_id()
);

-- Los usuarios pueden eliminar sus propios comentarios
CREATE POLICY "Users can delete their own comments"
ON public.flow_comments
FOR DELETE
USING (
  user_id = get_current_profile_id()
);

-- Políticas para la tabla flows (complementando las existentes)

-- Los colaboradores con permiso de edición pueden actualizar un flujo
CREATE POLICY "Collaborators can edit shared flows"
ON public.flows
FOR UPDATE
USING (
  id IN (
    SELECT flow_id FROM public.flow_collaborators 
    WHERE user_id = get_current_profile_id() 
    AND permission_level = 'edit'
  )
);

-- Los colaboradores con cualquier permiso pueden ver un flujo
CREATE POLICY "Collaborators can view shared flows"
ON public.flows
FOR SELECT
USING (
  id IN (
    SELECT flow_id FROM public.flow_collaborators 
    WHERE user_id = get_current_profile_id()
  )
);

------------------------------------------------------------------------------
-- FUNCIONES DE UTILIDAD
------------------------------------------------------------------------------

-- Función para invitar a un colaborador por email
CREATE OR REPLACE FUNCTION invite_collaborator_by_email(
  flow_id_param UUID,
  email_param TEXT,
  permission_level_param TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flow_record RECORD;
  current_user_id TEXT;
  user_id_from_email TEXT;
  collaborator_id UUID;
BEGIN
  -- Obtener el ID del usuario actual desde profiles
  current_user_id := get_current_profile_id();
  
  -- Verificar que el flujo existe y pertenece al usuario actual
  SELECT * INTO flow_record FROM flows 
  WHERE id = flow_id_param AND user_id = current_user_id;
  
  IF flow_record.id IS NULL THEN
    RAISE EXCEPTION 'Flow not found or not owned by the current user';
  END IF;
  
  -- Intentar encontrar el ID del usuario a través del email en profiles
  SELECT id INTO user_id_from_email 
  FROM profiles 
  WHERE email = email_param LIMIT 1;
  
  -- Si no se encuentra el usuario, usar un ID temporal
  IF user_id_from_email IS NULL THEN
    user_id_from_email = 'pending_' || email_param;
  END IF;
  
  -- Insertar o actualizar el colaborador
  INSERT INTO flow_collaborators (
    flow_id, 
    user_id, 
    email, 
    permission_level
  ) 
  VALUES (
    flow_id_param, 
    user_id_from_email, 
    email_param, 
    permission_level_param
  )
  ON CONFLICT (flow_id, user_id) 
  DO UPDATE SET 
    permission_level = permission_level_param,
    invited_at = now()
  RETURNING id INTO collaborator_id;
  
  -- Devolver el resultado
  RETURN jsonb_build_object(
    'success', true,
    'collaborator_id', collaborator_id,
    'email', email_param,
    'permission_level', permission_level_param
  );
END;
$$;

-- Función para obtener colaboradores de un flujo con información de perfil
CREATE OR REPLACE FUNCTION get_flow_collaborators(flow_id_param UUID)
RETURNS SETOF flow_collaborators
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT;
  is_owner BOOLEAN;
BEGIN
  -- Obtener el ID del usuario actual desde profiles
  current_user_id := get_current_profile_id();
  
  -- Comprobar si el usuario es propietario del flujo
  SELECT EXISTS (
    SELECT 1 FROM flows 
    WHERE id = flow_id_param AND user_id = current_user_id
  ) INTO is_owner;
  
  -- Si es propietario o colaborador, devolver los colaboradores
  IF is_owner OR EXISTS (
    SELECT 1 FROM flow_collaborators 
    WHERE flow_id = flow_id_param AND user_id = current_user_id
  ) THEN
    RETURN QUERY 
    SELECT fc.* 
    FROM flow_collaborators fc
    WHERE fc.flow_id = flow_id_param;
  ELSE
    RAISE EXCEPTION 'Not authorized to view collaborators for this flow';
  END IF;
  
  RETURN;
END;
$$;

-- Función para registrar o actualizar presencia en un flujo
CREATE OR REPLACE FUNCTION register_flow_presence(
  flow_id_param UUID,
  position_param JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT;
  presence_id UUID;
  can_access BOOLEAN;
BEGIN
  -- Obtener el ID del usuario actual desde profiles
  current_user_id := get_current_profile_id();
  
  -- Comprobar si el usuario tiene acceso al flujo
  SELECT EXISTS (
    SELECT 1 FROM flows 
    WHERE id = flow_id_param AND user_id = current_user_id
  ) OR EXISTS (
    SELECT 1 FROM flow_collaborators 
    WHERE flow_id = flow_id_param AND user_id = current_user_id
  ) INTO can_access;
  
  IF NOT can_access THEN
    RAISE EXCEPTION 'Not authorized to register presence for this flow';
  END IF;
  
  -- Insertar o actualizar presencia
  INSERT INTO flow_collaborators_presence (
    flow_id,
    user_id,
    current_position,
    last_active
  )
  VALUES (
    flow_id_param,
    current_user_id,
    position_param,
    now()
  )
  ON CONFLICT (flow_id, user_id)
  DO UPDATE SET
    current_position = CASE 
      WHEN position_param IS NOT NULL THEN position_param 
      ELSE flow_collaborators_presence.current_position 
    END,
    last_active = now()
  RETURNING id INTO presence_id;
  
  -- También actualizar la última actividad en flow_collaborators si existe
  UPDATE flow_collaborators
  SET last_active = now()
  WHERE flow_id = flow_id_param AND user_id = current_user_id;
  
  -- Devolver resultado
  RETURN jsonb_build_object(
    'success', true,
    'presence_id', presence_id,
    'flow_id', flow_id_param,
    'timestamp', now()
  );
END;
$$; 