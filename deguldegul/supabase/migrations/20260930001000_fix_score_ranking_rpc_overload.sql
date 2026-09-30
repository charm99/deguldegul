-- Avoid PostgREST ambiguity with the legacy varchar overload.
alter function public.get_score_ranking(text, integer)
  rename to get_score_ranking_since_reset;

revoke all on function public.get_score_ranking_since_reset(text, integer) from public;
grant execute on function public.get_score_ranking_since_reset(text, integer) to authenticated;
