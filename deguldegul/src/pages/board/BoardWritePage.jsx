import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Stack,
  TextField,
  Button,
  IconButton,
  Alert,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import { useAuth } from "../../contexts/AuthContext";
import { canManageNotice } from "../../shared/model/permissions";
import {
  createBoard,
  getBoardDetail,
  updateBoard,
  uploadBoardFiles,
} from "../../services/boardService";

function BoardWritePage() {
  const navigate = useNavigate();
  const { boardId } = useParams();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();

  const isEdit = !!boardId;
  const boardTp = searchParams.get("type") || "FRI";

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState([]);
  const [message, setMessage] = useState("");

  const canWriteNotice = canManageNotice(profile);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      alert("내용을 입력해주세요.");
      return;
    }

    if (boardTp === "NOT" && !canWriteNotice) {
      alert("공지사항은 관리자 또는 매니저만 작성할 수 있습니다.");
      return;
    }

    try {
      if (isEdit) {
        const { error } = await updateBoard(boardId, {
          title: title.trim(),
          content: content.trim(),
        });

        if (error) throw error;

        navigate(`/board/${boardId}`);
        return;
      }

      const { data, error } = await createBoard({
        boardTp,
        title: title.trim(),
        content: content.trim(),
        writerId: profile.id,
      });

      if (error) throw error;

      if (files.length > 0) {
        await uploadBoardFiles(data.board_id, files);
      }

      navigate(`/board/${data.board_id}`);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "저장 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!isEdit) return undefined;

    let active = true;
    getBoardDetail(boardId).then(({ data, error }) => {
      if (!active) return;

      if (error) {
        setMessage(error.message);
        return;
      }

      setTitle(data.title);
      setContent(data.content);
    });

    return () => {
      active = false;
    };
  }, [boardId, isEdit]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 72px)",
        bgcolor: "#f7f7f8",
        pb: 10,
        fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif",
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          minHeight: 58,
          px: 1,
          bgcolor: "#fff",
          borderBottom: "1px solid #eceef2",
        }}
      >
        <IconButton onClick={() => navigate(-1)} size="small">
          <ArrowBackIcon />
        </IconButton>

        <Typography sx={{ fontSize: 16, fontWeight: 900 }}>
          {isEdit ? "글 수정" : boardTp === "NOT" ? "공지 작성" : "자유글 작성"}
        </Typography>
      </Stack>

      <Stack
        spacing={1.5}
        sx={{
          m: 2,
          p: 1.75,
          bgcolor: "#fff",
          border: "1px solid #eceef2",
          borderRadius: 2,
        }}
      >
        {message && <Alert severity="error">{message}</Alert>}

        <TextField
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          size="small"
          sx={fieldSx}
        />

        <TextField
          label="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          minRows={8}
          fullWidth
          sx={fieldSx}
        />

        {!isEdit && (
          <Button
            variant="outlined"
            component="label"
            sx={{ borderRadius: 1.5, fontWeight: 800 }}
          >
            사진 첨부
            <input
              hidden
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
            />
          </Button>
        )}

        {files.length > 0 && (
          <Typography variant="body2" color="text.secondary">
            첨부 {files.length}개
          </Typography>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          sx={{ borderRadius: 1.5, bgcolor: "#0868f7", fontWeight: 900 }}
        >
          저장
        </Button>
      </Stack>
    </Box>
  );
}

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 1.5,
    fontSize: 13,
  },
};

export default BoardWritePage;
