-- Adds a per-prospect container price, so dashboard/CSV can show revenue
-- (containers/week * price/container), not just container counts.

alter table public.prospects
  add column price_per_container numeric;
