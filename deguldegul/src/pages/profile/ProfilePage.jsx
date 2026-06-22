import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../services/supabase";
import { useNavigate } from "react-router-dom";

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
  Chip,
} from "@mui/material";

function ProfilePage() {
  const { profile } = useAuth();

  const isAdmin = ["ADMIN", "MANAGER", "STAFF"].includes(profile?.role);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navigate = useNavigate();

  const getRoleLabel = (role) => {
    switch (role) {
      case "ADMIN":
        return "관리자";
      case "MANAGER":
        return "담당자";
      case "STAFF":
        return "스태프";
      case "MEMBER":
        return "멤버";
      default:
        return role || "-";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "ACTIVE":
        return "정상";
      case "PENDING":
        return "승인대기";
      case "SLEEP":
        return "휴면";
      case "REJECTED":
        return "거절";
      default:
        return status || "-";
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        내 정보
      </Typography>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: "primary.main",
                fontWeight: 800,
              }}
            >
              {profile?.name?.charAt(0) || "?"}
            </Avatar>

            <Box sx={{ flex: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography fontWeight={800}>
                  {profile?.name || "사용자"}
                </Typography>

                <Chip
                  label={getRoleLabel(profile?.role)}
                  size="small"
                  color={isAdmin ? "primary" : "default"}
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Typography variant="body2" color="text.secondary">
                {profile?.nickname || "-"}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                가입일 {profile?.join_date || "-"} · {getStatusLabel(profile?.status)}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <InfoChip label="손" value={profile?.hand === "LEFT" ? "왼손" : "오른손"} />
            <InfoChip label="스타일" value={getBowlTypeLabel(profile?.bwl_tp)} />
          </Stack>

          <Button fullWidth variant="outlined" sx={{ mt: 2 }}>
            프로필 편집
          </Button>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <List>
          {[
            "점수 기록",
            "출석 기록",
            "알림 설정",
            "이용약관",
            "개인정보처리방침",
          ].map((item, index, arr) => (
            <Box key={item}>
              <ListItemButton>
                <ListItemText primary={item} />
              </ListItemButton>
              {index < arr.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <List>
          <ListItemButton onClick={handleLogout}>
            <ListItemText primary="로그아웃" />
          </ListItemButton>
        </List>
      </Card>

      {isAdmin && (
        <Card sx={{ borderRadius: 3 }}>
          <List>
            <ListItemButton onClick={() => navigate("/admin")}>
              <ListItemText
                primary="관리자 메뉴"
                secondary="회원관리, 볼링장관리, 고정모임관리"
              />
            </ListItemButton>
          </List>
        </Card>
      )}
    </Box>
  );
}

function InfoChip({ label, value }) {
  return (
    <Box
      sx={{
        flex: 1,
        bgcolor: "#f5f6fa",
        borderRadius: 2,
        px: 1.5,
        py: 1,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={800}>{value || "-"}</Typography>
    </Box>
  );
}

function getBowlTypeLabel(value) {
  switch (value) {
    case "WRIST_SPT":
      return "아대";
    case "THREE_FINGER":
      return "3핑거";
    case "THUMBLESS":
      return "덤리스";
    case "TWO_HAND":
      return "투핸드";
    default:
      return value || "-";
  }
}

export default ProfilePage;