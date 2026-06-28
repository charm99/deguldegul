import { Box, Typography, IconButton, Stack, Card, CardContent } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

function TermsPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={800}>이용약관</Typography>
      </Stack>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
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

export default TermsPage;