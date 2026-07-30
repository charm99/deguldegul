import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchMyRecords } from "../../features/ranking/api/rankingApi";
import { useCommonCodes } from "../../contexts/useCommonCodes";
import { COMMON_CODE_GROUP } from "../../shared/constants/commonCodeGroups";

function MyRecordsPage() {
  const navigate = useNavigate();
  const { getCodeName } = useCommonCodes();
  const getMeetingTypeLabel = (value) =>
    getCodeName(COMMON_CODE_GROUP.MEETING_TYPE, value);

  const [records, setRecords] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    fetchMyRecords().then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setMessage(error.message);
        return;
      }

      setRecords(data || []);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 72px)",
        bgcolor: "#f7f7f8",
        pb: 10,
        fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          minHeight: 58,
          px: 1,
          bgcolor: "#fff",
          borderBottom: "1px solid #eceef2",
        }}
      >
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Typography sx={{ fontSize: 16, fontWeight: 900 }}>
          전체 점수 기록
        </Typography>
      </Stack>

      <Stack spacing={1.25} sx={{ p: 2 }}>
        {message && <Alert severity="error">{message}</Alert>}

        {records.length === 0 ? (
          <Card sx={cardSx}>
            <CardContent sx={{ py: 4 }}>
              <Typography color="text.secondary" textAlign="center">
                등록된 점수 기록이 없습니다.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          records.map((record) => (
            <Card key={record.meeting_id} sx={cardSx}>
              <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) auto",
                    alignItems: "center",
                    columnGap: 1,
                  }}
                >
                  <Typography noWrap sx={{ minWidth: 0, fontSize: 14, fontWeight: 900 }}>
                    {record.meeting_nm}
                  </Typography>
                  <Chip
                    label={getMeetingTypeLabel(record.meeting_tp)}
                    size="small"
                    color={record.meeting_tp === "REG" ? "primary" : "default"}
                    sx={{ height: 23, fontSize: 10.5, fontWeight: 800 }}
                  />
                </Box>

                <Box sx={{ mt: 0.65, textAlign: "left" }}>
                  <Typography color="#5f6368" sx={{ fontSize: 11.5, lineHeight: 1.45 }}>
                    {formatDateTime(record.meeting_dt)}
                  </Typography>
                  <Typography color="#858991" noWrap sx={{ fontSize: 11.5, lineHeight: 1.45 }}>
                    {record.center_nm || "-"}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.25 }} />

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                    gap: 0.75,
                    mb: 1,
                  }}
                >
                  <InfoBox label="평균" value={formatNumber(record.avg_score, 1)} />
                  <InfoBox label="합계" value={record.total_score} />
                  <InfoBox label="최고점" value={record.high_score} />
                </Box>

                <ScoreGrid scores={parseScores(record.scores)} />
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Box>
  );
}

function ScoreGrid({ scores }) {
  if (scores.length === 0) {
    return (
      <Typography color="#858991" textAlign="center" sx={{ py: 0.75, fontSize: 11.5 }}>
        게임별 점수가 없습니다.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(scores.length, 4)}, minmax(0, 1fr))`,
        gap: 0.6,
      }}
    >
      {scores.map((score, index) => (
        <Box
          key={`${index}-${score}`}
          sx={{
            minWidth: 0,
            py: 0.75,
            bgcolor: "#fff",
            border: "1px solid #e4e8ee",
            borderRadius: 1.25,
            textAlign: "center",
          }}
        >
          <Typography color="#9397a0" sx={{ fontSize: 9, lineHeight: 1 }}>
            {index + 1}G
          </Typography>
          <Typography color="#0868f7" sx={{ mt: 0.4, fontSize: 12.5, lineHeight: 1, fontWeight: 900 }}>
            {score}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function InfoBox({ label, value }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        bgcolor: "#f5f7fa",
        borderRadius: 1.5,
        px: 0.5,
        py: 0.85,
        textAlign: "left",
      }}
    >
      <Typography color="#858991" sx={{ fontSize: 9.5 }}>
        {label}
      </Typography>
      <Typography noWrap color="#25282d" sx={{ mt: 0.2, fontSize: 13, fontWeight: 900 }}>
        {value}
      </Typography>
    </Box>
  );
}

function parseScores(value) {
  if (Array.isArray(value)) {
    return value
      .map((score) => Number(score))
      .filter(Number.isFinite);
  }

  return String(value || "")
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number) || [];
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
  borderRadius: 2,
  border: "1px solid #eceef2",
  boxShadow: "none",
};

export default MyRecordsPage;
