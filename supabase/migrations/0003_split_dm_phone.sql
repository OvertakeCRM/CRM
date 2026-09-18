-- Split the single decision-maker phone field into cell and work numbers.
alter table public.prospects rename column dm_phone to dm_phone_cell;
alter table public.prospects add column dm_phone_work text;
