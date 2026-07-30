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
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchBattleRanking,
  fetchPersonalStats,
  fetchRankings,
} from "../../features/ranking/api/rankingApi";

function RankingPage() {
  const [tab, setTab] = useState(0);
  const [rankingRange, setRankingRange] = useState("YEARLY");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 72px)",
        bgcolor: "#f7f7f8",
        color: "#17191d",
        pb: 10,
        textAlign: "left",
        "& .MuiTypography-root, & .MuiButton-root, & .MuiTab-root": {
          fontFamily: 'Pretendard, "Noto Sans KR", "Segoe UI", sans-serif',
          letterSpacing: "-0.025em",
        },
      }}
    >
      <Typography variant="h6" fontWeight={800} textAlign="center" sx={{ display: "none" }}>
        통계
      </Typography>

      <Box sx={{ position: "sticky", top: 0, zIndex: 1100, bgcolor: "#fff", px: 2 }}>
        <Tabs
          value={tab}
          onChange={(e, value) => setTab(value)}
          variant="fullWidth"
          sx={{
            minHeight: 58,
            borderBottom: "1px solid #f0f1f3",
            "& .MuiTab-root": {
              minHeight: 58,
              py: 0,
              color: "#a5a8ae",
              fontSize: 14,
              fontWeight: 500,
            },
            "& .Mui-selected": { color: "#0868f7 !important", fontWeight: 800 },
            "& .MuiTabs-indicator": { height: 2, bgcolor: "#0868f7" },
          }}
        >
          <Tab label="개인통계" />
          <Tab label="랭킹" />
          <Tab label="배틀로얄" />
        </Tabs>
      </Box>

      <Box sx={{ p: 2 }}>
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

  useEffect(() => {
    let active = true;

    fetchPersonalStats(year).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("");
      setMyStats((previous) => data.stats || previous);
      setYearlyAvgData(data.monthlyAverages);
      setRecentGames(data.recentGames);
    });

    return () => {
      active = false;
    };
  }, [year]);

  return (
    <Stack spacing={2}>
      {message && <Alert severity="error">{message}</Alert>}

      <Card sx={cardSx}>
        <Box
          sx={{
            p: 2.2,
            background: "linear-gradient(135deg, #0868f7, #438cff)",
            color: "#fff",
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.4}>
            <Avatar
              sx={{
                width: 52,
                height: 52,
                bgcolor: "rgba(255,255,255,0.24)",
                fontSize: 21,
                fontWeight: 900,
              }}
            >
              {(profile?.nickname || profile?.name || "회").slice(0, 1)}
            </Avatar>

            <Box sx={{ textAlign: "left" }}>
              <Typography color="rgba(255,255,255,.78)" sx={{ fontSize: 11 }}>
                나의 기록
              </Typography>
              <Typography fontSize={18} fontWeight={900}>
                {profile?.nickname || profile?.name || "회원"}
              </Typography>
              <Typography sx={{ mt: 0.2, opacity: 0.8, fontSize: 11 }}>
                클럽 가입일 {profile?.join_date || "-"}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0.8 }}>
            <SummaryStat label="평균" value={formatNumber(myStats.avg_score, 1)} suffix="점" primary />
            <SummaryStat label="최고" value={myStats.high_score || 0} suffix="점" />
            <SummaryStat label="게임" value={myStats.game_cnt || 0} suffix="게임" />
            <SummaryStat label="참석" value={myStats.attendance_count || 0} suffix="회" />
            <SummaryStat label="출석률" value={formatNumber(myStats.attendance_rate, 1)} suffix="%" primary />
            <SummaryStat
              label="누적"
              value={Number(myStats.total_score || 0).toLocaleString()}
              suffix="점"
            />
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ ...cardSx, order: 3 }}>
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

      <Card sx={{ ...cardSx, order: 2 }}>
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
            <>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "56px minmax(0, 1fr) 48px 58px",
                  columnGap: 0.75,
                  px: 0.25,
                  pb: 0.7,
                }}
              >
                {["날짜", "장소", "게임", "평균"].map((label, index) => (
                  <Typography
                    key={label}
                    color="#858991"
                    textAlign={index < 2 ? "left" : "right"}
                    sx={{ fontSize: 10.5, fontWeight: 700 }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              {recentGames.map((item, index) => (
                <Box key={item.meeting_id}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "56px minmax(0, 1fr) 48px 58px",
                      alignItems: "center",
                      columnGap: 0.75,
                      minHeight: 34,
                      px: 0.25,
                    }}
                  >
                    <Typography color="#858991" sx={{ fontSize: 11.5 }}>
                      {formatDate(item.meeting_dt)}
                    </Typography>

                    <Typography noWrap color="#25282d" sx={{ fontSize: 12 }}>
                      {item.center_nm || "-"}
                    </Typography>

                    <Typography textAlign="right" color="#5f6368" sx={{ fontSize: 11.5 }}>
                      {item.game_count || 0}게임
                    </Typography>

                    <Typography
                      noWrap
                      textAlign="right"
                      color="#0868f7"
                      sx={{ fontSize: 12.5, fontWeight: 900 }}
                    >
                      {formatRecentAverage(item)}
                    </Typography>
                  </Box>

                  {index < recentGames.length - 1 && <Divider />}
                </Box>
              ))}
            </>
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

  const avgScoreRanking = useMemo(() => {
    return scoreRanking
      .filter((item) => item.ranking_tp === "AVG")
      .sort((a, b) => Number(a.rank_no || 0) - Number(b.rank_no || 0));
  }, [scoreRanking]);

  const highScoreRanking = useMemo(() => {
    return scoreRanking
      .filter((item) => item.ranking_tp === "HIGH")
      .sort((a, b) => Number(a.rank_no || 0) - Number(b.rank_no || 0));
  }, [scoreRanking]);

  const selectedScoreRanking =
    scoreSort === "AVG" ? avgScoreRanking : highScoreRanking;

  useEffect(() => {
    let active = true;

    fetchRankings(rankingRange, selectedYear).then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("");
      setScoreRanking(data.scores);
      setAttendanceRanking(data.attendances);
    });

    return () => {
      active = false;
    };
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
            rows={selectedScoreRanking.map((item) => [
              Number(item.rank_no),
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
      const aPoint = a.point;
      const bPoint = b.point;

      if (sortKey === "point") return bPoint - aPoint;
      if (sortKey === "battle_count") return b.battle_count - a.battle_count;
      if (sortKey === "win_count") return b.win_count - a.win_count;
      if (sortKey === "win_rate") return Number(b.win_rate) - Number(a.win_rate);

      return bPoint - aPoint;
    });
  }, [battleRanking, sortKey]);

  useEffect(() => {
    let active = true;

    fetchBattleRanking().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setMessage(error.message);
        return;
      }
      setMessage("");
      setBattleRanking(data || []);
    });

    return () => {
      active = false;
    };
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
    <Stack spacing={0.8}>
      {rows.map((item, index) => (
        <Box
          key={item.user_id}
          sx={{
            p: 1.5,
            bgcolor: "#fff",
            border: index === 0 ? "1px solid #bcd8ff" : "1px solid #eceef2",
            borderRadius: 2,
          }}
        >
          <Stack direction="row" alignItems="center">
            <RankBadge rank={index + 1} />
            <Box sx={{ flex: 1, minWidth: 0, ml: 1.2 }}>
              <Typography fontWeight={900} noWrap sx={{ fontSize: 14 }}>
                {item.nickname || item.user_nm}
              </Typography>
              <Typography color="#858991" sx={{ mt: 0.2, fontSize: 11 }}>
                {item.battle_count}전 {item.win_count}승 {item.lose_count}패
              </Typography>
            </Box>
            <Box sx={{ textAlign: "right" }}>
              <Typography color="#0868f7" fontWeight={900} sx={{ fontSize: 17 }}>
                {item.point}P
              </Typography>
              <Typography color="#858991" sx={{ fontSize: 10.5 }}>
                승률 {formatNumber(item.win_rate, 1)}%
              </Typography>
            </Box>
          </Stack>
        </Box>
      ))}

      {rows.length === 0 && (
        <Typography color="text.secondary" textAlign="center" sx={{ py: 6 }}>
          배틀로얄 기록이 없습니다.
        </Typography>
      )}
    </Stack>
  );
}

