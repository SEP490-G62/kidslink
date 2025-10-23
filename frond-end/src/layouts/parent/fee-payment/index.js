/**
=========================================================
* KidsLink Parent Dashboard - Fee and Payment
=========================================================
*/

// React
import { useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function FeeAndPayment() {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  const fees = [
    {
      id: 1,
      name: "Học phí tháng 12/2024",
      amount: 2500000,
      dueDate: "15/12/2024",
      status: "Chưa thanh toán",
      description: "Học phí chính thức tháng 12"
    },
    {
      id: 2,
      name: "Phí ăn uống tháng 12/2024",
      amount: 800000,
      dueDate: "15/12/2024",
      status: "Chưa thanh toán",
      description: "Phí ăn uống và dinh dưỡng"
    },
    {
      id: 3,
      name: "Phí hoạt động ngoại khóa",
      amount: 500000,
      dueDate: "20/12/2024",
      status: "Chưa thanh toán",
      description: "Phí các hoạt động ngoại khóa tháng 12"
    },
    {
      id: 4,
      name: "Học phí tháng 11/2024",
      amount: 2500000,
      dueDate: "15/11/2024",
      status: "Đã thanh toán",
      description: "Học phí chính thức tháng 11"
    },
    {
      id: 5,
      name: "Phí ăn uống tháng 11/2024",
      amount: 800000,
      dueDate: "15/11/2024",
      status: "Đã thanh toán",
      description: "Phí ăn uống và dinh dưỡng"
    }
  ];

  const paymentMethods = [
    { id: 1, name: "Chuyển khoản ngân hàng", icon: "ni ni-credit-card" },
    { id: 2, name: "Ví điện tử Momo", icon: "ni ni-mobile-button" },
    { id: 3, name: "Ví điện tử ZaloPay", icon: "ni ni-mobile-button" },
    { id: 4, name: "Thanh toán tại trường", icon: "ni ni-shop" }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Đã thanh toán":
        return "success";
      case "Chưa thanh toán":
        return "error";
      case "Quá hạn":
        return "warning";
      default:
        return "default";
    }
  };

  const handlePayment = (fee) => {
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedFee(null);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Học phí & Thanh toán
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Quản lý học phí và thanh toán cho con
          </ArgonTypography>
        </ArgonBox>

        {/* Summary Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-money-coins"
                    color="error"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Tổng nợ
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="error">
                      {formatCurrency(3800000)}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-check-bold"
                    color="success"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Đã thanh toán
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="success">
                      {formatCurrency(3300000)}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-calendar-grid-58"
                    color="warning"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Sắp đến hạn
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="warning">
                      3
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter and Search */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm học phí..."
                InputProps={{
                  startAdornment: (
                    <i className="ni ni-zoom-split-in" style={{ marginRight: 8 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select label="Trạng thái">
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="unpaid">Chưa thanh toán</MenuItem>
                  <MenuItem value="paid">Đã thanh toán</MenuItem>
                  <MenuItem value="overdue">Quá hạn</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Tháng</InputLabel>
                <Select label="Tháng">
                  <MenuItem value="all">Tất cả</MenuItem>
                  <MenuItem value="12">Tháng 12/2024</MenuItem>
                  <MenuItem value="11">Tháng 11/2024</MenuItem>
                  <MenuItem value="10">Tháng 10/2024</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Fees Table */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
              Danh sách học phí
            </ArgonTypography>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tên học phí</TableCell>
                    <TableCell>Số tiền</TableCell>
                    <TableCell>Hạn thanh toán</TableCell>
                    <TableCell>Trạng thái</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell>
                        <ArgonTypography variant="body1" fontWeight="medium" color="dark">
                          {fee.name}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body1" fontWeight="bold" color="dark">
                          {formatCurrency(fee.amount)}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" color="text">
                          {fee.dueDate}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={fee.status}
                          color={getStatusColor(fee.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <ArgonTypography variant="body2" color="text">
                          {fee.description}
                        </ArgonTypography>
                      </TableCell>
                      <TableCell>
                        {fee.status === "Chưa thanh toán" ? (
                          <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() => handlePayment(fee)}
                          >
                            Thanh toán
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            disabled
                          >
                            Đã thanh toán
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog
          open={paymentDialogOpen}
          onClose={handleClosePaymentDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
              Thanh toán học phí
            </ArgonTypography>
          </DialogTitle>
          <DialogContent>
            {selectedFee && (
              <ArgonBox>
                <ArgonBox mb={3}>
                  <ArgonTypography variant="h6" color="dark" mb={1}>
                    {selectedFee.name}
                  </ArgonTypography>
                  <ArgonTypography variant="h4" fontWeight="bold" color="primary" mb={1}>
                    {formatCurrency(selectedFee.amount)}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    Hạn thanh toán: {selectedFee.dueDate}
                  </ArgonTypography>
                </ArgonBox>

                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                  Chọn phương thức thanh toán
                </ArgonTypography>

                <RadioGroup>
                  {paymentMethods.map((method) => (
                    <FormControlLabel
                      key={method.id}
                      value={method.id}
                      control={<Radio />}
                      label={
                        <ArgonBox display="flex" alignItems="center">
                          <i className={method.icon} style={{ marginRight: 8 }} />
                          <ArgonTypography variant="body1">
                            {method.name}
                          </ArgonTypography>
                        </ArgonBox>
                      }
                    />
                  ))}
                </RadioGroup>
              </ArgonBox>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePaymentDialog}>
              Hủy
            </Button>
            <Button variant="contained" color="primary">
              Xác nhận thanh toán
            </Button>
          </DialogActions>
        </Dialog>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default FeeAndPayment;
