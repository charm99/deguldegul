import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Card, Chip, CircularProgress, IconButton, MenuItem, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { fetchAverageManagementData } from "../../features/admin/api/adminApi";
import { useCommonCodes } from "../../contexts/useCommonCodes";
import { COMMON_CODE_GROUP } from "../../shared/constants/commonCodeGroups";

const COLUMNS = [
  { key: "name", label: "이름", align: "left" },
  { key: "game_count", label: "게임 수" },
  { key: "avg_score", label: "에버리지" },
  { key: "high_score", label: "최고점" },
  { key: "low_score", label: "최저점" },
  { key: "total_score", label: "총점" },
  { key: "average_start_date", label: "집계 시작일" },
];

function AverageManagePage() {
  const navigate = useNavigate();
  const { getCodeName } = useCommonCodes();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ACT");
  const [sort, setSort] = useState({ key: "avg_score", direction: "desc" });

  useEffect(() => {
    let active = true;
    fetchAverageManagementData().then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(loadError.message || "에버리지 현황을 불러오지 못했습니다.");
      else setRows(data || []);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const visibleRows = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("ko-KR");
    const direction = sort.direction === "asc" ? 1 : -1;
    return rows.filter((row) => (status === "ALL" || row.status === status) && (!keyword || `${row.name} ${row.nickname || ""}`.toLocaleLowerCase("ko-KR").includes(keyword)))
      .sort((a, b) => {
        const aValue = a[sort.key];
        const bValue = b[sort.key];
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        return compare(aValue, bValue) * direction;
      });
  }, [rows, query, status, sort]);

  const requestSort = (key) => setSort((current) => ({ key, direction: current.key === key && current.direction === "desc" ? "asc" : "desc" }));
  const totalGames = visibleRows.reduce((sum, row) => sum + row.game_count, 0);

  return <Box sx={{ p: 2 }}>
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}><IconButton onClick={() => navigate("/admin")}><ArrowBackIcon /></IconButton><Box><Typography variant="h6" fontWeight={800}>에버리지 관리</Typography><Typography variant="caption" color="text.secondary">회원별 집계 시작일 이후, 완료된 모임의 점수 기준입니다.</Typography></Box></Stack>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Card sx={{ borderRadius: 3, mb: 2, p: 2 }}><Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <TextField size="small" label="회원 검색" value={query} onChange={(e) => setQuery(e.target.value)} sx={{ flex: 1 }} />
      <TextField select size="small" label="회원 상태" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 140 }}><MenuItem value="ACT">활성 회원</MenuItem><MenuItem value="SLP">휴면 회원</MenuItem><MenuItem value="PND">승인 대기</MenuItem><MenuItem value="REJ">추방/거절</MenuItem><MenuItem value="ALL">전체 회원</MenuItem></TextField>
    </Stack><Stack direction="row" spacing={1} sx={{ mt: 1.5 }}><Chip label={`${visibleRows.length}명`} /><Chip label={`${totalGames.toLocaleString()}게임`} color="primary" /></Stack></Card>
    <Card sx={{ borderRadius: 3 }}><TableContainer>{loading ? <Box sx={{ py: 6, textAlign: "center" }}><CircularProgress /></Box> : <Table size="small"><TableHead><TableRow sx={{ bgcolor: "#f5f6fa" }}>{COLUMNS.map((column) => <TableCell key={column.key} align={column.align || "right"} sx={{ fontWeight: 800, whiteSpace: "nowrap" }}><TableSortLabel active={sort.key === column.key} direction={sort.key === column.key ? sort.direction : "asc"} onClick={() => requestSort(column.key)}>{column.label}</TableSortLabel></TableCell>)}</TableRow></TableHead><TableBody>
      {visibleRows.map((row) => <TableRow hover key={row.id}><TableCell><Typography variant="body2" fontWeight={800}>{row.name}</Typography><Typography variant="caption" color="text.secondary">{row.nickname || "-"} · {getCodeName(COMMON_CODE_GROUP.ROLE, row.role)}</Typography></TableCell><TableCell align="right">{row.game_count.toLocaleString()}</TableCell><TableCell align="right" sx={{ color: "primary.main", fontWeight: 800 }}>{formatScore(row.avg_score, 1)}</TableCell><TableCell align="right">{formatScore(row.high_score)}</TableCell><TableCell align="right">{formatScore(row.low_score)}</TableCell><TableCell align="right">{row.total_score.toLocaleString()}</TableCell><TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{row.average_start_date || "2026-07-01"}</TableCell></TableRow>)}
      {!visibleRows.length && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: "text.secondary" }}>조회 결과가 없습니다.</TableCell></TableRow>}
    </TableBody></Table>}</TableContainer></Card>
  </Box>;
}

function compare(a, b) { return typeof a === "string" ? a.localeCompare(b, "ko-KR") : Number(a) - Number(b); }
function formatScore(value, digits = 0) { return value == null ? "-" : Number(value).toFixed(digits); }
export default AverageManagePage;
