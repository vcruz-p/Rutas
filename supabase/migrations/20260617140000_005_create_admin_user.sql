-- Migration para crear usuario admin por defecto
-- Usuario: admin, Contraseña: admin

DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Verificar si ya existe el usuario admin
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE username = 'admin') THEN
    -- Crear usuario en auth.users con contraseña hasheada correctamente
    INSERT INTO auth.users (
      instance_id, 
      id, 
      aud, 
      role, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      recovery_sent_at, 
      last_sign_in_at, 
      raw_app_meta_data, 
      raw_user_meta_data, 
      created_at, 
      updated_at, 
      confirmation_token, 
      email_change, 
      email_change_token_new, 
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@cubarouteplanner.com',
      crypt('admin', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      '{"username": "admin", "role": "admin", "full_name": "Administrador"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;
    
    -- Crear perfil de usuario admin
    INSERT INTO public.user_profiles (id, username, email, role, full_name)
    VALUES (
      admin_user_id,
      'admin',
      'admin@cubarouteplanner.com',
      'admin',
      'Administrador'
    );
  END IF;
END $$;
