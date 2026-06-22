import { useState } from "react";

import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Stack,
  Fab,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";

function BoardPage() {
  const [tab, setTab] = useState(0);

  const posts = tab === 0
    ? [
        ["[공지] 7월 정기전 안내", "2024.06.18"],
        ["[공지] 신입회원 가입 안내", "2024.06.15"],
        ["[공지] 회비 납부 안내", "2024.06.10"],
      ]
    : [
        ["오늘 번개 가능하신 분?", "임창민"],
        ["볼 추천 부탁드립니다!", "박성근"],
        ["주말에 연습 같이 하실 분?", "임창민"],
      ];

  return (
    <Box sx={{ p: 2, position: "relative", minHeight: "calc(100vh - 80px)" }}>
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        게시판
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        variant="fullWidth"
        sx={{ mb: 2 }}
      >
        <Tab label="공지사항" />
        <Tab label="자유게시판" />
      </Tabs>

      <Stack spacing={2}>
        {posts.map((item, index) => (
          <Card key={index} sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography fontWeight={700}>{item[0]}</Typography>
              <Typography variant="caption" color="text.secondary">
                {item[1]}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Fab
        color="primary"
        sx={{
          position: "fixed",
          bottom: "calc(88px + env(safe-area-inset-bottom))",
          right: "max(20px, calc((100vw - 480px) / 2 + 20px))",
          zIndex: 1200,
        }}
      >
        <EditIcon />
      </Fab>
    </Box>
  );
}

export default BoardPage;