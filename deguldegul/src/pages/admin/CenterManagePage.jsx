import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Switch,
  Divider,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";

import { supabase } from "../../services/supabase";

const WEEK_OPTIONS = [
  { value: 1, label: "1주" },
  { value: 2, label: "2주" },
  { value: 3, label: "3주" },
  { value: 4, label: "4주" },
  { value: 5, label: "5주" },
];

const WEEKDAY_OPTIONS = [
  { value: "SUN", label: "일요일" },
  { value: "MON", label: "월요일" },
  { value: "TUE", label: "화요일" },
  { value: "WED", label: "수요일" },
  { value: "THU", label: "목요일" },
  { value: "FRI", label: "금요일" },
  { value: "SAT", label: "토요일" },
];

const EMPTY_FORM = {
  center_id: null,
  center_nm: "",
  address: "",
  center_tel_no: "",
  manager_user_id: "",
  bank_nm: "",
  account_no: "",
  account_holder: "",
  game_cost: "0",
  fixed_week_nos: [],
  fixed_weekday: "SUN",
  fixed_time: "",
  use_yn: "Y",
};

function CenterManagePage() {
  const navigate = useNavigate();

  const [centers, setCenters] = useState([]);
  const [managers, setManagers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [onlyUse, setOnlyUse] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const isEdit = !!form.center_id;

  const filteredCenters = useMemo(() => {
    if (!onlyUse) return centers;
    return centers.filter((center) => center.use_yn === "Y");
  }, [centers, onlyUse]);

  const loadManagers = async () => {
    const { data, error } = await supabase
      .from("degul_users")
      .select("id, name, nickname, phone_no, role, status")
      .in("role", ["ADM", "MGR", "STF"])
      .eq("status", "ACT")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    setManagers(data || []);
  };

  const loadCenters = async () => {
    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await supabase
        .from("degul_center")
        .select(`
          center_id,
          center_nm,
          address,
          center_tel_no,
          manager_user_id,
          bank_nm,
          account_no,
          account_holder,
          game_cost,
          fixed_week_nos,
          fixed_weekday,
          fixed_time,
          use_yn,
          manager:manager_user_id (
            id,
            name,
            nickname,
            phone_no
          )
        `)
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setCenters(data || []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "볼링장 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEditDialog = (center) => {
    setForm({
      center_id: center.center_id,
      center_nm: center.center_nm || "",
      address: center.address || "",
      center_tel_no: center.center_tel_no || "",
      manager_user_id: center.manager_user_id || "",
      bank_nm: center.bank_nm || "",
      account_no: center.account_no || "",
      account_holder: center.account_holder || "",
      game_cost: String(center.game_cost ?? 0),
      fixed_week_nos: center.fixed_week_nos || [],
      fixed_weekday: center.fixed_weekday || "SUN",
      fixed_time: center.fixed_time ? center.fixed_time.slice(0, 5) : "",
      use_yn: center.use_yn || "Y",
    });

    setOpen(true);
  };

  const handleWeekToggle = (weekNo) => {
    const exists = form.fixed_week_nos.includes(weekNo);

    const next = exists
      ? form.fixed_week_nos.filter((item) => item !== weekNo)
      : [...form.fixed_week_nos, weekNo];

    setForm({
      ...form,
      fixed_week_nos: next.sort((a, b) => a - b),
    });
  };

  const validateForm = () => {
    if (!form.center_nm.trim()) {
      alert("볼링장명을 입력해주세요.");
      return false;
    }

    if (form.fixed_week_nos.length === 0) {
      alert("고정 주차를 1개 이상 선택해주세요.");
      return false;
    }

    if (!form.fixed_weekday) {
      alert("고정 요일을 선택해주세요.");
      return false;
    }

    if (!form.fixed_time) {
      alert("고정 시간을 입력해주세요.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const payload = {
      center_nm: form.center_nm.trim(),
      address: form.address.trim(),
      center_tel_no: form.center_tel_no.trim(),
      manager_user_id: form.manager_user_id || null,
      bank_nm: form.bank_nm.trim(),
      account_no: form.account_no.trim(),
      account_holder: form.account_holder.trim(),
      game_cost: Number(form.game_cost || 0),
      fixed_week_nos: form.fixed_week_nos,
      fixed_weekday: form.fixed_weekday,
      fixed_time: form.fixed_time,
      use_yn: form.use_yn,
    };

    const { error } = isEdit
      ? await supabase
          .from("degul_center")
          .update(payload)
          .eq("center_id", form.center_id)
      : await supabase.from("degul_center").insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    setOpen(false);
    await loadCenters();
  };

  useEffect(() => {
    loadManagers();
    loadCenters();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <IconButton onClick={() => navigate("/admin")}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
          볼링장관리
        </Typography>

        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          등록
        </Button>
      </Stack>

      <FormControlLabel
        sx={{ mb: 1 }}
        control={
          <Switch
            checked={onlyUse}
            onChange={(e) => setOnlyUse(e.target.checked)}
          />
        }
        label={onlyUse ? "사용중만 보기" : "전체 볼링장 보기"}
      />

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {loading && (
        <Typography color="text.secondary">불러오는 중...</Typography>
      )}

      {!loading && filteredCenters.length === 0 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography color="text.secondary" textAlign="center">
              표시할 볼링장이 없습니다.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Stack spacing={2}>
        {filteredCenters.map((center) => (
          <Card key={center.center_id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography fontWeight={800}>{center.center_nm}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {center.address || "주소 미입력"}
                  </Typography>
                </Box>

                <Chip
                  label={center.use_yn === "Y" ? "사용" : "미사용"}
                  color={center.use_yn === "Y" ? "primary" : "default"}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Box sx={{ mt: 1.5 }}>
                <InfoRow
                  label="고정일"
                  value={`${formatWeekNos(center.fixed_week_nos)} ${formatWeekday(
                    center.fixed_weekday
                  )} ${formatTime(center.fixed_time)}`}
                />
                <InfoRow
                  label="담당자"
                  value={
                    center.manager
                      ? `${center.manager.name} (${center.manager.nickname || "-"})`
                      : "-"
                  }
                />
                <InfoRow
                  label="연락처"
                  value={center.manager?.phone_no || center.center_tel_no || "-"}
                />
                <InfoRow
                  label="계좌"
                  value={
                    center.bank_nm
                      ? `${center.bank_nm} ${center.account_no} ${center.account_holder}`
                      : "-"
                  }
                />
              </Box>

              <Button
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
                onClick={() => openEditDialog(center)}
              >
                수정
              </Button>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth>
        <DialogTitle>{isEdit ? "볼링장 수정" : "볼링장 등록"}</DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="볼링장명"
              value={form.center_nm}
              onChange={(e) =>
                setForm({ ...form, center_nm: e.target.value })
              }
              fullWidth
            />

            <TextField
              label="주소"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              fullWidth
            />

            <TextField
              label="볼링장 연락처"
              value={form.center_tel_no}
              onChange={(e) =>
                setForm({ ...form, center_tel_no: e.target.value })
              }
              fullWidth
            />

            <TextField
              select
              label="담당자"
              value={form.manager_user_id}
              onChange={(e) =>
                setForm({ ...form, manager_user_id: e.target.value })
              }
              fullWidth
            >
              <MenuItem value="">미지정</MenuItem>
              {managers.map((manager) => (
                <MenuItem key={manager.id} value={manager.id}>
                  {manager.name} ({manager.nickname || "-"})
                </MenuItem>
              ))}
            </TextField>

            <Divider />

            <Typography fontWeight={800}>계좌 정보</Typography>

            <TextField
              label="은행명"
              value={form.bank_nm}
              onChange={(e) => setForm({ ...form, bank_nm: e.target.value })}
              fullWidth
            />

            <TextField
              label="계좌번호"
              value={form.account_no}
              onChange={(e) =>
                setForm({ ...form, account_no: e.target.value })
              }
              fullWidth
            />

            <TextField
              label="예금주"
              value={form.account_holder}
              onChange={(e) =>
                setForm({ ...form, account_holder: e.target.value })
              }
              fullWidth
            />

            <TextField
              label="게임비"
              type="number"
              value={form.game_cost}
              onChange={(e) =>
                setForm({ ...form, game_cost: e.target.value })
              }
              fullWidth
            />

            <Divider />

            <Typography fontWeight={800}>고정일</Typography>

            <Stack direction="row" flexWrap="wrap" gap={1}>
              {WEEK_OPTIONS.map((item) => (
                <FormControlLabel
                  key={item.value}
                  control={
                    <Checkbox
                      checked={form.fixed_week_nos.includes(item.value)}
                      onChange={() => handleWeekToggle(item.value)}
                    />
                  }
                  label={item.label}
                />
              ))}
            </Stack>

            <TextField
              select
              label="요일"
              value={form.fixed_weekday}
              onChange={(e) =>
                setForm({ ...form, fixed_weekday: e.target.value })
              }
              fullWidth
            >
              {WEEKDAY_OPTIONS.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="시간"
              type="time"
              value={form.fixed_time}
              onChange={(e) => setForm({ ...form, fixed_time: e.target.value })}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
              fullWidth
            />

            <TextField
              select
              label="사용여부"
              value={form.use_yn}
              onChange={(e) => setForm({ ...form, use_yn: e.target.value })}
              fullWidth
            >
              <MenuItem value="Y">사용</MenuItem>
              <MenuItem value="N">미사용</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>취소</Button>
          <Button variant="contained" onClick={handleSave}>
            저장
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" spacing={1} sx={{ py: 0.3 }}>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ width: 64, flexShrink: 0 }}
      >
        {label}
      </Typography>

      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}

function formatWeekNos(value) {
  if (!value || value.length === 0) return "-";

  return `${value.join(",")}주`;
}

function formatWeekday(value) {
  const map = {
    SUN: "일요일",
    MON: "월요일",
    TUE: "화요일",
    WED: "수요일",
    THU: "목요일",
    FRI: "금요일",
    SAT: "토요일",
  };

  return map[value] || value || "-";
}

function formatTime(value) {
  if (!value) return "-";
  return value.slice(0, 5);
}

export default CenterManagePage;