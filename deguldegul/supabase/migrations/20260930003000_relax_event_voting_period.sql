-- Application dates describe the external competition and do not limit the app's attendance poll.
drop trigger if exists trg_enforce_event_application_period on public.degul_event_participation;
drop function if exists public.enforce_event_application_period();
