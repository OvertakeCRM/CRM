-- Adjust auto-follow-up offsets: give most stages more breathing room, but
-- keep the tight follow-ups where speed matters most (right after a visit,
-- and right after a prospect shows interest), and don't suggest a date at
-- all when a prospect is first added as "Not Visited" — there's nothing to
-- follow up on yet.
create or replace function public.change_prospect_stage(
  p_prospect_id uuid,
  p_new_stage text,
  p_note text default null,
  p_loss_reason text default null
)
returns void
language plpgsql
as $$
declare
  v_old_stage text;
  v_followup_offset int;
begin
  select stage into v_old_stage from public.prospects where id = p_prospect_id;

  v_followup_offset := case p_new_stage
    when 'not_visited' then null
    when 'visited' then 2
    when 'contacted' then 3
    when 'decision_maker_engaged' then 7
    when 'interested_qualified' then 5
    when 'proposal_sent' then 7
    when 'negotiating' then 9
    else null
  end;

  update public.prospects
  set stage = p_new_stage,
      loss_reason = case when p_new_stage = 'lost' then p_loss_reason else null end,
      next_follow_up_date = case
        when v_followup_offset is not null then (current_date + v_followup_offset)
        else null
      end,
      updated_at = now()
  where id = p_prospect_id;

  insert into public.activity_log (prospect_id, rep_id, type, old_stage, new_stage, note)
  values (p_prospect_id, auth.uid(), 'stage_change', v_old_stage, p_new_stage, p_note);
end;
$$;
