import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";

function AdminPage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
        관리자 메뉴
      </Typography>

      <Stack spacing={2}>
        <Card sx={{ borderRadius: 3 }}>
          <List>
            <ListItemButton onClick={() => navigate("/admin/users")}>
              <ListItemText
                primary="회원관리"
                secondary="가입 승인, 회원 권한/상태 관리"
              />
            </ListItemButton>
          </List>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <List>
            <ListItemButton onClick={() => navigate("/admin/centers")}>
              <ListItemText
                primary="볼링장관리"
                secondary="볼링장, 담당자, 고정일 관리"
              />
            </ListItemButton>
          </List>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <List>
            <ListItemButton onClick={() => navigate("/admin/meetings")}>
              <ListItemText
                primary="모임관리"
                secondary="정기전, 번개, 이벤트 일정 관리"
              />
            </ListItemButton>
          </List>
        </Card>

        <Card sx={{ borderRadius: 3 }}>
          <List>
            <ListItemButton onClick={() => navigate("/admin/battle")}>
              <ListItemText
                primary="배틀로얄 관리"
                secondary="배틀로얄 정산, 포인트이력 관리"
              />
            </ListItemButton>
          </List>
        </Card>


      </Stack>
    </Box>
  );
}

export default AdminPage;