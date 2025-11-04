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
import Chip from "@mui/material/Chip";
import { Edit as EditIcon, Delete as DeleteIcon, Restore as RestoreIcon, Search as SearchIcon, Add as AddIcon, KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import InputAdornment from "@mui/material/InputAdornment";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
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
          sx={{ bgcolor: '#f06292', color: '#fff' }}
        />
      );
    }
    if (role === 'parent') {
      return (
        <Chip
          size="small"
          label="parent"
          variant="filled"
          sx={{ bgcolor: '#ffca28', color: '#212121' }}
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
    return <Chip size="small" label={conf.label} color={conf.color} variant="filled" />;
  };

  const renderStatusChip = (status) => (
    <Chip size="small" label={status === 1 ? 'Hoạt động' : 'Không hoạt động'} color={status === 1 ? 'success' : 'error'} variant="filled" />
  );

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
      <ArgonBox mb={2} display="flex" alignItems="center" justifyContent="space-between">
        <ArgonTypography variant="h4" fontWeight="bold">Quản lý tài khoản</ArgonTypography>
        <ArgonButton color="info" startIcon={<AddIcon />} onClick={openCreate}>+ Tạo tài khoản</ArgonButton>
      </ArgonBox>

      <ArgonBox display="flex" gap={2} mb={2} flexWrap="wrap" alignItems="center">
        <TextField
          size="small"
          placeholder="Tìm kiếm (tên, username, email, sđt)"
          value={qSearch}
          onChange={(e) => setQSearch(e.target.value)}
          sx={{ width: 360 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          InputLabelProps={{ shrink: false }}
        />
        <Select
          size="small"
          value={qRole}
          onChange={(e) => setQRole(e.target.value)}
          displayEmpty
          onOpen={() => setRoleOpen(true)}
          onClose={() => setRoleOpen(false)}
          IconComponent={roleOpen ? KeyboardArrowUp : KeyboardArrowDown}
          sx={{ width: 180 }}
        >
          <MenuItem value="">Tất cả vai trò</MenuItem>
          {ROLES.map((r) => (
            <MenuItem key={r} value={r}>{r}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={qStatus}
          onChange={(e) => setQStatus(e.target.value)}
          displayEmpty
          onOpen={() => setStatusOpen(true)}
          onClose={() => setStatusOpen(false)}
          IconComponent={statusOpen ? KeyboardArrowUp : KeyboardArrowDown}
          sx={{ width: 180 }}
        >
          <MenuItem value="">Tất cả trạng thái</MenuItem>
          <MenuItem value={1}>Hoạt động</MenuItem>
          <MenuItem value={0}>Vô hiệu</MenuItem>
        </Select>
        <Select size="small" value={limit} onChange={(e) => setLimit(Number(e.target.value))} onOpen={() => setLimitOpen(true)} onClose={() => setLimitOpen(false)} IconComponent={limitOpen ? KeyboardArrowUp : KeyboardArrowDown} sx={{ width: 120 }}>
          {[5, 10, 20, 50].map((n) => (
            <MenuItem key={n} value={n}>{n}/trang</MenuItem>
          ))}
        </Select>
      </ArgonBox>

      <TableContainer component={Paper} sx={{ boxShadow: 1, mt: 1 }}>
        <Table
          size="small"
          sx={{
            tableLayout: 'fixed',
            width: '100%',
            '& .MuiTableHead-root': {
              display: 'table-header-group !important',
              padding: 0,
            },
            '& .MuiTableCell-root': {
              padding: '12px 16px',
              verticalAlign: 'middle',
            },
          }}
        >
          <colgroup>
            <col style={{ width: '22%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '24%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '6%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 260, pl: 7, pr: 2 }}>
                <strong>Họ tên</strong>
              </TableCell>
              <TableCell sx={{ width: 140, px: 2 }}>
                <strong>Username</strong>
              </TableCell>
              <TableCell sx={{ width: 140, px: 2 }}>
                <strong>Vai trò</strong>
              </TableCell>
              <TableCell sx={{ width: 240, px: 2 }}>
                <strong>Email</strong>
              </TableCell>
              <TableCell sx={{ width: 140, px: 2 }}>
                <strong>SĐT</strong>
              </TableCell>
              <TableCell sx={{ width: 120, px: 2 }}>
                <strong>Trạng thái</strong>
              </TableCell>
              <TableCell sx={{ width: 140, pr: 2 }} align="right">
                <strong>Thao tác</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box display="flex" justifyContent="center" py={4}>
                    <CircularProgress size={28} />
                  </Box>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>Không có dữ liệu</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u, idx) => (
                <TableRow key={u._id} hover sx={{ bgcolor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar src={u.avatar_url} alt={u.full_name} sx={{ width: 28, height: 28 }} />
                      <ArgonTypography variant="body2" sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.full_name}
                      </ArgonTypography>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}>
                    <ArgonTypography variant="body2">{u.username}</ArgonTypography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}>
                    {renderRoleChip(u.role)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}>
                    <ArgonTypography variant="body2">{u.email || ""}</ArgonTypography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', px: 2 }}>
                    <ArgonTypography variant="body2">{u.phone_number || ""}</ArgonTypography>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', px: 2 }}>{renderStatusChip(u.status)}</TableCell>
                  <TableCell align="right" sx={{ pr: 2 }}>
                    <Tooltip title="Chỉnh sửa">
                      <IconButton onClick={() => openEdit(u)} size="small" color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Xóa vĩnh viễn">
                      <IconButton onClick={() => handleHardDelete(u._id)} size="small" color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ArgonBox display="flex" justifyContent="center" my={2}>
        <Pagination page={page} count={totalPages} onChange={(_, p) => setPage(p)} color="primary" />
      </ArgonBox>

      <UserFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => { setModalOpen(false); fetchUsers(); }}
        user={editingUser}
      />
    </DashboardLayout>
  );
}

export default ManageAccountPage;


