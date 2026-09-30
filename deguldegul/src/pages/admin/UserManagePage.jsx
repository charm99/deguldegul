import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { fetchUsers, resetUserPassword, updateUser as updateUserRequest } from "../../features/admin/api/adminApi";
import { useAuth } from "../../contexts/AuthContext";
import { canEditUsers, canManageUsers, canSeePrivateUserInfo } from "../../shared/model/permissions";
import { useCommonCodes } from "../../contexts/useCommonCodes";
import { COMMON_CODE_GROUP } from "../../shared/constants/commonCodeGroups";

const STATUS_OPTIONS = [
  { value: "ACT", label: "활성" }, { value: "SLP", label: "휴면" },
  { value: "PND", label: "승인대기" }, { value: "REJ", label: "추방/거절" },
];

function UserManagePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { getCodes, getCodeName } = useCommonCodes();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ status: "ACT", role: "MBR" });
  const [saving, setSaving] = useState(false);
  const canAccess = canManageUsers(profile);
  const canEdit = canEditUsers(profile);
  const canSeePhone = canSeePrivateUserInfo(profile);
  const roles = getCodes(COMMON_CODE_GROUP.ROLE);

  const loadUsers = async () => {
    setLoading(true); setMessage("");
    const { data, error } = await fetchUsers();
    if (error) setMessage(error.message || "회원 목록을 불러오지 못했습니다.");
    else setUsers(data || []);
    setLoading(false);
  };
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    return users.filter((user) => {
      const searchable = [user.name, user.nickname, user.email, user.phone_no, user.car_no].filter(Boolean).join(" ").toLocaleLowerCase("ko-KR");
      return (!keyword || searchable.includes(keyword)) && (statusFilter === "ALL" || user.status === statusFilter) && (roleFilter === "ALL" || user.role === roleFilter);
    }).sort((a, b) => a.status === "PND" && b.status !== "PND" ? -1 : a.status !== "PND" && b.status === "PND" ? 1 : new Date(b.created_at) - new Date(a.created_at));
  }, [users, query, statusFilter, roleFilter]);
  const pendingUsers = users.filter((user) => user.status === "PND");

  const updateUser = async (id, values, success) => {
    const { error } = await updateUserRequest(id, values);
    if (error) throw error;
    setSuccessMessage(success || "회원 설정을 변경했습니다.");
    await loadUsers();
  };
  const openEdit = (user) => { setEditTarget(user); setEditForm({ status: user.status || "ACT", role: user.role || "MBR" }); setMessage(""); setSuccessMessage(""); };
  const saveEdit = async () => {
    try { setSaving(true); await updateUser(editTarget.id, editForm, `${editTarget.name}님의 설정을 변경했습니다.`); setEditTarget(null); }
    catch (error) { setMessage(error.message || "회원 설정 변경에 실패했습니다."); }
    finally { setSaving(false); }
  };
  const resetPassword = async () => {
    if (!confirm(`${editTarget.name}님의 비밀번호를 111111로 초기화할까요?`)) return;
    setSaving(true); const { error } = await resetUserPassword(editTarget.id); setSaving(false);
    if (error) setMessage(error.message || "비밀번호 초기화에 실패했습니다.");
    else setSuccessMessage(`${editTarget.name}님의 비밀번호를 111111로 초기화했습니다.`);
  };
  const resetAverage = async () => {
    if (!confirm(`${editTarget.name}님의 에버리지 집계를 오늘부터 다시 시작할까요?`)) return;
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    try { setSaving(true); await updateUser(editTarget.id, { average_start_date: today }, `${editTarget.name}님의 에버리지를 초기화했습니다.`); setEditTarget(null); }
    catch (error) { setMessage(error.message || "에버리지 초기화에 실패했습니다."); } finally { setSaving(false); }
  };
  const expelUser = async () => {
    if (!confirm(`${editTarget.name}님을 추방할까요? 계정 로그인이 차단됩니다.`)) return;
    try { setSaving(true); await updateUser(editTarget.id, { status: "REJ" }, `${editTarget.name}님을 추방했습니다.`); setEditTarget(null); }
    catch (error) { setMessage(error.message || "회원 추방에 실패했습니다."); } finally { setSaving(false); }
  };
  if (!canAccess) return null;

  return <Box sx={{ p: 2 }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}><IconButton onClick={() => navigate("/admin")}><ArrowBackIcon /></IconButton><Typography variant="h6" fontWeight={800}>회원관리</Typography></Stack>
    {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}
    {successMessage && <Alert severity="success" onClose={() => setSuccessMessage("")} sx={{ mb: 2 }}>{successMessage}</Alert>}
    <Card sx={{ borderRadius: 3, mb: 2 }}><CardContent>
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography fontWeight={800}>가입 승인 대기</Typography><Typography variant="body2" color="text.secondary">승인 대기 {pendingUsers.length}명 / 전체 {users.length}명</Typography></Box><Chip label={`${pendingUsers.length}명`} color={pendingUsers.length ? "warning" : "default"} sx={{ fontWeight: 800 }} /></Stack>
      {canEdit && pendingUsers.length > 0 && <><Divider sx={{ my: 1.5 }} /><Stack spacing={1}>{pendingUsers.map((user) => <Stack key={user.id} direction="row" alignItems="center" spacing={1}><Box sx={{ flex: 1, minWidth: 0 }}><Typography fontWeight={800} noWrap>{user.name}</Typography><Typography variant="caption" color="text.secondary" noWrap>{user.nickname} · {user.email || "-"}</Typography></Box><Button size="small" variant="contained" onClick={() => updateUser(user.id, { status: "ACT" }, "가입을 승인했습니다.").catch((e) => setMessage(e.message))}>승인</Button><Button size="small" color="error" onClick={() => updateUser(user.id, { status: "REJ" }, "가입을 거절했습니다.").catch((e) => setMessage(e.message))}>거절</Button></Stack>)}</Stack></>}
    </CardContent></Card>
    <Card sx={{ borderRadius: 3 }}><CardContent><Typography fontWeight={800} sx={{ mb: 1.5 }}>회원 목록</Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 2 }}><TextField size="small" label="검색" placeholder="이름, 닉네임, 이메일, 연락처, 차량번호" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ flex: 1 }} /><TextField select size="small" label="상태" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} sx={{ minWidth: 130 }}><MenuItem value="ALL">전체 상태</MenuItem>{STATUS_OPTIONS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField><TextField select size="small" label="역할" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} sx={{ minWidth: 130 }}><MenuItem value="ALL">전체 역할</MenuItem>{roles.map((item) => <MenuItem key={item.com_cd} value={item.com_cd}>{item.com_nm}</MenuItem>)}</TextField></Stack>
      {loading ? <Typography color="text.secondary">불러오는 중...</Typography> : <Box sx={{ overflowX: "auto" }}><Box sx={{ minWidth: canSeePhone ? 1040 : 900 }}><GridHeader canSeePhone={canSeePhone} canEdit={canEdit} />{filteredUsers.map((user) => <GridRow key={user.id} user={user} canSeePhone={canSeePhone} canEdit={canEdit} onEdit={openEdit} getCodeName={getCodeName} />)}{!filteredUsers.length && <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>검색 결과가 없습니다.</Typography>}</Box></Box>}
    </CardContent></Card>
    <Dialog open={Boolean(editTarget)} onClose={saving ? undefined : () => setEditTarget(null)} fullWidth maxWidth="xs"><DialogTitle>회원 설정 편집</DialogTitle><DialogContent><Stack spacing={2} sx={{ mt: 1 }}><Typography fontWeight={800}>{editTarget?.name} ({editTarget?.nickname})</Typography><TextField select label="상태" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>{STATUS_OPTIONS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField><TextField select label="역할" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>{roles.map((item) => <MenuItem key={item.com_cd} value={item.com_cd}>{item.com_nm}</MenuItem>)}</TextField><Button variant="outlined" onClick={resetPassword} disabled={saving}>비밀번호 111111로 초기화</Button><Button variant="outlined" onClick={resetAverage} disabled={saving}>에버리지 초기화</Button><Button color="error" variant="outlined" onClick={expelUser} disabled={saving}>회원 추방</Button></Stack></DialogContent><DialogActions><Button onClick={() => setEditTarget(null)} disabled={saving}>취소</Button><Button variant="contained" onClick={saveEdit} disabled={saving}>저장</Button></DialogActions></Dialog>
  </Box>;
}

