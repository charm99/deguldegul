import { Container, Button, Typography, Stack } from "@mui/material";
import { supabase } from "../../services/supabase";

function LoginPage() {
  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <Container maxWidth="sm">
      <Stack spacing={3} sx={{ mt: 15 }}>
        <Typography
          variant="h4"
          align="center"
        >
          볼링클럽
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleKakaoLogin}
        >
          카카오로 시작하기
        </Button>
      </Stack>
    </Container>
  );
}

export default LoginPage;