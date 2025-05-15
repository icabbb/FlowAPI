"""-- Base de Datos Inicial - Esquema Consolidado
-- Version: 1.0
-- Descripcion: Script completo para crear todas las tablas, funciones,
-- politicas RLS y triggers para la aplicacion de flujos colaborativos.

------------------------------------------------------------------------------
-- EXTENSIONES (si son necesarias y no estan habilitadas por defecto)
------------------------------------------------------------------------------
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Para uuid_generate_v4()
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Para gen_random_uuid() (generalmente disponible en Supabase)

------------------------------------------------------------------------------
-- FUNCION AUXILIAR PRINCIPAL: OBTENER ID DE PERFIL DEL USUARIO ACTUAL
------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_current_profile_id()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  jwt_sub TEXT;
  profile_id_val TEXT;
BEGIN
  -- Obtener el 'sub' (subject, que es el user_id de Clerk) del JWT.
  jwt_sub := (SELECT auth.jwt() ->> 'sub');

  IF jwt_sub IS NULL THEN
    -- RAISE WARNING 'JWT o sub (user_id) es NULL. No se puede identificar al usuario.';
    RETURN NULL;
  END IF;

  -- Verificar si el usuario existe en la tabla de perfiles.
  SELECT id INTO profile_id_val FROM public.profiles WHERE id = jwt_sub;

  IF profile_id_val IS NULL THEN
    -- RAISE WARNING 'No se encontro un perfil para el user_id: %. El usuario debe tener un perfil para esta operacion.', jwt_sub;
    RETURN NULL;
  END IF;

  RETURN profile_id_val;
EXCEPTION
  WHEN others THEN
    -- RAISE WARNING 'Error inesperado en get_current_profile_id: %', SQLERRM;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION get_current_profile_id() IS 'Obtiene el ID de perfil del usuario actual autenticado (desde JWT y verificado contra la tabla profiles). Devuelve NULL si no se puede identificar o no existe el perfil.';

------------------------------------------------------------------------------
-- TABLA: profiles
-- Almacena informacion publica de los usuarios, sincronizada con Clerk.
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,  -- Coincide con el user_id de Clerk
  display_name TEXT,
  username TEXT,
  avatar_url TEXT,
  email TEXT UNIQUE,    -- Email debe ser unico
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Perfiles para usuarios de la aplicacion, sincronizados con Clerk. El ID es el user_id de Clerk.';
COMMENT ON COLUMN public.profiles.id IS 'ID del usuario (Clerk user_id).';
COMMENT ON COLUMN public.profiles.email IS 'Email del usuario, debe ser unico.';

-- Indices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email_lookup ON public.profiles(email); -- Ya existe indice por UNIQUE constraint, pero puede ser explicito.

-- Funcion y Trigger para actualizar 'updated_at' en profiles
CREATE OR REPLACE FUNCTION public.handle_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_profile_updated_at ON public.profiles;
CREATE TRIGGER trigger_profile_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_profile_updated_at();

-- RLS para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Funcion auxiliar simple para politicas de profiles (directamente el sub del JWT)
CREATE OR REPLACE FUNCTION internal_get_jwt_sub()
RETURNS TEXT LANGUAGE sql STABLE SECURITY DEFINER AS $$ SELECT auth.jwt() ->> 'sub'; $$;

COMMENT ON FUNCTION internal_get_jwt_sub() IS 'Funcion interna para RLS de profiles: obtiene el sub del JWT.';

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (id = internal_get_jwt_sub());

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (id = internal_get_jwt_sub());

-- No se permite DELETE en profiles por ahora para mantener la integridad referencial.
-- CREATE POLICY "Users can delete their own profile"
--   ON public.profiles FOR DELETE USING (id = internal_get_jwt_sub());

------------------------------------------------------------------------------
-- TABLA: public_flow_shares
-- Gestiona los enlaces publicos para compartir flujos.
-- ASUNCION: Opción A - Esta tabla TIENE una columna 'flow_user_id'.
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.public_flow_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL, -- Se referenciara despues de crear la tabla flows
  flow_user_id TEXT NOT NULL, -- ID del propietario del flujo (desde profiles.id)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed TIMESTAMPTZ
  -- No se añade FK a flows aqui para evitar dependencia circular inicial, se añade despues.
  -- No se añade FK a profiles aqui para flow_user_id, se asume integridad por la logica de aplicacion
  -- o se puede añadir un FK si se desea mayor rigidez.
);

COMMENT ON TABLE public.public_flow_shares IS 'Gestiona enlaces publicos para compartir flujos de solo lectura.';
COMMENT ON COLUMN public.public_flow_shares.flow_user_id IS 'ID del usuario propietario del flujo original (referencia a profiles.id).';

-- Indices para public_flow_shares
CREATE INDEX IF NOT EXISTS idx_public_flow_shares_flow_id ON public.public_flow_shares(flow_id);
CREATE INDEX IF NOT EXISTS idx_public_flow_shares_flow_user_id ON public.public_flow_shares(flow_user_id);
CREATE INDEX IF NOT EXISTS idx_public_flow_shares_is_active ON public.public_flow_shares(is_active);

-- RLS para public_flow_shares
ALTER TABLE public.public_flow_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage their own shares"
  ON public.public_flow_shares
  FOR ALL -- SELECT, INSERT, UPDATE, DELETE
  USING (flow_user_id = get_current_profile_id())
  WITH CHECK (flow_user_id = get_current_profile_id());

CREATE POLICY "Anonymous users can view active shares"
  ON public.public_flow_shares
  FOR SELECT
  TO anon, authenticated -- Tambien los autenticados pueden verlos por esta via publica
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Politica para permitir actualizacion de contadores por un trigger/funcion (no directamente por anon)
-- Esta politica permite a la logica de aplicacion (o un trigger SECURITY DEFINER) actualizar contadores.
CREATE POLICY "Allow service or trigger to update access counts"
  ON public.public_flow_shares
  FOR UPDATE
  USING (true); -- La logica de actualizacion especifica debe estar en la aplicacion o trigger

-- Triggers para public_flow_shares
-- Funcion y Trigger para desactivar shares expirados (ejecutado en SELECT o por un job)
-- Esta funcion es mas para mantenimiento. La politica de SELECT ya filtra.
CREATE OR REPLACE FUNCTION public.handle_deactivate_expired_shares()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NOT NULL AND NEW.expires_at <= now() THEN
    NEW.is_active := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_deactivate_expired_shares ON public.public_flow_shares;
CREATE TRIGGER trigger_deactivate_expired_shares
  BEFORE INSERT OR UPDATE ON public.public_flow_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deactivate_expired_shares();

-- Funcion para actualizar contador de acceso (llamada por la aplicacion, no trigger directo en update por anon)
CREATE OR REPLACE FUNCTION public.increment_flow_share_access(share_id_param UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Importante para que pueda escribir aunque el usuario sea anonimo
AS $$
BEGIN
  UPDATE public.public_flow_shares
  SET 
    access_count = access_count + 1,
    last_accessed = now()
  WHERE id = share_id_param AND is_active = true AND (expires_at IS NULL OR expires_at > now());
END;
$$;
COMMENT ON FUNCTION public.increment_flow_share_access(UUID) IS 'Incrementa el contador de acceso y actualiza last_accessed para un share publico activo.';

------------------------------------------------------------------------------
-- TABLA: flows
-- Almacena la definicion de los flujos creados por los usuarios.
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Propietario del flujo
  name TEXT NOT NULL,
  description TEXT,
  collections TEXT, -- Podria ser un array o FK a otra tabla si se formaliza
  nodes JSONB DEFAULT '[]'::jsonb,
  edges JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  share_id UUID REFERENCES public.public_flow_shares(id) ON DELETE SET NULL, -- Enlace al share publico
  -- Campos para colaboracion
  last_collaborative_edit TIMESTAMPTZ,
  last_updated_by TEXT REFERENCES public.profiles(id) ON DELETE SET NULL, -- Quien hizo el ultimo cambio colaborativo
  change_id TEXT -- Un ID para rastrear conjuntos de cambios, si es necesario
);

COMMENT ON TABLE public.flows IS 'Define los flujos de trabajo, sus nodos y conexiones.';
COMMENT ON COLUMN public.flows.user_id IS 'ID del usuario propietario del flujo (referencia a profiles.id).';
COMMENT ON COLUMN public.flows.share_id IS 'ID del enlace publico asociado a este flujo (referencia a public_flow_shares.id).';
COMMENT ON COLUMN public.flows.last_updated_by IS 'ID del perfil del ultimo usuario que realizo una edicion colaborativa.';

-- Ahora que flows existe, podemos añadir el FK a public_flow_shares
ALTER TABLE public.public_flow_shares
ADD CONSTRAINT fk_public_flow_shares_flow_id
FOREIGN KEY (flow_id) REFERENCES public.flows(id) ON DELETE CASCADE;

ALTER TABLE public.public_flow_shares
ADD CONSTRAINT fk_public_flow_shares_flow_user_id
FOREIGN KEY (flow_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- Indices para flows
CREATE INDEX IF NOT EXISTS idx_flows_user_id ON public.flows(user_id);
CREATE INDEX IF NOT EXISTS idx_flows_collections ON public.flows(collections); -- Si se usa para filtrar
CREATE INDEX IF NOT EXISTS idx_flows_share_id ON public.flows(share_id);

-- Funcion y Trigger para actualizar 'updated_at' en flows
CREATE OR REPLACE FUNCTION public.handle_flow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  -- Si es un cambio colaborativo, tambien se actualiza last_collaborative_edit
  IF NEW.last_updated_by IS NOT NULL AND NEW.last_updated_by <> OLD.user_id THEN
     NEW.last_collaborative_edit = NEW.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_flow_updated_at ON public.flows;
CREATE TRIGGER trigger_flow_updated_at
  BEFORE UPDATE ON public.flows
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_flow_updated_at();

-- RLS para flows
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flow owners can manage their own flows"
  ON public.flows
  FOR ALL -- SELECT, INSERT, UPDATE, DELETE
  USING (user_id = get_current_profile_id())
  WITH CHECK (user_id = get_current_profile_id());

CREATE POLICY "Collaborators with edit permission can update shared flows"
  ON public.flows
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.flow_collaborators fc
      WHERE fc.flow_id = public.flows.id
        AND fc.user_id = get_current_profile_id()
        AND fc.permission_level = 'edit'
    )
  )
  WITH CHECK ( -- Adicionalmente, el check debe asegurar que no se cambia el propietario
    user_id = (SELECT f.user_id FROM public.flows f WHERE f.id = public.flows.id)
  );


CREATE POLICY "Collaborators (any permission) can view shared flows"
  ON public.flows
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.flow_collaborators fc
      WHERE fc.flow_id = public.flows.id
        AND fc.user_id = get_current_profile_id()
    )
  );

-- Politica para permitir SELECT de flujos que tienen un share_id activo (para public_flow_shares)
-- Esto es para que el servicio pueda obtener el flujo si el share es valido.
CREATE POLICY "Service can select flows that are actively shared"
  ON public.flows
  FOR SELECT -- Solo SELECT
  USING (
    EXISTS (
        SELECT 1
        FROM public.public_flow_shares pfs
        WHERE pfs.flow_id = public.flows.id
        AND pfs.is_active = true
        AND (pfs.expires_at IS NULL OR pfs.expires_at > now())
    )
  );


------------------------------------------------------------------------------
-- TABLA: flow_collaborators
-- Gestiona los permisos de colaboracion en los flujos.
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flow_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL, -- Email de invitacion, puede no coincidir con profiles.email si el usuario cambia su email
  permission_level TEXT NOT NULL CHECK (permission_level IN ('view', 'comment', 'edit')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ,
  UNIQUE (flow_id, user_id), -- Un permiso por usuario por flujo
  UNIQUE (flow_id, email) -- Una invitacion por email por flujo (mientras user_id no este seteado a un profile.id real)
);

COMMENT ON TABLE public.flow_collaborators IS 'Permisos de colaboracion en flujos para usuarios.';
COMMENT ON COLUMN public.flow_collaborators.user_id IS 'ID del usuario colaborador (referencia a profiles.id).';
COMMENT ON COLUMN public.flow_collaborators.email IS 'Email utilizado para la invitacion.';

-- Indices para flow_collaborators
CREATE INDEX IF NOT EXISTS idx_fc_flow_id ON public.flow_collaborators(flow_id);
CREATE INDEX IF NOT EXISTS idx_fc_user_id ON public.flow_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_fc_email ON public.flow_collaborators(email);

-- RLS para flow_collaborators
ALTER TABLE public.flow_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flow owners can manage collaborators"
  ON public.flow_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.flows f
      WHERE f.id = public.flow_collaborators.flow_id
        AND f.user_id = get_current_profile_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.flows f
      WHERE f.id = public.flow_collaborators.flow_id
        AND f.user_id = get_current_profile_id()
    )
  );

CREATE POLICY "Collaborators can view other collaborators of the same flow"
  ON public.flow_collaborators
  FOR SELECT
  USING (
    flow_id IN (
      SELECT fc.flow_id
      FROM public.flow_collaborators fc
      WHERE fc.user_id = get_current_profile_id()
    )
  );

------------------------------------------------------------------------------
-- TABLA: flow_collaborators_presence
-- Seguimiento de presencia en tiempo real para colaboradores.
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flow_collaborators_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_position JSONB, -- Posicion actual del cursor {x,y} o nodo seleccionado, etc.
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (flow_id, user_id) -- Un registro de presencia por usuario por flujo
);

COMMENT ON TABLE public.flow_collaborators_presence IS 'Presencia en tiempo real de colaboradores en un flujo.';

-- Indices para flow_collaborators_presence
CREATE INDEX IF NOT EXISTS idx_fcp_flow_id ON public.flow_collaborators_presence(flow_id);
CREATE INDEX IF NOT EXISTS idx_fcp_user_id ON public.flow_collaborators_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_fcp_last_active ON public.flow_collaborators_presence(last_active);

-- RLS para flow_collaborators_presence
ALTER TABLE public.flow_collaborators_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own presence record"
  ON public.flow_collaborators_presence
  FOR ALL -- Permite SELECT, INSERT, UPDATE, DELETE de su propio registro
  USING (user_id = get_current_profile_id())
  WITH CHECK (
    user_id = get_current_profile_id()
    AND -- Ademas, deben ser propietario o colaborador del flujo
    (
      EXISTS (SELECT 1 FROM public.flows f WHERE f.id = public.flow_collaborators_presence.flow_id AND f.user_id = get_current_profile_id())
      OR
      EXISTS (SELECT 1 FROM public.flow_collaborators fc WHERE fc.flow_id = public.flow_collaborators_presence.flow_id AND fc.user_id = get_current_profile_id())
    )
  );

CREATE POLICY "Owners and collaborators can view presence in their flows"
  ON public.flow_collaborators_presence
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.flows f WHERE f.id = public.flow_collaborators_presence.flow_id AND f.user_id = get_current_profile_id())
    OR
    EXISTS (SELECT 1 FROM public.flow_collaborators fc WHERE fc.flow_id = public.flow_collaborators_presence.flow_id AND fc.user_id = get_current_profile_id())
  );


------------------------------------------------------------------------------
-- TABLA: flow_comments
-- Comentarios realizados en los flujos.
------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flow_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES public.flows(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  position JSONB NOT NULL, -- Posicion del comentario en el canvas {x,y} o asociado a un nodo_id
  parent_id UUID REFERENCES public.flow_comments(id) ON DELETE CASCADE, -- Para respuestas/hilos
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.flow_comments IS 'Comentarios y discusiones sobre los flujos.';

-- Indices para flow_comments
CREATE INDEX IF NOT EXISTS idx_fcomm_flow_id ON public.flow_comments(flow_id);
CREATE INDEX IF NOT EXISTS idx_fcomm_user_id ON public.flow_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_fcomm_parent_id ON public.flow_comments(parent_id);

-- Funcion y Trigger para actualizar 'updated_at' en flow_comments
CREATE OR REPLACE FUNCTION public.handle_flow_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_flow_comment_updated_at ON public.flow_comments;
CREATE TRIGGER trigger_flow_comment_updated_at
  BEFORE UPDATE ON public.flow_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_flow_comment_updated_at();

-- RLS para flow_comments
ALTER TABLE public.flow_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and collaborators can view comments in their flows"
  ON public.flow_comments
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.flows f WHERE f.id = public.flow_comments.flow_id AND f.user_id = get_current_profile_id())
    OR
    EXISTS (SELECT 1 FROM public.flow_collaborators fc WHERE fc.flow_id = public.flow_comments.flow_id AND fc.user_id = get_current_profile_id())
  );

CREATE POLICY "Users can manage their own comments" -- Create, Update, Delete own comments
  ON public.flow_comments
  FOR ALL
  USING (user_id = get_current_profile_id()) -- Puede ver/actualizar/borrar sus propios comentarios
  WITH CHECK (
    user_id = get_current_profile_id()
    AND -- Ademas, para crear, debe ser propietario o colaborador con permiso 'comment' o 'edit'
    (
      EXISTS (SELECT 1 FROM public.flows f WHERE f.id = public.flow_comments.flow_id AND f.user_id = get_current_profile_id())
      OR
      EXISTS (
        SELECT 1 FROM public.flow_collaborators fc
        WHERE fc.flow_id = public.flow_comments.flow_id
          AND fc.user_id = get_current_profile_id()
          AND fc.permission_level IN ('comment', 'edit')
      )
    )
  );

------------------------------------------------------------------------------
-- FUNCIONES RPC (Stored Procedures)
------------------------------------------------------------------------------

-- Funcion para invitar a un colaborador por email
CREATE OR REPLACE FUNCTION invite_collaborator_by_email(
  flow_id_param UUID,
  email_param TEXT,
  permission_level_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoker_profile_id TEXT;
  target_profile_id TEXT;
  flow_owner_id TEXT;
  new_collaborator_id UUID;
  result JSONB;
BEGIN
  invoker_profile_id := get_current_profile_id();
  IF invoker_profile_id IS NULL THEN
    RAISE EXCEPTION 'Accion no autorizada: Se requiere autenticacion y perfil.';
  END IF;

  -- Verificar que el invocador es el propietario del flujo
  SELECT user_id INTO flow_owner_id FROM flows WHERE id = flow_id_param;
  IF flow_owner_id IS NULL THEN
    RAISE EXCEPTION 'Flujo no encontrado: %', flow_id_param;
  END IF;
  IF flow_owner_id <> invoker_profile_id THEN
    RAISE EXCEPTION 'Accion no autorizada: Solo el propietario del flujo puede invitar colaboradores.';
  END IF;

  -- Validar nivel de permiso
  IF permission_level_param NOT IN ('view', 'comment', 'edit') THEN
    RAISE EXCEPTION 'Nivel de permiso invalido: %', permission_level_param;
  END IF;

  -- Buscar el perfil del usuario invitado por email
  SELECT id INTO target_profile_id FROM profiles WHERE email = lower(trim(email_param));

  IF target_profile_id IS NOT NULL AND target_profile_id = invoker_profile_id THEN
    RAISE EXCEPTION 'No puedes invitarte a ti mismo como colaborador.';
  END IF;

  IF target_profile_id IS NULL THEN
    -- Usuario no tiene perfil, se crea una invitacion pendiente con el email
    -- Se podria manejar de otra forma, ej. no crear hasta que el usuario se registre.
    -- Por ahora, la columna user_id en flow_collaborators NO es FK directa a profiles.id
    -- sino que se actualiza cuando el usuario acepta. Esto permite invitaciones a emails no registrados.
    -- Esta version del script la hace FK, asi que el usuario DEBE existir.
    RAISE EXCEPTION 'Usuario con email % no encontrado en perfiles. El usuario debe registrarse primero.', email_param;
  END IF;
  
  -- Insertar o actualizar el colaborador
  INSERT INTO flow_collaborators (flow_id, user_id, email, permission_level, invited_at)
  VALUES (flow_id_param, target_profile_id, lower(trim(email_param)), permission_level_param, now())
  ON CONFLICT (flow_id, user_id) DO UPDATE SET
    permission_level = EXCLUDED.permission_level,
    email = EXCLUDED.email, -- Actualizar email por si cambia en el perfil
    invited_at = now() -- Reiniciar la fecha de invitacion si se actualiza el permiso
  RETURNING id INTO new_collaborator_id;

  result := jsonb_build_object(
    'success', true,
    'message', 'Colaborador invitado/actualizado exitosamente.',
    'collaborator_id', new_collaborator_id,
    'flow_id', flow_id_param,
    'user_id', target_profile_id,
    'email', email_param,
    'permission_level', permission_level_param
  );
  RETURN result;

EXCEPTION
  WHEN unique_violation THEN
    IF SQLERRM LIKE '%flow_collaborators_flow_id_email_key%' THEN
       RAISE EXCEPTION 'Ya existe una invitacion para este email en este flujo.';
    ELSE
       RAISE EXCEPTION 'Error de unicidad: %', SQLERRM;
    END IF;
  WHEN others THEN
    RAISE WARNING 'Error en invite_collaborator_by_email: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
COMMENT ON FUNCTION invite_collaborator_by_email(UUID, TEXT, TEXT) IS 'Invita a un usuario (por email existente en profiles) a colaborar en un flujo.';


-- Funcion para obtener colaboradores de un flujo (incluyendo datos del perfil)
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
STABLE
SECURITY DEFINER -- Para poder leer perfiles publicos aunque el RLS de profiles cambie.
SET search_path = public
AS $$
DECLARE
  invoker_profile_id TEXT;
  is_owner BOOLEAN;
  is_collaborator BOOLEAN;
BEGIN
  invoker_profile_id := get_current_profile_id();
  IF invoker_profile_id IS NULL THEN
    RAISE EXCEPTION 'Accion no autorizada: Se requiere autenticacion y perfil.';
  END IF;

  -- Verificar si el invocador es propietario o colaborador
  SELECT EXISTS (SELECT 1 FROM flows f WHERE f.id = flow_id_param AND f.user_id = invoker_profile_id) INTO is_owner;
  SELECT EXISTS (SELECT 1 FROM flow_collaborators fc WHERE fc.flow_id = flow_id_param AND fc.user_id = invoker_profile_id) INTO is_collaborator;

  IF NOT (is_owner OR is_collaborator) THEN
    RAISE EXCEPTION 'Accion no autorizada: Debes ser propietario o colaborador para ver la lista de colaboradores.';
  END IF;

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
  FROM
    flow_collaborators fc
    LEFT JOIN profiles p ON fc.user_id = p.id
  WHERE
    fc.flow_id = flow_id_param
  ORDER BY
    p.display_name ASC, fc.invited_at ASC;

END;
$$;
COMMENT ON FUNCTION get_flow_collaborators(UUID) IS 'Obtiene la lista de colaboradores de un flujo, incluyendo su nombre y avatar desde perfiles.';


-- Funcion para registrar o actualizar la presencia en un flujo
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
  invoker_profile_id TEXT;
  is_owner BOOLEAN;
  is_collaborator BOOLEAN;
  presence_id_val UUID;
BEGIN
  invoker_profile_id := get_current_profile_id();
  IF invoker_profile_id IS NULL THEN
    RAISE EXCEPTION 'Accion no autorizada: Se requiere autenticacion y perfil para registrar presencia.';
  END IF;

  -- Verificar si el invocador es propietario o colaborador
  SELECT EXISTS (SELECT 1 FROM flows f WHERE f.id = flow_id_param AND f.user_id = invoker_profile_id) INTO is_owner;
  SELECT EXISTS (SELECT 1 FROM flow_collaborators fc WHERE fc.flow_id = flow_id_param AND fc.user_id = invoker_profile_id) INTO is_collaborator;

  IF NOT (is_owner OR is_collaborator) THEN
    RAISE EXCEPTION 'Accion no autorizada: Debes ser propietario o colaborador para registrar presencia en este flujo.';
  END IF;

  INSERT INTO flow_collaborators_presence (flow_id, user_id, current_position, last_active)
  VALUES (flow_id_param, invoker_profile_id, position_param, now())
  ON CONFLICT (flow_id, user_id) DO UPDATE SET
    current_position = COALESCE(EXCLUDED.current_position, flow_collaborators_presence.current_position),
    last_active = now()
  RETURNING id INTO presence_id_val;

  -- Tambien actualizar last_active en la tabla flow_collaborators
  UPDATE flow_collaborators
  SET last_active = now()
  WHERE flow_id = flow_id_param AND user_id = invoker_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'presence_id', presence_id_val,
    'flow_id', flow_id_param,
    'user_id', invoker_profile_id,
    'timestamp', now()
  );

EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Error en register_flow_presence: %', SQLERRM;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
COMMENT ON FUNCTION register_flow_presence(UUID, JSONB) IS 'Registra o actualiza la presencia (posicion, ultima actividad) de un usuario en un flujo.';

-- Funcion para añadir un comentario a un flujo
CREATE OR REPLACE FUNCTION add_flow_comment(
    flow_id_param UUID,
    content_param TEXT,
    position_param JSONB,
    parent_id_param UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invoker_profile_id TEXT;
    is_owner BOOLEAN;
    collaborator_permission TEXT;
    new_comment_id UUID;
BEGIN
    invoker_profile_id := get_current_profile_id();
    IF invoker_profile_id IS NULL THEN
        RAISE EXCEPTION 'Accion no autorizada: Se requiere autenticacion y perfil para comentar.';
    END IF;

    -- Verificar si el invocador es propietario
    SELECT EXISTS (SELECT 1 FROM flows f WHERE f.id = flow_id_param AND f.user_id = invoker_profile_id) INTO is_owner;

    -- Obtener permiso si es colaborador
    IF NOT is_owner THEN
        SELECT permission_level INTO collaborator_permission 
        FROM flow_collaborators fc 
        WHERE fc.flow_id = flow_id_param AND fc.user_id = invoker_profile_id;
    END IF;

    IF NOT is_owner AND (collaborator_permission IS NULL OR collaborator_permission NOT IN ('comment', 'edit')) THEN
        RAISE EXCEPTION 'Accion no autorizada: Debes ser propietario o colaborador con permiso de comentar/editar.';
    END IF;
    
    IF char_length(content_param) = 0 OR char_length(content_param) > 2000 THEN
        RAISE EXCEPTION 'El contenido del comentario debe tener entre 1 y 2000 caracteres.';
    END IF;

    INSERT INTO flow_comments (flow_id, user_id, content, position, parent_id, created_at, updated_at)
    VALUES (flow_id_param, invoker_profile_id, content_param, position_param, parent_id_param, now(), now())
    RETURNING id INTO new_comment_id;

    RETURN jsonb_build_object(
        'success', true,
        'comment_id', new_comment_id,
        'flow_id', flow_id_param,
        'user_id', invoker_profile_id,
        'content', content_param,
        'position', position_param,
        'parent_id', parent_id_param,
        'created_at', now()
    );

EXCEPTION
    WHEN others THEN
        RAISE WARNING 'Error en add_flow_comment: %', SQLERRM;
        RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
COMMENT ON FUNCTION add_flow_comment(UUID, TEXT, JSONB, UUID) IS 'Añade un nuevo comentario a un flujo.';


-- Funcion para obtener comentarios de un flujo (con datos de perfil y conteo de respuestas)
CREATE OR REPLACE FUNCTION get_flow_comments(flow_id_param UUID)
RETURNS TABLE (
    id UUID,
    flow_id UUID,
    user_id TEXT,
    content TEXT,
    position JSONB,
    parent_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    display_name TEXT,
    avatar_url TEXT,
    reply_count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invoker_profile_id TEXT;
    is_owner BOOLEAN;
    is_collaborator BOOLEAN;
BEGIN
    invoker_profile_id := get_current_profile_id();
    IF invoker_profile_id IS NULL THEN
        RAISE EXCEPTION 'Accion no autorizada: Se requiere autenticacion y perfil para ver comentarios.';
    END IF;

    SELECT EXISTS (SELECT 1 FROM flows f WHERE f.id = flow_id_param AND f.user_id = invoker_profile_id) INTO is_owner;
    SELECT EXISTS (SELECT 1 FROM flow_collaborators fc WHERE fc.flow_id = flow_id_param AND fc.user_id = invoker_profile_id) INTO is_collaborator;

    IF NOT (is_owner OR is_collaborator) THEN
        RAISE EXCEPTION 'Accion no autorizada: Debes ser propietario o colaborador para ver comentarios.';
    END IF;

    RETURN QUERY
    SELECT
        c.id,
        c.flow_id,
        c.user_id,
        c.content,
        c.position,
        c.parent_id,
        c.created_at,
        c.updated_at,
        p.display_name,
        p.avatar_url,
        (SELECT COUNT(*) FROM flow_comments replies WHERE replies.parent_id = c.id) AS reply_count
    FROM
        flow_comments c
        LEFT JOIN profiles p ON c.user_id = p.id
    WHERE
        c.flow_id = flow_id_param
    ORDER BY
        c.created_at ASC;
END;
$$;
COMMENT ON FUNCTION get_flow_comments(UUID) IS 'Obtiene todos los comentarios de un flujo, incluyendo datos del perfil del autor y conteo de respuestas.';

------------------------------------------------------------------------------
-- FIN DEL SCRIPT
------------------------------------------------------------------------------
"" 