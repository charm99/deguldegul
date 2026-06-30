import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Stack,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Alert,
  Card,
  CardContent,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

function ProfileEditPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [form, setForm] = useState({
    phone_no: "",
    car_no: "",
    hand: "",
    bwl_tp: "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!profile) return;

    setForm({
      phone_no: profile.phone_no || "",
      car_no: profile.car_no || "",
      hand: profile.hand || "",
      bwl_tp: profile.bwl_tp || "",
    });
  }, [profile]);

  const handleChange = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const handleSave = async () => {
    setMessage("");

    const { error } = await supabase
      .from("degul_users")
      .update({
        phone_no: form.phone_no.trim() || null,
        car_no: form.car_no.trim() || null,
        hand: form.hand || null,
        bwl_tp: form.bwl_tp || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    alert("프로필이 수정되었습니다. 다시 로그인하면 변경사항이 완전히 반영됩니다.");
    navigate("/profile");
  };

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800}>
          프로필 편집
        </Typography>
      </Stack>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            <TextField
              label="이름"
              value={profile?.name || ""}
              disabled
              fullWidth
            />

            <TextField
              label="이메일"
              value={profile?.email || ""}
              disabled
              fullWidth
            />

            <TextField
              label="닉네임"
              value={profile?.nickname || ""}
              disabled
              fullWidth
            />

            <TextField
              label="차량번호"
              value={form.car_no}
              onChange={(e) => handleChange("car_no", e.target.value.toUpperCase())}
              placeholder="123가4567"
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
              <MenuItem value="NON">없음(초보)</MenuItem>
              <MenuItem value="SPT">아대</MenuItem>
              <MenuItem value="THR">3핑거</MenuItem>
              <MenuItem value="TLS">덤리스</MenuItem>
              <MenuItem value="THD">투핸드</MenuItem>
              <MenuItem value="BCK">백업</MenuItem>
            </TextField>

            <Button variant="contained" size="large" onClick={handleSave}>
              저장
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default ProfileEditPage;
