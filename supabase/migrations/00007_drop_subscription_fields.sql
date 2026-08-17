-- Remove billing/subscription fields: the product no longer has paid plans.
alter table public.users drop column if exists stripe_customer_id;
alter table public.users drop column if exists subscription_status;