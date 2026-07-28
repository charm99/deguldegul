import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlineRounded";
import MonetizationOnRoundedIcon from "@mui/icons-material/MonetizationOnRounded";

import capsuleMachine from "../../assets/capsule/capsule-machine.webp";
import {
  drawCapsule,
  fetchCapsuleDashboard,
} from "../../features/capsule/api/capsuleApi";

const PURPLE = "#9b43ef";
const GOLD = "#ffca28";

function CapsulePage() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [quantityMode, setQuantityMode] = useState("remain");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [result, setResult] = useState(null);

  const loadDashboard = async () => {
    const { data, error } = await fetchCapsuleDashboard();
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("");
      setDashboard(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;

    fetchCapsuleDashboard().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      else setDashboard(data);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const handleDraw = async () => {
    if (!dashboard?.round || drawing) return;

    setDrawing(true);
    setMessage("");

    const startedAt = Date.now();
    const { data, error } = await drawCapsule(dashboard.round.round_id);
    const remainingAnimation = Math.max(0, 1300 - (Date.now() - startedAt));
    await new Promise((resolve) => window.setTimeout(resolve, remainingAnimation));

    setDrawing(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setResult(data);
    await loadDashboard();
  };

  if (loading) {
    return (
      <CenterState>
        <CircularProgress sx={{ color: PURPLE }} />
        <Typography sx={{ mt: 1.5 }}>캡슐 이벤트를 불러오는 중...</Typography>
      </CenterState>
    );
  }

  if (!dashboard?.round) {
    return (
      <CenterState>
        <Typography fontWeight={800} fontSize={18}>진행 중인 캡슐 이벤트가 없습니다.</Typography>
        <Button onClick={() => navigate("/home")} sx={{ mt: 2 }}>홈으로 돌아가기</Button>
      </CenterState>
    );
  }

  const round = dashboard.round;
  const progress = round.total_capsule_cnt
    ? ((round.total_capsule_cnt - dashboard.remain_capsule_cnt) /
        round.total_capsule_cnt) *
      100
    : 0;
  const canDraw =
    dashboard.coin_balance > 0 && dashboard.remain_capsule_cnt > 0 && !drawing;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        color: "#fff",
        bgcolor: "#10091f",
        background:
          "radial-gradient(circle at 50% 22%, rgba(118,42,183,.32), transparent 36%), linear-gradient(180deg, #130924 0%, #0e081b 100%)",
        pb: 3,
      }}
    >
      <Stack direction="row" alignItems="center" sx={{ px: 1.5, pt: 1.5 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: "#fff" }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography fontWeight={800} sx={{ flex: 1, textAlign: "center" }}>뽑기 👑</Typography>
        <IconButton onClick={() => setHelpOpen(true)} sx={{ color: "#fff" }}>
          <HelpOutlineIcon />
        </IconButton>
      </Stack>

      <Box sx={{ px: 2.2, textAlign: "center" }}>
        <Typography
          fontWeight={900}
          sx={{
            mt: 1.5,
            fontSize: 27,
            background: "linear-gradient(90deg, #ff8eea, #c278ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          배틀로얄 뽑기
        </Typography>
        <Typography color="#aaa0bd" sx={{ mt: 0.3, fontSize: 12 }}>
          {round.round_nm}
        </Typography>

        {message && <Alert severity="error" sx={{ mt: 1.5, textAlign: "left" }}>{message}</Alert>}

        <Box
          component="img"
          src={capsuleMachine}
          alt="보라색 캡슐 머신"
          sx={{
            width: "100%",
            maxHeight: 330,
            objectFit: "contain",
            mt: 1,
            borderRadius: 3,
            transform: drawing ? "translateX(-3px) rotate(-1deg)" : "none",
            animation: drawing ? "capsuleShake .12s infinite alternate" : "none",
            "@keyframes capsuleShake": {
              from: { transform: "translateX(-4px) rotate(-1deg)" },
              to: { transform: "translateX(4px) rotate(1deg)" },
            },
          }}
        />

        <Stack direction="row" spacing={1.2} sx={{ mt: -1 }}>
          <StatusCard label="남은 당첨품" value={`${dashboard.remain_prize_cnt}개`} />
          <StatusCard
            label="남은 캡슐"
            value={`${dashboard.remain_capsule_cnt} / ${round.total_capsule_cnt}개`}
          >
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                mt: 1,
                height: 6,
                borderRadius: 99,
                bgcolor: "rgba(255,255,255,.12)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: "#bd4cff",
                  borderRadius: 99,
                },
              }}
            />
          </StatusCard>
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          sx={{
            mt: 1.2,
            px: 2,
            py: 1.4,
            bgcolor: "rgba(255,255,255,.07)",
            border: "1px solid rgba(255,255,255,.09)",
            borderRadius: 2.2,
          }}
        >
          <Typography color="#b8aec8" sx={{ flex: 1, textAlign: "left", fontSize: 12 }}>
            보유 코인
          </Typography>
          <MonetizationOnRoundedIcon sx={{ color: GOLD, mr: 0.5 }} />
          <Typography fontWeight={900} fontSize={22}>{dashboard.coin_balance}개</Typography>
        </Stack>

        <Box
          sx={{
            mt: 1.5,
            p: 1.5,
            bgcolor: "rgba(255,255,255,.055)",
            border: "1px solid rgba(255,255,255,.09)",
            borderRadius: 2.2,
            textAlign: "left",
          }}
        >
          <Stack direction="row" alignItems="center" sx={{ mb: 1.2 }}>
            <Typography fontWeight={800} sx={{ flex: 1 }}>당첨품 목록</Typography>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={quantityMode}
              onChange={(_, value) => value && setQuantityMode(value)}
              sx={{
                "& .MuiToggleButton-root": {
                  color: "#9e94b3",
                  borderColor: "rgba(255,255,255,.12)",
                  px: 1.1,
                  py: 0.35,
                  fontSize: 10,
                },
                "& .Mui-selected": {
                  color: "#fff !important",
                  bgcolor: "rgba(155,67,239,.35) !important",
                },
              }}
            >
              <ToggleButton value="total">전체</ToggleButton>
              <ToggleButton value="remain">남은</ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          <Stack spacing={0.8}>
            {dashboard.prizes.map((prize, index) => (
              <Stack key={prize.prize_id} direction="row" alignItems="center">
                <Box
                  sx={{
                    width: 25,
                    height: 25,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: prize.prize_tp === "LOSE" ? "#625a70" : "#7d2fc2",
                    mr: 1,
                  }}
                >
                  {prize.prize_tp === "LOSE" ? "·" : "✦"}
                </Box>
                <Typography color={GOLD} fontWeight={800} sx={{ width: 28, fontSize: 13 }}>
                  {index + 1}등
                </Typography>
                <Typography sx={{ flex: 1, fontSize: 12 }}>{prize.prize_nm}</Typography>
                <Typography color="#b8aec8" sx={{ fontSize: 12 }}>
                  {quantityMode === "total" ? prize.total_qty : prize.remain_qty}개
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Button
          fullWidth
          variant="contained"
          disabled={!canDraw}
          onClick={handleDraw}
          startIcon={<MonetizationOnRoundedIcon />}
          sx={{
            mt: 2,
            height: 54,
            borderRadius: 99,
            fontSize: 17,
            fontWeight: 900,
            background: "linear-gradient(90deg, #7831db, #a22ce5)",
            boxShadow: "0 10px 28px rgba(135,48,220,.35)",
            "&.Mui-disabled": {
              color: "#777080",
              background: "#2b2534",
            },
          }}
        >
          {drawing ? "캡슐을 뽑는 중..." : "1개로 뽑기!"}
        </Button>
      </Box>

      <HelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ResultDialog result={result} onClose={() => setResult(null)} />
    </Box>
  );
}

function StatusCard({ label, value, children }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        p: 1.5,
        bgcolor: "rgba(255,255,255,.07)",
        border: "1px solid rgba(255,255,255,.09)",
        borderRadius: 2.2,
        textAlign: "left",
      }}
    >
      <Typography color="#b8aec8" sx={{ fontSize: 11 }}>{label}</Typography>
      <Typography fontWeight={900} sx={{ mt: 0.4, fontSize: 18 }}>{value}</Typography>
      {children}
    </Box>
  );
}

function HelpDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>캡슐 뽑기 안내</DialogTitle>
      <DialogContent>
        <Stack spacing={1.2}>
          <Typography variant="body2">• 운영진이 지정한 모임 참석 시 회차 코인을 받을 수 있습니다.</Typography>
          <Typography variant="body2">• 코인 1개로 캡슐을 한 번 뽑을 수 있습니다.</Typography>
          <Typography variant="body2">• 각 캡슐의 당첨품은 회차 시작 시 미리 무작위 배정됩니다.</Typography>
          <Typography variant="body2">• 상품별 전체 및 남은 수량은 화면에서 확인할 수 있습니다.</Typography>
          <Typography variant="body2">• 회차가 종료되면 남은 코인은 다음 회차로 이월되지 않습니다.</Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>확인</Button>
      </DialogActions>
    </Dialog>
  );
}

function ResultDialog({ result, onClose }) {
  return (
    <Dialog open={Boolean(result)} onClose={onClose} fullWidth>
      <DialogContent sx={{ textAlign: "center", pt: 4 }}>
        <Typography fontSize={42}>{result?.prize_tp === "LOSE" ? "🥲" : "🎉"}</Typography>
        <Typography fontWeight={900} fontSize={22} sx={{ mt: 1 }}>
          {result?.prize_tp === "LOSE" ? "아쉽지만 꽝이에요" : "당첨되었습니다!"}
        </Typography>
        <Typography color="primary" fontWeight={900} fontSize={19} sx={{ mt: 1 }}>
          {result?.prize_nm}
        </Typography>
        {result?.memo && <Typography color="text.secondary" sx={{ mt: 1 }}>{result.memo}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button fullWidth variant="contained" onClick={onClose}>확인</Button>
      </DialogActions>
    </Dialog>
  );
}

function CenterState({ children }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{ minHeight: "100vh", bgcolor: "#10091f", color: "#fff", px: 3, textAlign: "center" }}
    >
      {children}
    </Stack>
  );
}

export default CapsulePage;
