-- Script para corregir funciones de colaboración
-- Este script repara cualquier problema con las funciones get_flow_collaborators e invite_collaborator_by_email.

-- Primero, vamos a obtener una versión mejorada del método para obtener el ID del usuario actual
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_user_id TEXT;
  profile_exists BOOLEAN;
BEGIN
  -- Obtener el ID de usuario desde el JWT
  jwt_user_id := (SELECT auth.jwt() ->> 'sub');
  
  -- Verificar que tenemos un ID
  IF jwt_user_id IS NULL THEN
    RAISE WARNING 'No user ID found in JWT token';
    -- Devolver NULO explícitamente si no hay token (el usuario no está autenticado)
    -- Esto asegura un comportamiento claro cuando el JWT no contiene un ID de usuario
    RETURN NULL;
  END IF;
  
  -- Verificar si existe un perfil para este usuario
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = jwt_user_id
  ) INTO profile_exists;
  
  -- Registrar la respuesta para depuración
  RAISE NOTICE 'Profile exists for user % = %', jwt_user_id, profile_exists;
  
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

-- Función mejorada para obtener colaboradores con manejo de errores adicional
-- (devuelve datos extendidos con información de perfil)
CREATE OR REPLACE FUNCTION get_flow_collaborators(flow_id_param UUID)
RETURNS TABLE (
  id UUID,
  flow_id UUID,
  user_id TEXT,
  email TEXT,
  permission_level TEXT,
  invited_at TIMESTAMPTZ,
  last_active TIMESTAMPTZ,
  display_name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id TEXT;
  is_owner BOOLEAN;
  flow_exists BOOLEAN;
BEGIN
  -- Obtener el ID del usuario actual desde profiles
  current_user_id := get_current_profile_id();
  
  -- Validar que el usuario está autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;
  
  -- Verificar que el flujo existe
  SELECT EXISTS (
    SELECT 1 FROM flows WHERE id = flow_id_param
  ) INTO flow_exists;
  
  IF NOT flow_exists THEN
    RAISE EXCEPTION 'Flow with ID % does not exist', flow_id_param;
  END IF;
  
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
    SELECT 
      fc.id,
      fc.flow_id,
      fc.user_id,
      fc.email,
      fc.permission_level,
      fc.invited_at,
      fc.last_active,
      p.display_name,
      p.avatar_url
    FROM flow_collaborators fc
    LEFT JOIN profiles p ON fc.user_id = p.id
    WHERE fc.flow_id = flow_id_param;
  ELSE
    RAISE EXCEPTION 'Not authorized to view collaborators for this flow';
  END IF;
END;
$$;

-- Versión mejorada de la función para invitar colaboradores por email
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
  flow_exists BOOLEAN;
BEGIN
  -- Obtener el ID del usuario actual desde profiles
  current_user_id := get_current_profile_id();
  
  -- Validar que el usuario está autenticado
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'No authenticated user found';
  END IF;
  
  -- Verificar que el flujo existe
  SELECT EXISTS (
    SELECT 1 FROM flows WHERE id = flow_id_param
  ) INTO flow_exists;
  
  IF NOT flow_exists THEN
    RAISE EXCEPTION 'Flow with ID % does not exist', flow_id_param;
  END IF;
  
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
    permission_level,
    invited_at
  ) 
  VALUES (
    flow_id_param, 
    user_id_from_email, 
    email_param, 
    permission_level_param,
    now()
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
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'error_code', SQLSTATE
    );
END;
$$; 