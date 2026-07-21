-- Tabla de perfiles de usuario con roles
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Modificar tabla vehicles para agregar user_id
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Modificar tabla route_history para asegurar que tenga user_id
ALTER TABLE route_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_route_history_user_id ON route_history(user_id);

-- Habilitar RLS en user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_profiles
-- Los usuarios autenticados pueden leer su propio perfil
CREATE POLICY "users_can_view_own_profile" ON user_profiles FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Solo los admins pueden crear/perfiles
CREATE POLICY "admins_can_insert_profiles" ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Los usuarios pueden actualizar su propio perfil, los admins pueden actualizar cualquier perfil
CREATE POLICY "users_can_update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (auth.uid() = id OR EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Solo los admins pueden eliminar perfiles
CREATE POLICY "admins_can_delete_profiles" ON user_profiles FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Actualizar políticas RLS para vehicles
DROP POLICY IF EXISTS "select_vehicles" ON vehicles;
DROP POLICY IF EXISTS "insert_vehicles" ON vehicles;
DROP POLICY IF EXISTS "update_vehicles" ON vehicles;
DROP POLICY IF EXISTS "delete_vehicles" ON vehicles;

-- Admins pueden ver todos los vehículos, clientes solo los suyos
CREATE POLICY "select_vehicles" ON vehicles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

-- Admins pueden crear vehículos para cualquier usuario, clientes solo para sí mismos
CREATE POLICY "insert_vehicles" ON vehicles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

-- Admins pueden editar cualquier vehículo, clientes solo los suyos
CREATE POLICY "update_vehicles" ON vehicles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

-- Solo admins pueden eliminar vehículos, clientes no pueden eliminar
CREATE POLICY "delete_vehicles" ON vehicles FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Actualizar políticas RLS para route_history
DROP POLICY IF EXISTS "select_routes" ON route_history;
DROP POLICY IF EXISTS "insert_routes" ON route_history;
DROP POLICY IF EXISTS "delete_routes" ON route_history;

-- Admins pueden ver todas las rutas, clientes solo las suyas
CREATE POLICY "select_routes" ON route_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

-- Admins pueden crear rutas para cualquier usuario, clientes solo para sí mismos
CREATE POLICY "insert_routes" ON route_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
    OR user_id = auth.uid()
  );

-- Solo admins pueden eliminar rutas
CREATE POLICY "delete_routes" ON route_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Función para crear perfil automáticamente cuando se registra un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para obtener el rol del usuario actual
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role FROM user_profiles WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insertar un usuario admin por defecto (esto debe ejecutarse manualmente o mediante la UI de admin)
-- El password se debe establecer desde la UI de Supabase o mediante la API de auth
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, role) 
-- VALUES ('admin@cuba.com', crypt('admin123', gen_salt('bf')), now(), 'admin');
