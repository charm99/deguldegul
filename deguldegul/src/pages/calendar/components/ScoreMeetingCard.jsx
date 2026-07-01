import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import { formatTime } from "../utils/calendarUtils";
import InfoBox from "./InfoBox";

const cardSx = {
  borderRadius: 3,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

function ScoreMeetingCard({ meeting, scores, onClick }) {
  const total = scores.reduce((sum, item) => sum + Number(item.score || 0), 0);
  const avg = scores.length > 0 ? (total / scores.length).toFixed(1) : "-";
  const high =
    scores.length > 0 ? Math.max(...scores.map((item) => item.score)) : "-";

  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={900} textAlign="left" noWrap>
              {meeting.meeting_nm}
            </Typography>

            <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 1 }}>
              <PlaceOutlinedIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary" textAlign="left" noWrap>
                {meeting.center?.center_nm || "-"}
              </Typography>
            </Stack>

            <Stack direction="row" spacing={0.7} alignItems="center" sx={{ mt: 0.6 }}>
              <AccessTimeIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary" textAlign="left">
                {formatTime(meeting.meeting_dt)}
              </Typography>
            </Stack>
          </Box>

          <Chip
            label={scores.length > 0 ? "입력완료" : "미입력"}
            color={scores.length > 0 ? "success" : "default"}
            size="small"
            sx={{ fontWeight: 800, flexShrink: 0 }}
          />
        </Stack>

        {scores.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />

            <Stack direction="row" spacing={1}>
              <InfoBox label="게임" value={`${scores.length}`} />
              <InfoBox label="합계" value={total} />
              <InfoBox label="평균" value={avg} />
              <InfoBox label="최고" value={high} />
            </Stack>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="left"
              sx={{ mt: 1.5, whiteSpace: "pre-wrap" }}
            >
              {scores.map((item) => `${item.game_no}G ${item.score}`).join(" / ")}
            </Typography>
          </>
        )}

        <Button
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            fontWeight: 900,
            borderRadius: 2,
            py: 1,
          }}
          onClick={onClick}
        >
          {scores.length > 0 ? "점수 수정" : "점수 입력"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ScoreMeetingCard;