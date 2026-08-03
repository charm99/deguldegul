import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";

import {
  createCapsuleRound,
  fetchAdminCapsuleHistory,
  fetchAdminCapsuleRounds,
  grantAttendanceCapsuleCoins,
  startCapsuleRound,
} from "../../features/capsule/api/capsuleApi";
import { formatDateTime } from "../../shared/utils/date";

function CapsuleManagePage() {
  const navigate = useNavigate();
  const [rounds, setRounds] = useState([]);
  const [message, setMessage] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [historyRound, setHistoryRound] = useState(null);
  const [historyTab, setHistoryTab] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState({ coin_history: [], winner_history: [] });

  const loadRounds = async () => {
    const { data, error } = await fetchAdminCapsuleRounds();
    if (error) setMessage(error.message);
    else setRounds(data || []);
  };

  useEffect(() => {
    let active = true;

    fetchAdminCapsuleRounds().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      else setRounds(data || []);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleStart = async (round) => {
    if (!confirm(`${round.round_nm} 회차를 시작할까요? 시작 후 상품 구성을 변경하면 안 됩니다.`)) return;
    setProcessingId(round.round_id);
    const { error } = await startCapsuleRound(round.round_id);
    setProcessingId(null);
    if (error) {
      setMessage(error.message);
      return;
    }
    await loadRounds();
  };

  const handleGrantAttendanceCoins = async (round) => {
    const meetingId = prompt("배틀 참가 코인을 지급할 모임 UUID를 입력하세요.");
    if (!meetingId?.trim()) return;

    setProcessingId(round.round_id);
    const { data, error } = await grantAttendanceCapsuleCoins({
      roundId: round.round_id,
      meetingId: meetingId.trim(),
    });
    setProcessingId(null);

    if (error) {
      setMessage(error.message);
      return;
    }

    alert(`${data || 0}명의 배틀 참가자에게 코인을 지급했습니다.`);
  };

  const handleOpenHistory = async (round) => {
    setHistoryRound(round);
    setHistoryTab(0);
    setHistoryLoading(true);
    setHistory({ coin_history: [], winner_history: [] });

    const { data, error } = await fetchAdminCapsuleHistory(round.round_id);
    setHistoryLoading(false);
    if (error) {
      setMessage(error.message);
      setHistoryRound(null);
      return;
    }
    setHistory(data || { coin_history: [], winner_history: [] });
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate("/admin")}><ArrowBackIcon /></IconButton>
        <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
          캡슐 이벤트 관리
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setCreateOpen(true)}
        >
          새 이벤트
        </Button>
      </Stack>
      {message && <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert>}
      <Stack spacing={1.5}>
        {rounds.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
            등록된 캡슐 이벤트가 없습니다.
          </Typography>
        )}
        {rounds.map((round) => {
          const quantityMatched =
            round.allocated_total_qty === round.total_capsule_cnt;
          return (
            <Card key={round.round_id} variant="outlined" sx={{ borderRadius: 2.5 }}>
              <CardContent>
                <Stack direction="row" alignItems="center">
                  <Typography fontWeight={900} sx={{ flex: 1 }}>{round.round_nm}</Typography>
                  <Chip size="small" label={getStatusLabel(round.status)} />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 0.7, fontSize: 12 }}>
                  {round.start_dt} ~ {round.end_dt}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ mt: 1.3 }}>
                  <Metric label="상품/전체" value={`${round.prize_total_qty}/${round.total_capsule_cnt}`} />
                  <Metric label="생성" value={round.generated_capsule_cnt} />
                  <Metric label="뽑힘" value={round.drawn_capsule_cnt} />
                </Stack>
                <Button
                  fullWidth
                  variant="text"
                  onClick={() => handleOpenHistory(round)}
                  sx={{ mt: 1 }}
                >
                  코인 및 당첨 내역 조회
                </Button>
                {round.status === "RDY" && (
                  <Button
                    fullWidth
                    variant="contained"
                    disabled={!quantityMatched || processingId === round.round_id}
                    onClick={() => handleStart(round)}
                    sx={{ mt: 1.5 }}
                  >
                    {processingId === round.round_id ? "시작 처리 중..." : "캡슐 생성 및 회차 시작"}
                  </Button>
                )}
                {round.status === "OPN" && (
                  <Button
                    fullWidth
                    variant="outlined"
                    disabled={processingId === round.round_id}
                    onClick={() => handleGrantAttendanceCoins(round)}
                    sx={{ mt: 1.5 }}
                  >
                    배틀 참가자 코인 지급
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <CreateCapsuleRoundDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={async (notice) => {
          setCreateOpen(false);
          if (notice) setMessage(notice);
          await loadRounds();
        }}
      />
      <CapsuleAdminHistoryDialog
        round={historyRound}
        open={Boolean(historyRound)}
        loading={historyLoading}
        tab={historyTab}
        history={history}
        onTabChange={setHistoryTab}
        onClose={() => setHistoryRound(null)}
      />
    </Box>
  );
}

function CapsuleAdminHistoryDialog({
  round,
  open,
  loading,
  tab,
  history,
  onTabChange,
  onClose,
}) {
  const rows = tab === 0 ? history.coin_history : history.winner_history;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography fontWeight={900}>{round?.round_nm || "캡슐 이벤트 내역"}</Typography>
        <Typography color="text.secondary" fontSize={12}>
          전체 회원의 코인 원장과 상품 당첨 내역
        </Typography>
      </DialogTitle>
      <Tabs
        value={tab}
        onChange={(_, value) => onTabChange(value)}
        variant="fullWidth"
      >
        <Tab label={`코인 내역 ${history.coin_history.length}`} />
        <Tab label={`당첨 내역 ${history.winner_history.length}`} />
      </Tabs>
      <DialogContent dividers sx={{ bgcolor: "#f7f7f8", p: 1.5 }}>
        {loading && (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>
            내역을 불러오는 중...
          </Typography>
        )}
        {!loading && rows.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>
            조회된 내역이 없습니다.
          </Typography>
        )}
        {!loading && (
          <Stack spacing={1}>
            {tab === 0
              ? rows.map((item) => <CoinHistoryRow key={item.coin_history_id} item={item} />)
              : rows.map((item) => <WinnerHistoryRow key={item.capsule_id} item={item} />)}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

function CoinHistoryRow({ item }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={800}>{getUserLabel(item)}</Typography>
            <Typography color="text.secondary" fontSize={12}>
              {getCoinTypeLabel(item.coin_tp)}
              {item.meeting_nm ? ` · ${item.meeting_nm}` : ""}
            </Typography>
            {item.memo && <Typography fontSize={12}>{item.memo}</Typography>}
            <Typography color="text.secondary" fontSize={11}>
              {formatDateTime(item.created_at)}
            </Typography>
          </Box>
          <Typography
            fontWeight={900}
            color={item.coin_qty > 0 ? "primary.main" : "error.main"}
          >
            {item.coin_qty > 0 ? "+" : ""}{item.coin_qty}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

function WinnerHistoryRow({ item }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography fontWeight={900}>
          {item.prize_nm}{item.memo ? ` / ${item.memo}` : ""}
        </Typography>
        <Typography fontWeight={700}>{getUserLabel(item)}</Typography>
        <Typography color="text.secondary" fontSize={12}>
          캡슐 #{item.capsule_no} · {formatDateTime(item.drawn_at)}
        </Typography>
      </CardContent>
    </Card>
  );
}

function getUserLabel(item) {
  return item.nickname
    ? `${item.user_name} (${item.nickname})`
    : item.user_name || item.user_id;
}

function getCoinTypeLabel(type) {
  return {
    ATD: "참가 코인 지급",
    DRAW: "캡슐 뽑기 사용",
    ADMIN: "관리자 조정",
    CANCEL: "뽑기 취소 복구",
  }[type] || type;
}

function CreateCapsuleRoundDialog({ open, onClose, onCreated }) {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState(() => createInitialForm(currentYear));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const totalCapsules = form.prizes.reduce(
    (sum, prize) => sum + Number(prize.total_qty || 0),
    0
  );

  const updateForm = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const updatePrize = (key, name, value) => {
    setForm((previous) => ({
      ...previous,
      prizes: previous.prizes.map((prize) =>
        prize.key === key ? { ...prize, [name]: value } : prize
      ),
    }));
  };

  const addPrize = () => {
    setForm((previous) => ({
      ...previous,
      prizes: [...previous.prizes, createPrizeRow("PRIZE")],
    }));
  };

  const removePrize = (key) => {
    setForm((previous) => ({
      ...previous,
      prizes: previous.prizes.filter((prize) => prize.key !== key),
    }));
  };

  const handleSubmit = async (startImmediately) => {
    setErrorMessage("");

    if (
      !form.round_nm.trim() ||
      !form.start_dt ||
      !form.end_dt ||
      form.prizes.length === 0
    ) {
      setErrorMessage("회차명, 진행 기간과 상품을 모두 입력해주세요.");
      return;
    }

    if (form.start_dt > form.end_dt) {
      setErrorMessage("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }

    if (
      form.prizes.some(
        (prize) => !prize.prize_nm.trim() || Number(prize.total_qty) <= 0
      )
    ) {
      setErrorMessage("모든 상품의 이름과 1개 이상의 수량을 입력해주세요.");
      return;
    }

    if (!form.prizes.some((prize) => prize.prize_tp === "LOSE")) {
      setErrorMessage("꽝 상품을 한 개 이상 등록해주세요.");
      return;
    }

    setSaving(true);

    const { data: roundId, error: createError } = await createCapsuleRound({
      roundYear: Number(form.round_year),
      roundNo: Number(form.round_no),
      roundName: form.round_nm.trim(),
      startDate: form.start_dt,
      endDate: form.end_dt,
      memo: form.memo.trim(),
      prizes: form.prizes.map((prize, index) => ({
        prize_nm: prize.prize_nm.trim(),
        prize_tp: prize.prize_tp,
        total_qty: Number(prize.total_qty),
        sort_no: (index + 1) * 10,
        image_url: null,
        memo: prize.memo.trim() || null,
      })),
    });

    if (createError) {
      setSaving(false);
      setErrorMessage(createError.message);
      return;
    }

    if (startImmediately) {
      const { error: startError } = await startCapsuleRound(roundId);
      if (startError) {
        setSaving(false);
        await onCreated(
          `회차는 준비 상태로 저장됐지만 시작하지 못했습니다. ${startError.message}`
        );
        return;
      }
    }

    setSaving(false);
    setForm(createInitialForm(currentYear));
    await onCreated();
  };

  const handleClose = () => {
    if (saving) return;
    setErrorMessage("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>새 캡슐 이벤트</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ mt: 0.5 }}>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Stack direction="row" spacing={1}>
            <TextField
              label="연도"
              type="number"
              value={form.round_year}
              onChange={(event) => updateForm("round_year", event.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="회차"
              type="number"
              value={form.round_no}
              onChange={(event) => updateForm("round_no", event.target.value)}
              sx={{ flex: 1 }}
            />
          </Stack>

          <TextField
            label="회차명"
            value={form.round_nm}
            onChange={(event) => updateForm("round_nm", event.target.value)}
            placeholder={`${currentYear}년 1차 배틀로얄 캡슐 이벤트`}
            fullWidth
          />

          <Stack direction="row" spacing={1}>
            <TextField
              label="시작일"
              type="date"
              value={form.start_dt}
              onChange={(event) => updateForm("start_dt", event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
            <TextField
              label="종료일"
              type="date"
              value={form.end_dt}
              onChange={(event) => updateForm("end_dt", event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={{ flex: 1 }}
            />
          </Stack>

          <TextField
            label="운영 메모"
            value={form.memo}
            onChange={(event) => updateForm("memo", event.target.value)}
            multiline
            minRows={2}
          />

          <Divider />

          <Stack direction="row" alignItems="center">
            <Typography fontWeight={800} sx={{ flex: 1 }}>
              상품 구성
            </Typography>
            <Chip
              color="primary"
              variant="outlined"
              label={`총 ${totalCapsules.toLocaleString()}캡슐`}
            />
          </Stack>

          {form.prizes.map((prize, index) => (
            <Box
              key={prize.key}
              sx={{ p: 1.3, border: "1px solid #e7e9ed", borderRadius: 2 }}
            >
              <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                <Typography fontWeight={800} sx={{ flex: 1, fontSize: 13 }}>
                  상품 {index + 1}
                </Typography>
                <IconButton
                  size="small"
                  color="error"
                  disabled={form.prizes.length <= 1}
                  onClick={() => removePrize(prize.key)}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Stack>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    select
                    label="유형"
                    value={prize.prize_tp}
                    onChange={(event) =>
                      updatePrize(prize.key, "prize_tp", event.target.value)
                    }
                    sx={{ width: 110 }}
                  >
                    <MenuItem value="PRIZE">당첨품</MenuItem>
                    <MenuItem value="LOSE">꽝</MenuItem>
                  </TextField>
                  <TextField
                    label="상품명"
                    value={prize.prize_nm}
                    onChange={(event) =>
                      updatePrize(prize.key, "prize_nm", event.target.value)
                    }
                    sx={{ flex: 1 }}
                  />
                </Stack>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="수량"
                    type="number"
                    value={prize.total_qty}
                    onChange={(event) =>
                      updatePrize(prize.key, "total_qty", event.target.value)
                    }
                    slotProps={{ htmlInput: { min: 1 } }}
                    sx={{ width: 110 }}
                  />
                  <TextField
                    label="상품 설명"
                    value={prize.memo}
                    onChange={(event) =>
                      updatePrize(prize.key, "memo", event.target.value)
                    }
                    sx={{ flex: 1 }}
                  />
                </Stack>
              </Stack>
            </Box>
          ))}

          <Button variant="outlined" startIcon={<AddIcon />} onClick={addPrize}>
            상품 추가
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} disabled={saving}>취소</Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          disabled={saving}
          onClick={() => handleSubmit(false)}
        >
          준비 상태로 저장
        </Button>
        <Button
          variant="contained"
          disabled={saving}
          onClick={() => handleSubmit(true)}
        >
          {saving ? "처리 중..." : "저장하고 시작"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function createInitialForm(year) {
  return {
    round_year: year,
    round_no: 1,
    round_nm: "",
    start_dt: "",
    end_dt: "",
    memo: "",
    prizes: [createPrizeRow("PRIZE"), createPrizeRow("LOSE", "꽝")],
  };
}

function createPrizeRow(type, name = "") {
  return {
    key:
      globalThis.crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    prize_nm: name,
    prize_tp: type,
    total_qty: 1,
    memo: "",
  };
}

function Metric({ label, value }) {
  return (
    <Box>
      <Typography color="text.secondary" fontSize={11}>{label}</Typography>
      <Typography fontWeight={800}>{value}</Typography>
    </Box>
  );
}

function getStatusLabel(status) {
  return { RDY: "준비", OPN: "진행", CLS: "종료", CNL: "취소" }[status] || status;
}

export default CapsuleManagePage;
