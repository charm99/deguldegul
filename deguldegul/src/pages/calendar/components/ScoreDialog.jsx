import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import { formatTime } from "../utils/calendarUtils";

function ScoreDialog({
  open,
  meeting,
  scoreInputs,
  onClose,
  onAddGame,
  onRemoveGame,
  onUpdateScore,
  onSave,
  onDelete,
}) {
  const isRegular = meeting?.meeting_tp === "REG";

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>점수 입력</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography fontWeight={800}>{meeting?.meeting_nm || "-"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {meeting?.center?.center_nm || "-"} · {formatTime(meeting?.meeting_dt)}
            </Typography>
          </Box>

          {scoreInputs.map((item, index) => (
            <Stack key={index} direction="row" spacing={1} alignItems="center">
              <TextField
                label={`${index + 1}게임`}
                type="number"
                value={item.score}
                onChange={(e) => onUpdateScore(index, e.target.value)}
                fullWidth
              />

              {!isRegular && scoreInputs.length > 1 && (
                <IconButton color="error" onClick={() => onRemoveGame(index)}>
                  <DeleteIcon />
                </IconButton>
              )}
            </Stack>
          ))}

          {!isRegular && (
            <Button variant="outlined" onClick={onAddGame}>
              게임 추가
            </Button>
          )}

          {isRegular && (
            <Typography variant="caption" color="text.secondary">
              정기전은 4게임 기준으로 입력합니다.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button color="error" onClick={onDelete}>
          전체삭제
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={onSave}>
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ScoreDialog;