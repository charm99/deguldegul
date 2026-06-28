import { Box, Typography, IconButton, Stack, Card, CardContent } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={800}>개인정보처리방침</Typography>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
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
        </CardContent>
      </Card>
    </Box>
  );
}

function TextBlock({ title, children }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Typography fontWeight={900} sx={{ mb: 0.7 }}>{title}</Typography>
      <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
        {children}
      </Typography>
    </Box>
  );
}

export default PrivacyPage;