-- Fix search_path for generate_master_password function
DROP FUNCTION IF EXISTS generate_master_password();

-- Create trigger on auth.users table to call existing handle_new_user function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();