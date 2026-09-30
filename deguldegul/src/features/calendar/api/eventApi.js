import { supabase } from "../../../services/supabase";

export function fetchEvents(userId) {
  return supabase.from("degul_event").select(`
    event_id,title,application_open_at,application_deadline_at,event_at,location,content,created_by,created_at,
    images:degul_event_image(image_id,file_name,file_path,sort_no),
    participations:degul_event_participation(user_id,participation_status,user:user_id(name,nickname))
  `).eq("use_yn", "Y").order("event_at", { ascending: true }).then(({ data, error }) => ({
    data: (data || []).map((event) => ({ ...event, images: [...(event.images || [])].sort((a,b) => a.sort_no-b.sort_no), my_status: event.participations?.find((item) => item.user_id === userId)?.participation_status || null })), error,
  }));
}

export function createEvent(payload) {
  return supabase.from("degul_event").insert(payload).select("event_id").single();
}

export function updateEvent(eventId, payload) {
  return supabase.from("degul_event").update({ ...payload, updated_at: new Date().toISOString() }).eq("event_id", eventId);
}

export function deleteEvent(eventId) {
  return supabase.from("degul_event").update({ use_yn: "N", updated_at: new Date().toISOString() }).eq("event_id", eventId);
}

export async function uploadEventImages(eventId, files) {
  for (const [index, file] of files.entries()) {
    const extension = file.name.split(".").pop();
    const path = `${eventId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("event").upload(path, file);
    if (uploadError) throw uploadError;
    const { error } = await supabase.from("degul_event_image").insert({ event_id: eventId, file_name: file.name, file_path: path, sort_no: index });
    if (error) throw error;
  }
}

export function getEventImageUrl(path) { return supabase.storage.from("event").getPublicUrl(path).data.publicUrl; }
export function saveEventParticipation(eventId, userId, status) {
  return supabase.from("degul_event_participation").upsert({ event_id: eventId, user_id: userId, participation_status: status, updated_at: new Date().toISOString() }, { onConflict: "event_id,user_id" });
}
