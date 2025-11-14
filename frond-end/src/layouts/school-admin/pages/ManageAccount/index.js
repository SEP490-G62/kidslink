import React, { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  IconButton,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  Paper,
  TableHead,
  TableRow,
  TextField,
  Tooltip
} from "@mui/material";
import Switch from "@mui/material/Switch";
import { styled } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import { Edit as EditIcon, Delete as DeleteIcon, Restore as RestoreIcon, Search as SearchIcon, Add as AddIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import InputAdornment from "@mui/material/InputAdornment";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import { useAuth } from "context/AuthContext";
import api from "services/api";
import UserFormModal from "./userFormModal";

const ROLES = [
  "school_admin",
  "teacher",
  "parent",
  "health_care_staff",
  "nutrition_staff",
];

function ManageAccountPage() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [qRole, setQRole] = useState("");
  const [qStatus, setQStatus] = useState("");
  const [qSearch, setQSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roleOpen, setRoleOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [limitOpen, setLimitOpen] = useState(false);

  const StatusSwitch = useMemo(() => styled(Switch)(({ theme }) => ({
    width: 44,
    height: 24,
    padding: 0,
    display: 'inline-flex',
    '& .MuiSwitch-switchBase': {
      padding: 2,
      top: 0,
      left: 0,
      transform: 'translateX(2px)',
      '&.Mui-checked': {
        transform: 'translateX(20px)',
        '& + .MuiSwitch-track': {
          backgroundColor: '#22c55e !important',
          opacity: 1,
        },
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: 0.5,
      },
    },
    '& .MuiSwitch-thumb': {
      width: 20,
      height: 20,
      boxShadow: 'none',
      backgroundColor: '#fff',
    },
    '& .MuiSwitch-track': {
      borderRadius: 12,
      backgroundColor: '#e5e7eb !important',
      opacity: 1,
    },
  })), []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (qRole) params.set("role", qRole);
      if (qStatus !== "") params.set("status", qStatus);
      // Optional server-side search could be added later
      const res = await api.get(`/users?${params.toString()}`, true);
      const payload = res || {};
      const data = payload.data || [];
      const pagination = payload.pagination || { totalPages: 1 };
      setUsers(Array.isArray(data) ? data : []);
      setTotalPages(parseInt(pagination.totalPages || 1));
    } catch (e) {
      console.error("Failed to fetch users", e);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, qRole, qStatus]);

  const filteredUsers = useMemo(() => {
    if (!qSearch) return users;
    const s = qSearch.toLowerCase();
    return users.filter((u) =>
      [u.full_name, u.username, u.email, u.phone_number]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s))
    );
  }, [users, qSearch]);

  const renderRoleChip = (role) => {
    // Custom colors per requirement
    if (role === 'health_care_staff') {
      return (
        <Chip
          size="small"
          label="health_care_staff"
          variant="filled"
          sx={{ bgcolor: '#f06292', color: '#fff', borderRadius: '16px' }}
        />
      );
    }
    if (role === 'parent') {
      return (
        <Chip
          size="small"
          label="parent"
          variant="filled"
          sx={{ bgcolor: '#ffca28', color: '#212121', borderRadius: '16px' }}
        />
      );
    }
    const map = {
      school_admin: { color: 'primary', label: 'school_admin' },
      teacher: { color: 'info', label: 'teacher' },
      nutrition_staff: { color: 'warning', label: 'nutrition_staff' },
      admin: { color: 'error', label: 'admin' },
    };
    const conf = map[role] || { color: 'default', label: role };
    return <Chip size="small" label={conf.label} color={conf.color} variant="filled" sx={{ borderRadius: '16px' }} />;
  };

  const renderStatusChip = (status) => (
    <Chip size="small" label={status === 1 ? 'Hoạt động' : 'Không hoạt động'} color={status === 1 ? 'success' : 'error'} variant="filled" sx={{ borderRadius: '16px' }} />
  );

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 1 ? 0 : 1;
    // optimistic UI update
    setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: newStatus } : u)));
    try {
      await api.put(`/users/${user._id}`, { status: newStatus }, true);
    } catch (e) {
      console.error("Toggle status failed", e);
      // revert on failure
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: user.status } : u)));
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Xác nhận vô hiệu hóa tài khoản?")) return;
    try {
      await api.delete(`/users/${userId}`, true);
      fetchUsers();
    } catch (e) {
      console.error("Delete user failed", e);
    }
  };

  const handleHardDelete = async (userId) => {
    if (!window.confirm("Xóa vĩnh viễn tài khoản? Không thể khôi phục.")) return;
    try {
      await api.delete(`/users/${userId}/hard`, true);
      fetchUsers();
    } catch (e) {
      console.error("Hard delete user failed", e);
    }
  };

  const handleRestore = async (userId) => {
    try {
      await api.put(`/users/${userId}/restore`, {}, true);
      fetchUsers();
    } catch (e) {
      console.error("Restore user failed", e);
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold" color="white">Quản lý tài khoản</ArgonTypography>
          <ArgonButton color="info" size="medium" onClick={openCreate} variant="gradient">+ Tạo tài khoản</ArgonButton>
        </ArgonBox>

        <ArgonBox mb={2} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="Tìm kiếm"
            value={qSearch}
            onChange={(e) => setQSearch(e.target.value)}
            sx={{
              maxWidth: 480,
              width: "100%",
              backgroundColor: "white",
              borderRadius: 1,
              '& .MuiInputBase-input': {
                color: 'text.primary',
                paddingRight: '14px',
                overflow: 'visible',
                textOverflow: 'clip',
                '::placeholder': { color: 'text.secondary', opacity: 0.6, fontSize: '0.95rem' },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            InputLabelProps={{ shrink: false }}
          />
          <Box display="flex" alignItems="center" gap={0.5}>
            <Select
              size="small"
              value={qRole}
              onChange={(e) => setQRole(e.target.value)}
              displayEmpty
              open={roleOpen}
              onOpen={() => setRoleOpen(true)}
              onClose={() => setRoleOpen(false)}
              sx={{
                width: 140,
                backgroundColor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "& .MuiSelect-icon": { display: "none" },
              }}
            >
              <MenuItem value="">Tất cả vai trò</MenuItem>
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
            <IconButton size="small" onClick={() => setRoleOpen(!roleOpen)} sx={{ backgroundColor: "white", color: "text.main", minWidth: 32, height: 32 }}>
              {roleOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Select
              size="small"
              value={qStatus}
              onChange={(e) => setQStatus(e.target.value)}
              displayEmpty
              open={statusOpen}
              onOpen={() => setStatusOpen(true)}
              onClose={() => setStatusOpen(false)}
              sx={{
                width: 140,
                backgroundColor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "& .MuiSelect-icon": { display: "none" },
              }}
            >
              <MenuItem value="">Tất cả trạng thái</MenuItem>
              <MenuItem value={1}>Hoạt động</MenuItem>
              <MenuItem value={0}>Vô hiệu</MenuItem>
            </Select>
            <IconButton size="small" onClick={() => setStatusOpen(!statusOpen)} sx={{ backgroundColor: "white", color: "text.main", minWidth: 32, height: 32 }}>
              {statusOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Select
              size="small"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              open={limitOpen}
              onOpen={() => setLimitOpen(true)}
              onClose={() => setLimitOpen(false)}
              sx={{
                width: 100,
                backgroundColor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "& .MuiSelect-icon": { display: "none" },
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <MenuItem key={n} value={n}>{n}/trang</MenuItem>
              ))}
            </Select>
            <IconButton size="small" onClick={() => setLimitOpen(!limitOpen)} sx={{ backgroundColor: "white", color: "text.main", minWidth: 32, height: 32 }}>
              {limitOpen ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Box>
        </ArgonBox>
      {loading ? (
        <ArgonBox p={3} bgcolor="white" borderRadius={2}>
          <ArgonTypography variant="body2">Đang tải dữ liệu...</ArgonTypography>
        </ArgonBox>
      ) : (
        <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
          <Table
            sx={{
              tableLayout: "fixed",
              width: "100%",
              "& .MuiTableHead-root": {
                display: "table-header-group !important",
                padding: 0,
              },
              "& .MuiTableCell-root": {
                padding: "12px 16px",
                verticalAlign: "middle",
              },
            }}
          >
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <TableHead sx={{ display: 'table-header-group', backgroundColor: 'white' }}>
              <TableRow>
                <TableCell>
                  <strong>Họ tên</strong>
                </TableCell>
                <TableCell>
                  <strong>Username</strong>
                </TableCell>
                <TableCell>
                  <strong>Vai trò</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
                <TableCell>
                  <strong>SĐT</strong>
                </TableCell>
                <TableCell>
                  <strong>Trạng thái</strong>
                </TableCell>
                <TableCell>
                  <strong>Thao tác</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <TableRow key={u._id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar src={u.avatar_url} alt={u.full_name} sx={{ width: 28, height: 28 }} />
                        <ArgonTypography variant="body2" fontWeight="medium">
                          {u.full_name}
                        </ArgonTypography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <ArgonTypography variant="body2">{u.username}</ArgonTypography>
                    </TableCell>
                    <TableCell>
                      {renderRoleChip(u.role)}
                    </TableCell>
                    <TableCell>
                      <ArgonTypography variant="body2">{u.email || ""}</ArgonTypography>
                    </TableCell>
                    <TableCell>
                      <ArgonTypography variant="body2">{u.phone_number || ""}</ArgonTypography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <ArgonTypography variant="body2">
                          {u.status === 1 ? "Hoạt động" : "Vô hiệu"}
                        </ArgonTypography>
                        <StatusSwitch
                          size="small"
                          checked={u.status === 1}
                          onChange={() => handleToggleStatus(u)}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="inline-flex" gap={0.5}>
                        <IconButton
                          size="small"
                          color="primary"
                          title="Chỉnh sửa"
                          onClick={() => openEdit(u)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          title="Xóa vĩnh viễn"
                          onClick={() => handleHardDelete(u._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <ArgonTypography variant="body2" color="text">
                      {qSearch ? "Không tìm thấy tài khoản nào phù hợp" : "Chưa có dữ liệu tài khoản"}
                    </ArgonTypography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ArgonBox display="flex" justifyContent="center" my={2}>
        <Pagination page={page} count={totalPages} onChange={(_, p) => setPage(p)} color="primary" />
      </ArgonBox>

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchUsers(); }}
        user={editingUser}
      />
      </ArgonBox>
    </DashboardLayout>
  );
}

export default ManageAccountPage;


