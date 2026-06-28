import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Stack,
  IconButton,
  Card,
  CardContent,
  Alert,
  Chip,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

function PointHistoryPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [histories, setHistories] = useState([]);
  const [message, setMessage] = useState("");

  const totalPoint = histories.reduce(
    (sum, item) => sum + Number(item.point || 0),
    0
  );

  const loadHistories = async () => {
    if (!profile?.id) return;

    setMessage("");

    const { data, error } = await supabase
      .from("degul_point_history")
      .select(`
        point_hist_id,
        point_tp,
        point,
        memo,
        created_at,
        meeting:meeting_id (
          meeting_nm,
          meeting_dt
        )
      `)
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setHistories(data || []);
  };

  useEffect(() => {
    loadHistories();
  }, [profile?.id]);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800}>
          포인트 이력
        </Typography>
      </Stack>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Typography color="text.secondary">현재 누적 포인트</Typography>
          <Typography fontWeight={900} fontSize={32} color="primary.main">
            {totalPoint.toLocaleString()} P
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        {histories.length === 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography color="text.secondary" textAlign="center">
                포인트 이력이 없습니다.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          histories.map((item) => (
            <Card key={item.point_hist_id} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={getPointTypeLabel(item.point_tp)}
                        size="small"
                        color={getPointColor(item.point_tp)}
                        sx={{ fontWeight: 800 }}
                      />

                      <Typography fontWeight={900}>
                        +{Number(item.point || 0).toLocaleString()}P
                      </Typography>
                    </Stack>

                    <Typography variant="body2" sx={{ mt: 1 }} noWrap>
                      {item.meeting?.meeting_nm || "-"}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(item.meeting?.meeting_dt)}
                    </Typography>

                    {item.memo && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {item.memo}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  );
}

function getPointTypeLabel(value) {
  const map = {
    ATD: "참석",
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
  if (value === "ATD") return "info";
  return "default";
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default PointHistoryPage;