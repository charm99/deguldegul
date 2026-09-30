import { useEffect, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CheckIcon from "@mui/icons-material/Check";
import { createEvent, deleteEvent, fetchEvents, getEventImageUrl, saveEventParticipation, updateEvent, uploadEventImages } from "../../../features/calendar/api/eventApi";
import { koreanDateTimeLocalToUtcIso } from "../../../shared/utils/date";

const EMPTY_FORM = { title: "", application_open_at: "", application_deadline_at: "", event_at: "", location: "", content: "" };
const STATUS_BUTTONS = [{ value: "ATD", label: "참가예정", color: "primary" }, { value: "PND", label: "미정", color: "inherit" }, { value: "ABS", label: "참가안함", color: "error" }];

function EventTab({ profile }) {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const canManage = ["ADM", "MGR", "STF"].includes(profile?.role);

  const loadEvents = async () => {
    const { data, error } = await fetchEvents(profile?.id);
    if (error) setMessage(error.message || "이벤트를 불러오지 못했습니다.");
    else {
      const nextEvents = data || [];
      setMessage("");
      setEvents(nextEvents);
      setSelected((current) => current
        ? nextEvents.find((event) => event.event_id === current.event_id) || null
        : null);
    }
  };
  useEffect(() => { let active=true; fetchEvents(profile?.id).then(({data,error}) => { if (!active) return; if(error) setMessage(error.message); else setEvents(data || []); }); return () => { active=false; }; }, [profile?.id]);

  const submit = async () => {
    if (!form.title.trim() || !form.application_deadline_at || !form.event_at || !form.location.trim()) { alert("제목, 신청기한, 대회일시, 장소는 필수입니다."); return; }
    try {
      setSaving(true);
      const payload = { title: form.title.trim(), application_open_at: form.application_open_at ? koreanDateTimeLocalToUtcIso(form.application_open_at) : null, application_deadline_at: koreanDateTimeLocalToUtcIso(form.application_deadline_at), event_at: koreanDateTimeLocalToUtcIso(form.event_at), location: form.location.trim(), content: form.content.trim() };
      const { data, error } = editTarget
        ? await updateEvent(editTarget.event_id, payload).select("event_id").single()
        : await createEvent({ ...payload, created_by: profile.id });
      if (error) throw error;
      if (files.length) await uploadEventImages(data.event_id, files);
      setFormOpen(false); setEditTarget(null); setForm(EMPTY_FORM); setFiles([]); await loadEvents();
    } catch (error) { setMessage(error.message || "이벤트 등록에 실패했습니다."); }
    finally { setSaving(false); }
  };

  const vote = async (event, status) => {
    const applyStatus = (target) => {
      if (!target || target.event_id !== event.event_id) return target;
      const others = (target.participations || []).filter((item) => item.user_id !== profile.id);
      return {
        ...target,
        my_status: status,
        participations: [...others, {
          user_id: profile.id,
          participation_status: status,
          user: { name: profile.name, nickname: profile.nickname },
        }],
      };
    };

    setEvents((current) => current.map(applyStatus));
    setSelected(applyStatus);

    const { error } = await saveEventParticipation(event.event_id, profile.id, status);
    if (error) {
      alert(error.message);
      await loadEvents();
      return;
    }
    await loadEvents();
  };

  const openEdit = (event) => {
    setEditTarget(event);
    setForm({ title:event.title, application_open_at:toLocalInput(event.application_open_at), application_deadline_at:toLocalInput(event.application_deadline_at), event_at:toLocalInput(event.event_at), location:event.location, content:event.content || "" });
    setFiles([]); setSelected(null); setFormOpen(true);
  };
  const removeEvent = async (event) => {
    if (!confirm(`${event.title} 이벤트를 삭제할까요?`)) return;
    const { error } = await deleteEvent(event.event_id);
    if (error) { alert(error.message); return; }
    setSelected(null); await loadEvents();
  };

  return <Box sx={{ minHeight: "calc(100vh - 130px)", bgcolor: "#f7f7f8", p: 2, pb: 11 }}>
    {message && <Alert severity="error" sx={{ mb: 1.5 }}>{message}</Alert>}
    <Stack spacing={1.5}>{events.length ? events.map((event) => <EventCard key={event.event_id} event={event} onOpen={() => setSelected(event)} />) : <Card sx={{ borderRadius: 3, boxShadow: "none" }}><CardContent><Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>등록된 이벤트가 없습니다.</Typography></CardContent></Card>}</Stack>
    {canManage && <Fab color="primary" onClick={() => setFormOpen(true)} sx={{ position:"fixed", bottom:"calc(88px + env(safe-area-inset-bottom))", right:"max(20px, calc((100vw - 375px) / 2 + 20px))", zIndex:1200 }}><AddIcon /></Fab>}
    <EventDetail event={selected} canManage={canManage} onClose={() => setSelected(null)} onEdit={() => openEdit(selected)} onDelete={() => removeEvent(selected)} onVote={(status) => vote(selected, status)} />
    <Dialog open={formOpen} onClose={saving ? undefined : () => { setFormOpen(false); setEditTarget(null); }} fullWidth maxWidth="sm"><DialogTitle>{editTarget ? "이벤트 수정" : "이벤트 등록"}</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt:1 }}>
      <TextField label="제목" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} required />
      <TextField label="신청일시" type="datetime-local" value={form.application_open_at} onChange={(e)=>setForm({...form,application_open_at:e.target.value})} slotProps={{inputLabel:{shrink:true}}} />
      <TextField label="신청기한" type="datetime-local" value={form.application_deadline_at} onChange={(e)=>setForm({...form,application_deadline_at:e.target.value})} slotProps={{inputLabel:{shrink:true}}} required />
      <TextField label="대회일시" type="datetime-local" value={form.event_at} onChange={(e)=>setForm({...form,event_at:e.target.value})} slotProps={{inputLabel:{shrink:true}}} required />
      <TextField label="장소" value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} required />
      <TextField label="내용" value={form.content} onChange={(e)=>setForm({...form,content:e.target.value})} multiline minRows={4} />
      <Button component="label" variant="outlined">사진 여러 장 선택<input hidden type="file" accept="image/*" multiple onChange={(e)=>setFiles(Array.from(e.target.files || []))} /></Button>
      {files.length > 0 && <Typography variant="body2" color="text.secondary">선택한 사진 {files.length}장</Typography>}
    </Stack></DialogContent><DialogActions><Button onClick={()=>{setFormOpen(false);setEditTarget(null);}} disabled={saving}>취소</Button><Button variant="contained" onClick={submit} disabled={saving}>{saving ? "저장 중..." : "저장"}</Button></DialogActions></Dialog>
  </Box>;
}

