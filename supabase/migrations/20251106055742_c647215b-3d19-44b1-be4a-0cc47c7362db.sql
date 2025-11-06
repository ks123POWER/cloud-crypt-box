-- Recreate handle_new_user function with correct implementation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  master_pass TEXT;
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- Generate unique master password (32 chars alphanumeric)
  master_pass := encode(gen_random_bytes(24), 'base64');
  master_pass := regexp_replace(master_pass, '[^a-zA-Z0-9]', '', 'g');
  master_pass := substring(master_pass, 1, 32);
  
  -- Insert master password
  INSERT INTO public.user_master_passwords (user_id, master_password)
  VALUES (NEW.id, master_pass);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;