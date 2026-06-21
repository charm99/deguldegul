import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Stack,
  Typography,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";

import { supabase } from "../../services/supabase";

function CompleteProfilePage() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");

  const [gender, setGender] = useState("M");
  const [hand, setHand] = useState("RIGHT");
  const [bwlTp, setBwlTp] = useState("THREE_FINGER");

  const handleSave = async () => {

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("degul_users")
      .insert({
        id: user.id,
        name,
        nickname,
        birthday,
        gender,
        hand,
        bwl_tp: bwlTp,

        role: "MEMBER",
        status: "PENDING",
      });

    if (error) {
      alert(error.message);
      return;
    }

    alert("가입 신청이 완료되었습니다.");

    navigate("/");
  };

  return (
    <Container maxWidth="sm">
      <Stack spacing={2} sx={{ mt: 4 }}>

        <Typography
          variant="h5"
          align="center"
        >
          추가 정보 입력
        </Typography>

        <TextField
          label="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <TextField
          label="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
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
        />

        <TextField
          select
          label="성별"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <MenuItem value="M">남성</MenuItem>
          <MenuItem value="F">여성</MenuItem>
        </TextField>

        <TextField
          select
          label="손"
          value={hand}
          onChange={(e) => setHand(e.target.value)}
        >
          <MenuItem value="RIGHT">오른손</MenuItem>
          <MenuItem value="LEFT">왼손</MenuItem>
        </TextField>

        <TextField
          select
          label="볼링 스타일"
          value={bwlTp}
          onChange={(e) => setBwlTp(e.target.value)}
        >
          <MenuItem value="WRIST_SPT">아대</MenuItem>
          <MenuItem value="THREE_FINGER">3핑거</MenuItem>
          <MenuItem value="THUMBLESS">덤리스</MenuItem>
          <MenuItem value="TWO_HAND">투핸드</MenuItem>
        </TextField>

        <Button
          variant="contained"
          onClick={handleSave}
        >
          가입 신청
        </Button>

      </Stack>
    </Container>
  );
}

export default CompleteProfilePage;