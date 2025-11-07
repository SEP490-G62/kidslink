import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, TextField, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import api from "services/api";
import FeeModal from "./FeeModal";

const ManageTuition = () => {
  const [fees, setFees] = useState([]);
  const [feeSearch, setFeeSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchFees = async () => {
    try {
      const res = await api.get("/fees", true);
      const rows = Array.isArray(res) ? res : res.data || [];
      setFees(rows);
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
      setFees((prev) => prev.filter((f) => f._id !== id));
    } catch (e) {
      console.error(e);
      alert("Không thể xoá khoản phí.");
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <ArgonTypography variant="h5" fontWeight="bold" color="white">
            Quản lý học phí
          </ArgonTypography>
        </ArgonBox>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ overflow: "hidden" }}>
              <CardContent>
                <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">Danh sách khoản phí</Typography>
                  <TextField
                    size="small"
                    placeholder="Tìm theo tên khoản phí..."
                    value={feeSearch}
                    onChange={(e) => setFeeSearch(e.target.value)}
                    sx={{ width: 320 }}
                  />
                  <Button variant="contained" onClick={() => { setEditingId(null); setModalOpen(true); }}>+ Tạo học phí</Button>
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
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "9%" }} />
                      <col style={{ width: "10%" }} />
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
                        <TableCell><strong>Trạng thái</strong></TableCell>
                        <TableCell><strong>Thao tác</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(fees || []).filter((f) => (f.fee_name || "").toLowerCase().includes(feeSearch.trim().toLowerCase())).length > 0 ? (
                        (fees || [])
                          .filter((f) => (f.fee_name || "").toLowerCase().includes(feeSearch.trim().toLowerCase()))
                          .map((f) => (
                            <TableRow key={f._id} hover>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>{f.ten_khoan_thu || f.fee_name}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">{f.mo_ta || f.description || ""}</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">{(f.so_tien?.$numberDecimal || f.so_tien || f.amount || 0).toLocaleString()} đ</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" color="text.secondary">
                                  {Array.isArray(f.lop_ids) && f.lop_ids.length > 0
                                    ? f.lop_ids.map((c) => c?.class_name).filter(Boolean).join(', ')
                                    : Array.isArray(f.class_ids) && f.class_ids.length > 0
                                    ? f.class_ids.map((c) => c?.class_name).filter(Boolean).join(', ')
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
                                  <Chip size="small" label={f.bat_buoc ? "Bắt buộc" : "Tuỳ chọn"} sx={{ bgcolor: f.bat_buoc ? '#ef5350' : '#66bb6a', color: '#fff' }} />
                                ) : (
                                  <Typography variant="body2">-</Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  size="small"
                                  label={(() => {
                                    const v = f.trang_thai || 'đang áp dụng';
                                    if (v === 'dang_ap_dung') return 'đang áp dụng';
                                    if (v === 'tam_ngung') return 'tạm ngừng';
                                    if (v === 'ket_thuc' || v === 'ngung') return 'kết thúc';
                                    return v;
                                  })()}
                                  color={(() => {
                                    const v = f.trang_thai;
                                    if (v === 'tam_ngung' || v === 'tạm ngừng') return 'warning';
                                    if (v === 'ket_thuc' || v === 'ngung' || v === 'kết thúc') return 'default';
                                    return 'primary';
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
                          <TableCell colSpan={5} align="center">
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


