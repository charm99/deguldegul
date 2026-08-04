import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";

import {
  fetchBattlePointHistory,
  fetchMonthlyBattleAttendances,
  refreshBattleResults,
} from "../../features/admin/api/adminApi";
import { useCommonCodes } from "../../contexts/useCommonCodes";
import { COMMON_CODE_GROUP } from "../../shared/constants/commonCodeGroups";

function BattleManagePage() {
  const navigate = useNavigate();
  const { getCodeName } = useCommonCodes();
  const getPointTypeLabel = (value) =>
    getCodeName(COMMON_CODE_GROUP.POINT_TYPE, value);

  const [histories, setHistories] = useState([]);
  const [tab, setTab] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentKoreanMonth());
  const [monthlyAttendances, setMonthlyAttendances] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [message, setMessage] = useState("");

  const loadHistories = async () => {
    setMessage("");

    const { data, error } = await fetchBattlePointHistory();

    if (error) {
      setMessage(error.message);
      return;
    }

    setHistories(data || []);
  };

  const handleRefresh = async () => {
    const ok = confirm(
      "미확정 배틀 결과와 포인트를 최신화할까요?\n진행 중인 캡슐 회차가 있으면 배틀 참가자에게 코인 1개가 자동 지급됩니다."
    );
    if (!ok) return;

    const { data, error } = await refreshBattleResults();

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      `${data || 0}건의 배틀 결과가 최신화되었습니다.\n대상 배틀 참가자의 코인도 중복 없이 지급되었습니다.`
    );
    await loadHistories();
  };

  const loadMonthlyAttendances = async (month = selectedMonth) => {
    setMessage("");
    setMonthlyLoading(true);

    const { startDate, endDate } = getKoreanMonthRange(month);
    const { data, error } = await fetchMonthlyBattleAttendances(startDate, endDate);

    if (error) {
      setMessage(error.message);
      setMonthlyAttendances([]);
    } else {
      setMonthlyAttendances(summarizeMonthlyAttendances(data || []));
    }

    setMonthlyLoading(false);
  };

  useEffect(() => {
    let active = true;

    fetchBattlePointHistory().then(({ data, error }) => {
      if (!active) return;
      if (error) setMessage(error.message);
      else setHistories(data || []);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <Box sx={{ p: 2, pb: 10 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton onClick={() => navigate("/admin")}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800} sx={{ flex: 1 }}>
          배틀로얄관리
        </Typography>

        {tab === 0 && (
          <Button
            variant="contained"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            결과 최신화
          </Button>
        )}
      </Stack>

      <Tabs
        value={tab}
        onChange={(_, value) => {
          setTab(value);
          if (value === 1) loadMonthlyAttendances();
        }}
        variant="fullWidth"
        sx={{ mb: 2, borderBottom: "1px solid #e5e7eb" }}
      >
        <Tab label="포인트 이력" />
        <Tab label="월별 참석" />
      </Tabs>

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {tab === 0 && <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={800} sx={{ mb: 1.5 }}>
            포인트 이력
          </Typography>

          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 720 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "130px 140px 120px 80px 80px 1fr",
                  bgcolor: "#f5f6fa",
                  borderRadius: 2,
                  py: 1,
                }}
              >
                {["일시", "회원", "모임", "구분", "포인트", "메모"].map((col) => (
                  <Typography
                    key={col}
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    fontWeight={800}
                  >
                    {col}
                  </Typography>
                ))}
              </Box>

              {histories.map((item) => (
                <Box
                  key={item.point_hist_id}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "130px 140px 120px 80px 80px 1fr",
                    py: 1.2,
                    borderBottom: "1px solid #eee",
                    alignItems: "center",
                  }}
                >
                  <Cell>{formatDateTime(item.created_at)}</Cell>
                  <Cell bold>{item.user?.nickname || item.user?.name || "-"}</Cell>
                  <Cell>{item.meeting?.meeting_nm || "-"}</Cell>
                  <Cell>
                    <Chip
                      label={getPointTypeLabel(item.point_tp)}
                      size="small"
                      color={getPointColor(item.point_tp)}
                      sx={{ fontWeight: 800 }}
                    />
                  </Cell>
                  <Cell bold>{item.point}</Cell>
                  <Cell>{item.memo || "-"}</Cell>
                </Box>
              ))}

              {histories.length === 0 && (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  포인트 이력이 없습니다.
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>
      </Card>}

      {tab === 1 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography fontWeight={800}>월별 배틀로얄 참석</Typography>
                <Typography variant="caption" color="text.secondary">
                  배틀로얄 참가로 체크된 모임 수를 집계합니다.
                </Typography>
              </Box>
              <TextField
                type="month"
                size="small"
                value={selectedMonth}
                onChange={(event) => {
                  const month = event.target.value;
                  setSelectedMonth(month);
                  if (month) loadMonthlyAttendances(month);
                }}
                sx={{ width: 150, flexShrink: 0 }}
                slotProps={{ htmlInput: { max: getCurrentKoreanMonth() } }}
              />
            </Stack>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "64px 1fr 100px",
                bgcolor: "#f5f6fa",
                borderRadius: 2,
                py: 1,
              }}
            >
              {["순위", "회원", "참석 횟수"].map((column) => (
                <Typography
                  key={column}
                  variant="caption"
                  color="text.secondary"
                  textAlign="center"
                  fontWeight={800}
                >
                  {column}
                </Typography>
              ))}
            </Box>

            {monthlyAttendances.map((item, index) => (
              <Box
                key={item.userId}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "64px 1fr 100px",
                  py: 1.4,
                  borderBottom: "1px solid #eee",
                  alignItems: "center",
                }}
              >
                <Cell>{index + 1}</Cell>
                <Cell bold>{item.nickname || item.name || "-"}</Cell>
                <Cell bold>{item.count}회</Cell>
              </Box>
            ))}

            {!monthlyLoading && monthlyAttendances.length === 0 && (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                해당 월의 배틀로얄 참석 기록이 없습니다.
              </Typography>
            )}

            {monthlyLoading && (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                참석 기록을 불러오는 중입니다.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

function summarizeMonthlyAttendances(attendances) {
  const users = new Map();

  attendances.forEach((attendance) => {
    const current = users.get(attendance.user_id) || {
      userId: attendance.user_id,
      name: attendance.user?.name,
      nickname: attendance.user?.nickname,
      meetingIds: new Set(),
    };

    current.meetingIds.add(attendance.meeting_id);
    users.set(attendance.user_id, current);
  });

  return [...users.values()]
    .map(({ meetingIds, ...user }) => ({ ...user, count: meetingIds.size }))
    .sort((a, b) => b.count - a.count || (a.nickname || a.name || "").localeCompare(
      b.nickname || b.name || "",
      "ko"
    ));
}

function getCurrentKoreanMonth() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function getKoreanMonthRange(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const startDate = new Date(`${year}-${String(monthNumber).padStart(2, "0")}-01T00:00:00+09:00`);
  const endDate = new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}

function Cell({ children, bold = false }) {
  return (
    <Typography textAlign="center" fontWeight={bold ? 800 : 500} noWrap>
      {children}
    </Typography>
  );
}

function getPointColor(value) {
  if (value === "WIN") return "success";
  if (value === "LOS") return "default";
  if (value === "BYE") return "warning";
  if (["S05", "S10", "S15"].includes(value)) return "primary";
  return "default";
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default BattleManagePage;
