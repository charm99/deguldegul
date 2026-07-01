import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Stack,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  Fab,
} from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AddIcon from "@mui/icons-material/Add";
import { getBoards } from "../../services/boardService";
import { useAuth } from "../../contexts/AuthContext";

function BoardPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [tab, setTab] = useState(0);
  const [boards, setBoards] = useState([]);
  const [message, setMessage] = useState("");

  const boardTp = tab === 0 ? "NOT" : "FRI";

  const canWriteNotice = ["ADM", "MGR"].includes(profile?.role);
  const canWrite = boardTp === "FRI" || canWriteNotice;

  const loadBoards = async () => {
    setMessage("");

    const { data, error } = await getBoards(boardTp);

    if (error) {
      setMessage(error.message);
      return;
    }

    setBoards(data || []);
  };

  useEffect(() => {
    loadBoards();
  }, [boardTp]);

  return (
    <Box sx={{ p: 2, minHeight: "calc(100vh - 80px)" }}>
      <Typography variant="h6" fontWeight={800} textAlign="center" sx={{ mb: 2 }}>
        게시판
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        variant="fullWidth"
        sx={{ mb: 2, "& .MuiTab-root": { fontWeight: 700 } }}
      >
        <Tab label="공지사항" />
        <Tab label="자유게시판" />
      </Tabs>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Stack spacing={2}>
        {boards.length === 0 ? (
          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography color="text.secondary" textAlign="center">
                등록된 글이 없습니다.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          boards.map((board) => (
            <Card
              key={board.board_id}
              sx={{
                borderRadius: 3,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                textAlign: "left",
              }}
              onClick={() => navigate(`/board/${board.board_id}`)}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography
                  fontWeight={800}
                  fontSize={18}
                  sx={{
                    wordBreak: "break-word",
                    mb: 1.2,
                    textAlign: "left",
                  }}
                >
                  {board.title}
                </Typography>

                <Stack direction="row" alignItems="center" sx={{ width: "100%" }}>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {board.writer?.nickname || board.writer?.name || "-"}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mx: 0.8 }}>
                    ·
                  </Typography>

                  <Typography variant="body2" color="text.secondary" noWrap>
                    {formatDate(board.created_at)}
                  </Typography>

                  <Box sx={{ flex: 1 }} />

                  <Stack direction="row" spacing={0.4} alignItems="center">
                    <VisibilityOutlinedIcon sx={{ fontSize: 17, color: "text.secondary" }} />

                    <Typography variant="body2" color="text.secondary" fontWeight={700}>
                      {board.view_cnt}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {canWrite && (
        <Fab
          color="primary"
          onClick={() => navigate(`/board/write?type=${boardTp}`)}
          sx={{
            position: "fixed",
            bottom: "calc(88px + env(safe-area-inset-bottom))",
            right: "max(20px, calc((100vw - 480px) / 2 + 20px))",
            zIndex: 1200,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR");
}

export default BoardPage;