import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Alert,
  Card,
  CardContent,
  TextField,
  Divider,
  Dialog,
} from "@mui/material";
import LinkIcon from "@mui/icons-material/Link";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";

import { useAuth } from "../../contexts/AuthContext";
import {
  createComment,
  deleteBoard,
  deleteComment,
  getBoardDetail,
  getBoardFileUrl,
  getComments,
  increaseViewCount,
} from "../../services/boardService";

function BoardDetailPage() {
  const navigate = useNavigate();
  const { boardId } = useParams();
  const { profile } = useAuth();

  const [board, setBoard] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = ["ADM", "MGR"].includes(profile?.role);
  const isWriter = board?.writer_id === profile?.id;
  const canEdit = isAdmin || isWriter;

  const [imageOpen, setImageOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");

  const loadBoard = async () => {
    setMessage("");

    const { data, error } = await getBoardDetail(boardId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setBoard(data);
  };

  const loadComments = async () => {
    const { data, error } = await getComments(boardId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setComments(data || []);
  };

  const handleDeleteBoard = async () => {
    if (!confirm("게시글을 삭제할까요?")) return;

    const { error } = await deleteBoard(boardId);

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/board");
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    const { error } = await createComment({
      boardId,
      writerId: profile.id,
      content: commentText.trim(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setCommentText("");
    await loadComments();
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("댓글을 삭제할까요?")) return;

    const { error } = await deleteComment(commentId);

    if (error) {
      alert(error.message);
      return;
    }

    await loadComments();
  };

  useEffect(() => {
    increaseViewCount(boardId);
    loadBoard();
    loadComments();
  }, [boardId]);

  if (!board && !message) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">불러오는 중...</Typography>
      </Box>
    );
  }

  return (
  <Box sx={{ p: 2 }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
      <IconButton onClick={() => navigate(-1)}>
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
        게시글
      </Typography>

      {canEdit && (
        <Button
          size="small"
          onClick={() => navigate(`/board/edit/${boardId}?type=${board.board_tp}`)}
        >
          수정
        </Button>
      )}

      {canEdit && (
        <IconButton color="error" onClick={handleDeleteBoard}>
          <DeleteIcon />
        </IconButton>
      )}
    </Stack>

    {message && (
      <Alert severity="error" sx={{ mb: 2 }}>
        {message}
      </Alert>
    )}

    {board && (
      <>
        <Card sx={{ borderRadius: 3, mb: 2, textAlign: "left" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={800} textAlign="left">
              {board.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {board.writer?.nickname || board.writer?.name || "-"} ·{" "}
              {formatDateTime(board.created_at)} · 조회 {board.view_cnt}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: "left" }}>{renderContent(board.content)}</Box>

            {board.files?.length > 0 && (
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                {board.files.map((file) => {
                  const imageUrl = getBoardFileUrl(file.file_path);

                  return (
                    <Box
                      key={file.file_id}
                      component="img"
                      src={imageUrl}
                      alt={file.file_name}
                      onClick={() => {
                        setSelectedImageUrl(imageUrl);
                        setImageOpen(true);
                      }}
                      sx={{
                        width: "100%",
                        maxHeight: 340,
                        borderRadius: 2,
                        objectFit: "cover",
                        cursor: "pointer",
                      }}
                    />
                  );
                })}
              </Stack>
            )}
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, textAlign: "left" }}>
          <CardContent>
            <Typography fontWeight={800} sx={{ mb: 1 }}>
              댓글 {comments.length}
            </Typography>

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="댓글을 입력하세요"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                fullWidth
              />
              <Button variant="contained" onClick={handleAddComment}>
                등록
              </Button>
            </Stack>

            <Stack spacing={1.5}>
              {comments.map((comment) => {
                const canDeleteComment =
                  isAdmin || comment.writer_id === profile?.id;

                return (
                  <Box key={comment.comment_id}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography fontWeight={800} variant="body2">
                        {comment.writer?.nickname || comment.writer?.name || "-"}
                      </Typography>

                      {canDeleteComment && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDeleteComment(comment.comment_id)}
                        >
                          삭제
                        </Button>
                      )}
                    </Stack>

                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", textAlign: "left" }}
                    >
                      {comment.content}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(comment.created_at)}
                    </Typography>

                    <Divider sx={{ mt: 1 }} />
                  </Box>
                );
              })}

              {comments.length === 0 && (
                <Typography color="text.secondary" textAlign="center">
                  댓글이 없습니다.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Dialog
          open={imageOpen}
          onClose={() => setImageOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <Box
            component="img"
            src={selectedImageUrl}
            alt="확대 이미지"
            onClick={() => setImageOpen(false)}
            sx={{
              width: "100%",
              maxHeight: "85vh",
              objectFit: "contain",
              bgcolor: "#000",
              cursor: "pointer",
            }}
          />
        </Dialog>
      </>
    )}
  </Box>
);
}
function renderContent(text) {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return text.split("\n").map((line, lineIndex) => (
    <Typography
      key={lineIndex}
      sx={{
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: 1.8,
        mb: 0.5,
      }}
    >
      {line.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) {
          return (
            <Button
              key={index}
              component="a"
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="text"
              startIcon={<LinkIcon />}
              sx={{
                p: 0,
                minWidth: 0,
                textTransform: "none",
                fontWeight: 700,
                verticalAlign: "baseline",
              }}
            >
              링크 열기
            </Button>
          );
        }

        return part;
      })}
    </Typography>
  ));
}
function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default BoardDetailPage;