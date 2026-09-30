import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Fab,
  Stack,
  Tab,
  Tabs,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ChatBubbleOutlinedIcon from "@mui/icons-material/ChatBubbleOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CampaignOutlinedIcon from "@mui/icons-material/CampaignOutlined";
import { getBoards } from "../../services/boardService";
import { useAuth } from "../../contexts/AuthContext";
import { canManageNotice } from "../../shared/model/permissions";
import { getBoardCategoryLabel } from "../../shared/constants/boardCategories";
import { BOARD_CATEGORIES } from "../../shared/constants/boardCategories";

function BoardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();

  const requestedBoardType = searchParams.get("type");
  const tab = requestedBoardType === "FRI" ? 1 : 0;
  const [boards, setBoards] = useState([]);
  const [message, setMessage] = useState("");

  const boardTp = tab === 0 ? "NOT" : "FRI";
  const requestedCategory = searchParams.get("category");
  const category = BOARD_CATEGORIES.some((item) => item.value === requestedCategory)
    ? requestedCategory
    : "ALL";
  const canWrite = boardTp === "FRI" || canManageNotice(profile);

  const handleTabChange = (_, value) => {
    setSearchParams({ type: value === 0 ? "NOT" : "FRI" }, { replace: true });
  };

  const handleCategoryChange = (_, value) => {
    if (!value) return;
    const nextParams = { type: "FRI" };
    if (value !== "ALL") nextParams.category = value;
    setSearchParams(nextParams, { replace: true });
  };

  useEffect(() => {
    let active = true;

    getBoards(boardTp, boardTp === "FRI" && category !== "ALL" ? category : null).then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setMessage(error.message);
        setBoards([]);
        return;
      }

      setMessage("");
      setBoards(data || []);
    });

    return () => {
      active = false;
    };
  }, [boardTp, category]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 72px)",
        bgcolor: "#f7f7f8",
        pb: 10,
        fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 5,
          bgcolor: "#fff",
          borderBottom: "1px solid #eceef2",
        }}
      >
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            minHeight: 58,
            "& .MuiTab-root": {
              minHeight: 58,
              color: "#999da5",
              fontSize: 14,
              fontWeight: 700,
            },
            "& .Mui-selected": { color: "#0868f7 !important", fontWeight: 900 },
            "& .MuiTabs-indicator": { height: 2, bgcolor: "#0868f7" },
          }}
        >
          <Tab label="공지사항" />
          <Tab label="자유게시판" />
        </Tabs>
      </Box>

      {boardTp === "FRI" && (
        <Box sx={{ px: 2, pt: 1.5, bgcolor: "#f7f7f8", overflowX: "auto" }}>
          <ToggleButtonGroup exclusive size="small" value={category} onChange={handleCategoryChange} aria-label="자유게시판 카테고리" sx={{ whiteSpace: "nowrap", "& .MuiToggleButton-root": { px: 1.5, py: 0.65, borderRadius: "18px !important", border: "1px solid #e1e4e8 !important", mr: 0.75, color: "#737780", fontSize: 12, fontWeight: 700 }, "& .Mui-selected": { bgcolor: "#eaf3ff !important", color: "#0868f7 !important", borderColor: "#b7d4ff !important" } }}>
            <ToggleButton value="ALL">전체</ToggleButton>
            {BOARD_CATEGORIES.map((item) => <ToggleButton key={item.value} value={item.value}>{item.label}</ToggleButton>)}
          </ToggleButtonGroup>
        </Box>
      )}

      <Stack spacing={1.1} sx={{ p: 2 }}>
        {message && <Alert severity="error">{message}</Alert>}

        {boards.length === 0 ? (
          <Card sx={cardSx}>
            <CardContent sx={{ py: 4 }}>
              <Typography color="#858991" textAlign="center" sx={{ fontSize: 13 }}>
                등록된 글이 없습니다.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          boards.map((board, index) => (
            <Card
              key={board.board_id}
              component="button"
              type="button"
              onClick={() => navigate(`/board/${board.board_id}`)}
              sx={{
                ...cardSx,
                width: "100%",
                p: 0,
                bgcolor: "#fff",
                cursor: "pointer",
                textAlign: "left",
                font: "inherit",
              }}
            >
              <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Stack direction="row" alignItems="flex-start" spacing={1}>
                  {boardTp === "NOT" && index === 0 && (
                    <CampaignOutlinedIcon sx={{ mt: 0.15, color: "#ff324a", fontSize: 18 }} />
                  )}
                  <Typography
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      color: "#25282d",
                      fontSize: 14,
                      lineHeight: 1.45,
                      fontWeight: boardTp === "NOT" ? 800 : 700,
                      wordBreak: "break-word",
                    }}
                  >
                    {board.title}
                  </Typography>
                  {boardTp === "FRI" && <Chip label={getBoardCategoryLabel(board.category)} size="small" sx={{ height: 22, fontSize: 10.5 }} />}
                </Stack>

                <Stack direction="row" alignItems="center" sx={{ mt: 1.1 }}>
                  <Typography noWrap color="#737780" sx={{ minWidth: 0, fontSize: 11.5 }}>
                    {board.writer?.nickname || board.writer?.name || "-"}
                  </Typography>
                  <Typography color="#b1b4ba" sx={{ mx: 0.65, fontSize: 11 }}>·</Typography>
                  <Typography noWrap color="#858991" sx={{ fontSize: 11.5 }}>
                    {formatDate(board.created_at)}
                  </Typography>

                  <Box sx={{ flex: 1 }} />

                  <MetaIcon icon={<VisibilityOutlinedIcon />} value={board.view_cnt || 0} />
                  <MetaIcon icon={<ChatBubbleOutlinedIcon />} value={board.comment_count || 0} />
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>

      {canWrite && (
        <Fab
          color="primary"
          aria-label="글쓰기"
          onClick={() => navigate(`/board/write?type=${boardTp}`)}
          sx={{
            position: "fixed",
            bottom: "calc(88px + env(safe-area-inset-bottom))",
            right: "max(20px, calc((100vw - 480px) / 2 + 20px))",
            width: 54,
            height: 54,
            bgcolor: "#0868f7",
            boxShadow: "0 7px 18px rgba(8,104,247,.3)",
            zIndex: 1200,
          }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}

function MetaIcon({ icon, value }) {
  return (
    <Stack
      direction="row"
      spacing={0.35}
      alignItems="center"
      sx={{ ml: 1, color: "#858991", "& .MuiSvgIcon-root": { fontSize: 15 } }}
    >
      {icon}
      <Typography sx={{ fontSize: 11, fontWeight: 700 }}>{value}</Typography>
    </Stack>
  );
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

const cardSx = {
  borderRadius: 2,
  border: "1px solid #eceef2",
  boxShadow: "none",
};

export default BoardPage;
