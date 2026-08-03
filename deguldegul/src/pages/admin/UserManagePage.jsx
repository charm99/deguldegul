import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Alert,
  IconButton,
  MenuItem,
  TextField,
  Divider,
  FormControlLabel,
  Switch,
} from "@mui/material";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";
import {
  fetchUsers,
  updateUser as updateUserRequest,
} from "../../features/admin/api/adminApi";
import { useAuth } from "../../contexts/AuthContext";
import {
  canManageUsers,
  canSeePrivateUserInfo,
} from "../../shared/model/permissions";
import { useCommonCodes } from "../../contexts/useCommonCodes";
import { COMMON_CODE_GROUP } from "../../shared/constants/commonCodeGroups";

function UserManagePage() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [onlyUse, setOnlyUse] = useState(true);

  const canAccess = canManageUsers(profile);
  const canSeePhone = canSeePrivateUserInfo(profile);

  const pendingUsers = useMemo(
    () => users.filter((user) => user.status === "PND"),
    [users]
  );

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (onlyUse) {
      list = list.filter((user) => user.status !== "REJ");
    }

    return list.sort((a, b) => {
      if (a.status === "PND" && b.status !== "PND") return -1;
      if (a.status !== "PND" && b.status === "PND") return 1;

      return new Date(b.created_at) - new Date(a.created_at);
    });
  }, [users, onlyUse]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setMessage("");

      const { data, error } = await fetchUsers();

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error(error);
      setMessage(error.message || "회원 목록 조회 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id, values) => {
    const { error } = await updateUserRequest(id, values);

    if (error) {
      alert(error.message);
      return;
    }

    await loadUsers();
  };

  useEffect(() => {
    loadUsers();
  }, []);

  if (!canAccess) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <IconButton onClick={() => navigate("/admin")}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant="h6" fontWeight={800}>
          회원관리
        </Typography>
      </Stack>

      <FormControlLabel
        sx={{ mb: 1 }}
        control={
          <Switch
            checked={onlyUse}
            onChange={(e) => setOnlyUse(e.target.checked)}
          />
        }
        label={onlyUse ? "사용회원만 보기" : "전체회원 보기"}
      />

      {message && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Card sx={{ borderRadius: 3, mb: 2 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography fontWeight={800}>가입 승인 대기</Typography>
              <Typography variant="body2" color="text.secondary">
                승인 대기 {pendingUsers.length}명 / 전체 {users.length}명
              </Typography>
            </Box>

            <Chip
              label={`${pendingUsers.length}명`}
              color={pendingUsers.length > 0 ? "warning" : "default"}
              sx={{ fontWeight: 800 }}
            />
          </Stack>

          {pendingUsers.length > 0 && (
            <>
              <Divider sx={{ my: 1.5 }} />

              <Stack spacing={1}>
                {pendingUsers.map((user) => (
                  <Stack
                    key={user.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={800} noWrap>
                        {user.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {user.nickname} · {user.email || "-"}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => updateUser(user.id, { status: "ACT" })}
                    >
                      승인
                    </Button>

                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => updateUser(user.id, { status: "REJ" })}
                    >
                      거절
                    </Button>
                  </Stack>
                ))}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography fontWeight={800} sx={{ mb: 1 }}>
            회원 목록
          </Typography>

          {loading ? (
            <Typography color="text.secondary">불러오는 중...</Typography>
          ) : (
            <Box sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: canSeePhone ? 1040 : 920 }}>
                <GridHeader canSeePhone={canSeePhone} />

                {filteredUsers.map((user) => (
                  <GridRow
                    key={user.id}
                    user={user}
                    onUpdate={updateUser}
                    canSeePhone={canSeePhone}
                  />
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

function GridHeader({ canSeePhone }) {
  const columns = [
    "이름",
    "닉네임",
    "이메일",
    ...(canSeePhone ? ["전화번호"] : []),
    "차량번호",
    "상태",
    "역할",
    "손",
    "투구",
    "가입일",
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: canSeePhone
          ? "80px 100px 170px 120px 110px 70px 90px 80px 80px 90px"
          : "80px 100px 170px 110px 70px 90px 80px 80px 90px",
        py: 1,
        px: 1,
        bgcolor: "#f5f6fa",
        borderRadius: 2,
      }}
    >
      {columns.map((label) => (
        <Typography
          key={label}
          variant="caption"
          color="text.secondary"
          fontWeight={800}
        >
          {label}
        </Typography>
      ))}
    </Box>
  );
}

function GridRow({ user, onUpdate, canSeePhone }) {
  const { getCodes, getCodeName } = useCommonCodes();
  const roles = getCodes(COMMON_CODE_GROUP.ROLE);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: canSeePhone
          ? "80px 100px 170px 120px 110px 70px 90px 80px 80px 90px"
          : "80px 100px 170px 110px 70px 90px 80px 80px 90px",
        alignItems: "center",
        py: 1,
        px: 1,
        borderBottom: "1px solid #eee",
      }}
    >
      <Typography fontWeight={800} noWrap>
        {user.name}
      </Typography>

      <Typography variant="body2" noWrap>
        {user.nickname}
      </Typography>

      <Typography variant="body2" color="text.secondary" noWrap>
        {user.email || "-"}
      </Typography>

      {canSeePhone && (
        <Typography variant="body2" color="text.secondary" noWrap>
          {user.phone_no || "-"}
        </Typography>
      )}

      <Typography variant="body2" color="text.secondary" noWrap>
        {user.car_no || "-"}
      </Typography>

      <Chip
        label={getCodeName(COMMON_CODE_GROUP.USER_STATUS, user.status)}
        color={
          user.status === "ACT"
            ? "primary"
            : user.status === "PND"
            ? "warning"
            : "default"
        }
        size="small"
        sx={{ fontWeight: 700, width: 64 }}
      />

      <TextField
        select
        size="small"
        value={user.role || "MBR"}
        onChange={(e) => onUpdate(user.id, { role: e.target.value })}
        sx={{ width: 82 }}
      >
        {roles.map((item) => (
          <MenuItem key={item.com_cd} value={item.com_cd}>
            {item.com_nm}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant="body2">
        {getCodeName(COMMON_CODE_GROUP.HAND, user.hand)}
      </Typography>

      <Typography variant="body2">
        {getCodeName(COMMON_CODE_GROUP.BOWLING_TYPE, user.bwl_tp)}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {user.join_date || "-"}
      </Typography>
    </Box>
  );
}

export default UserManagePage;
