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

  const canWriteNotice = ["ADM", "MGR"].includes(profile?.role);

  const loadBoard = async () => {
    const { data, error } = await getBoardDetail(boardId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTitle(data.title);
    setContent(data.content);
  };

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
    if (isEdit) {
      loadBoard();
    }
  }, [boardId]);

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800}>
          {isEdit ? "글 수정" : boardTp === "NOT" ? "공지 작성" : "자유글 작성"}
        </Typography>
      </Stack>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Stack spacing={2}>
        <TextField
          label="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
        />

        <TextField
          label="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          minRows={8}
          fullWidth
        />

        {!isEdit && (
          <Button variant="outlined" component="label">
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

        <Button variant="contained" size="large" onClick={handleSave}>
          저장
        </Button>
      </Stack>
    </Box>
  );
}

export default BoardWritePage;