const columns = (phone, edit) => `90px 100px 180px ${phone ? "120px " : ""}110px 80px 90px 70px 70px 100px${edit ? " 64px" : ""}`;
function GridHeader({ canSeePhone, canEdit }) { return <Box sx={{ display: "grid", gridTemplateColumns: columns(canSeePhone, canEdit), p: 1, bgcolor: "#f5f6fa", borderRadius: 2 }}>{["이름", "닉네임", "이메일", ...(canSeePhone ? ["전화번호"] : []), "차량번호", "상태", "역할", "손", "투구", "가입일", ...(canEdit ? ["편집"] : [])].map((label) => <Typography key={label} variant="caption" color="text.secondary" fontWeight={800}>{label}</Typography>)}</Box>; }
function GridRow({ user, canSeePhone, canEdit, onEdit, getCodeName }) {
  const statusLabel = STATUS_OPTIONS.find((item) => item.value === user.status)?.label || getCodeName(COMMON_CODE_GROUP.USER_STATUS, user.status);
  return <Box sx={{ display: "grid", gridTemplateColumns: columns(canSeePhone, canEdit), alignItems: "center", p: 1, borderBottom: "1px solid #eee" }}><Typography fontWeight={800} noWrap>{user.name}</Typography><Typography variant="body2" noWrap>{user.nickname}</Typography><Typography variant="body2" color="text.secondary" noWrap>{user.email || "-"}</Typography>{canSeePhone && <Typography variant="body2" color="text.secondary" noWrap>{user.phone_no || "-"}</Typography>}<Typography variant="body2" color="text.secondary" noWrap>{user.car_no || "-"}</Typography><Chip label={statusLabel} color={user.status === "ACT" ? "primary" : user.status === "PND" ? "warning" : "default"} size="small" sx={{ width: 70 }} /><Typography variant="body2">{getCodeName(COMMON_CODE_GROUP.ROLE, user.role)}</Typography><Typography variant="body2">{getCodeName(COMMON_CODE_GROUP.HAND, user.hand)}</Typography><Typography variant="body2">{getCodeName(COMMON_CODE_GROUP.BOWLING_TYPE, user.bwl_tp)}</Typography><Typography variant="body2" color="text.secondary">{user.join_date || "-"}</Typography>{canEdit && <IconButton size="small" aria-label={`${user.name} 편집`} onClick={() => onEdit(user)}><EditOutlinedIcon fontSize="small" /></IconButton>}</Box>;
}
export default UserManagePage;
