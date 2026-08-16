-- Update subscription_status to use 'basic' instead of 'free'.
-- Coerce any value that is not 'pro' (including legacy 'free', null, or any
-- unexpected value) to 'basic' so the re-added CHECK constraint can never fail
-- on unmapped legacy data.
alter table public.users drop constraint if exists users_subscription_status_check;

update public.users set subscription_status = 'basic'
  where subscription_status is distinct from 'pro';

alter table public.users add constraint users_subscription_status_check
  check (subscription_status in ('basic', 'pro'));

alter table public.users alter column subscription_status set default 'basic';