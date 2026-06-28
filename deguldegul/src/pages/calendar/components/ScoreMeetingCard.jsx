import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import { formatTime } from "../utils/calendarUtils";
import InfoBox from "./InfoBox";

const cardSx = {
  borderRadius: 3,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

function ScoreMeetingCard({ meeting, scores, onClick }) {
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  const avg = scores.length > 0 ? (total / scores.length).toFixed(1) : "-";
  const high =
    scores.length > 0 ? Math.max(...scores.map((item) => item.score)) : "-";

  return (
    <Card sx={cardSx}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <div>
            <Typography fontWeight={800}>{meeting.meeting_nm}</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }}>
              {meeting.center?.center_nm || "-"}
            </Typography>
          </div>

          <Chip
            label={scores.length > 0 ? "입력완료" : "미입력"}
            color={scores.length > 0 ? "success" : "default"}
            size="small"
            sx={{ fontWeight: 700 }}
          />
        </Stack>

        <Typography sx={{ mt: 1 }}>{formatTime(meeting.meeting_dt)}</Typography>

        {scores.length > 0 && (
          <>
            <Divider sx={{ my: 1.5 }} />

            <Stack direction="row" spacing={1}>
              <InfoBox label="게임" value={`${scores.length}`} />
              <InfoBox label="합계" value={total} />
              <InfoBox label="평균" value={avg} />
              <InfoBox label="최고" value={high} />
            </Stack>

            <Typography variant="body2" sx={{ mt: 1.5 }}>
              {scores.map((item) => `${item.game_no}G ${item.score}`).join(" / ")}
            </Typography>
          </>
        )}

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={onClick}>
          {scores.length > 0 ? "점수 수정" : "점수 입력"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default ScoreMeetingCard;