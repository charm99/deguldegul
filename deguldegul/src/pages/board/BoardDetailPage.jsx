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
  canManageNotice,
  canManageOwnedContent,
} from "../../shared/model/permissions";
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

  const isAdmin = canManageNotice(profile);
  const canEdit = canManageOwnedContent(profile, board?.writer_id);

  const [imageOpen, setImageOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");

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
    let active = true;

    Promise.all([getBoardDetail(boardId), getComments(boardId)]).then(
      ([boardResult, commentResult]) => {
        if (!active) return;

        const error = boardResult.error || commentResult.error;
        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage("");
        setBoard(boardResult.data);
        setComments(commentResult.data || []);
      }
    );

    return () => {
      active = false;
    };
  }, [boardId]);

  if (!board && !message) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "#f7f7f8", p: 3 }}>
        <Typography color="#858991" textAlign="center">불러오는 중...</Typography>
      </Box>
    );
  }

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
        position: "sticky",
        top: 0,
        zIndex: 5,
        minHeight: 58,
        px: 1,
        bgcolor: "#fff",
        borderBottom: "1px solid #eceef2",
      }}
    >
      <IconButton onClick={() => navigate(-1)} size="small">
        <ArrowBackIcon />
      </IconButton>

      <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 900 }}>
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

    <Box sx={{ p: 2 }}>
    {message && <Alert severity="error" sx={{ mb: 1.25 }}>{message}</Alert>}

    {board && (
      <>
        <Card sx={{ ...cardSx, mb: 1.25, textAlign: "left" }}>
          <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
            <Typography sx={{ color: "#25282d", fontSize: 17, lineHeight: 1.45, fontWeight: 900 }}>
              {board.title}
            </Typography>

            <Typography color="#858991" sx={{ mt: 0.65, fontSize: 11.5 }}>
              {board.writer?.nickname || board.writer?.name || "-"} ·{" "}
              {formatDateTime(board.created_at)} · 조회 {board.view_cnt}
            </Typography>

            <Divider sx={{ my: 1.5, borderColor: "#eceef2" }} />

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
                        borderRadius: 1.5,
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

        <Card sx={{ ...cardSx, textAlign: "left" }}>
          <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
            <Typography sx={{ mb: 1.25, fontSize: 14, fontWeight: 900 }}>
              댓글 {comments.length}
            </Typography>

            <Stack direction="row" spacing={0.75} sx={{ mb: 2 }}>
              <TextField
                size="small"
                placeholder="댓글을 입력하세요"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                fullWidth
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}
              />
              <Button
                variant="contained"
                onClick={handleAddComment}
                sx={{ minWidth: 58, borderRadius: 1.5, bgcolor: "#0868f7", fontWeight: 800 }}
              >
                등록
              </Button>
            </Stack>

            <Stack spacing={1.25}>
              {comments.map((comment) => {
                const canDeleteComment =
                  isAdmin || comment.writer_id === profile?.id;

                return (
                  <Box key={comment.comment_id}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography sx={{ fontSize: 12.5, fontWeight: 900 }}>
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
                      sx={{ mt: 0.35, whiteSpace: "pre-wrap", textAlign: "left", fontSize: 13, lineHeight: 1.55 }}
                    >
                      {comment.content}
                    </Typography>

                    <Typography color="#999da5" sx={{ fontSize: 10.5 }}>
                      {formatDateTime(comment.created_at)}
                    </Typography>

                    <Divider sx={{ mt: 1, borderColor: "#eceef2" }} />
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
        color: "#34373c",
        fontSize: 14,
        lineHeight: 1.75,
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

const cardSx = {
  borderRadius: 2,
  border: "1px solid #eceef2",
  boxShadow: "none",
};

export default BoardDetailPage;
