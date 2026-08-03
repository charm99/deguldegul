import { Box, Button, Chip, Stack, Typography } from "@mui/material";

import { formatTime } from "../utils/calendarUtils";

const BLUE = "#0868f7";

function ScoreMeetingCard({ meeting, scores, onClick }) {
  const total = scores.reduce((sum, item) => sum + Number(item.score || 0), 0);
  const avg = scores.length > 0 ? (total / scores.length).toFixed(1) : "-";
  const high = scores.length > 0
    ? Math.max(...scores.map((item) => item.score))
    : "-";

  return (
    <Box
      sx={{
        px: 2.5,
        py: 2.5,
        bgcolor: "#fff",
        borderBottom: "8px solid #f7f7f8",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography
          fontWeight={800}
          noWrap
          sx={{ flex: 1, minWidth: 0, fontSize: 16, lineHeight: 1.4 }}
        >
          {meeting.meeting_nm}
        </Typography>
        <Chip
          label={scores.length > 0 ? "입력완료" : "미입력"}
          size="small"
          sx={{
            height: 24,
            flexShrink: 0,
            bgcolor: scores.length > 0 ? "#2d9146" : "#eeeeef",
            color: scores.length > 0 ? "#fff" : "#666a70",
            fontSize: 11,
            fontWeight: 800,
            "& .MuiChip-label": { px: 1 },
          }}
        />
      </Stack>

      <Stack spacing={0.3} sx={{ mt: 1.1 }}>
        <InfoRow label="장 소" value={meeting.center?.center_nm || "-"} />
        <InfoRow label="시 간" value={formatTime(meeting.meeting_dt)} />
      </Stack>

      {scores.length > 0 && (
        <>
          <Box sx={{ height: "1px", bgcolor: "#e5e7eb", my: 1.5 }} />
          <Stack direction="row" spacing={0.8}>
            <StatBox label="게임" value={scores.length} />
            <StatBox label="합계" value={total} />
            <StatBox label="평균" value={avg} />
            <StatBox label="최고" value={high} />
          </Stack>

          <Typography
            color="#555a62"
            sx={{ mt: 1.2, fontSize: 12, lineHeight: 1.45 }}
          >
            {scores.map((item) => `${item.game_no}G ${item.score}`).join(" / ")}
          </Typography>
        </>
      )}

      <Button
        fullWidth
        variant="contained"
        onClick={onClick}
        sx={{
          mt: 1.5,
          height: 39,
          borderRadius: 1.2,
          bgcolor: BLUE,
          boxShadow: "none",
          fontSize: 13,
          fontWeight: 800,
          "&:hover": { bgcolor: "#0059dd", boxShadow: "none" },
        }}
      >
        {scores.length > 0 ? "점수 수정" : "점수 입력"}
      </Button>
    </Box>
  );
}

function InfoRow({ label, value }) {
  return (
    <Stack direction="row" alignItems="center" minHeight={18}>
      <Typography
        color="#a0a4ab"
        sx={{
          width: 58,
          flexShrink: 0,
          whiteSpace: "nowrap",
          fontSize: 13,
          lineHeight: 1.4,
        }}
      >
        {label}
      </Typography>
      <Typography
        color="#30333a"
        fontWeight={500}
        noWrap
        sx={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.4 }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function StatBox({ label, value }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        py: 1,
        bgcolor: "#f5f6fa",
        borderRadius: 1.5,
        textAlign: "center",
      }}
    >
      <Typography color="#555a62" sx={{ fontSize: 11, lineHeight: 1.3 }}>
        {label}
      </Typography>
      <Typography color="#16181c" fontWeight={800} sx={{ mt: 0.35, fontSize: 15 }}>
        {value}
      </Typography>
    </Box>
  );
}

export default ScoreMeetingCard;
