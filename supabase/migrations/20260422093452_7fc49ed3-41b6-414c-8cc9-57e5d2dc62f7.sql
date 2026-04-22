
-- Create the admin auth user only if it doesn't already exist.
-- We use auth.users directly because we need a deterministic, fixed credential
-- (no email link, no SMS) per the user's request.
DO $$
DECLARE
  admin_email TEXT := '7095658244@admin.bakery.local';
  admin_password TEXT := 'pass123';
  new_user_id UUID;
  existing_user_id UUID;
BEGIN
  SELECT id INTO existing_user_id FROM auth.users WHERE email = admin_email;

  IF existing_user_id IS NULL THEN
    new_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"phone":"7095658244","role":"admin"}'::jsonb,
      now(), now(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', admin_email),
      'email',
      new_user_id::text,
      now(), now(), now()
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Ensure the role is granted even if the auth user pre-existed
    INSERT INTO public.user_roles (user_id, role)
    VALUES (existing_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;
