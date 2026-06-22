import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Divider,
  Alert,
} from "@mui/material";

import { supabase } from "../../services/supabase";

function AdminPage() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadPendingUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("degul_users")
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setPendingUsers(data || []);
    setLoading(false);
  };

  const handleApprove = async (userId) => {
    const { error } = await supabase
      .from("degul_users")
      .update({
        status: "ACTIVE",
      })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPendingUsers();
  };

  const handleReject = async (userId) => {
    const { error } = await supabase
      .from("degul_users")
      .update({
        status: "REJECTED",
      })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadPendingUsers();
  };

  useEffect(() => {
    loadPendingUsers();
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        관리자 메뉴
      </Typography>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Typography fontWeight={800}>가입 승인 대기</Typography>
          <Typography variant="body2" color="text.secondary">
            승인 대기 회원 {pendingUsers.length}명
          </Typography>
        </CardContent>
      </Card>

      <Stack spacing={2}>
        {loading && (
          <Typography color="text.secondary">불러오는 중...</Typography>
        )}

        {!loading && pendingUsers.length === 0 && (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography color="text.secondary" textAlign="center">
                승인 대기 회원이 없습니다.
              </Typography>
            </CardContent>
          </Card>
        )}

        {pendingUsers.map((user) => (
          <Card key={user.id} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={800}>{user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.nickname}
                  </Typography>
                </Box>

                <Chip
                  label="승인대기"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 700 }}
                />
              </Stack>

              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={0.5}>
                <Typography variant="body2">
                  이메일: {user.email || "-"}
                </Typography>
                <Typography variant="body2">
                  생년월일: {user.birthday || "-"}
                </Typography>
                <Typography variant="body2">
                  손: {user.hand === "LEFT" ? "왼손" : "오른손"}
                </Typography>
                <Typography variant="body2">
                  스타일: {getBowlTypeLabel(user.bwl_tp)}
                </Typography>
                <Typography variant="body2">
                  신청일: {formatDate(user.created_at)}
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleApprove(user.id)}
                >
                  승인
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  color="error"
                  onClick={() => handleReject(user.id)}
                >
                  거절
                </Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
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

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("ko-KR");
}

export default AdminPage;