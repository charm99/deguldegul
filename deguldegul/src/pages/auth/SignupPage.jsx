import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Stack,
  TextField,
  Button,
  Typography,
  MenuItem,
  Alert,
  Box,
  FormControlLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { supabase } from "../../services/supabase";

function SignupPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    nickname: "",
    birthday: "",
    phone_no: "",
    gender: "M",
    hand: "R",
    bwl_tp: "SPT",
  });

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const [message, setMessage] = useState("");

  const handleChange = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const validate = () => {
    if (!form.email.trim()) {
      alert("이메일을 입력해주세요.");
      return false;
    }

    if (!form.password) {
      alert("비밀번호를 입력해주세요.");
      return false;
    }

    if (form.password.length < 6) {
      alert("비밀번호는 6자리 이상 입력해주세요.");
      return false;
    }

    if (form.password !== form.passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return false;
    }

    if (!form.name.trim()) {
      alert("이름을 입력해주세요.");
      return false;
    }

    if (!form.nickname.trim()) {
      alert("닉네임을 입력해주세요.");
      return false;
    }

    if (!form.birthday) {
      alert("생년월일을 입력해주세요.");
      return false;
    }

    if (!agreeTerms) {
      alert("이용약관에 동의해주세요.");
      return false;
    }

    if (!agreePrivacy) {
      alert("개인정보처리방침에 동의해주세요.");
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setMessage("회원가입 처리 중 오류가 발생했습니다.");
      return;
    }

    const { error: profileError } = await supabase.from("degul_users").insert({
      id: userId,
      email: form.email.trim(),
      name: form.name.trim(),
      nickname: form.nickname.trim(),
      birthday: form.birthday,
      phone_no: form.phone_no.trim(),
      gender: form.gender,
      hand: form.hand,
      bwl_tp: form.bwl_tp,
      role: "MBR",
      status: "PND",
      join_date: new Date().toISOString().slice(0, 10),
    });

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    alert("회원가입이 완료되었습니다. 관리자 승인 후 이용할 수 있습니다.");
    navigate("/");
  };

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 5, mb: 6 }}>
        <Typography variant="h5" align="center" fontWeight={900}>
          회원가입
        </Typography>

        <Typography align="center" color="text.secondary">
          데굴데굴 이용을 위한 정보를 입력해주세요.
        </Typography>

        {message && <Alert severity="error">{message}</Alert>}

        <TextField
          label="이메일"
          value={form.email}
          onChange={(e) => handleChange("email", e.target.value)}
          fullWidth
        />

        <TextField
          label="비밀번호"
          type="password"
          value={form.password}
          onChange={(e) => handleChange("password", e.target.value)}
          fullWidth
        />

        <TextField
          label="비밀번호 확인"
          type="password"
          value={form.passwordConfirm}
          onChange={(e) => handleChange("passwordConfirm", e.target.value)}
          fullWidth
        />

        <TextField
          label="이름"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          fullWidth
        />

        <TextField
          label="닉네임"
          value={form.nickname}
          onChange={(e) => handleChange("nickname", e.target.value)}
          fullWidth
        />

        <TextField
          label="생년월일"
          type="date"
          value={form.birthday}
          onChange={(e) => handleChange("birthday", e.target.value)}
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
          fullWidth
        />

        <TextField
          label="휴대폰번호"
          value={form.phone_no}
          onChange={(e) => handleChange("phone_no", e.target.value)}
          placeholder="01012345678"
          fullWidth
        />

        <TextField
          select
          label="성별"
          value={form.gender}
          onChange={(e) => handleChange("gender", e.target.value)}
          fullWidth
        >
          <MenuItem value="M">남자</MenuItem>
          <MenuItem value="F">여자</MenuItem>
        </TextField>

        <TextField
          select
          label="주손"
          value={form.hand}
          onChange={(e) => handleChange("hand", e.target.value)}
          fullWidth
        >
          <MenuItem value="R">오른손</MenuItem>
          <MenuItem value="L">왼손</MenuItem>
        </TextField>

        <TextField
          select
          label="투구방식"
          value={form.bwl_tp}
          onChange={(e) => handleChange("bwl_tp", e.target.value)}
          fullWidth
        >
          <MenuItem value="SPT">아대</MenuItem>
          <MenuItem value="THR">3핑거</MenuItem>
          <MenuItem value="TLS">덤리스</MenuItem>
          <MenuItem value="THD">투핸드</MenuItem>
        </TextField>

        <Box>
          <FormControlLabel
            control={
              <Checkbox
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                <Typography
                  component="span"
                  color="primary"
                  fontWeight={800}
                  onClick={(e) => {
                    e.preventDefault();
                    setTermsOpen(true);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  이용약관
                </Typography>
                에 동의합니다. (필수)
              </Typography>
            }
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={agreePrivacy}
                onChange={(e) => setAgreePrivacy(e.target.checked)}
              />
            }
            label={
              <Typography variant="body2">
                <Typography
                  component="span"
                  color="primary"
                  fontWeight={800}
                  onClick={(e) => {
                    e.preventDefault();
                    setPrivacyOpen(true);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  개인정보처리방침
                </Typography>
                에 동의합니다. (필수)
              </Typography>
            }
          />
        </Box>

        <Button variant="contained" size="large" onClick={handleSignup}>
          가입하기
        </Button>

        <Button variant="text" onClick={() => navigate("/")}>
          로그인으로 돌아가기
        </Button>
      </Stack>

      <TermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyDialog open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </Container>
  );
}

function TermsDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>이용약관</DialogTitle>

      <DialogContent dividers>
        <TextBlock title="제1조 목적">
          본 약관은 데굴데굴 서비스의 이용조건 및 운영에 관한 사항을 규정합니다.
        </TextBlock>

        <TextBlock title="제2조 회원가입">
          회원은 정확한 정보를 입력하여 가입하여야 하며, 허위 정보를 입력한 경우 서비스 이용이 제한될 수 있습니다.
        </TextBlock>

        <TextBlock title="제3조 서비스 이용">
          회원은 모임 일정 조회, 참석 투표, 점수 등록, 배틀로얄 참여, 게시판 이용, 통계 조회 기능을 이용할 수 있습니다.
        </TextBlock>

        <TextBlock title="제4조 회원의 의무">
          회원은 타인의 정보 도용, 허위 점수 등록, 서비스 운영 방해, 타 회원 비방 행위를 해서는 안 됩니다.
        </TextBlock>

        <TextBlock title="제5조 게시글">
          게시글의 책임은 작성자에게 있으며, 운영자는 부적절한 게시글을 삭제하거나 숨김 처리할 수 있습니다.
        </TextBlock>

        <TextBlock title="제6조 서비스 변경">
          운영자는 서비스 개선을 위해 기능을 변경하거나 종료할 수 있습니다.
        </TextBlock>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>확인</Button>
      </DialogActions>
    </Dialog>
  );
}

function PrivacyDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>개인정보처리방침</DialogTitle>

      <DialogContent dividers>
        <TextBlock title="1. 수집하는 개인정보">
          이름, 닉네임, 이메일, 휴대폰번호, 생년월일, 성별, 주손, 투구방식, 가입일, 모임 참석 기록, 경기 점수 기록, 배틀로얄 기록을 수집합니다.
        </TextBlock>

        <TextBlock title="2. 이용 목적">
          회원 식별, 모임 운영, 출석 관리, 점수 및 통계 제공, 공지사항 전달을 위해 사용합니다.
        </TextBlock>

        <TextBlock title="3. 보관 기간">
          회원 탈퇴 시 개인정보는 지체 없이 삭제합니다. 단, 모임 통계의 무결성 유지를 위해 식별이 어려운 형태의 일부 기록은 보관될 수 있습니다.
        </TextBlock>

        <TextBlock title="4. 제3자 제공">
          서비스는 회원의 개인정보를 제3자에게 제공하지 않습니다. 단, 법령에 따라 요구되는 경우는 예외로 합니다.
        </TextBlock>

        <TextBlock title="5. 개인정보 보호">
          서비스는 Supabase 기반의 인증 및 데이터베이스를 이용하며, 접근 권한 정책을 통해 개인정보를 보호합니다.
        </TextBlock>

        <TextBlock title="6. 문의">
          개인정보 관련 문의는 데굴데굴 운영진에게 문의할 수 있습니다.
        </TextBlock>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>확인</Button>
      </DialogActions>
    </Dialog>
  );
}

function TextBlock({ title, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography fontWeight={900} sx={{ mb: 0.7 }}>
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
        {children}
      </Typography>
    </Box>
  );
}

export default SignupPage;