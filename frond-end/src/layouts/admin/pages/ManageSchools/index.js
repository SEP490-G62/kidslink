import React, { useEffect, useMemo, useState } from "react";
import {
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Pagination,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SchoolIcon from "@mui/icons-material/School";
import { useNavigate } from "react-router-dom";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import adminService from "services/adminService";
import SchoolModal from "./SchoolModal";
import SchoolDetailModal from "./SchoolDetailModal";

const ManageSchools = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminService.getAllSchools(page, limit, search);
      if (res.success && res.data) {
        setSchools(res.data);
        setTotalPages(res.pagination?.totalPages || 1);
        setTotal(res.pagination?.total || 0);
      } else {
        setSchools([]);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách trường học:", e);
      setError(e.message || "Không thể tải danh sách trường học. Vui lòng thử lại.");
      setSchools([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [page]);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchSchools();
      } else {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  const handleCreate = () => {
    setSelectedSchool(null);
    setModalOpen(true);
  };

  const handleEdit = (school) => {
    setSelectedSchool(school);
    setModalOpen(true);
  };

  const handleView = (school) => {
    setSelectedSchool(school);
    setDetailModalOpen(true);
  };

  const handleDelete = (school) => {
    setSchoolToDelete(school);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!schoolToDelete) return;

    try {
      const result = await adminService.deleteSchool(schoolToDelete._id);
      if (result.success) {
        setError(null);
        fetchSchools();
        setDeleteDialogOpen(false);
        setSchoolToDelete(null);
      } else {
        setError(result.message || "Không thể xóa trường học");
      }
    } catch (e) {
      console.error("Lỗi khi xóa trường học:", e);
      setError(e.message || "Không thể xóa trường học. Vui lòng thử lại.");
    }
  };

  const handleStatusChange = async (school, newStatus) => {
    try {
      const result = await adminService.updateSchoolStatus(school._id, newStatus);
      if (result.success) {
        fetchSchools();
      } else {
        setError(result.message || "Không thể cập nhật trạng thái");
      }
    } catch (e) {
      console.error("Lỗi khi cập nhật trạng thái:", e);
      setError(e.message || "Không thể cập nhật trạng thái. Vui lòng thử lại.");
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedSchool(null);
  };

  const handleSuccess = () => {
    fetchSchools();
    handleModalClose();
  };

  if (loading && schools.length === 0) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SchoolIcon color="primary" />
                  <ArgonTypography
                    variant="h5"
                    fontWeight="bold"
                    letterSpacing={0.2}
                  >
                    Quản lý trường học
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  Quản lý danh sách trường học trong hệ thống
                </ArgonTypography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Chip
                  icon={<SchoolIcon />}
                  color="primary"
                  variant="outlined"
                  label={`${schools.length} trường học`}
                />
                <ArgonButton
                  color="info"
                  size="medium"
                  onClick={handleCreate}
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  Tạo trường học mới
                </ArgonButton>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Filter Section */}
        <Card 
          sx={{ 
            mb: 3,
            background: "linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)",
            border: "1px solid #e3f2fd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <CardContent>
            <ArgonBox
              display="flex"
              gap={2}
              flexWrap="wrap"
              alignItems="center"
            >
              <TextField
                size="small"
                placeholder="Tìm kiếm theo tên, địa chỉ, email, số điện thoại..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ flex: 1, minWidth: 200, maxWidth: 400,  
                  width: '100%',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': {
                    width: '100%',
                    '&:hover fieldset': {
                      borderColor: 'primary.main',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiInputBase-input': {
                    width: '100% !important',
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: "#1976d2" }} />
                    </InputAdornment>
                  ),
                }}
              />
            </ArgonBox>
          </CardContent>
        </Card>

        {/* Schools List */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
              Danh sách trường học ({schools.length} trường)
            </ArgonTypography>

            {schools.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body1" color="text">
                  {search
                    ? "Không tìm thấy trường học nào phù hợp"
                    : "Chưa có dữ liệu trường học"}
                </ArgonTypography>
              </ArgonBox>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 2, border: (theme) => `1px solid ${theme.palette.info.light}` }}>
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
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "22%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "13%" }} />
                    <col style={{ width: "10%" }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Logo
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Tên trường
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Email
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Số điện thoại
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Người dùng
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Trạng thái
                        </ArgonTypography>
                      </TableCell>
                      <TableCell align="center">
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Thao tác
                        </ArgonTypography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {schools.length > 0 ? (
                      schools.map((school) => (
                        <TableRow key={school._id} hover>
                          <TableCell>
                            <Box
                              component="img"
                              src={school.logo_url || "https://via.placeholder.com/50"}
                              alt={school.school_name}
                              sx={{
                                width: 50,
                                height: 50,
                                objectFit: "cover",
                                borderRadius: 1,
                                border: "1px solid #e0e0e0",
                              }}
                              onError={(e) => {
                                e.target.src = "https://via.placeholder.com/50";
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" fontWeight="600" color="#212121">
                              {school.school_name}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" color="#424242">
                              {school.email || "-"}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <ArgonTypography variant="body2" color="#424242">
                              {school.phone || "-"}
                            </ArgonTypography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={school.user_count || 0}
                              color="info"
                              size="small"
                              sx={{
                                backgroundColor: "#e3f2fd",
                                color: "#1565c0",
                                border: "1px solid #1976d2",
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                label={school.status === 1 ? "Hoạt động" : "Vô hiệu hóa"}
                                color={school.status === 1 ? "success" : "error"}
                                size="small"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  height: 24,
                                  minWidth: 80,
                                }}
                              />
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={school.status === 1}
                                    onChange={(e) =>
                                      handleStatusChange(school, e.target.checked ? 1 : 0)
                                    }
                                  />
                                }
                                label=""
                                sx={{ m: 0 }}
                              />
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              title="Xem chi tiết"
                              onClick={() => handleView(school)}
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  backgroundColor: "#e3f2fd",
                                },
                                mr: 0.5,
                              }}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              title="Chỉnh sửa"
                              onClick={() => handleEdit(school)}
                              sx={{
                                color: "#1976d2",
                                "&:hover": {
                                  backgroundColor: "#e3f2fd",
                                },
                                mr: 0.5,
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              title="Xóa trường học"
                              onClick={() => handleDelete(school)}
                              sx={{
                                color: "#d32f2f",
                                "&:hover": {
                                  backgroundColor: "#ffebee",
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <ArgonTypography variant="body2" color="text">
                            {search
                              ? "Không tìm thấy trường học nào phù hợp"
                              : "Chưa có dữ liệu trường học"}
                          </ArgonTypography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {totalPages > 1 && (
              <ArgonBox display="flex" justifyContent="center" mt={3}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                />
              </ArgonBox>
            )}

            <ArgonBox mt={2}>
              <ArgonTypography variant="body2" color="text">
                Tổng số: {total} trường học
              </ArgonTypography>
            </ArgonBox>
          </CardContent>
        </Card>

        {/* School Modal */}
        <SchoolModal
          open={modalOpen}
          onClose={handleModalClose}
          schoolData={selectedSchool}
          onSuccess={handleSuccess}
        />

        {/* School Detail Modal */}
        <SchoolDetailModal
          open={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedSchool(null);
          }}
          schoolData={selectedSchool}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setSchoolToDelete(null);
          }}
        >
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Bạn có chắc chắn muốn xóa trường học &quot;{schoolToDelete?.school_name}&quot;?
              {schoolToDelete?.user_count > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  Trường học này có {schoolToDelete.user_count} người dùng. 
                  Vui lòng xóa hoặc chuyển người dùng trước khi xóa trường học.
                </Alert>
              )}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <ArgonButton
              onClick={() => {
                setDeleteDialogOpen(false);
                setSchoolToDelete(null);
              }}
              color="secondary"
            >
              Hủy
            </ArgonButton>
            <ArgonButton
              onClick={confirmDelete}
              color="error"
              disabled={schoolToDelete?.user_count > 0}
            >
              Xóa
            </ArgonButton>
          </DialogActions>
        </Dialog>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default ManageSchools;

