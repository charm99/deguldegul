import { useEffect, useMemo, useState } from "react";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
  Alert,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import { supabase } from "../../services/supabase";
import { useAuth } from "../../contexts/AuthContext";

function RankingPage() {
  const [tab, setTab] = useState(0);
  const [rankingRange, setRankingRange] = useState("YEARLY");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <Box sx={{ p: 2, minHeight: "calc(100vh - 80px)" }}>
      <Typography variant="h6" fontWeight={800} textAlign="center" sx={{ mb: 2 }}>
        통계
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        variant="fullWidth"
        sx={{ mb: 2, "& .MuiTab-root": { fontWeight: 700 } }}
      >
        <Tab label="개인 통계" />
        <Tab label="랭킹" />
        <Tab label="배틀로얄" />
      </Tabs>

      {tab === 0 && <PersonalStatsView />}

      {tab === 1 && (
        <RankingView
          rankingRange={rankingRange}
          setRankingRange={setRankingRange}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />
      )}

      {tab === 2 && <BattleRankingView />}
    </Box>
  );
}

function PersonalStatsView() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [myStats, setMyStats] = useState({
    avg_score: 0,
    high_score: 0,
    game_cnt: 0,
    total_score: 0,
    attendance_count: 0,
    attendance_rate: 0,
  });

  const [yearlyAvgData, setYearlyAvgData] = useState([]);
  const [recentGames, setRecentGames] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [message, setMessage] = useState("");

  const loadPersonalStats = async () => {
    setMessage("");

    const { data: statData, error: statError } = await supabase.rpc("get_my_stats");

    if (statError) {
      setMessage(statError.message);
      return;
    }

    setMyStats(statData?.[0] || myStats);

    const { data: yearData, error: yearError } = await supabase.rpc(
      "get_my_monthly_avg",
      { p_year: year }
    );

    if (yearError) {
      setMessage(yearError.message);
      return;
    }

    setYearlyAvgData(yearData || []);

    const { data: recentData, error: recentError } = await supabase.rpc(
      "get_my_recent_games",
      { p_limit: 5 }
    );

    if (recentError) {
      setMessage(recentError.message);
      return;
    }

    setRecentGames(recentData || []);
  };

  useEffect(() => {
    loadPersonalStats();
  }, [year]);

  return (
    <Stack spacing={2}>
      {message && <Alert severity="error">{message}</Alert>}

      <Card sx={cardSx}>
        <Box
          sx={{
            p: 2,
            background: "linear-gradient(135deg, #1976d2, #42a5f5)",
            color: "#fff",
          }}
        >
          <Typography fontWeight={800} sx={{ mb: 2 }}>
            내 통계
          </Typography>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                width: 70,
                height: 70,
                bgcolor: "rgba(255,255,255,0.24)",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              {(profile?.nickname || profile?.name || "회").slice(0, 1)}
            </Avatar>

            <Box sx={{ textAlign: "left" }}>
              <Typography variant="h5" fontWeight={900}>
                {profile?.nickname || profile?.name || "회원"}
              </Typography>
              <Typography sx={{ opacity: 0.9 }}>
                클럽 가입일 {profile?.join_date || "-"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 0 }}>
          <StatRow label="평균 점수" value={formatNumber(myStats.avg_score, 1)} />
          <StatRow label="최고 점수" value={myStats.high_score || 0} />
          <StatRow label="참석 횟수" value={`${myStats.attendance_count || 0}회`} />
          <StatRow
            label="출석률"
            value={`${formatNumber(myStats.attendance_rate, 1)}%`}
            highlight
          />
          <StatRow
            label="누적 점수"
            value={Number(myStats.total_score || 0).toLocaleString()}
            last
          />
        </CardContent>
      </Card>

      <Card sx={cardSx}>
        <CardContent>
          <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
            <Typography fontWeight={800}>
              월별 평균 점수
            </Typography>

            <Box sx={{ flex: 1 }} />

            <Select
              size="small"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              sx={{
                height: 34,
                fontSize: 13,
                borderRadius: 2,
              }}
            >
              {getYearOptions().map((item) => (
                <MenuItem key={item} value={item}>
                  {item}년
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <YearlyBarChart data={yearlyAvgData} />
        </CardContent>
      </Card>

      <Card sx={cardSx}>
        <CardContent>
          <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
            <Typography fontWeight={800}>
              최근 게임 기록
            </Typography>

            <Box sx={{ flex: 1 }} />

            <Button
              size="small"
              endIcon={<ChevronRightIcon />}
              onClick={() => navigate("/ranking/my-records")}
              sx={{
                color: "text.secondary",
                fontWeight: 800,
                minWidth: 0,
                p: 0,
              }}
            >
              더보기
            </Button>
          </Stack>

          {recentGames.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" sx={{ py: 2 }}>
              기록이 없습니다.
            </Typography>
          ) : (
            recentGames.map((item, index) => (
              <Box key={item.meeting_id}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  py={1}
                  spacing={1}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ width: 76 }}
                  >
                    {formatDate(item.meeting_dt)}
                  </Typography>

                  <Typography variant="body2" sx={{ flex: 1 }} noWrap>
                    {item.center_nm || "-"}
                  </Typography>

                  <Typography variant="body2" sx={{ width: 48 }}>
                    {item.game_count}게임
                  </Typography>

                  <Typography variant="body2" fontWeight={700}>
                    {item.scores}
                  </Typography>
                </Stack>

                {index < recentGames.length - 1 && <Divider />}
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

function RankingView({
  rankingRange,
  setRankingRange,
  selectedYear,
  setSelectedYear,
}) {
  const [scoreRanking, setScoreRanking] = useState([]);
  const [attendanceRanking, setAttendanceRanking] = useState([]);
  const [scoreSort, setScoreSort] = useState("AVG");
  const [message, setMessage] = useState("");

  const highScoreRanking = useMemo(() => {
    return [...scoreRanking]
      .sort((a, b) => Number(b.high_score || 0) - Number(a.high_score || 0))
      .slice(0, 10);
  }, [scoreRanking]);

  const avgScoreRanking = useMemo(() => {
    return [...scoreRanking]
      .sort((a, b) => Number(b.avg_score || 0) - Number(a.avg_score || 0))
      .slice(0, 10);
  }, [scoreRanking]);

  const selectedScoreRanking =
    scoreSort === "AVG" ? avgScoreRanking : highScoreRanking;

  const loadRanking = async () => {
    setMessage("");

    const { data: scoreData, error: scoreError } = await supabase.rpc(
      "get_score_ranking",
      {
        p_range: rankingRange,
        p_year: selectedYear,
      }
    );

    if (scoreError) {
      setMessage(scoreError.message);
      return;
    }

    setScoreRanking(scoreData || []);

    const { data: attendanceData, error: attendanceError } = await supabase.rpc(
      "get_attendance_ranking",
      {
        p_range: rankingRange,
        p_year: selectedYear,
      }
    );

    if (attendanceError) {
      setMessage(attendanceError.message);
      return;
    }

    setAttendanceRanking(attendanceData || []);
  };

  useEffect(() => {
    loadRanking();
  }, [rankingRange, selectedYear]);

  return (
    <Stack spacing={2}>
      {message && <Alert severity="error">{message}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
        <Stack
          direction="row"
          sx={{
            p: 0.4,
            bgcolor: "#eef4fb",
            borderRadius: 99,
            flex: 1,
          }}
        >
          <RangeButton
            active={rankingRange === "YEARLY"}
            label="점수 랭킹"
            onClick={() => setRankingRange("YEARLY")}
          />
          <RangeButton
            active={rankingRange === "TOTAL"}
            label="출석 랭킹"
            onClick={() => setRankingRange("TOTAL")}
          />
        </Stack>

        <Select
          size="small"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          sx={{
            height: 36,
            minWidth: 116,
            borderRadius: 2,
            fontSize: 13,
            display: rankingRange === "YEARLY" ? "block" : "none",
          }}
        >
          {getYearOptions().map((item) => (
            <MenuItem key={item} value={item}>
              {item}년
            </MenuItem>
          ))}
        </Select>
      </Stack>

      {rankingRange === "YEARLY" ? (
        <>
          <Stack
            direction="row"
            sx={{
              p: 0.4,
              bgcolor: "#f5f6fa",
              borderRadius: 99,
            }}
          >
            <RangeButton
              active={scoreSort === "AVG"}
              label="평균 TOP10"
              onClick={() => setScoreSort("AVG")}
            />
            <RangeButton
              active={scoreSort === "HIGH"}
              label="최고 TOP10"
              onClick={() => setScoreSort("HIGH")}
            />
          </Stack>

          <RankingTableCard
            title={scoreSort === "AVG" ? "평균 점수 TOP 10" : "최고 점수 TOP 10"}
            columns={
              scoreSort === "AVG"
                ? ["순위", "이름", "평균", "게임"]
                : ["순위", "이름", "최고", "게임"]
            }
            rows={selectedScoreRanking.map((item, index) => [
              index + 1,
              item.nickname || item.user_nm,
              scoreSort === "AVG"
                ? formatNumber(item.avg_score, 1)
                : item.high_score,
              item.game_count,
            ])}
          />

          <Typography variant="caption" color="text.secondary">
            · 점수 랭킹은 마감된 모임에 등록된 점수를 기준으로 집계됩니다.
          </Typography>
        </>
      ) : (
        <>
          <RankingTableCard
            title="출석 랭킹 TOP 10"
            columns={["순위", "이름", "참석", "출석률"]}
            rows={attendanceRanking.map((item, index) => [
              index + 1,
              item.nickname || item.user_nm,
              `${item.attend_count}회`,
              `${formatNumber(item.attendance_rate, 1)}%`,
            ])}
          />

          <Typography variant="caption" color="text.secondary">
            · 출석 랭킹은 마감된 모임의 참석/늦참 기록을 기준으로 집계됩니다.
          </Typography>
        </>
      )}
    </Stack>
  );
}

function BattleRankingView() {
  const [battleRanking, setBattleRanking] = useState([]);
  const [sortKey, setSortKey] = useState("point");
  const [message, setMessage] = useState("");

  const sortedRows = useMemo(() => {
    return [...battleRanking].sort((a, b) => {
      const aPoint = calcBattlePoint(a);
      const bPoint = calcBattlePoint(b);

      if (sortKey === "point") return bPoint - aPoint;
      if (sortKey === "battle_count") return b.battle_count - a.battle_count;
      if (sortKey === "win_count") return b.win_count - a.win_count;
      if (sortKey === "win_rate") return Number(b.win_rate) - Number(a.win_rate);

      return bPoint - aPoint;
    });
  }, [battleRanking, sortKey]);

  const loadBattleRanking = async () => {
    setMessage("");

    const { data, error } = await supabase.rpc("get_battle_ranking");

    if (error) {
      setMessage(error.message);
      return;
    }

    setBattleRanking(data || []);
  };

  useEffect(() => {
    loadBattleRanking();
  }, []);

  return (
    <Stack spacing={2}>
      {message && <Alert severity="error">{message}</Alert>}

      <Stack direction="row" justifyContent="space-between" alignItems="center">

        <Select
          size="small"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          sx={{ height: 36, minWidth: 120, borderRadius: 2, fontSize: 13 }}
        >
          <MenuItem value="point">포인트순</MenuItem>
          <MenuItem value="battle_count">참여순</MenuItem>
          <MenuItem value="win_count">승수순</MenuItem>
          <MenuItem value="win_rate">승률순</MenuItem>
        </Select>
      </Stack>

      <BattleRankingGrid rows={sortedRows} />
    </Stack>
  );
}

function BattleRankingGrid({ rows }) {
  return (
    <Card sx={cardSx}>
      <CardContent>
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 620 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "52px 120px 80px 80px 70px 70px 80px",
                py: 1,
                bgcolor: "#f5f6fa",
                borderRadius: 2,
              }}
            >
              {["순위", "이름", "포인트", "참여", "승", "패", "승률"].map(
                (column) => (
                  <Typography
                    key={column}
                    variant="caption"
                    color="text.secondary"
                    textAlign="center"
                    fontWeight={800}
                  >
                    {column}
                  </Typography>
                )
              )}
            </Box>

            {rows.map((item, index) => (
              <Box
                key={item.user_id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "52px 120px 80px 80px 70px 70px 80px",
                  py: 1.1,
                  borderBottom: "1px solid #eee",
                  bgcolor: index === 0 ? "#eaf4ff" : "transparent",
                }}
              >
                <GridCell bold>{index + 1}</GridCell>
                <GridCell bold>{item.nickname || item.user_nm}</GridCell>
                <GridCell bold>{calcBattlePoint(item)}</GridCell>
                <GridCell>{item.battle_count}</GridCell>
                <GridCell>{item.win_count}</GridCell>
                <GridCell>{item.lose_count}</GridCell>
                <GridCell>{formatNumber(item.win_rate, 1)}%</GridCell>
              </Box>
            ))}

            {rows.length === 0 && (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                배틀로얄 기록이 없습니다.
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function RankingTableCard({ title, columns, rows }) {
  return (
    <Card sx={cardSx}>
      <CardContent>
        <Typography fontWeight={800} sx={{ mb: 1.5 }}>
          {title}
        </Typography>

        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 420 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                py: 1,
                bgcolor: "#f5f6fa",
                borderRadius: 2,
              }}
            >
              {columns.map((column) => (
                <Typography
                  key={column}
                  variant="caption"
                  color="text.secondary"
                  textAlign="center"
                  fontWeight={700}
                >
                  {column}
                </Typography>
              ))}
            </Box>

            {rows.map((row, rowIndex) => (
              <Box
                key={rowIndex}
                sx={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                  py: 1,
                  borderBottom: "1px solid #eee",
                  bgcolor: rowIndex === 0 ? "#eaf4ff" : "transparent",
                }}
              >
                {row.map((cell, cellIndex) => (
                  <Typography
                    key={cellIndex}
                    textAlign="center"
                    fontWeight={
                      rowIndex === 0 || cellIndex === 1 || cellIndex === 2
                        ? 800
                        : 500
                    }
                    color={
                      rowIndex === 0 && cellIndex === 2
                        ? "primary.main"
                        : "text.primary"
                    }
                  >
                    {cell}
                  </Typography>
                ))}
              </Box>
            ))}

            {rows.length === 0 && (
              <Typography color="text.secondary" textAlign="center" sx={{ py: 3 }}>
                조회된 기록이 없습니다.
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function YearlyBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Typography color="text.secondary" textAlign="center" sx={{ py: 5 }}>
        월별 점수 기록이 없습니다.
      </Typography>
    );
  }

  const maxScore = Math.max(...data.map((item) => Number(item.avg_score || 0)));

  return (
    <Box
      sx={{
        height: 210,
        display: "flex",
        alignItems: "flex-end",
        gap: 1.5,
        px: 1,
        pt: 2,
        borderBottom: "1px solid #eee",
      }}
    >
      {data.map((item) => {
        const score = Number(item.avg_score || 0);
        const height = Math.max((score / maxScore) * 150, 24);

        return (
          <Box key={item.year_no} sx={{ flex: 1, textAlign: "center" }}>
            <Typography variant="caption" fontWeight={700}>
              {score.toFixed(1)}
            </Typography>

            <Box
              sx={{
                height,
                mt: 0.8,
                mx: "auto",
                width: 22,
                borderRadius: "8px 8px 0 0",
                background: "linear-gradient(180deg, #42a5f5, #1976d2)",
              }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              {item.year_label}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function StatRow({ label, value, highlight = false, last = false }) {
  return (
    <Box sx={{ textAlign: "left" }}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ px: 2, py: 1.6 }}
      >
        <Typography
          color="text.secondary"
          fontWeight={700}
          sx={{ flex: 1, textAlign: "left" }}
        >
          {label}
        </Typography>

        <Typography
          fontWeight={900}
          color={highlight ? "primary.main" : "text.primary"}
          sx={{ textAlign: "right" }}
        >
          {value}
        </Typography>
      </Stack>

      {!last && <Divider />}
    </Box>
  );
}

function RangeButton({ active, label, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        py: 0.8,
        textAlign: "center",
        borderRadius: 99,
        bgcolor: active ? "#fff" : "transparent",
        color: active ? "primary.main" : "text.secondary",
        fontWeight: 800,
        fontSize: 14,
        cursor: "pointer",
        boxShadow: active ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
      }}
    >
      {label}
    </Box>
  );
}

function GridCell({ children, bold = false }) {
  return (
    <Typography textAlign="center" fontWeight={bold ? 800 : 500}>
      {children}
    </Typography>
  );
}

function calcBattlePoint(item) {
  return Number(item.win_count || 0) * 20 + Number(item.lose_count || 0) * 10;
}

function formatNumber(value, digits = 0) {
  if (value === null || value === undefined || value === "-") return "-";

  const num = Number(value);

  if (Number.isNaN(num)) return "-";

  return digits > 0 ? num.toFixed(digits) : num;
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  });
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthOptions() {
  const now = new Date();
  const result = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;

    result.push({
      value,
      label: `${date.getFullYear()}년 ${date.getMonth() + 1}월`,
    });
  }

  return result;
}

function getYearOptions() {
  const now = new Date().getFullYear();
  return [now, now - 1, now - 2];
}

const cardSx = {
  borderRadius: 3,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

export default RankingPage;