function RankingTableCard({ title, columns, rows }) {
  return (
    <Card sx={cardSx}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Typography fontWeight={800} sx={{ mb: 1.2, fontSize: 14 }}>
          {title}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "48px minmax(0, 1.35fr) 1fr .8fr",
            py: 0.9,
            bgcolor: "#f5f7fa",
            borderRadius: 1.5,
          }}
        >
          {columns.map((column) => (
            <Typography
              key={column}
              color="#858991"
              textAlign="center"
              fontWeight={700}
              sx={{ fontSize: 11 }}
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
              gridTemplateColumns: "48px minmax(0, 1.35fr) 1fr .8fr",
              py: 1.15,
              borderBottom: "1px solid #f0f1f3",
              alignItems: "center",
            }}
          >
            {row.map((cell, cellIndex) => (
              <Typography
                key={cellIndex}
                noWrap
                textAlign="center"
                fontWeight={cellIndex === 1 || cellIndex === 2 ? 800 : 500}
                color={cellIndex === 2 ? "#0868f7" : "#25282d"}
                sx={{ fontSize: 12.5 }}
              >
                {cell}
              </Typography>
            ))}
          </Box>
        ))}

        {rows.length === 0 && (
          <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
            조회된 기록이 없습니다.
          </Typography>
        )}
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
        overflowX: "auto",
        mx: -0.5,
        px: 0.5,
        pb: 0.5,
        scrollbarWidth: "thin",
      }}
    >
      <Box
        sx={{
          height: 210,
          minWidth: Math.max(300, data.length * 62),
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          px: 1,
          pt: 2,
          borderBottom: "1px solid #eceef2",
        }}
      >
      {data.map((item) => {
        const score = Number(item.avg_score || 0);
        const height = Math.max((score / maxScore) * 150, 24);

        return (
          <Box key={item.year_no} sx={{ flex: 1, minWidth: 48, textAlign: "center" }}>
            <Typography color="#25282d" sx={{ fontSize: 11, fontWeight: 800 }}>
              {score.toFixed(1)}
            </Typography>

            <Box
              sx={{
                height,
                mt: 0.8,
                mx: "auto",
                width: 22,
                borderRadius: "8px 8px 0 0",
                background: "linear-gradient(180deg, #438cff, #0868f7)",
              }}
            />

            <Typography
              color="#858991"
              sx={{ display: "block", mt: 1, fontSize: 10.5 }}
            >
              {item.year_label}
            </Typography>
          </Box>
        );
      })}
      </Box>
    </Box>
  );
}

