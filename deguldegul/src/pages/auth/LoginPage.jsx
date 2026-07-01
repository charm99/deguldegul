import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

import {
  Container,
  Button,
  Stack,
  TextField,
  Alert,
  Box,
  CircularProgress,
} from "@mui/material";

import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const { authUser, profile, loading, refreshSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!authUser) return;

    if (!profile) {
      navigate("/complete-profile", { replace: true });
      return;
    }

    if (profile.status === "PND") {
      setMessage("관리자 승인 대기중입니다.");
      supabase.auth.signOut();
      return;
    }

    if (profile.status === "REJ") {
      setMessage("가입이 거절된 계정입니다.");
      supabase.auth.signOut();
      return;
    }

    if (profile.status === "SLP") {
      setMessage("휴면 계정입니다.");
      supabase.auth.signOut();
      return;
    }

    if (profile.status !== "ACT") {
      setMessage("사용할 수 없는 계정 상태입니다.");
      supabase.auth.signOut();
      return;
    }

    navigate("/home", { replace: true });
  }, [authUser, profile, loading, navigate]);

  const handleLogin = async () => {
    try {
      setLoginLoading(true);
      setMessage("");

      if (!email.trim()) {
        setMessage("이메일을 입력해주세요.");
        return;
      }

      if (!password) {
        setMessage("비밀번호를 입력해주세요.");
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      // 세션 생성 직후 profile을 한 번 강제로 로드
      await refreshSession();
    } catch (error) {
      console.error(error);
      setMessage(error.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Stack spacing={2} alignItems="center" sx={{ mt: 16 }}>
          <CircularProgress />
        </Stack>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 12, alignItems: "center" }}>
        <Box
          component="img"
          src={logo}
          alt="데굴데굴"
          sx={{
            width: "90%",
            maxWidth: 360,
            mx: "auto",
            display: "block",
            mb: 3,
          }}
        />

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
          onKeyDown={(e) => {
            if (e.key === "Enter") handleLogin();
          }}
          fullWidth
        />

        <Button
          variant="contained"
          size="large"
          onClick={handleLogin}
          disabled={loginLoading}
          fullWidth
        >
          로그인
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate("/signup")}
          fullWidth
        >
          회원가입
        </Button>
      </Stack>
    </Container>
  );
}

export default LoginPage;