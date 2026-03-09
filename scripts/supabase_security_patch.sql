-- Fix 1: Move btree_gist extension out of public schema to prevent unauthorized access
CREATE SCHEMA IF NOT EXISTS extensions;
ALTER EXTENSION btree_gist SET SCHEMA extensions;

-- Fix 2: Secure the get_price function against search_path manipulation
ALTER FUNCTION public.get_price SET search_path = public;
