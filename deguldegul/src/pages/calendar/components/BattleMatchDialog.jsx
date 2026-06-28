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
                  {group.rows.map((row) => {
                    const user1Id = getUserId(row, "user1");
                    const user2Id = getUserId(row, "user2");

                    return (
                      <Stack
                        key={row.battle_id}
                        direction="row"
                        alignItems="center"
                        sx={{
                          bgcolor: "#f5f6fa",
                          borderRadius: 2,
                          p: 1.2,
                          minHeight: 48,
                        }}
                      >
                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            justifyContent: "flex-start",
                          }}
                        >
                          <UserResult
                            user={row.user1}
                            isWinner={isSameId(row.winner_user_id, user1Id)}
                            isLoser={isSameId(row.loser_user_id, user1Id)}
                          />
                        </Box>

                        <Chip
                          label={getMiddleLabel(row)}
                          size="small"
                          color={getMiddleColor(row)}
                          sx={{
                            mx: 1.5,
                            minWidth: 58,
                            fontWeight: 800,
                          }}
                        />

                        <Box
                          sx={{
                            flex: 1,
                            minWidth: 0,
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          {row.bye_yn === "Y" ? (
                            <Typography fontWeight={800}>*</Typography>
                          ) : (
                            <UserResult
                              user={row.user2}
                              isWinner={isSameId(row.winner_user_id, user2Id)}
                              isLoser={isSameId(row.loser_user_id, user2Id)}
                              reverse
                            />
                          )}
                        </Box>
                      </Stack>
                    );
                  })}
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

function UserResult({ user, isWinner, isLoser, reverse = false }) {
  const resultChip = isWinner ? (
    <Chip label="승" size="small" color="success" sx={{ fontWeight: 800 }} />
  ) : isLoser ? (
    <Chip label="패" size="small" color="default" sx={{ fontWeight: 800 }} />
  ) : null;

  return (
    <Stack
      direction="row"
      spacing={0.7}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
      {reverse ? (
        <>
          {resultChip}
          <Typography fontWeight={800} noWrap>
            {getUserName(user)}
          </Typography>
        </>
      ) : (
        <>
          <Typography fontWeight={800} noWrap>
            {getUserName(user)}
          </Typography>
          {resultChip}
        </>
      )}
    </Stack>
  );
}

function getUserId(row, side) {
  if (side === "user1") {
    return row.user1_id || row.user1_user_id || row.user1?.id;
  }

  return row.user2_id || row.user2_user_id || row.user2?.id;
}

function isSameId(a, b) {
  if (!a || !b) return false;
  return String(a) === String(b);
}

function getMiddleLabel(row) {
  if (row.bye_yn === "Y") return "부전승";
  if (row.result_confirm_yn === "Y" || row.result_status === "FIN") return "결과";
  return "미정";
}

function getMiddleColor(row) {
  if (row.bye_yn === "Y") return "warning";
  if (row.result_confirm_yn === "Y" || row.result_status === "FIN") return "primary";
  return "default";
}

function getUserName(user) {
  if (!user) return "-";
  return user.nickname || user.name || "-";
}

export default BattleMatchDialog;