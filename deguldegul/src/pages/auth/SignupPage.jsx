import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  TextField,
  Button,
  Typography,
  Stack,
  MenuItem,
  Alert,
} from "@mui/material";

import { supabase } from "../../services/supabase";

function SignupPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");

  const [gender, setGender] = useState("M");
  const [hand, setHand] = useState("RIGHT");
  const [bwlTp, setBwlTp] = useState("THREE_FINGER");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async () => {
    try {
      setLoading(true);
      setMessage("");

      if (!email) {
        setMessage("이메일을 입력해주세요.");
        return;
      }

      if (password.length < 6) {
        setMessage("비밀번호는 6자리 이상 입력해주세요.");
        return;
      }

      if (!name) {
        setMessage("이름을 입력해주세요.");
        return;
      }

      if (!nickname) {
        setMessage("닉네임을 입력해주세요.");
        return;
      }

      if (!birthday) {
        setMessage("생년월일을 입력해주세요.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const { error: insertError } = await supabase
        .from("degul_users")
        .insert({
          id: data.user.id,
          email,
          name,
          nickname,
          birthday,
          gender,
          hand,
          bwl_tp: bwlTp,
          role: "MEMBER",
          status: "PENDING",
        });

      if (insertError) {
        throw insertError;
      }

      alert("가입 신청이 완료되었습니다.\n관리자 승인 후 이용 가능합니다.");
      navigate("/");
    } catch (error) {
      console.error(error);
      setMessage(error.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 4, mb: 5 }}>
        <Typography variant="h5" align="center" fontWeight={800}>
          회원가입
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

        <TextField
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />

        <TextField
          label="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          fullWidth
        />

        <TextField
          label="생년월일"
          type="date"
          value={birthday}
          onChange={(e) => setBirthday(e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          fullWidth
        />

        <TextField
          select
          label="성별"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
          fullWidth
        >
          <MenuItem value="M">남성</MenuItem>
          <MenuItem value="F">여성</MenuItem>
        </TextField>

        <TextField
          select
          label="손"
          value={hand}
          onChange={(e) => setHand(e.target.value)}
          fullWidth
        >
          <MenuItem value="RIGHT">오른손</MenuItem>
          <MenuItem value="LEFT">왼손</MenuItem>
        </TextField>

        <TextField
          select
          label="볼링 스타일"
          value={bwlTp}
          onChange={(e) => setBwlTp(e.target.value)}
          fullWidth
        >
          <MenuItem value="WRIST_SPT">아대</MenuItem>
          <MenuItem value="THREE_FINGER">3핑거</MenuItem>
          <MenuItem value="THUMBLESS">덤리스</MenuItem>
          <MenuItem value="TWO_HAND">투핸드</MenuItem>
        </TextField>

        <Button
          variant="contained"
          size="large"
          onClick={handleSignup}
          disabled={loading}
        >
          가입 신청
        </Button>

        <Button
          variant="outlined"
          size="large"
          onClick={() => navigate("/")}
        >
          로그인으로
        </Button>
      </Stack>
    </Container>
  );
}

export default SignupPage;