import { useState } from "react";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

const myStats = {
  name: "홍길동",
  joinDate: "2023.03.15",
  avgScore: 187.5,
  highScore: 279,
  attendanceCount: 28,
  attendanceRate: 93.3,
  totalScore: 12450,
};

const monthlyAvgData = [
  { month: "1월", score: 187.5 },
  { month: "2월", score: 210.2 },
  { month: "3월", score: 226.8 },
  { month: "4월", score: 195.3 },
  { month: "5월", score: 279.0 },
  { month: "6월", score: 187.5 },
];

const recentGames = [
  {
    date: "2026.06.21",
    center: "볼원 볼링장",
    games: "3게임",
    scores: "213 / 187 / 162",
  },
  {
    date: "2026.06.14",
    center: "레인보우볼링장",
    games: "2게임",
    scores: "179 / 201",
  },
  {
    date: "2026.06.07",
    center: "양산킴스 볼링센터",
    games: "3게임",
    scores: "198 / 187 / 142",
  },
];

const highScoreRanking = [
  { rank: 1, name: "홍길동", score: 279, gameCount: 8 },
  { rank: 2, name: "김철수", score: 268, gameCount: 7 },
  { rank: 3, name: "이영희", score: 256, gameCount: 8 },
  { rank: 4, name: "박민수", score: 245, gameCount: 6 },
  { rank: 5, name: "정민호", score: 235, gameCount: 7 },
  { rank: 6, name: "최지영", score: 223, gameCount: 6 },
  { rank: 7, name: "강현우", score: 215, gameCount: 5 },
  { rank: 8, name: "표상훈", score: 210, gameCount: 6 },
  { rank: 9, name: "유재석", score: 205, gameCount: 5 },
  { rank: 10, name: "조세호", score: 198, gameCount: 6 },
];

const avgScoreRanking = [
  { rank: 1, name: "홍길동", score: 187.5, gameCount: 8 },
  { rank: 2, name: "김철수", score: 179.3, gameCount: 7 },
  { rank: 3, name: "이영희", score: 168.9, gameCount: 8 },
  { rank: 4, name: "박민수", score: 162.4, gameCount: 6 },
  { rank: 5, name: "정민호", score: 158.6, gameCount: 7 },
  { rank: 6, name: "최지영", score: 155.2, gameCount: 6 },
  { rank: 7, name: "강현우", score: 153.1, gameCount: 5 },
  { rank: 8, name: "표상훈", score: 150.3, gameCount: 6 },
  { rank: 9, name: "유재석", score: 148.7, gameCount: 5 },
  { rank: 10, name: "조세호", score: 146.5, gameCount: 6 },
];

const attendanceRanking = [
  { rank: 1, name: "홍길동", attendCount: 28, totalMeeting: 30, rate: 93.3 },
  { rank: 2, name: "김철수", attendCount: 27, totalMeeting: 30, rate: 90.0 },
  { rank: 3, name: "이영희", attendCount: 25, totalMeeting: 30, rate: 83.3 },
  { rank: 4, name: "박민수", attendCount: 24, totalMeeting: 30, rate: 80.0 },
  { rank: 5, name: "정민호", attendCount: 22, totalMeeting: 30, rate: 73.3 },
  { rank: 6, name: "최지영", attendCount: 20, totalMeeting: 30, rate: 66.7 },
  { rank: 7, name: "강현우", attendCount: 18, totalMeeting: 30, rate: 60.0 },
];

function RankingPage() {
  const [tab, setTab] = useState(0);
  const [rankingRange, setRankingRange] = useState("MONTHLY");

  return (
    <Box sx={{ p: 2, minHeight: "calc(100vh - 80px)" }}>
      <Typography
        variant="h6"
        fontWeight={800}
        textAlign="center"
        sx={{ mb: 2 }}
      >
        통계
      </Typography>

      <Tabs
        value={tab}
        onChange={(e, value) => setTab(value)}
        variant="fullWidth"
        sx={{
          mb: 2,
          "& .MuiTab-root": {
            fontWeight: 700,
          },
        }}
      >
        <Tab label="개인 통계" />
        <Tab label="점수 랭킹" />
        <Tab label="출석 랭킹" />
      </Tabs>

      {tab === 0 && <PersonalStatsView />}

      {tab === 1 && (
        <ScoreRankingView
          rankingRange={rankingRange}
          setRankingRange={setRankingRange}
        />
      )}

      {tab === 2 && <AttendanceRankingView />}
    </Box>
  );
}

