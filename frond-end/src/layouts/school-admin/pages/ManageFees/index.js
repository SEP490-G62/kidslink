import React, { useEffect, useMemo, useState } from "react";
import {
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Chip,
  Box,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Alert,
  Stack,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SortIcon from "@mui/icons-material/Sort";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { useNavigate } from "react-router-dom";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import schoolAdminService from "services/schoolAdminService";
import api from "services/api";
import FeeModal from "./FeeModal";

const ManageFees = () => {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // "asc" or "desc"
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  // cấu hình width dùng chung cho cả header & body
  const columns = {
    name: { width: 180 },
    desc: { width: 220 },
    amount: { width: 140 },
    classes: { width: 260 },
    createdAt: { width: 160 },
    updatedAt: { width: 160 },
    actions: { width: 100 },
  };

  const fetchFees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await schoolAdminService.getAllFees(1, 100);
      if (res.success && res.data) {
        setFees(res.data);
      } else {
        setFees([]);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách phí:", e);
      setError(e.message || "Không thể tải danh sách phí. Vui lòng thử lại.");
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await api.get("/classes", true);
      if (res.data) {
        setClasses(res.data);
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách lớp:", e);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchClasses();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    const filteredFees = fees.filter((f) => {
      const name = f.fee_name || "";
      const desc = f.description || "";

      const matchesSearch =
        !s || name.toLowerCase().includes(s) || desc.toLowerCase().includes(s);

      const matchesClass =
        !filterClass ||
        (f.class_ids && f.class_ids.includes(filterClass));

      return matchesSearch && matchesClass;
    });

    // Sort by createdAt
    const sorted = [...filteredFees].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

    return sorted;
  }, [fees, search, filterClass, sortOrder]);

  const handleCreate = () => {
    setSelectedFee(null);
    setModalOpen(true);
  };

  const handleEdit = (feeData) => {
    setSelectedFee(feeData);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedFee(null);
  };

  const handleSuccess = () => {
    fetchFees(); // Refresh list
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0";
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("vi-VN").format(num);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleDelete = async (id, feeName) => {
    if (!window.confirm(`Bạn có chắc muốn xóa phí "${feeName}"?\n\nLưu ý: Phí đang được áp dụng cho các lớp học sẽ không thể xóa.`)) return;
    try {
      const res = await schoolAdminService.deleteFee(id);
      if (res.success) {
        setFees((prev) => prev.filter((f) => f._id !== id));
        alert("Xóa phí thành công!");
      } else {
        alert(res.message || "Không thể xóa phí. Vui lòng thử lại.");
      }
    } catch (e) {
      console.error("Lỗi khi xóa phí:", e);
      const errorMessage = e.message || "Không thể xóa phí. Vui lòng thử lại.";
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox
          py={3}
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox py={3}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <ArgonButton onClick={fetchFees} color="info">
            Thử lại
          </ArgonButton>
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
                  <AttachMoneyIcon color="primary" />
                  <ArgonTypography
                    variant="h5"
                    fontWeight="bold"
                    letterSpacing={0.2}
                  >
                    Quản lý phí
                  </ArgonTypography>
                </Stack>
                <ArgonTypography variant="body2" color="text" mt={0.5}>
                  Quản lý các khoản phí và áp dụng cho lớp học
                </ArgonTypography>
              </Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Chip
                  icon={<AttachMoneyIcon />}
                  color="primary"
                  variant="outlined"
                  label={`${filtered.length} phí`}
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
                  Tạo phí mới
                </ArgonButton>
              </Stack>
            </Box>
          </CardContent>
        </Card>

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
                placeholder="Tìm kiếm theo tên phí hoặc mô tả..."
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
              <TextField
                select
                size="small"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                sx={{
                  minWidth: 280,
                  "& .MuiOutlinedInput-root": {
                    bgcolor: "#fff",
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    pl: 1,
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#e0e0e0",
                    borderWidth: 1.5,
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#1976d2",
                    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.15)",
                  },
                  "& .MuiOutlinedInput-root.Mui-focused": {
                    boxShadow: "0 0 0 3px rgba(25, 118, 210, 0.1)",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1976d2",
                      borderWidth: 2,
                    },
                  },
                  "& .MuiInputBase-input": {
                    fontWeight: filterClass ? 600 : 400,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton
                        size="small"
                        edge="start"
                        sx={{ color: "#1976d2" }}
                        onMouseDown={(event) => event.preventDefault()}
                      >
                        <FilterListIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => {
                    if (!value) return "Tất cả lớp học";
                    const selectedClass = classes.find((cls) => cls._id === value);
                    return selectedClass
                      ? `${selectedClass.class_name} (${selectedClass.academic_year})`
                      : value;
                  },
                  MenuProps: {
                    PaperProps: {
                      sx: {
                        borderRadius: 2,
                        mt: 1,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        "& .MuiMenuItem-root": {
                          borderRadius: 1,
                          mx: 0.5,
                          my: 0.25,
                          "&:hover": {
                            backgroundColor: "#e3f2fd",
                          },
                          "&.Mui-selected": {
                            backgroundColor: "#1976d2",
                            color: "#fff",
                            "&:hover": {
                              backgroundColor: "#1565c0",
                            },
                          },
                        },
                      },
                    },
                  },
                }}
              >
                <MenuItem value="">
                  <em>Tất cả lớp học</em>
                </MenuItem>
                {classes.map((cls) => (
                  <MenuItem key={cls._id} value={cls._id}>
                    {cls.class_name} ({cls.academic_year})
                  </MenuItem>
                ))}
              </TextField>
              <ArgonButton
                size="small"
                variant="outlined"
                color="info"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                startIcon={sortOrder === "desc" ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                sx={{
                  minWidth: 160,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  borderWidth: 1.5,
                  "&:hover": {
                    borderWidth: 1.5,
                    backgroundColor: "#e3f2fd",
                    transform: "translateY(-1px)",
                    boxShadow: "0 2px 6px rgba(25, 118, 210, 0.2)",
                  },
                  transition: "all 0.2s ease",
                }}
              >
                {sortOrder === "desc" ? "Mới nhất" : "Cũ nhất"}
              </ArgonButton>
              {(search || filterClass) && (
                <ArgonButton
                  size="small"
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setSearch("");
                    setFilterClass("");
                  }}
                  startIcon={<ClearIcon />}
                  sx={{
                    minWidth: 120,
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 500,
                    borderWidth: 1.5,
                    "&:hover": {
                      borderWidth: 1.5,
                      backgroundColor: "#ffebee",
                      transform: "translateY(-1px)",
                      boxShadow: "0 2px 6px rgba(211, 47, 47, 0.2)",
                    },
                    transition: "all 0.2s ease",
                  }}
                >
                  Xóa bộ lọc
                </ArgonButton>
              )}
            </ArgonBox>
          </CardContent>
        </Card>

        {/* Fees List */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
              Danh sách phí ({filtered.length} phí)
            </ArgonTypography>

            {filtered.length === 0 ? (
              <ArgonBox textAlign="center" py={4}>
                <ArgonTypography variant="body1" color="text">
                  {search || filterClass
                    ? "Không tìm thấy phí nào phù hợp"
                    : "Chưa có dữ liệu phí"}
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
                <col style={{ width: "18%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "25%" }} />
                <col style={{ width: "13%" }} />
                <col style={{ width: "10%" }} />
              </colgroup>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                      Tên phí
                    </ArgonTypography>
                  </TableCell>
                  <TableCell>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                      Mô tả
                    </ArgonTypography>
                  </TableCell>
                  <TableCell>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                      Số tiền
                    </ArgonTypography>
                  </TableCell>
                  <TableCell>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                      Lớp học áp dụng
                    </ArgonTypography>
                  </TableCell>
                  <TableCell>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                      Ngày tạo
                    </ArgonTypography>
                  </TableCell>
                  <TableCell>
                    <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                      Thao tác
                    </ArgonTypography>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((fee) => (
                    <TableRow key={fee._id} hover>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="600" color="#212121">
                          {fee.fee_name || "-"}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" color="#424242">
                          {fee.description || "-"}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#1976d2" sx={{ fontSize: "0.95rem" }}>
                          {formatCurrency(fee.amount)} VNĐ
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        {fee.classes && fee.classes.length > 0 ? (
                          <Box display="flex" flexWrap="wrap" gap={0.5}>
                            {fee.classes.map((cls) => (
                              <Chip
                                key={cls._id}
                                label={`${cls.class_name} (${cls.academic_year})`}
                                size="small"
                                sx={{
                                  backgroundColor: "#e3f2fd",
                                  color: "#1565c0",
                                  border: "1px solid #1976d2",
                                  fontWeight: 500,
                                  "&:hover": {
                                    backgroundColor: "#bbdefb",
                                  },
                                }}
                              />
                            ))}
                          </Box>
                        ) : (
                          <ArgonTypography variant="body2" color="#757575" fontStyle="italic">
                            Chưa áp dụng lớp nào
                          </ArgonTypography>
                        )}
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontSize="0.875rem" color="#424242">
                          {formatDate(fee.createdAt)}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          title="Xem chi tiết"
                          onClick={() => navigate(`/school-admin/fees/${fee._id}`)}
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
                          onClick={() => handleEdit(fee)}
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
                          title="Xóa phí"
                          onClick={() => handleDelete(fee._id, fee.fee_name)}
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
                    <TableCell colSpan={6} align="center">
                      <ArgonTypography variant="body2" color="text">
                        {search || filterClass
                          ? "Không tìm thấy phí nào phù hợp"
                          : "Chưa có dữ liệu phí"}
                      </ArgonTypography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
            )}
          </CardContent>
        </Card>

        <FeeModal
          open={modalOpen}
          onClose={handleModalClose}
          feeData={selectedFee}
          onSuccess={handleSuccess}
        />
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default ManageFees;
