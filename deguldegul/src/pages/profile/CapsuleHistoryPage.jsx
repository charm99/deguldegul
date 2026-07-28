import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { fetchMyCapsuleHistory } from "../../features/capsule/api/capsuleApi";

function CapsuleHistoryPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [history, setHistory] = useState({ coin_history: [], draw_history: [] });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMyCapsuleHistory().then(({ data, error }) => {
      if (error) setMessage(error.message);
      else setHistory(data);
    });
  }, []);

  const rows = tab === 0 ? history.coin_history : history.draw_history;

  return (
    <Box sx={{ pb: 10 }}>
      <Stack direction="row" alignItems="center" sx={{ px: 1.5, py: 1.5 }}>
        <IconButton onClick={() => navigate(-1)}><ArrowBackIcon /></IconButton>
        <Typography fontWeight={800} fontSize={18}>코인 및 뽑기 내역</Typography>
      </Stack>
      <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="fullWidth">
        <Tab label="코인 내역" />
        <Tab label="뽑기 내역" />
      </Tabs>
      {message && <Alert severity="error" sx={{ m: 2 }}>{message}</Alert>}
      <Stack spacing={1} sx={{ p: 2 }}>
        {rows.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
            내역이 없습니다.
          </Typography>
        ) : tab === 0 ? (
          rows.map((item) => (
            <HistoryCard
              key={item.coin_history_id}
              title={getCoinTitle(item.coin_tp)}
              subtitle={`${item.round_nm} · ${formatDateTime(item.created_at)}`}
              trailing={
                <Typography
                  fontWeight={900}
                  color={item.coin_qty > 0 ? "primary.main" : "error.main"}
                >
                  {item.coin_qty > 0 ? "+" : ""}{item.coin_qty}
                </Typography>
              }
            />
          ))
        ) : (
          rows.map((item) => (
            <HistoryCard
              key={item.capsule_id}
              title={item.prize_nm}
              subtitle={`${item.round_nm} · ${formatDateTime(item.drawn_at)}`}
              trailing={
                <Chip
                  size="small"
                  label={item.prize_tp === "LOSE" ? "꽝" : "당첨"}
                  color={item.prize_tp === "LOSE" ? "default" : "secondary"}
                />
              }
            />
          ))
        )}
      </Stack>
    </Box>
  );
}

function HistoryCard({ title, subtitle, trailing }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ p: 1.6, border: "1px solid #eceef2", borderRadius: 2 }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={800}>{title}</Typography>
        <Typography color="text.secondary" noWrap sx={{ mt: 0.3, fontSize: 12 }}>
          {subtitle}
        </Typography>
      </Box>
      {trailing}
    </Stack>
  );
}

function getCoinTitle(type) {
  return {
    ATD: "참석 코인 지급",
    DRAW: "캡슐 뽑기",
    ADMIN: "관리자 조정",
    CANCEL: "뽑기 취소 복구",
  }[type] || type;
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default CapsuleHistoryPage;