function PersonalStatsView() {
  return (
    <Stack spacing={2}>
      <Card
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <Box
          sx={{
            p: 2,
            background: "linear-gradient(135deg, #5E35B1, #7E57C2)",
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
                bgcolor: "#d7d2f3",
                fontSize: 28,
              }}
            >
              홍
            </Avatar>

            <Box>
              <Typography variant="h5" fontWeight={900}>
                {myStats.name}
              </Typography>
              <Typography sx={{ opacity: 0.9 }}>
                클럽 가입일 {myStats.joinDate}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <CardContent sx={{ p: 0 }}>
          <StatRow label="평균 점수" value={myStats.avgScore} />
          <StatRow label="최고 점수" value={myStats.highScore} />
          <StatRow label="참석 횟수" value={`${myStats.attendanceCount}회`} />
          <StatRow
            label="출석률"
            value={`${myStats.attendanceRate}%`}
            highlight
          />
          <StatRow
            label="누적 점수"
            value={myStats.totalScore.toLocaleString()}
            last
          />
        </CardContent>
      </Card>

      <Card sx={cardSx}>
        <CardContent>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Typography fontWeight={800}>월별 평균 점수</Typography>

            <Select
              size="small"
              value="2026"
              sx={{
                height: 34,
                fontSize: 13,
                borderRadius: 2,
              }}
            >
              <MenuItem value="2026">2026년</MenuItem>
            </Select>
          </Stack>

          <MonthlyBarChart data={monthlyAvgData} />
        </CardContent>
      </Card>

      <Card sx={cardSx}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography fontWeight={800}>최근 게임 기록</Typography>
            <Typography variant="caption" color="text.secondary">
              더보기
            </Typography>
          </Stack>

          {recentGames.map((item, index) => (
            <Box key={index}>
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
                  sx={{ width: 78 }}
                >
                  {item.date}
                </Typography>

                <Typography variant="body2" sx={{ flex: 1 }}>
                  {item.center}
                </Typography>

                <Typography variant="body2" sx={{ width: 46 }}>
                  {item.games}
                </Typography>

                <Typography variant="body2" fontWeight={700}>
                  {item.scores}
                </Typography>
              </Stack>

              {index < recentGames.length - 1 && <Divider />}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Stack>
  );
}

function ScoreRankingView({ rankingRange, setRankingRange }) {
  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        spacing={1}
      >
        <Stack
          direction="row"
          sx={{
            p: 0.4,
            bgcolor: "#f4f2fa",
            borderRadius: 99,
            flex: 1,
          }}
        >
          <RangeButton
            active={rankingRange === "MONTHLY"}
            label="월별 랭킹"
            onClick={() => setRankingRange("MONTHLY")}
          />
          <RangeButton
            active={rankingRange === "TOTAL"}
            label="전체 랭킹"
            onClick={() => setRankingRange("TOTAL")}
          />
        </Stack>

        <Select
          size="small"
          value="2026-06"
          sx={{
            height: 36,
            minWidth: 110,
            borderRadius: 2,
            fontSize: 13,
          }}
        >
          <MenuItem value="2026-06">2026년 6월</MenuItem>
        </Select>
      </Stack>

      <RankingTableCard
        title="최고 점수 TOP 10"
        columns={["순위", "이름", "최고 점수", "게임 수"]}
        rows={highScoreRanking.map((item) => [
          item.rank,
          item.name,
          item.score,
          item.gameCount,
        ])}
      />

      <RankingTableCard
        title="평균 점수 TOP 10"
        columns={["순위", "이름", "평균 점수", "게임 수"]}
        rows={avgScoreRanking.map((item) => [
          item.rank,
          item.name,
          item.score,
          item.gameCount,
        ])}
      />

      <Typography variant="caption" color="text.secondary">
        · 월별 랭킹은 해당 월에 등록된 게임을 기준으로 집계됩니다.
      </Typography>
    </Stack>
  );
}

function AttendanceRankingView() {
  return (
    <RankingTableCard
      title="출석 랭킹"
      columns={["순위", "이름", "참석", "전체", "출석률"]}
      rows={attendanceRanking.map((item) => [
        item.rank,
        item.name,
        `${item.attendCount}회`,
        `${item.totalMeeting}회`,
        `${item.rate}%`,
      ])}
    />
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
          <Box
            sx={{
              minWidth: 420,
            }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: `repeat(${columns.length}, 1fr)`,
                py: 1,
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
                  borderRadius: 2,
                  bgcolor: rowIndex === 0 ? "#efe7ff" : "transparent",
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
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

function MonthlyBarChart({ data }) {
  const maxScore = Math.max(...data.map((item) => item.score));

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
        const height = Math.max((item.score / maxScore) * 150, 24);

        return (
          <Box
            key={item.month}
            sx={{
              flex: 1,
              textAlign: "center",
            }}
          >
            <Typography variant="caption" fontWeight={700}>
              {item.score}
            </Typography>

            <Box
              sx={{
                height,
                mt: 0.8,
                mx: "auto",
                width: 22,
                borderRadius: "8px 8px 0 0",
                background: "linear-gradient(180deg, #7E57C2, #5E35B1)",
              }}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 1 }}
            >
              {item.month}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

function StatRow({ label, value, highlight = false, last = false }) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ px: 2, py: 1.6 }}>
        <Typography color="text.secondary">{label}</Typography>
        <Typography
          fontWeight={900}
          color={highlight ? "primary.main" : "text.primary"}
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

const cardSx = {
  borderRadius: 3,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
};

export default RankingPage;