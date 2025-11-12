import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  FormControl,
  MenuItem,
  Select,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import api from "services/api";
import FeeModal from "./FeeModal";

const ManageTuition = () => {
  const [fees, setFees] = useState([]);
  const [feeSearch, setFeeSearch] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("all");
  const [availableSchoolYears, setAvailableSchoolYears] = useState([]);
  const [schoolYearOpen, setSchoolYearOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchFees = async () => {
    try {
      const res = await api.get("/fees", true);
      const rows = Array.isArray(res) ? res : res.data || [];
      setFees(rows);
      const years = Array.from(
        new Set(
          rows
            .map((item) => item.nam_hoc || item.school_year || item.schoolYear)
            .filter(Boolean)
        )
      ).sort((a, b) => b.localeCompare(a));
      setAvailableSchoolYears(years);
      if (schoolYearFilter !== "all" && !years.includes(schoolYearFilter)) {
        setSchoolYearFilter("all");
      }
    } catch (e) {
      console.error("Lỗi khi tải danh sách khoản phí:", e);
    }
  };

  useEffect(() => {
    fetchFees();
  }, []);

  const handleEdit = (fee) => {
    setEditingId(fee._id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn chắc chắn muốn xoá khoản phí này?")) return;
    try {
      await api.delete(`/fees/${id}`, true);
      setFees((prev) => {
        const updated = prev.filter((f) => f._id !== id);
        const years = Array.from(
          new Set(
            updated
              .map((item) => item.nam_hoc || item.school_year || item.schoolYear)
              .filter(Boolean)
          )
        ).sort((a, b) => b.localeCompare(a));
        setAvailableSchoolYears(years);
        if (schoolYearFilter !== "all" && !years.includes(schoolYearFilter)) {
          setSchoolYearFilter("all");
        }
        return updated;
      });
    } catch (e) {
      console.error(e);
      alert("Không thể xoá khoản phí.");
    }
  };

  const normalizedSearch = feeSearch.trim().toLowerCase();
  const filteredFees = (fees || []).filter((fee) => {
    const name = (fee.ten_khoan_thu || fee.fee_name || fee.name || "").toLowerCase();
    const matchesSearch = name.includes(normalizedSearch);
    const year = fee.nam_hoc || fee.school_year || fee.schoolYear;
    const matchesYear = schoolYearFilter === "all" ? true : year === schoolYearFilter;
    return matchesSearch && matchesYear;
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold" color="white">
            Quản lý học phí
          </ArgonTypography>
          <ArgonButton color="info" size="medium" onClick={() => { setEditingId(null); setModalOpen(true); }} variant="gradient">
            + Tạo học phí
          </ArgonButton>
        </ArgonBox>

        <ArgonBox mb={2} display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <TextField
            size="small"
            placeholder="Tìm theo tên khoản phí..."
            value={feeSearch}
            onChange={(e) => setFeeSearch(e.target.value)}
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
            InputLabelProps={{ shrink: false }}
          />
          <Box display="flex" alignItems="center" gap={0.5}>
            <Select
              size="small"
              value={schoolYearFilter}
              onChange={(e) => setSchoolYearFilter(e.target.value)}
              displayEmpty
              open={schoolYearOpen}
              onOpen={() => setSchoolYearOpen(true)}
              onClose={() => setSchoolYearOpen(false)}
              sx={{
                width: 180,
                backgroundColor: "white",
                borderRadius: 1,
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
                "& .MuiSelect-icon": { display: "none" },
              }}
              renderValue={(selected) => {
                if (selected === "all" || !selected) {
                  return "Năm học";
                }
                return selected;
              }}
            >
              <MenuItem value="all">Năm học</MenuItem>
              {availableSchoolYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
            <IconButton size="small" onClick={() => setSchoolYearOpen(!schoolYearOpen)} sx={{ backgroundColor: "white", color: "text.main", minWidth: 32, height: 32 }}>
              {schoolYearOpen ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          </Box>
        </ArgonBox>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ overflow: "hidden" }}>
              <CardContent>
                <Box mb={2}>
                  <Typography variant="h6">Danh sách khoản phí</Typography>
                </Box>

                <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                  <Table
                    sx={{
                      tableLayout: "fixed",
                      width: "100%",
                      "& .MuiTableHead-root": { display: "table-header-group !important", padding: 0 },
                      "& .MuiTableCell-root": { padding: "12px 16px", verticalAlign: "middle" },
                    }}
                  >
                    <colgroup>
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "19%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "13%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "6%" }} />
                    </colgroup>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Tên</strong></TableCell>
                        <TableCell><strong>Mô tả</strong></TableCell>
                        <TableCell><strong>Số tiền</strong></TableCell>
                        <TableCell><strong>Lớp</strong></TableCell>
                        <TableCell><strong>Hạn nộp</strong></TableCell>
                        <TableCell><strong>Bắt buộc</strong></TableCell>
                        <TableCell><strong>Năm học</strong></TableCell>
                        <TableCell><strong>Trạng thái</strong></TableCell>
                        <TableCell><strong>Thao tác</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredFees.length > 0 ? (
                        filteredFees.map((f) => (
                          <TableRow key={f._id} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>{f.ten_khoan_thu || f.fee_name}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{f.mo_ta || f.description || ""}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {(() => {
                                  const amount = f.so_tien?.$numberDecimal ?? f.so_tien ?? f.amount ?? 0;
                                  const numericAmount = typeof amount === "string" ? Number(amount) : amount;
                                  return (numericAmount || 0).toLocaleString();
                                })()}{" "}
                                đ
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {Array.isArray(f.lop_ids) && f.lop_ids.length > 0
                                  ? f.lop_ids.map((c) => c?.class_name || c).filter(Boolean).join(", ")
                                  : Array.isArray(f.class_ids) && f.class_ids.length > 0
                                  ? f.class_ids.map((c) => c?.class_name || c).filter(Boolean).join(", ")
                                  : "-"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {f.han_nop ? new Date(f.han_nop).toLocaleDateString() : "-"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {f.bat_buoc !== undefined ? (
                                <Chip size="small" label={f.bat_buoc ? "Bắt buộc" : "Tuỳ chọn"} sx={{ bgcolor: f.bat_buoc ? "#ef5350" : "#66bb6a", color: "#fff" }} />
                              ) : (
                                <Typography variant="body2">-</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {f.nam_hoc || f.school_year || f.schoolYear || "-"}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={(() => {
                                  const v = f.trang_thai || "đang áp dụng";
                                  if (v === "dang_ap_dung") return "đang áp dụng";
                                  if (v === "tam_ngung") return "tạm ngừng";
                                  if (v === "ket_thuc" || v === "ngung") return "kết thúc";
                                  if (v === "da_hoan_thanh") return "đã hoàn thành";
                                  if (v === "chua_ap_dung") return "chưa áp dụng";
                                  return v;
                                })()}
                                color={(() => {
                                  const v = f.trang_thai;
                                  if (v === "tam_ngung" || v === "tạm ngừng") return "warning";
                                  if (v === "ket_thuc" || v === "ngung" || v === "kết thúc") return "default";
                                  if (v === "da_hoan_thanh") return "success";
                                  if (v === "chua_ap_dung") return "secondary";
                                  return "primary";
                                })()}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Box display="inline-flex" gap={0.5}>
                                <IconButton size="small" color="primary" title="Chỉnh sửa" onClick={() => handleEdit(f)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" color="error" title="Xoá" onClick={() => handleDelete(f._id)}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            <Typography variant="body2" color="text.secondary">Chưa có khoản phí</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <FeeModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setEditingId(null); }}
          feeData={editingId ? fees.find((f) => f._id === editingId) : null}
          onSuccess={fetchFees}
        />
      </ArgonBox>
    </DashboardLayout>
  );
};

export default ManageTuition;