function SummaryStat({ label, value, suffix, primary = false }) {
  return (
    <Box
      sx={{
        minWidth: 0,
        px: 1,
        py: 1.15,
        bgcolor: "#f5f7fa",
        borderRadius: 1.5,
        textAlign: "left",
      }}
    >
      <Typography color="#858991" sx={{ fontSize: 10.5 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={0.3}
        sx={{
          mt: 0.55,
          width: "100%",
          minHeight: 19,
          alignItems: "flex-end",
          justifyContent: "flex-end",
          whiteSpace: "nowrap",
        }}
      >
        <Typography
          noWrap
          color={primary ? "#0868f7" : "#25282d"}
          fontWeight={900}
          sx={{ fontSize: 16, lineHeight: 1 }}
        >
          {value}
        </Typography>
        <Typography color="#858991" sx={{ fontSize: 9.5, lineHeight: 1 }}>
          {suffix}
        </Typography>
      </Stack>
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
        color: active ? "#0868f7" : "#858991",
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

function RankBadge({ rank }) {
  const featured = rank <= 3;
  return (
    <Box
      sx={{
        width: 34,
        height: 34,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        borderRadius: "50%",
        bgcolor: featured ? "#eaf3ff" : "#f5f6f8",
        color: featured ? "#0868f7" : "#858991",
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      {rank}
    </Box>
  );
}

function getRecentAverage(item) {
  const suppliedAverage = Number(item.avg_score);
  if (Number.isFinite(suppliedAverage)) {
    return suppliedAverage.toFixed(1);
  }

  const gameCount = Number(item.game_count);
  const totalScore = Number(item.total_score);
  if (gameCount > 0 && Number.isFinite(totalScore)) {
    return (totalScore / gameCount).toFixed(1);
  }

  const scores = Array.isArray(item.scores)
    ? item.scores.map(Number).filter(Number.isFinite)
    : String(item.scores || "")
        .match(/\d+(?:\.\d+)?/g)
        ?.map(Number) || [];

  if (scores.length === 0) return "-";
  return (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1);
}

function formatRecentAverage(item) {
  const average = getRecentAverage(item);
  return average === "-" ? average : `${average}점`;
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

function getYearOptions() {
  const now = new Date().getFullYear();
  return [now, now - 1, now - 2];
}

const cardSx = {
  borderRadius: 2,
  border: "1px solid #eceef2",
  boxShadow: "none",
};

export default RankingPage;
