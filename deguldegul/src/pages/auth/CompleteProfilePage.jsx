import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Container,
  Stack,
  Typography,
  TextField,
  Button,
} from "@mui/material";

import { createProfile, getCurrentUser } from "../../features/auth/api/authApi";
import { COMMON_CODE_GROUP } from "../../shared/constants/commonCodeGroups";
import CodeSelect from "../../shared/components/CodeSelect";

function CompleteProfilePage() {

  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");

  const [gender, setGender] = useState("M");
  const [hand, setHand] = useState("R");
  const [bwlTp, setBwlTp] = useState("THR");

  const handleSave = async () => {

    const {
      data: { user },
    } = await getCurrentUser();

    const { error } = await createProfile({
        id: user.id,
        name,
        nickname,
        birthday,
        gender,
        hand,
        bwl_tp: bwlTp,

        role: "MBR",
        status: "PND",
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

        <CodeSelect
          group={COMMON_CODE_GROUP.GENDER}
          label="성별"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        />

        <CodeSelect
          group={COMMON_CODE_GROUP.HAND}
          label="손"
          value={hand}
          onChange={(e) => setHand(e.target.value)}
        />

        <CodeSelect
          group={COMMON_CODE_GROUP.BOWLING_TYPE}
          label="볼링 스타일"
          value={bwlTp}
          onChange={(e) => setBwlTp(e.target.value)}
        />

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
