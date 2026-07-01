import { Box, Typography, Card, CardContent, Stack, Avatar, Button, List, ListItemButton, ListItemText, Divider } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

function ProfilePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isAdmin = ["ADM", "MGR", "STF"].includes(profile?.role);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        내정보
      </Typography>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 58,
                height: 58,
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              {(profile?.nickname || profile?.name || "회").slice(0, 1)}
            </Avatar>

            <Box
              sx={{
                flex: 1,
                textAlign: "left",
                minWidth: 0,
              }}
            >
              <Typography
                fontWeight={900}
                noWrap
              >
                {profile?.nickname || profile?.name || "회원"}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                noWrap
              >
                {profile?.email}
              </Typography>

              <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.3 }}>
                <CalendarMonthIcon
                  sx={{
                    fontSize: 15,
                    color: "text.secondary",
                  }}
                />

                <Typography variant="caption" color="text.secondary">
                  가입일 {profile?.join_date || "-"}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Button
            fullWidth
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => navigate("/profile/edit")}
          >
            프로필 편집
          </Button>
        </CardContent>
      </Card>

      <MenuCard
        items={[
          { label: "포인트 이력", onClick: () => navigate("/profile/points") },
          { label: "알림 설정", onClick: () => alert("알림 설정은 추후 업데이트 예정입니다.") },
          { label: "이용약관", onClick: () => navigate("/profile/terms") },
          { label: "개인정보처리방침", onClick: () => navigate("/profile/privacy") },
          { label: "로그아웃", onClick: handleLogout },
        ]}
      />

      {isAdmin && (
        <Card sx={{ borderRadius: 3, mt: 2 }}>
          <List>
            <ListItemButton onClick={() => navigate("/admin")}>
              <ListItemText
                primary="관리자 메뉴"
                secondary="회원관리, 볼링장관리, 모임관리"
              />
            </ListItemButton>
          </List>
        </Card>
      )}
    </Box>
  );
}

function MenuCard({ items }) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <List>
        {items.map((item, index) => (
          <Box key={item.label}>
            <ListItemButton onClick={item.onClick}>
              <ListItemText primary={item.label} />
            </ListItemButton>
            {index < items.length - 1 && <Divider />}
          </Box>
        ))}
      </List>
    </Card>
  );
}

export default ProfilePage;