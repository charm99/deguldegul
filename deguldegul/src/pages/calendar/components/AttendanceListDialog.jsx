import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

function AttendanceListDialog({ open, meeting, attendances, onClose }) {
  const grouped = {
    ATD: attendances.filter((item) => item.attendance_tp === "ATD"),
    LAT: attendances.filter((item) => item.attendance_tp === "LAT"),
    PND: attendances.filter((item) => item.attendance_tp === "PND"),
    ABS: attendances.filter((item) => item.attendance_tp === "ABS"),
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>참석자 현황</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography fontWeight={900}>{meeting?.meeting_nm || "-"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {meeting?.center?.center_nm || "-"}
            </Typography>
          </Box>

          <SummaryRow grouped={grouped} />

          <AttendanceGroup
            title="참석"
            color="primary"
            rows={grouped.ATD}
            emptyText="참석자가 없습니다."
          />

          <AttendanceGroup
            title="늦참"
            color="warning"
            rows={grouped.LAT}
            emptyText="늦참자가 없습니다."
          />

          <AttendanceGroup
            title="보류"
            color="default"
            rows={grouped.PND}
            emptyText="보류 인원이 없습니다."
          />

          <AttendanceGroup
            title="불참"
            color="default"
            rows={grouped.ABS}
            emptyText="불참 인원이 없습니다."
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

function SummaryRow({ grouped }) {
  return (
    <Stack direction="row" spacing={1}>
      <SummaryBox label="참석" value={grouped.ATD.length} />
      <SummaryBox label="늦참" value={grouped.LAT.length} />
      <SummaryBox label="보류" value={grouped.PND.length} />
      <SummaryBox label="불참" value={grouped.ABS.length} />
    </Stack>
  );
}

function SummaryBox({ label, value }) {
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

function AttendanceGroup({ title, color, rows, emptyText }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <Typography fontWeight={900}>{title}</Typography>
        <Chip label={`${rows.length}명`} size="small" color={color} />
      </Stack>

      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          {emptyText}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {rows.map((item) => (
            <Box
              key={item.user_id}
              sx={{
                bgcolor: "#f8f9fb",
                borderRadius: 2,
                p: 1.2,
              }}
            >
              <Stack direction="row" justifyContent="space-between" spacing={1}>
                <Typography fontWeight={800}>
                  {item.user?.nickname || item.user?.name || "-"}
                </Typography>

                {item.battle_join_yn === "Y" && (
                  <Chip
                    label="배틀"
                    size="small"
                    color="warning"
                    sx={{ fontWeight: 800 }}
                  />
                )}
              </Stack>

              {item.memo && (
                <>
                  <Divider sx={{ my: 0.8 }} />
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {item.memo}
                  </Typography>
                </>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

export default AttendanceListDialog;