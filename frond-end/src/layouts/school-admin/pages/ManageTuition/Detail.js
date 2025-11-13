"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Tooltip,
  Select,
  MenuItem,
  Switch,
  CircularProgress,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import RefreshIcon from "@mui/icons-material/Refresh"
import DashboardLayout from "examples/LayoutContainers/DashboardLayout"
import DashboardNavbar from "examples/Navbars/DashboardNavbar"
import ArgonBox from "components/ArgonBox"
import ArgonTypography from "components/ArgonTypography"
import ArgonButton from "components/ArgonButton"
import api from "services/api"
import { useLocation, useNavigate, useParams } from "react-router-dom"

const ManageTuitionDetail = () => {
  const { feeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const initialFee = location.state?.fee || null

  const [fee, setFee] = useState(initialFee)
  const [classes, setClasses] = useState([])
  const [classesLoading, setClassesLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState(null)
  const [invoices, setInvoices] = useState([])
  const [invoiceLoading, setInvoiceLoading] = useState(false)
  const [classFeeInfo, setClassFeeInfo] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState(null)

  const fetchFeeInfo = async () => {
    try {
      const res = await api.get("/fees", true)
      const rows = Array.isArray(res) ? res : res.data || []
      const found = rows.find((item) => item._id === feeId)
      if (found) {
        setFee(found)
      }
    } catch (err) {
      console.error("Không thể tải thông tin khoản phí:", err)
    }
  }

  const fetchClasses = async (preferredClassId = null) => {
    try {
      setClassesLoading(true)
      const res = await api.get(`/fees/${feeId}/classes`, true)
      const list = Array.isArray(res?.classes) ? res.classes : []
      setClasses(list)
      if (list.length === 0) {
        setSelectedClass(null)
        setInvoices([])
        setClassFeeInfo(null)
        return
      }
      let nextClass = null
      if (preferredClassId) {
        nextClass = list.find((item) => item.class?._id === preferredClassId) || null
      }
      if (!nextClass) {
        nextClass = list[0]
      }
      handleSelectClass(nextClass)
    } catch (err) {
      console.error("Không thể tải danh sách lớp:", err)
    } finally {
      setClassesLoading(false)
    }
  }

  const fetchInvoices = async (classId) => {
    if (!classId) return
    try {
      setInvoiceLoading(true)
      const res = await api.get(`/fees/${feeId}/classes/${classId}/students`, true)
      setClassFeeInfo(res?.classFee || null)
      const invoiceList = Array.isArray(res?.invoices) ? res.invoices : []
      setInvoices(invoiceList)
    } catch (err) {
      console.error("Không thể tải danh sách học sinh:", err)
    } finally {
      setInvoiceLoading(false)
    }
  }

  useEffect(() => {
    if (!fee) {
      fetchFeeInfo()
    }
  }, [feeId])

  useEffect(() => {
    fetchClasses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeId])

  const handleSelectClass = (item) => {
    setSelectedClass(item)
    const classId = item?.class?._id
    if (classId) {
      fetchInvoices(classId)
    } else {
      setInvoices([])
      setClassFeeInfo(null)
    }
  }

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "all") return invoices
    const statusValue = Number(statusFilter)
    return invoices.filter((invoice) => invoice.status === statusValue)
  }, [invoices, statusFilter])

  const handleTogglePaid = async (invoiceId, nextStatus) => {
    if (!invoiceId) return
    try {
      setUpdatingInvoiceId(invoiceId)
      const payload = {
        invoice_ids: [invoiceId],
        status: nextStatus,
      }
      await api.patch(`/fees/${feeId}/invoices`, payload, true)
      const currentClassId = selectedClass?.class?._id || null
      if (currentClassId) {
        await fetchInvoices(currentClassId)
      }
      await fetchClasses(currentClassId)
    } catch (err) {
      console.error("Không thể cập nhật trạng thái học phí:", err)
      alert("Cập nhật thất bại. Vui lòng thử lại.")
    } finally {
      setUpdatingInvoiceId(null)
    }
  }

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0"
    const numberValue = Number(value)
    if (Number.isNaN(numberValue)) return "0"
    return numberValue.toLocaleString("vi-VN")
  }

  const formatDate = (value) => {
    if (!value) return "-"
    return new Date(value).toLocaleDateString("vi-VN")
  }

  const getAvatarSrc = (value) => {
    if (!value) return ""
    if (/^https?:\/\//i.test(value)) return value
    const base = process.env.REACT_APP_API_URL || ""
    if (!base) return value
    return `${base.replace(/\/$/, "")}/${String(value).replace(/^\//, "")}`
  }

  const feeStatus = (fee?.trang_thai || "").toLowerCase()

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3} position="relative" zIndex={3}>
        <ArgonBox mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1.5}>
            <IconButton
              size="small"
              sx={{ color: "white", bgcolor: "rgba(255,255,255,0.15)" }}
              onClick={() => navigate(-1)}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <ArgonTypography variant="h5" fontWeight="bold" color="white">
              Chi tiết khoản phí
            </ArgonTypography>
          </Box>
          <ArgonButton color="info" variant="gradient" size="medium" onClick={fetchClasses}>
            <RefreshIcon fontSize="small" sx={{ mr: 0.5 }} />
            Làm mới
          </ArgonButton>
        </ArgonBox>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card sx={{ mb: 1.5 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="h6">{fee?.ten_khoan_thu || fee?.fee_name || "Khoản phí"}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {fee?.mo_ta || fee?.description || "Không có mô tả"}
                    </Typography>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      <Chip size="small" color="info" label={`Năm học: ${fee?.nam_hoc || "-"}`} />
                      <Chip size="small" color="primary" label={`Hạn nộp: ${formatDate(fee?.han_nop)}`} />
                      <Chip
                        size="small"
                        color="secondary"
                        label={`Số tiền: ${formatCurrency(fee?.so_tien?.$numberDecimal || fee?.so_tien || 0)} đ`}
                      />
                      <Chip
                        size="small"
                        color={
                          feeStatus.includes("dang")
                            ? "primary"
                            : feeStatus.includes("tam")
                              ? "warning"
                              : feeStatus.includes("ket")
                                ? "default"
                                : "info"
                        }
                        label={fee?.trang_thai || "đang áp dụng"}
                      />
                    </Box>
                  </Box>
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      Tổng lớp áp dụng: {classes.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Tổng học sinh: {classes.reduce((acc, item) => acc + (item.stats?.total || 0), 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Đã thu: {classes.reduce((acc, item) => acc + (item.stats?.paid || 0), 0)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box mb={2} display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="subtitle1" fontWeight={600}>
                    Lớp áp dụng
                  </Typography>
                  {classesLoading && (
                    <Typography variant="caption" color="text.secondary">
                      Đang tải...
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Box display="flex" flexDirection="column" gap={1.5} maxHeight={480} overflow="auto">
                  {classes.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Chưa có lớp áp dụng khoản phí này.
                    </Typography>
                  ) : (
                    classes.map((item) => {
                      const isActive = selectedClass?._id === item._id
                      const stats = item.stats || {}
                      return (
                        <Card
                          key={item._id}
                          variant={isActive ? "outlined" : "elevation"}
                          sx={{
                            cursor: "pointer",
                            borderColor: isActive ? "primary.main" : "transparent",
                            transition: "all 0.2s",
                            "&:hover": { boxShadow: 3 },
                          }}
                          onClick={() => handleSelectClass(item)}
                        >
                          <CardContent sx={{ py: 1.5 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="subtitle2" fontWeight={600}>
                                {item.class?.class_name || "Không rõ lớp"}
                              </Typography>
                              <Chip label={formatDate(item.due_date)} size="small" color="primary" variant="outlined" />
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Năm học: {item.class?.academic_year || "-"}
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                              <Chip size="small" label={`Tổng: ${stats.total || 0}`} />
                              <Chip size="small" color="success" label={`Đã thu: ${stats.paid || 0}`} />
                              <Chip size="small" color="warning" label={`Chờ thu: ${stats.pending || 0}`} />
                              <Chip size="small" color="error" label={`Quá hạn: ${stats.overdue || 0}`} />
                            </Box>
                          </CardContent>
                        </Card>
                      )
                    })
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1.5}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {selectedClass?.class?.class_name
                        ? `Danh sách học sinh - ${selectedClass.class.class_name}`
                        : "Danh sách học sinh"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {classFeeInfo?.due_date
                        ? `Hạn nộp: ${formatDate(classFeeInfo.due_date)}`
                        : "Chọn lớp để xem chi tiết"}
                    </Typography>
                  </Box>
                  <Select
                    size="small"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="all">Tất cả trạng thái</MenuItem>
                    <MenuItem value={0}>Chờ thu</MenuItem>
                    <MenuItem value={1}>Đã thu</MenuItem>
                    <MenuItem value={2}>Quá hạn</MenuItem>
                  </Select>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                  <Table
                    sx={{
                      tableLayout: "fixed",
                      width: "100%",
                      "& .MuiTableCell-root": {
                        padding: "8px 12px",
                        verticalAlign: "middle",
                      },
                      "& .MuiTableCell-head": {
                        fontWeight: 700,
                        color: "text.primary",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        backgroundColor: "#fafafa",
                        whiteSpace: "nowrap",
                      },
                    }}
                  >
                    <colgroup>
                      <col style={{ width: "40%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "25%" }} />
                    </colgroup>

                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: "40%" }}>Học sinh</TableCell>
                        <TableCell sx={{ width: "20%" }} align="right">
                          Số tiền
                        </TableCell>
                        <TableCell sx={{ width: "15%" }} align="right">
                          Giảm trừ
                        </TableCell>
                        <TableCell sx={{ width: "25%" }} align="right">
                          Thanh toán
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {invoiceLoading ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              Đang tải dữ liệu...
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : filteredInvoices.length > 0 ? (
                        filteredInvoices.map((invoice) => (
                          <TableRow key={invoice._id} hover>
                            {/* Học sinh */}
                            <TableCell sx={{ width: "40%", overflow: "hidden" }}>
                              <Box display="flex" alignItems="center" gap={1.5} minWidth={0}>
                                <Avatar
                                  src={getAvatarSrc(invoice.student?.avatar_url)}
                                  alt={invoice.student?.full_name || ""}
                                  sx={{ width: 36, height: 36, flexShrink: 0 }}
                                />
                                <Box overflow="hidden">
                                  <Typography variant="body2" fontWeight={600} noWrap>
                                    {invoice.student?.full_name || "Không rõ"}
                                  </Typography>
                                  {invoice.student?.code && (
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                      {invoice.student.code}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>

                            {/* Số tiền */}
                            <TableCell sx={{ width: "20%" }} align="right">
                              <Typography variant="body2">{formatCurrency(invoice.amount_due)} đ</Typography>
                            </TableCell>

                            {/* Giảm trừ */}
                            <TableCell sx={{ width: "15%" }} align="right">
                              <Typography variant="body2" color="text.secondary">
                                {invoice.discount ? `${invoice.discount.toLocaleString("vi-VN")} đ` : "0 đ"}
                              </Typography>
                            </TableCell>

                            {/* Thanh toán */}
                            <TableCell sx={{ width: "25%", overflow: "hidden" }} align="right">
                              <Box display="inline-flex" alignItems="center" justifyContent="flex-end" gap={1.5}>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  color={invoice.status === 1 ? "success.main" : "error.main"}
                                  sx={{ whiteSpace: "nowrap" }}
                                >
                                  {invoice.status === 1 ? "Đã thu" : "Chưa thu"}
                                </Typography>

                                <Tooltip
                                  title={invoice.status === 1 ? "Bỏ đánh dấu đã thu" : "Đánh dấu đã thu"}
                                  placement="left"
                                >
                                  <Box position="relative" display="inline-flex">
                                    <Switch
                                      size="small"
                                      color="success"
                                      checked={invoice.status === 1}
                                      disabled={updatingInvoiceId === invoice._id}
                                      onChange={(e) => handleTogglePaid(invoice._id, e.target.checked ? 1 : 0)}
                                    />
                                    {updatingInvoiceId === invoice._id && (
                                      <CircularProgress
                                        size={18}
                                        sx={{
                                          position: "absolute",
                                          top: "50%",
                                          left: "50%",
                                          transform: "translate(-50%, -50%)",
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">
                              {selectedClass ? "Chưa có học sinh nào" : "Chọn lớp để xem danh sách học sinh"}
                            </Typography>
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
      </ArgonBox>
    </DashboardLayout>
  )
}

export default ManageTuitionDetail
