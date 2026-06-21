import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Avatar,
  Divider,
} from "@mui/material";

import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

function HomePage() {
  return (
    <Box sx={{ p: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" fontWeight={700}>
          홈
        </Typography>

        <NotificationsNoneIcon />
      </Stack>

      <Card
        sx={{
          borderRadius: 3,
          background: "linear-gradient(135deg, #5E35B1, #7E57C2)",
          color: "#fff",
          mb: 2,
        }}
      >
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Typography fontWeight={700}>오늘의 모임</Typography>
            <Chip
              label="참여중"
              size="small"
              sx={{
                bgcolor: "#fff",
                color: "#5E35B1",
                fontWeight: 700,
              }}
            />
          </Stack>

          <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
            6/21 (금) 19:00 정기전
          </Typography>

          <Typography variant="body2" sx={{ mt: 0.5 }}>
            강남 볼링장
          </Typography>

          <Stack direction="row" spacing={-0.5} sx={{ mt: 2 }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <Avatar
                key={item}
                sx={{
                  width: 28,
                  height: 28,
                  border: "2px solid white",
                  fontSize: 12,
                }}
              >
                {item}
              </Avatar>
            ))}
          </Stack>

          <Typography variant="body2" sx={{ mt: 1 }}>
            참석 12 / 20명
          </Typography>

          <Button
            fullWidth
            variant="contained"
            sx={{
              mt: 2,
              bgcolor: "#fff",
              color: "#5E35B1",
              fontWeight: 700,
              "&:hover": {
                bgcolor: "#f4f4f4",
              },
            }}
          >
            참석하기
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography fontWeight={700}>공지사항</Typography>
            <Typography variant="caption" color="text.secondary">
              더보기
            </Typography>
          </Stack>

          {[
            ["[공지] 7월 정기전 안내", "2024.06.18"],
            ["[공지] 신입회원 가입 안내", "2024.06.15"],
            ["[공지] 회비 납부 안내", "2024.06.10"],
          ].map((item, index) => (
            <Box key={index}>
              <Stack direction="row" justifyContent="space-between" py={1}>
                <Typography variant="body2">{item[0]}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {item[1]}
                </Typography>
              </Stack>
              {index < 2 && <Divider />}
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={700} sx={{ mb: 1 }}>
            내 점수 요약
          </Typography>

          <Stack direction="row" spacing={1}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                평균점수
              </Typography>
              <Typography fontWeight={700}>187.5</Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                누적점수
              </Typography>
              <Typography fontWeight={700}>12,450</Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                게임수
              </Typography>
              <Typography fontWeight={700}>8</Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default HomePage;