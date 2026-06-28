import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";

import { supabase } from "../../services/supabase";

function BattleManagePage() {
  const navigate = useNavigate();

  const [histories, setHistories] = useState([]);
  const [message, setMessage] = useState("");

  const loadHistories = async () => {
    setMessage("");

    const { data, error } = await supabase
      .from("degul_point_history")
      .select(`
        point_hist_id,
        user_id,
        meeting_id,
        battle_id,
        point_tp,
        point,
        memo,
        created_at,
        user:user_id (
          name,
          nickname
        ),
        meeting:meeting_id (
          meeting_nm,
          meeting_dt
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setHistories(data || []);
  };

  const handleRefresh = async () => {
    const ok = confirm("미확정 배틀 결과를 최신화할까요?");
    if (!ok) return;

    const { data, error } = await supabase.rpc("refresh_battle_results");

    if (error) {
      alert(error.message);
      return;
    }

    alert(`${data || 0}건의 배틀 결과가 최신화되었습니다.`);
    await loadHistories();
  };

  useEffect(() => {
    loadHistories();
  }, []);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate("/admin")}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
          배틀로얄관리
        </Typography>

        <Button
          variant="contained"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
        >
          결과 최신화
        </Button>
      </Stack>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={800} sx={{ mb: 1.5 }}>
            포인트 이력
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 720 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "130px 140px 120px 80px 80px 1fr",
                  bgcolor: "#f5f6fa",
                  borderRadius: 2,
                  py: 1,
                }}
              >
                {["일시", "회원", "모임", "구분", "포인트", "메모"].map((col) => (
                  <Typography
                    key={col}
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    fontWeight={800}
                  >
                    {col}
                  </Typography>
                ))}
              </Box>

              {histories.map((item) => (
                <Box
                  key={item.point_hist_id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "130px 140px 120px 80px 80px 1fr",
                    py: 1.2,
                    borderBottom: "1px solid #eee",
                    alignItems: "center",
                  }}
                >
                  <Cell>{formatDateTime(item.created_at)}</Cell>
                  <Cell bold>{item.user?.nickname || item.user?.name || "-"}</Cell>
                  <Cell>{item.meeting?.meeting_nm || "-"}</Cell>
                  <Cell>
                    <Chip
                      label={getPointTypeLabel(item.point_tp)}
                      size="small"
                      color={getPointColor(item.point_tp)}
                      sx={{ fontWeight: 800 }}
                    />
                  </Cell>
                  <Cell bold>{item.point}</Cell>
                  <Cell>{item.memo || "-"}</Cell>
                </Box>
              ))}

              {histories.length === 0 && (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  포인트 이력이 없습니다.
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

function Cell({ children, bold = false }) {
  return (
    <Typography textAlign="center" fontWeight={bold ? 800 : 500} noWrap>
      {children}
    </Typography>
  );
}

function getPointTypeLabel(value) {
  const map = {
    WIN: "승리",
    LOS: "패배",
    BYE: "부전승",
    S05: "5연승",
    S10: "10연승",
    S15: "15연승",
    MAN: "수동",
  };

  return map[value] || value;
}

function getPointColor(value) {
  if (value === "WIN") return "success";
  if (value === "LOS") return "default";
  if (value === "BYE") return "warning";
  if (["S05", "S10", "S15"].includes(value)) return "primary";
  return "default";
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default BattleManagePage;