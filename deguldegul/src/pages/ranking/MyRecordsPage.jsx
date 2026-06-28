import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  IconButton,
  Chip,
  Alert,
  Divider,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { supabase } from "../../services/supabase";

function MyRecordsPage() {
  const navigate = useNavigate();

  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  const loadRecords = async () => {
    setMessage("");

    const { data, error } = await supabase.rpc("get_my_all_records");

    if (error) {
      setMessage(error.message);
      return;
    }

    setRecords(data || []);
  };

  useEffect(() => {
    loadRecords();
  }, []);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800}>
          전체 점수 기록
        </Typography>
      </Stack>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Stack spacing={2}>
        {records.length === 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography color="text.secondary" textAlign="center">
                등록된 점수 기록이 없습니다.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.meeting_id} sx={cardSx}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={900} noWrap>
                      {record.meeting_nm}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {formatDateTime(record.meeting_dt)}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" noWrap>
                      {record.center_nm || "-"}
                    </Typography>
                  </Box>

                  <Chip
                    label={getMeetingTypeLabel(record.meeting_tp)}
                    size="small"
                    color={record.meeting_tp === "REG" ? "primary" : "default"}
                    sx={{ fontWeight: 800 }}
                  />
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
                  <InfoBox label="게임" value={`${record.game_count}`} />
                  <InfoBox label="합계" value={record.total_score} />
                  <InfoBox label="평균" value={formatNumber(record.avg_score, 1)} />
                  <InfoBox label="최고" value={record.high_score} />
                </Stack>

                <Typography variant="body2" fontWeight={700}>
                  {record.scores}
                </Typography>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  );
}

function InfoBox({ label, value }) {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#f5f6fa",
        borderRadius: 2,
        p: 1,
        textAlign: "center",
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={900}>{value}</Typography>
    </Box>
  );
}

function getMeetingTypeLabel(value) {
  const map = {
    REG: "정기전",
    FLS: "번개",
    EVT: "이벤트",
  };

  return map[value] || value;
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

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined) return "-";

  const num = Number(value);

  if (Number.isNaN(num)) return "-";

  return digits > 0 ? num.toFixed(digits) : num;
}

const cardSx = {
  borderRadius: 3,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

export default MyRecordsPage;