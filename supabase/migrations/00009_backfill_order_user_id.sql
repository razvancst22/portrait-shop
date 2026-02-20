-- Backfill user_id for orders where customer_email matches auth user.
-- Makes past guest orders appear in My Account for users who later signed up.

UPDATE orders o
SET user_id = u.id
FROM auth.users u
WHERE o.user_id IS NULL
  AND o.customer_email IS NOT NULL
  AND LOWER(TRIM(o.customer_email)) = LOWER(TRIM(u.email));
