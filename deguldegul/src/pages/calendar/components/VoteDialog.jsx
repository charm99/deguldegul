import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
  Box,
} from "@mui/material";

import { formatTime } from "../utils/calendarUtils";

function VoteDialog({
  open,
  meeting,
  voteForm,
  setVoteForm,
  onClose,
  onSave,
}) {
  const canBattle = ["ATD", "LAT"].includes(voteForm.attendance_tp);

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>참석 투표</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography fontWeight={800}>{meeting?.meeting_nm || "-"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {meeting?.center?.center_nm || "-"} · {formatTime(meeting?.meeting_dt)}
            </Typography>
          </Box>

          <TextField
            select
            label="참석상태"
            value={voteForm.attendance_tp}
            onChange={(e) => {
              const nextAttendanceTp = e.target.value;

              setVoteForm({
                ...voteForm,
                attendance_tp: nextAttendanceTp,
                battle_join_yn: ["PND", "ABS"].includes(nextAttendanceTp)
                  ? "N"
                  : voteForm.battle_join_yn,
              });
            }}
            fullWidth
          >
            <MenuItem value="ATD">참석</MenuItem>
            <MenuItem value="LAT">늦참</MenuItem>
            <MenuItem value="PND">보류</MenuItem>
            <MenuItem value="ABS">불참</MenuItem>
          </TextField>

          {canBattle && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={voteForm.battle_join_yn === "Y"}
                  onChange={(e) =>
                    setVoteForm({
                      ...voteForm,
                      battle_join_yn: e.target.checked ? "Y" : "N",
                    })
                  }
                />
              }
              label="배틀로얄 참가"
            />
          )}

          <TextField
            label="메모"
            value={voteForm.memo}
            onChange={(e) => setVoteForm({ ...voteForm, memo: e.target.value })}
            multiline
            minRows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={onSave}>
          저장
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default VoteDialog;