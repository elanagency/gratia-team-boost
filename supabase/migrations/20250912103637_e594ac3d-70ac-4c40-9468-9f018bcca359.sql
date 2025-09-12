-- Fix the stuck user by setting them to inactive
UPDATE profiles 
SET is_active = false 
WHERE (first_name = 'Silva' AND last_name = '2') 
   OR (first_name = 'Jose' AND last_name = 'Silva');