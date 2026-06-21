import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Avatar,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";

function ProfilePage() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        내 정보
      </Typography>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ width: 56, height: 56 }}>홍</Avatar>

            <Box>
              <Typography fontWeight={700}>홍길동</Typography>
              <Typography variant="caption" color="text.secondary">
                클럽 가입일 2023.03.15
              </Typography>
            </Box>
          </Stack>

          <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
            프로필 편집
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <List>
          {[
            "참여 모임",
            "내 점수 기록",
            "출석 기록",
            "알림 설정",
            "이용약관",
            "개인정보처리방침",
            "로그아웃",
          ].map((item, index) => (
            <Box key={item}>
              <ListItemButton>
                <ListItemText primary={item} />
              </ListItemButton>
              {index < 6 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <List>
          <ListItemButton>
            <ListItemText
              primary="관리자 메뉴"
              secondary="회원관리, 볼링장관리, 고정모임관리"
            />
          </ListItemButton>
        </List>
      </Card>
    </Box>
  );
}

export default ProfilePage;