import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Button,
  Typography,
  Stack,
  TextField,
  Alert,
} from "@mui/material";

import { supabase } from "../../services/supabase";

function LoginPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setMessage("");

      if (!email) {
        setMessage("이메일을 입력해주세요.");
        return;
      }

      if (!password) {
        setMessage("비밀번호를 입력해주세요.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const { data: profile, error: profileError } = await supabase
        .from("degul_users")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        navigate("/complete-profile");
        return;
      }

      if (profile.status === "PENDING") {
        setMessage("관리자 승인 대기중입니다.");
        await supabase.auth.signOut();
        return;
      }

      if (profile.status === "REJECTED") {
        setMessage("가입이 거절된 계정입니다.");
        await supabase.auth.signOut();
        return;
      }

      if (profile.status === "SLEEP") {
        setMessage("휴면 계정입니다.");
        await supabase.auth.signOut();
        return;
      }

      navigate("/home");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 12 }}>
        <Typography variant="h4" align="center" fontWeight={800}>
          데굴데굴
        </Typography>

        <Typography align="center" color="text.secondary">
          볼링 동호회 관리 앱
        </Typography>

        {message && <Alert severity="error">{message}</Alert>}

        <TextField
          label="이메일"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />

        <TextField
          label="비밀번호"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleLogin}
          disabled={loading}
        >
          로그인
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate("/signup")}
        >
          회원가입
        </Button>
      </Stack>
    </Container>
  );
}

export default LoginPage;