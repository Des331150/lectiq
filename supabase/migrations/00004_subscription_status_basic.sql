-- Update subscription_status to use 'basic' instead of 'free'
alter table public.users drop constraint if exists users_subscription_status_check;

update public.users set subscription_status = 'basic' where subscription_status = 'free';

alter table public.users add constraint users_subscription_status_check
  check (subscription_status in ('basic', 'pro'));

alter table public.users alter column subscription_status set default 'basic';
