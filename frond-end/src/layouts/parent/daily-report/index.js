/**
=========================================================
* KidsLink Parent Dashboard - Daily Report
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Footer from "examples/Footer";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import { useEffect, useState, useRef } from 'react';
import { useAuth } from 'context/AuthContext';
import parentService from 'services/parentService';
import Pagination from '@mui/material/Pagination';

function DailyReport() {
  const { selectedChild } = useAuth();
  const [dailyReports, setDailyReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 5;
  const fromDateInputRef = useRef(null);
  const toDateInputRef = useRef(null);

  useEffect(() => {
    const fetchReports = async () => {
      if (!selectedChild?._id) return;
      const res = await parentService.getDailyReports(selectedChild._id);
      if (res && res.success !== false) {
        const data = res.data?.data || res.data || [];
        setDailyReports(data);
        setFilteredReports(data);
      } else {
        setDailyReports([]);
        setFilteredReports([]);
      }
    };
    fetchReports();
  }, [selectedChild]);

  // Filter reports based on date range
  useEffect(() => {
    if (!fromDate && !toDate) {
      setFilteredReports(dailyReports);
    } else {
      const filtered = dailyReports.filter((report) => {
        const reportDate = new Date(report.report_date);
        reportDate.setHours(0, 0, 0, 0);

        if (fromDate && toDate) {
          const from = new Date(fromDate);
          const to = new Date(toDate);
          from.setHours(0, 0, 0, 0);
          to.setHours(23, 59, 59, 999);
          return reportDate >= from && reportDate <= to;
        } else if (fromDate) {
          const from = new Date(fromDate);
          from.setHours(0, 0, 0, 0);
          return reportDate >= from;
        } else if (toDate) {
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999);
          return reportDate <= to;
        }
        return true;
      });
      setFilteredReports(filtered);
    }
    setCurrentPage(1); // Reset to first page when filter changes
  }, [fromDate, toDate, dailyReports]);

  const handleClearFilter = () => {
    setFromDate('');
    setToDate('');
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentReports = filteredReports.slice(startIndex, endIndex);

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Báo cáo hàng ngày
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Theo dõi hoạt động hàng ngày của con
          </ArgonTypography>
        </ArgonBox>

        {/* Filter */}
        <ArgonBox mb={3}>
          <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
            <CardContent sx={{ p: 2 }}>
              <ArgonBox display="flex" gap={3} alignItems="flex-end" flexWrap="wrap">
                <ArgonBox display="flex" flexDirection="column" gap={1} minWidth="200px">
                  <ArgonTypography variant="caption" color="text" fontWeight="medium" display="flex" alignItems="center" gap={0.5}>
                    <i className="ni ni-calendar-grid-58" style={{ fontSize: 16, color: '#344767' }} />
                    Từ ngày
                  </ArgonTypography>
                  <TextField
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        fontSize: 14,
                        cursor: "pointer",
                      },
                      "& .MuiOutlinedInput-input": {
                        cursor: "pointer",
                      },
                    }}
                    inputRef={fromDateInputRef}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          edge="end"
                          tabIndex={-1}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => fromDateInputRef.current?.showPicker?.()}
                        >
                          {/* <i className="ni ni-calendar-grid-58" style={{ fontSize: 16 }} /> */}
                        </IconButton>
                      ),
                    }}
                    InputLabelProps={{ shrink: false }}
                  />
                </ArgonBox>
                
                <ArgonBox display="flex" flexDirection="column" gap={1} minWidth="200px">
                  <ArgonTypography variant="caption" color="text" fontWeight="medium" display="flex" alignItems="center" gap={0.5}>
                    <i className="ni ni-calendar-grid-58" style={{ fontSize: 16, color: '#344767' }} />
                    Đến ngày
                  </ArgonTypography>
                  <TextField
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    size="small"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        fontSize: 14,
                        cursor: "pointer",
                      },
                      "& .MuiOutlinedInput-input": {
                        cursor: "pointer",
                      },
                    }}
                    inputRef={toDateInputRef}
                    InputProps={{
                      endAdornment: (
                        <IconButton
                          size="small"
                          edge="end"
                          tabIndex={-1}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => toDateInputRef.current?.showPicker?.()}
                        >
                          {/* <i className="ni ni-calendar-grid-58" style={{ fontSize: 16 }} /> */}
                        </IconButton>
                      ),
                    }}
                    InputLabelProps={{ shrink: false }}
                  />
                </ArgonBox>
                <Button
                  variant="outlined"
                  onClick={handleClearFilter}
                  disabled={!fromDate && !toDate}
                  startIcon={<i className="ni ni-fat-remove" />}
                  size="small"
                  sx={{
                    minWidth: 110,
                    fontWeight: "bold",
                    color: "#111111",
                    borderColor: "#111111",
                    borderWidth: 1.5,
                    backgroundColor: "#ffffff",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: "#000000",
                      backgroundColor: "#f5f5f5",
                    },
                    "&.Mui-disabled": {
                      color: "rgba(0,0,0,0.3)",
                      borderColor: "rgba(0,0,0,0.2)",
                    },
                  }}
                >
                  Xóa
                </Button>

              </ArgonBox>

            </CardContent>
          </Card>
        </ArgonBox>

        {/* Reports List */}
        <Grid container spacing={2}>
          {currentReports.length === 0 ? (
            <Grid item xs={12}>
              <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <i className="ni ni-calendar-grid-58" style={{ fontSize: 48, color: '#e0e0e0', marginBottom: 16 }} />
                  <ArgonTypography variant="h6" color="text" fontWeight="medium" mb={1}>
                    Không có báo cáo nào
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    {(fromDate || toDate) ? 'trong khoảng thời gian đã chọn' : 'cho con của bạn'}
                  </ArgonTypography>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            currentReports.map((report) => (
            <Grid item xs={12} key={report._id}>
              <Card sx={{ borderRadius: 2, boxShadow: 1, '&:hover': { boxShadow: 3 } }}>
                <CardContent sx={{ p: 2 }}>
                  {/* Header: Child + Date */}
                  <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <ArgonBox display="flex" alignItems="center">
                      <Avatar
                        src={selectedChild?.avatar_url || ''}
                        alt={selectedChild?.full_name || ''}
                        sx={{ width: 40, height: 40, mr: 1.5 }}
                      />
                      <ArgonBox>
                        <ArgonTypography variant="subtitle1" fontWeight="bold" color="dark">
                          {selectedChild?.full_name}
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="text" display="flex" alignItems="center">
                          <i className="ni ni-calendar-grid-58" style={{ fontSize: 12, marginRight: 4 }} />
                          {new Date(report.report_date).toLocaleDateString('vi-VN')}
                        </ArgonTypography>
                      </ArgonBox>
                    </ArgonBox>
                  </ArgonBox>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Checkin / Checkout section */}
                  <Grid container spacing={2} mb={1.5}>
                    <Grid item xs={12} md={6}>
                      <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                        <i className="ni ni-time-alarm" style={{ fontSize: 16, color: '#2196f3' }} />
                        <ArgonTypography variant="body2" fontWeight="bold" color="dark">
                          Đến lớp
                        </ArgonTypography>
                      </ArgonBox>
                      <ArgonBox display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={report.checkin_time || '--:--'} 
                          color="info" 
                          size="small" 
                          icon={<i className="ni ni-time-alarm" />}
                        />
                        {report.teacher_checkin_id?.user_id?.full_name && (
                          <ArgonTypography variant="caption" color="text">
                            • {report.teacher_checkin_id.user_id.full_name}
                          </ArgonTypography>
                        )}
                      </ArgonBox>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                        <i className="ni ni-time-alarm" style={{ fontSize: 16, color: '#4caf50' }} />
                        <ArgonTypography variant="body2" fontWeight="bold" color="dark">
                          Về nhà
                        </ArgonTypography>
                      </ArgonBox>
                      <ArgonBox display="flex" alignItems="center" gap={1}>
                        <Chip 
                          label={report.checkout_time ? report.checkout_time : 'Chưa về'} 
                          color={report.checkout_time ? 'success' : 'warning'} 
                          size="small"
                          icon={<i className="ni ni-time-alarm" />}
                        />
                        {report.teacher_checkout_id?.user_id?.full_name && (
                          <ArgonTypography variant="caption" color="text">
                            • {report.teacher_checkout_id.user_id.full_name}
                          </ArgonTypography>
                        )}
                      </ArgonBox>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Comments */}
                  <ArgonBox>
                    <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                      <i className="ni ni-single-copy-04" style={{ fontSize: 16, color: '#ff9800' }} />
                      <ArgonTypography variant="body2" fontWeight="bold" color="dark">
                        Ghi chú
                      </ArgonTypography>
                    </ArgonBox>
                    <ArgonTypography variant="body2" color="text" sx={{ pl: 2 }}>
                      {report.comments && report.comments.trim() !== '' ? report.comments : 'Không có ghi chú'}
                    </ArgonTypography>
                  </ArgonBox>
                </CardContent>
                {/* Health Notices */}
                {Array.isArray(report.health_notices) && report.health_notices.length > 0 && (
                  <CardContent sx={{ p: 2, pt: 0 }}>
                    <ArgonBox display="flex" alignItems="center" gap={1} mb={1.5}>
                      <i className="ni ni-favourite-28" style={{ fontSize: 18, color: '#f44336' }} />
                      <ArgonTypography variant="subtitle2" fontWeight="bold" color="error">
                        Thông báo sức khỏe
                      </ArgonTypography>
                    </ArgonBox>
                    <ArgonBox sx={{ pl: 2 }}>
                      {report.health_notices.map((hn, index) => (
                        <ArgonBox key={hn._id} mb={1.5} p={1.5} sx={{ bgcolor: '#fff3e0', borderRadius: 1, border: '1px solid #ffcc02' }}>
                          <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                            <i className="ni ni-favourite-28" style={{ fontSize: 14, color: '#f44336' }} />
                            <ArgonTypography variant="body2" fontWeight="bold" color="error">
                              Triệu chứng
                            </ArgonTypography>
                          </ArgonBox>
                          <ArgonTypography variant="body2" color="text" sx={{ pl: 2, mb: 0.5 }}>
                            {hn.symptoms}
                          </ArgonTypography>
                          
                          <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                            <i className="ni ni-caps-small" style={{ fontSize: 14, color: '#2196f3' }} />
                            <ArgonTypography variant="body2" fontWeight="bold" color="info">
                              Thuốc đã dùng
                            </ArgonTypography>
                          </ArgonBox>
                          <ArgonTypography variant="body2" color="text" sx={{ pl: 2, mb: 0.5 }}>
                            {hn.medications}
                          </ArgonTypography>
                          
                          <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                            <i className="ni ni-settings-gear-65" style={{ fontSize: 14, color: '#ff9800' }} />
                            <ArgonTypography variant="body2" fontWeight="bold" color="warning">
                              Hành động
                            </ArgonTypography>
                          </ArgonBox>
                          <ArgonTypography variant="body2" color="text" sx={{ pl: 2, mb: 0.5 }}>
                            {hn.actions_taken}
                          </ArgonTypography>
                          
                          {hn.note && (
                            <>
                              <ArgonBox display="flex" alignItems="center" gap={1} mb={0.5}>
                                <i className="ni ni-single-copy-04" style={{ fontSize: 14, color: '#9c27b0' }} />
                                <ArgonTypography variant="body2" fontWeight="bold" color="secondary">
                                  Ghi chú
                                </ArgonTypography>
                              </ArgonBox>
                              <ArgonTypography variant="body2" color="text" sx={{ pl: 2, mb: 0.5 }}>
                                {hn.note}
                              </ArgonTypography>
                            </>
                          )}
                          
                          <ArgonBox display="flex" alignItems="center" gap={1}>
                            <i className="ni ni-ambulance" style={{ fontSize: 14, color: '#4caf50' }} />
                            <ArgonTypography variant="body2" fontWeight="bold" color="success">
                              Y tá: {hn.health_care_staff_id?.user_id?.full_name || 'Chưa xác định'}
                            </ArgonTypography>
                          </ArgonBox>
                        </ArgonBox>
                      ))}
                    </ArgonBox>
                  </CardContent>
                )}
              </Card>
            </Grid>
            ))
          )}
        </Grid>

        {/* Pagination */}
        {totalPages > 1 && (
          <ArgonBox display="flex" justifyContent="center" alignItems="center" gap={1.5} mt={3}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
            <Chip 
              icon={<i className="ni ni-bullet-list-67" />}
              label={`Trang ${currentPage}/${totalPages}`}
              color="success"
              size="small"
            />
          </ArgonBox>
        )}
      </ArgonBox>
      <Footer />

    </DashboardLayout>
  );
}

export default DailyReport;
