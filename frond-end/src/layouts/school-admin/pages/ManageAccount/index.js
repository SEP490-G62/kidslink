import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Backdrop,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import RestoreIcon from "@mui/icons-material/Restore";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import schoolAdminService from "services/schoolAdminService";
import api from "services/api";
import UserFormModal from "./userFormModal";

const ROLE_LABELS = {
  teacher: "Giáo viên",
  parent: "Phụ huynh",
  health_care_staff: "Nhân viên y tế",
  nutrition_staff: "Nhân viên dinh dưỡng",
};

const STATUS_LABELS = {
  1: { label: "Hoạt động", color: "success" },
  0: { label: "Vô hiệu", color: "error" },
};

const ManageAccountPage = () => {
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchStudents();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await schoolAdminService.getUsers({ limit: 200 });
      if (res.success) {
        setUsers(res.data || []);
      } else {
        setUsers([]);
        setError(res.message || "Không thể tải danh sách người dùng");
      }
    } catch (err) {
      console.error("fetchUsers error", err);
      setUsers([]);
      setError(err.message || "Không thể tải danh sách người dùng");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await api.get("/student/all", true);
      const list = Array.isArray(res) ? res : res.students || [];
      setStudents(list);
    } catch (err) {
      console.error("fetchStudents error", err);
      setStudents([]);
    }
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setModalOpen(true);
  };

  const handleEditUser = async (user) => {
    try {
      setProfileLoading(true);
      const res = await schoolAdminService.getUserById(user._id);
      if (res.success) {
        setSelectedUser(res.data);
        setModalOpen(true);
      } else {
        alert(res.message || "Không thể tải thông tin user");
      }
    } catch (err) {
      console.error("getUserById error", err);
      alert(err.message || "Không thể tải thông tin user");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 1 ? 0 : 1;
    if (
      !window.confirm(
        `Bạn có chắc muốn ${nextStatus === 1 ? "kích hoạt" : "vô hiệu hóa"} tài khoản "${user.full_name}"?`
      )
    ) {
      return;
    }
    try {
      await schoolAdminService.updateUser(user._id, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === user._id ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      console.error("toggle status error", err);
      alert(err.message || "Không thể cập nhật trạng thái");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Bạn có chắc muốn khóa tài khoản "${user.full_name}"?`)) return;
    try {
      await schoolAdminService.softDeleteUser(user._id);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: 0 } : u)));
    } catch (err) {
      console.error("delete user error", err);
      alert(err.message || "Không thể khóa tài khoản");
    }
  };

  const handleRestoreUser = async (user) => {
    try {
      await schoolAdminService.restoreUser(user._id);
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: 1 } : u)));
    } catch (err) {
      console.error("restore user error", err);
      alert(err.message || "Không thể khôi phục tài khoản");
    }
  };

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = !roleFilter || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "" || Number(u.status) === Number(statusFilter);
      const matchesSearch =
        !keyword ||
        (u.full_name || "").toLowerCase().includes(keyword) ||
        (u.username || "").toLowerCase().includes(keyword) ||
        (u.email || "").toLowerCase().includes(keyword) ||
        (u.phone_number || "").toLowerCase().includes(keyword);
      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, search, roleFilter, statusFilter]);

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedUser(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchUsers();
  };

  const totalUsers = filteredUsers.length;
  const activeCount = users.filter((u) => u.status === 1).length;
  const inactiveCount = users.length - activeCount;
  const teacherCount = users.filter((u) => u.role === "teacher").length;

  const renderRoleChip = (role) => {
    const label = ROLE_LABELS[role] || role;
    let color = "default";
    if (role === "teacher") color = "primary";
    else if (role === "parent") color = "info";
    else if (role === "health_care_staff") color = "success";
    else if (role === "nutrition_staff") color = "warning";
    return <Chip size="small" color={color} label={label} />;
  };

  const renderStatusChip = (status) => {
    const { label, color } = STATUS_LABELS[status] || {
      label: "Không xác định",
      color: "default",
    };
    return <Chip size="small" color={color} label={label} />;
  };

  const formatDate = (value) => {
    if (!value) return "-";
    try {
      const date = new Date(value);
      return date.toLocaleString("vi-VN");
    } catch (e) {
      return "-";
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        <Card
          sx={{
            mb: 3,
            background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
            border: "1px solid #e3f2fd",
            boxShadow: "0 6px 18px rgba(25,118,210,0.12)",
          }}
        >
          <CardContent>
            <Box
              display="flex"
              flexDirection={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", md: "center" }}
              gap={2}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PeopleAltIcon color="primary" />
                  <ArgonTypography variant="h5" fontWeight="bold">
                    Quản lý tài khoản
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  Theo dõi và thao tác với tài khoản trong trường
                </ArgonTypography>
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <ArgonButton
                  color="secondary"
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={fetchUsers}
                >
                  Làm mới
                </ArgonButton>
                <ArgonButton
                  color="info"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreate}
                >
                  Thêm tài khoản
                </ArgonButton>
              </Stack>
            </Box>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              mt={3}
              flexWrap="wrap"
            >
              <Card
                sx={{
                  flex: 1,
                  minWidth: 220,
                  border: "1px solid #e0f2f1",
                  boxShadow: "none",
                  background:
                    "linear-gradient(135deg, rgba(224,242,241,0.8) 0%, rgba(255,255,255,0.9) 100%)",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <PeopleAltIcon color="primary" />
                    <Box>
                      <ArgonTypography variant="caption" color="text" textTransform="uppercase">
                        Tổng tài khoản
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {totalUsers}
                      </ArgonTypography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
              <Card
                sx={{
                  flex: 1,
                  minWidth: 220,
                  border: "1px solid #e3f2fd",
                  boxShadow: "none",
                  background:
                    "linear-gradient(135deg, rgba(227,242,253,0.8) 0%, rgba(255,255,255,0.95) 100%)",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleIcon color="success" />
                    <Box>
                      <ArgonTypography variant="caption" color="text" textTransform="uppercase">
                        Đang hoạt động
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {activeCount}
                      </ArgonTypography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
              <Card
                sx={{
                  flex: 1,
                  minWidth: 220,
                  border: "1px solid #ffebee",
                  boxShadow: "none",
                  background:
                    "linear-gradient(135deg, rgba(255,235,238,0.85) 0%, rgba(255,255,255,0.95) 100%)",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <BlockIcon color="error" />
                    <Box>
                      <ArgonTypography variant="caption" color="text" textTransform="uppercase">
                        Đã khóa
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {inactiveCount}
                      </ArgonTypography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
              <Card
                sx={{
                  flex: 1,
                  minWidth: 220,
                  border: "1px solid #ede7f6",
                  boxShadow: "none",
                  background:
                    "linear-gradient(135deg, rgba(237,231,246,0.85) 0%, rgba(255,255,255,0.95) 100%)",
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip label="GV" color="primary" size="small" />
                    <Box>
                      <ArgonTypography variant="caption" color="text" textTransform="uppercase">
                        Giáo viên
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {teacherCount}
                      </ArgonTypography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            mb: 3,
            background: "linear-gradient(135deg, #ffffff 0%, #f5f7fa 100%)",
            border: "1px solid #e3f2fd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                size="small"
                fullWidth
                placeholder="Tìm kiếm theo tên, username, email, SĐT..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: 220,
                  maxWidth: 400,
                  width: "100%",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
                    width: "100%",
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputBase-input": {
                    width: "100% !important",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                size="small"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: 220,
                  maxWidth: 260,
                  width: "100%",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
                    width: "100%",
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputBase-input": {
                    width: "100% !important",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" sx={{ color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => {
                    if (!value) return "Tất cả vai trò";
                    return ROLE_LABELS[value] || value;
                  },
                }}
              >
                <MenuItem value="">
                  <em>Tất cả vai trò</em>
                </MenuItem>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                size="small"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  flex: 1,
                  minWidth: 200,
                  maxWidth: 240,
                  width: "100%",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
                    width: "100%",
                    borderRadius: 2,
                    "&:hover fieldset": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "primary.main",
                    },
                  },
                  "& .MuiInputBase-input": {
                    width: "100% !important",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterListIcon fontSize="small" sx={{ color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => {
                    if (value === "") return "Trạng thái bất kỳ";
                    return Number(value) === 1 ? "Hoạt động" : "Vô hiệu";
                  },
                }}
              >
                <MenuItem value="">
                  <em>Trạng thái bất kỳ</em>
                </MenuItem>
                <MenuItem value={1}>Hoạt động</MenuItem>
                <MenuItem value={0}>Vô hiệu</MenuItem>
              </TextField>
              {(search || roleFilter || statusFilter !== "") && (
                <ArgonButton
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={() => {
                    setSearch("");
                    setRoleFilter("");
                    setStatusFilter("");
                  }}
                >
                  Xóa lọc
                </ArgonButton>
              )}
            </Stack>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
              Danh sách tài khoản ({filteredUsers.length})
            </ArgonTypography>
            {loading ? (
              <ArgonBox
                py={5}
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <CircularProgress />
              </ArgonBox>
            ) : filteredUsers.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body1" color="text">
                  {search || roleFilter || statusFilter !== ""
                    ? "Không tìm thấy tài khoản phù hợp"
                    : "Chưa có dữ liệu tài khoản"}
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 2,
                  border: (theme) => `1px solid ${theme.palette.info.light}`,
                  boxShadow: 3,
                }}
              >
                <Table
                  sx={{
                    tableLayout: "fixed",
                    width: "100%",
                    "& .MuiTableHead-root": {
                      display: "table-header-group !important",
                      padding: 0,
                      backgroundColor: (theme) => theme.palette.info.main,
                      "& .MuiTableCell-root": {
                        fontWeight: 700,
                        color: "#ffffff",
                        borderBottom: (theme) => `2px solid ${theme.palette.info.dark}`,
                      },
                    },
                    "& .MuiTableCell-root": {
                      padding: "14px 16px",
                      verticalAlign: "middle",
                      borderBottom: (theme) => `1px solid ${theme.palette.info.light}`,
                    },
                    "& .MuiTableBody-root .MuiTableRow-root:hover": {
                      backgroundColor: (theme) => `${theme.palette.info.light}33`,
                    },
                  }}
                >
                  <colgroup>
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "12%" }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell>Người dùng</TableCell>
                      <TableCell>Username</TableCell>
                      <TableCell>Vai trò</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>SĐT</TableCell>
                      <TableCell>Ngày tạo</TableCell>
                      <TableCell align="right">Thao tác</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <ArgonBox display="flex" alignItems="center" gap={1.5}>
                            <Avatar src={user.avatar_url} alt={user.full_name}>
                              {user.full_name?.charAt(0)?.toUpperCase()}
                            </Avatar>
                            <ArgonBox>
                              <ArgonTypography variant="button" fontWeight="medium">
                                {user.full_name || "-"}
                              </ArgonTypography>
                              <ArgonTypography variant="caption" color="text.secondary">
                                {ROLE_LABELS[user.role] || user.role}
                              </ArgonTypography>
                            </ArgonBox>
                          </ArgonBox>
                        </TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2">{user.username || "-"}</ArgonTypography>
                        </TableCell>
                        <TableCell>{renderRoleChip(user.role)}</TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2" color="text">
                            {user.email || "-"}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2" color="text">
                            {user.phone_number || "-"}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2" color="text">
                            {formatDate(user.createdAt)}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="Chỉnh sửa">
                            <IconButton
                              size="small"
                              sx={{ color: "#1976d2" }}
                              onClick={() => handleEditUser(user)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.status === 1 ? "Vô hiệu hóa" : "Kích hoạt"}>
                            <IconButton
                              size="small"
                              sx={{ color: user.status === 1 ? "#f57c00" : "#2e7d32" }}
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.status === 1 ? (
                                <LockIcon fontSize="small" />
                              ) : (
                                <LockOpenIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                          {user.status === 0 ? (
                            <Tooltip title="Khôi phục">
                              <IconButton
                                size="small"
                                sx={{ color: "#2e7d32" }}
                                onClick={() => handleRestoreUser(user)}
                              >
                                <RestoreIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Khoá tài khoản">
                              <IconButton
                                size="small"
                                sx={{ color: "#d32f2f" }}
                                onClick={() => handleDeleteUser(user)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />

      <UserFormModal
        open={modalOpen}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        user={selectedUser}
        students={students}
      />

      <Backdrop open={profileLoading} sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </DashboardLayout>
  );
};

export default ManageAccountPage;



