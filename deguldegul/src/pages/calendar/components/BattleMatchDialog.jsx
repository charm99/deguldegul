import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  Divider,
  Chip,
} from "@mui/material";

function BattleMatchDialog({ open, meeting, matches, onClose }) {
  const grouped = [1, 2, 3, 4].map((gameNo) => ({
    gameNo,
    rows: matches.filter((item) => item.game_no === gameNo),
  }));

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>배틀로얄 대진표</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Box>
            <Typography fontWeight={800}>{meeting?.meeting_nm || "-"}</Typography>
            <Typography variant="body2" color="text.secondary">
              {meeting?.center?.center_nm || "-"}
            </Typography>
          </Box>

          {matches.length === 0 ? (
            <Typography color="text.secondary">
              생성된 대진표가 없습니다.
            </Typography>
          ) : (
            grouped.map((group) => (
              <Box key={group.gameNo}>
                <Typography fontWeight={800} sx={{ mb: 1 }}>
                  {group.gameNo}게임
                </Typography>

                <Stack spacing={1}>
                  {group.rows.map((row) => (
                    <Stack
                      key={row.battle_id}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        bgcolor: "#f5f6fa",
                        borderRadius: 2,
                        p: 1.2,
                      }}
                    >
                      <Typography fontWeight={700}>
                        {getUserName(row.user1)}
                      </Typography>

                      <Chip
                        label={row.bye_yn === "Y" ? "부전승" : "VS"}
                        size="small"
                        color={row.bye_yn === "Y" ? "warning" : "default"}
                        sx={{ fontWeight: 700 }}
                      />

                      <Typography fontWeight={700}>
                        {row.bye_yn === "Y" ? "*" : getUserName(row.user2)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                {group.gameNo < 4 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

function getUserName(user) {
  if (!user) return "-";
  return user.nickname || user.name || "-";
}

export default BattleMatchDialog;