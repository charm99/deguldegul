import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

function FlashMeetingDialog({ open, centers, form, setForm, onClose, onSave }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>번개 생성</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="모임명"
            value={form.meeting_nm}
            onChange={(e) => setForm({ ...form, meeting_nm: e.target.value })}
            fullWidth
          />

          <TextField
            select
            label="볼링장"
            value={form.center_id}
            onChange={(e) => setForm({ ...form, center_id: e.target.value })}
            fullWidth
          >
            {centers.map((center) => (
              <MenuItem key={center.center_id} value={center.center_id}>
                {center.center_nm}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="일시"
            type="datetime-local"
            value={form.meeting_dt}
            onChange={(e) => setForm({ ...form, meeting_dt: e.target.value })}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            fullWidth
          />

          <TextField
            label="최대인원"
            type="number"
            value={form.max_member_cnt}
            onChange={(e) =>
              setForm({ ...form, max_member_cnt: e.target.value })
            }
            fullWidth
          />

          <TextField
            label="메모"
            value={form.memo}
            onChange={(e) => setForm({ ...form, memo: e.target.value })}
            multiline
            minRows={3}
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

export default FlashMeetingDialog;