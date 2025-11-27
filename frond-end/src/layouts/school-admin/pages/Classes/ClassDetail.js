import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  Grid,
  Card,
  CardContent,
  Divider,
  IconButton,
  Box,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import EditIcon from "@mui/icons-material/Edit";
import ClassIcon from "@mui/icons-material/Class";
import PersonIcon from "@mui/icons-material/Person";
import GroupIcon from "@mui/icons-material/Group";
import SchoolIcon from "@mui/icons-material/School";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import api from "services/api";
import TransferClassModal from "./TransferClassModal";
import ClassModal from "./ClassModal";

const infoColor = "#11cdef";
const infoHoverColor = "rgba(17, 205, 239, 0.12)";

const ClassDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  useEffect(() => {
    fetchClassDetail();
  }, [id]);

  const fetchClassDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      // Lấy thông tin lớp
      const classRes = await api.get(`/classes/${id}`, true);
      if (classRes.success && classRes.data) {
        setClassInfo(classRes.data);
      } else {
        setError("Không tìm thấy thông tin lớp học");
      }

      // Lấy danh sách học sinh
      const studentsRes = await api.get(`/student/class/${id}`, true);
      setStudents(studentsRes.students || []);
    } catch (error) {
      console.error("Lỗi khi tải thông tin lớp:", error);
      setError(error.message || "Không thể tải thông tin lớp. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const formatDateTime = (dateString) => {
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

  const handleEdit = () => {
    setEditModalOpen(true);
  };

  const handleEditModalClose = () => {
    setEditModalOpen(false);
  };

  const handleEditSuccess = () => {
    fetchClassDetail();
  };

  const getGenderText = (gender) => {
    if (gender === 1 || gender === "female") return "Nữ";
    if (gender === 0 || gender === "male") return "Nam";
    return "-";
  };

  const getStatusChip = (status) => {
    if (status === 1) {
      return <Chip label="Hoạt động" color="success" size="small" />;
    }
    return <Chip label="Không hoạt động" color="error" size="small" />;
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
          <ArgonButton onClick={() => navigate("/school-admin/classes")} color="info">
            Quay lại danh sách
          </ArgonButton>
        </ArgonBox>
        <Footer />
      </DashboardLayout>
    );
  }

  if (!classInfo) {
    return null;
  }

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 1).length;

  return (
    <DashboardLayout>
      <DashboardNavbar 
        breadcrumbOverride={classInfo ? {
          route: ['school-admin', 'classes', classInfo.class_name || id],
          title: classInfo.class_name || 'Chi tiết lớp học'
        } : undefined}
      />
      <ArgonBox py={3}>
        {/* Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              display="flex"
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
              flexWrap="wrap"
              gap={2}
            >
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton
                  onClick={() => navigate("/school-admin/classes")}
                  sx={{
                    color: infoColor,
                    "&:hover": {
                      backgroundColor: infoHoverColor,
                    },
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Stack spacing={0.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <ClassIcon sx={{ fontSize: 32, color: infoColor }} />
                    <ArgonTypography variant="h4" fontWeight="bold" letterSpacing={0.2}>
                      {classInfo.class_name || "Chi tiết lớp học"}
                    </ArgonTypography>
                  </Stack>
                  <ArgonTypography variant="body2" color="text">
                    Quản lý lớp học và danh sách học sinh
                  </ArgonTypography>
                </Stack>
              </Stack>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
              >
                <Chip
                  icon={<GroupIcon sx={{ color: infoColor }} />}
                  label={`${totalStudents} học sinh`}
                  variant="outlined"
                  sx={{
                    borderColor: infoColor,
                    color: infoColor,
                    "& .MuiChip-icon": {
                      color: infoColor,
                    },
                  }}
                />
                <ArgonButton
                  color="info"
                  size="medium"
                  onClick={handleEdit}
                  variant="contained"
                  startIcon={<EditIcon />}
                  sx={{
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                  }}
                >
                  Chỉnh sửa
                </ArgonButton>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                  Thông tin lớp học
                </ArgonTypography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ArgonTypography variant="body2" color="text" fontWeight="bold" mb={0.5}>
                      Mô tả
                    </ArgonTypography>
                    <ArgonTypography variant="body1" color="#424242">
                      Lớp {classInfo.class_name} - {classInfo.class_age_id?.age_name || "-"} - Năm học {classInfo.academic_year || "-"}
                    </ArgonTypography>
                    <Divider sx={{ my: 2 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Tên lớp
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#212121">
                        {classInfo.class_name || "-"}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Khối tuổi
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#424242">
                        {classInfo.class_age_id?.age_name || "-"}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Năm học
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#424242">
                        {classInfo.academic_year || "-"}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Ngày bắt đầu
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#424242">
                        {formatDate(classInfo.start_date)}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Ngày kết thúc
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#424242">
                        {formatDate(classInfo.end_date)}
                      </ArgonTypography>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={0.5}>
                      <ArgonTypography variant="body2" color="text" fontWeight="bold">
                        Giáo viên chính
                      </ArgonTypography>
                      <ArgonTypography variant="body1" color="#212121">
                        {classInfo.teacher_id?.user_id?.full_name || "-"}
                      </ArgonTypography>
                      {classInfo.teacher_id?.user_id?.email && (
                        <ArgonTypography variant="caption" color="text">
                          {classInfo.teacher_id.user_id.email}
                        </ArgonTypography>
                      )}
                    </Stack>
                  </Grid>
                  {classInfo.teacher_id2 && (
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={0.5}>
                        <ArgonTypography variant="body2" color="text" fontWeight="bold">
                          Giáo viên phụ
                        </ArgonTypography>
                        <ArgonTypography variant="body1" color="#212121">
                          {classInfo.teacher_id2?.user_id?.full_name || "-"}
                        </ArgonTypography>
                        {classInfo.teacher_id2?.user_id?.email && (
                          <ArgonTypography variant="caption" color="text">
                            {classInfo.teacher_id2.user_id.email}
                          </ArgonTypography>
                        )}
                      </Stack>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                  Thống kê nhanh
                </ArgonTypography>
                <Stack spacing={3}>
                  <Box>
                    <ArgonTypography variant="body2" color="text" fontWeight="bold" mb={0.5}>
                      Tổng số học sinh
                    </ArgonTypography>
                    <ArgonTypography variant="h4" color={infoColor} fontWeight="bold">
                      {totalStudents}
                    </ArgonTypography>
                  </Box>
                  <Divider />
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <ArgonTypography variant="body2" color="text">
                        Học sinh hoạt động
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold">
                        {activeStudents}
                      </ArgonTypography>
                    </Box>
                    <Chip
                      label="Đang học"
                      size="small"
                      sx={{
                        backgroundColor: infoHoverColor,
                        color: infoColor,
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <ArgonTypography variant="body2" color="text">
                        Học sinh không hoạt động
                      </ArgonTypography>
                      <ArgonTypography variant="h5" fontWeight="bold" color="#d32f2f">
                        {totalStudents - activeStudents}
                      </ArgonTypography>
                    </Box>
                    <Chip
                      label="Nghỉ học"
                      size="small"
                      sx={{
                        backgroundColor: "#fdecea",
                        color: "#d32f2f",
                        fontWeight: 600,
                      }}
                    />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Students Information */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <SchoolIcon sx={{ color: infoColor }} />
                <ArgonTypography variant="h6" fontWeight="bold">
                  Danh sách học sinh ({totalStudents})
                </ArgonTypography>
              </Stack>
              <ArgonTypography variant="body2" color="text">
                Quản lý và chuyển lớp cho học sinh
              </ArgonTypography>
            </Box>
            {students.length > 0 ? (
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
                    <col style={{ width: "5%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "10%" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "13%" }} />
                  </colgroup>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          STT
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Ảnh đại diện
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Họ và tên
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Ngày sinh
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Giới tính
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Dị ứng
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" fontWeight="bold" color="#ffffff">
                          Trạng thái
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
                    {students.map((student, index) => (
                      <TableRow key={student._id} hover>
                        <TableCell>
                          <ArgonTypography variant="body2" color="#424242">
                            {index + 1}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          <Avatar
                            src={student.avatar_url}
                            alt={student.full_name}
                            sx={{ width: 40, height: 40 }}
                          >
                            {student.full_name?.charAt(0)?.toUpperCase()}
                          </Avatar>
                        </TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2" fontWeight="600" color="#212121">
                            {student.full_name || "-"}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2" color="#424242">
                            {formatDate(student.dob)}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2" color="#424242">
                            {getGenderText(student.gender)}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          <ArgonTypography variant="body2" color={student.allergy ? "#424242" : "#757575"}>
                            {student.allergy || "Không có"}
                          </ArgonTypography>
                        </TableCell>
                        <TableCell>
                          {getStatusChip(student.status)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            title="Chuyển lớp"
                            onClick={() => {
                              setSelectedStudent(student);
                              setTransferModalOpen(true);
                            }}
                            sx={{
                              color: "#1976d2",
                              "&:hover": {
                                backgroundColor: "#e3f2fd",
                              },
                            }}
                          >
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: "#fafafa",
                  border: "2px dashed #e0e0e0",
                  textAlign: "center",
                }}
              >
                <ArgonTypography variant="body1" color="#9e9e9e" fontStyle="italic">
                  Lớp học chưa có học sinh nào
                </ArgonTypography>
              </Box>
            )}
          </CardContent>
        </Card>

        <ClassModal
          open={editModalOpen}
          onClose={handleEditModalClose}
          classData={classInfo}
          onSuccess={handleEditSuccess}
        />

        <TransferClassModal
          open={transferModalOpen}
          onClose={() => {
            setTransferModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          currentClassId={id}
          onSuccess={() => {
            fetchClassDetail();
          }}
        />
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
};

export default ClassDetail;