function EventCard({ event, onOpen }) {
  const image = event.images?.[0];
  return <Card sx={{ borderRadius:3, boxShadow:"0 2px 10px rgba(0,0,0,.05)", cursor:"pointer" }}><CardContent onClick={onOpen} sx={{ p:1.75 }}>
    <Stack direction="row" spacing={1.5}><Box sx={{ flex:1, minWidth:0 }}><Chip label={registrationLabel(event)} size="small" color={isRegistrationOpen(event) ? "primary" : "default"} variant="outlined" sx={{ mb:1, height:22, fontSize:10 }} /><Typography fontWeight={900} sx={{ fontSize:17, wordBreak:"keep-all" }}>{event.title}</Typography><Info icon={<CalendarMonthOutlinedIcon />} label="신청일시" value={formatDateTime(event.application_open_at)} /><Info icon={<CalendarMonthOutlinedIcon />} label="신청마감" value={formatDateTime(event.application_deadline_at)} /><Info icon={<CalendarMonthOutlinedIcon />} label="대회일시" value={formatDateTime(event.event_at)} /><Info icon={<LocationOnOutlinedIcon />} label="장소" value={event.location} /></Box>{image && <Box component="img" src={getEventImageUrl(image.file_path)} alt="" sx={{ width:92, height:122, borderRadius:1.5, objectFit:"cover" }} />}</Stack>
  </CardContent></Card>;
}
function EventDetail({ event, canManage, onClose, onEdit, onDelete, onVote }) { const attendees=(event?.participations || []).filter((item)=>item.participation_status==="ATD"); return <Dialog open={Boolean(event)} onClose={onClose} fullWidth maxWidth="sm"><DialogTitle>{event?.title}</DialogTitle><DialogContent dividers>{event && <Stack spacing={2}>
  {event.images?.length > 0 && <Box sx={{ display:"flex", overflowX:"auto", scrollSnapType:"x mandatory", gap:1 }}>{event.images.map((image)=><Box key={image.image_id} component="img" src={getEventImageUrl(image.file_path)} alt={image.file_name} sx={{ width:"100%", flex:"0 0 100%", maxHeight:520, objectFit:"contain", borderRadius:2, scrollSnapAlign:"start", bgcolor:"#f5f5f5" }} />)}</Box>}
  <Info icon={<CalendarMonthOutlinedIcon />} label="신청기간" value={`${formatDateTime(event.application_open_at)} ~ ${formatDateTime(event.application_deadline_at)}`} /><Info icon={<CalendarMonthOutlinedIcon />} label="대회일시" value={formatDateTime(event.event_at)} /><Info icon={<LocationOnOutlinedIcon />} label="장소" value={event.location} />{event.content && <Typography sx={{ whiteSpace:"pre-wrap" }}>{event.content}</Typography>}
  <Box><Typography fontWeight={800} sx={{ mb:1 }}>참가예정자 {attendees.length}명</Typography>{attendees.length ? <Stack direction="row" gap={0.7} flexWrap="wrap">{attendees.map((item)=><Chip key={item.user_id} label={item.user?.nickname || item.user?.name || "회원"} size="small" />)}</Stack> : <Typography variant="body2" color="text.secondary">아직 참가예정자가 없습니다.</Typography>}</Box>
  <Stack direction="row" spacing={1}>{STATUS_BUTTONS.map((item)=>{ const selected=event.my_status===item.value; return <Button key={item.value} fullWidth variant={selected ? "contained" : "outlined"} color={item.color} startIcon={selected ? <CheckIcon /> : null} onClick={()=>onVote(item.value)} sx={{ fontWeight:800 }}>{item.label}</Button>; })}</Stack>
  </Stack>}</DialogContent><DialogActions>{canManage && <><Button color="error" onClick={onDelete}>삭제</Button><Button onClick={onEdit}>수정</Button></>}<Box sx={{ flex:1 }} /><Button onClick={onClose}>닫기</Button></DialogActions></Dialog>; }
function Info({ icon,label,value }) { return <Stack direction="row" spacing={0.7} alignItems="flex-start" sx={{ mt:1, color:"text.secondary", "& .MuiSvgIcon-root":{fontSize:16,mt:.15} }}>{icon}<Typography variant="body2"><Box component="span" sx={{ display:"inline-block", width:62, color:"#777" }}>{label}</Box>{value || "-"}</Typography></Stack>; }
function isRegistrationOpen(event) { const now=new Date(); return (!event.application_open_at || now>=new Date(event.application_open_at)) && now<=new Date(event.application_deadline_at); }
function registrationLabel(event) { if (event.application_open_at && new Date()<new Date(event.application_open_at)) return "신청예정"; return isRegistrationOpen(event)?"참가신청중":"신청마감"; }
function formatDateTime(value) { return value ? new Date(value).toLocaleString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit",weekday:"short",hour:"2-digit",minute:"2-digit"}) : "-"; }
function toLocalInput(value) { if(!value) return ""; const date=new Date(value); const offset=date.getTimezoneOffset()*60000; return new Date(date-offset).toISOString().slice(0,16); }
export default EventTab;
