/**
=========================================================
* KidsLink Parent Dashboard - Child Information
=========================================================
*/

import { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/ParentNavBar";
import Footer from "examples/Footer";

// Services
import parentService from "services/parentService";

// Auth context
import { useAuth } from "context/AuthContext";

// Components
import PickupModal from "./PickupModal";

function ChildInformation() {
  const { selectedChild } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [childData, setChildData] = useState(null);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [editingPickup, setEditingPickup] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchChildInfo = async () => {
    if (!selectedChild?._id) {
      setError('Vui lòng chọn con từ sidebar');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await parentService.getChildInfo(selectedChild._id);
      
      if (result.success) {
        setChildData(result.data);
      } else {
        setError(result.error || 'Có lỗi xảy ra khi tải thông tin');
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPickup = () => {
    setEditingPickup(null);
    setPickupModalOpen(true);
  };

  const handleEditPickup = (pickup) => {
    setEditingPickup(pickup);
    setPickupModalOpen(true);
  };

  const handleMenuOpen = (event, pickup) => {
    setAnchorEl(event.currentTarget);
    setSelectedPickup(pickup);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPickup(null);
  };

  const handleEditFromMenu = () => {
    if (selectedPickup) {
      handleEditPickup(selectedPickup);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = () => {
    if (selectedPickup) {
      setAnchorEl(null); // Close menu but keep selectedPickup
      setDeleteDialogOpen(true);
    } else {
      handleMenuClose();
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPickup) return;
    
    try {
      setIsDeleting(true);
      const result = await parentService.deletePickup(selectedPickup._id, selectedChild._id);
      
      if (result.success) {
        setDeleteDialogOpen(false);
        setSelectedPickup(null);
        await fetchChildInfo();
      } else {
        alert('Có lỗi xảy ra khi xóa: ' + (result.message || 'Lỗi không xác định'));
      }
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedPickup(null);
  };

  const handleDeletePickup = async () => {
    if (!editingPickup) return;
    
    try {
      const result = await parentService.deletePickup(editingPickup._id, selectedChild._id);
      if (result.success) {
        setPickupModalOpen(false);
        setEditingPickup(null);
        await fetchChildInfo();
      } else {
        throw new Error(result.error || 'Có lỗi xảy ra khi xóa');
      }
    } catch (err) {
      throw err;
    }
  };

  const handleSubmitPickup = async (formData) => {
    if (editingPickup) {
      // Update existing pickup
      const result = await parentService.updatePickup(
        editingPickup._id,
        selectedChild._id,
        formData
      );
      if (result.success) {
        setPickupModalOpen(false);
        setEditingPickup(null);
        await fetchChildInfo();
      } else {
        throw new Error(result.error || 'Có lỗi xảy ra khi cập nhật');
      }
    } else {
      // Add new pickup
      const result = await parentService.addPickup(selectedChild._id, formData);
      if (result.success) {
        setPickupModalOpen(false);
        await fetchChildInfo();
      } else {
        throw new Error(result.error || 'Có lỗi xảy ra khi thêm');
      }
    }
  };

  useEffect(() => {
    fetchChildInfo();
  }, [selectedChild]);

  // Loading state
  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox py={3} display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </ArgonBox>
      </DashboardLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox py={3}>
          <Alert severity="error">{error}</Alert>
        </ArgonBox>
      </DashboardLayout>
    );
  }

  // No data state
  if (!childData) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <ArgonBox py={3}>
          <Alert severity="info">Không có dữ liệu để hiển thị</Alert>
        </ArgonBox>
      </DashboardLayout>
    );
  }

  const { student, pickups = [], healthRecords = [] } = childData;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Thông tin con
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Quản lý thông tin cá nhân và sức khỏe của con
          </ArgonTypography>
        </ArgonBox>

        <Grid container spacing={3}>
          {/* Left Column: Child Info + Pickup Management */}
          <Grid item xs={12} lg={4}>
            {/* Child Basic Info */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <ArgonBox display="flex" flexDirection="column" alignItems="center" mb={3}>
                  <Avatar
                    src={student.avatar_url}
                    alt={student.full_name}
                    sx={{ width: 100, height: 100, mb: 2 }}
                  />
                  <ArgonTypography variant="h5" fontWeight="bold" color="dark" textAlign="center">
                    {student.full_name}
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text" textAlign="center">
                    {selectedChild?.class?.class_name || 'Chưa phân lớp'} • {student.age} tuổi
                  </ArgonTypography>
                </ArgonBox>

                <ArgonBox display="flex" justifyContent="space-around" mb={3}>
                  <ArgonBox textAlign="center">
                    <ArgonBox display="flex" alignItems="center" justifyContent="center" mb={0.5}>
                      <i className="ni ni-calendar-grid-58" style={{ fontSize: '16px', color: '#5e72e4', marginRight: '4px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="medium">
                        Ngày sinh
                      </ArgonTypography>
                    </ArgonBox>
                    <ArgonTypography variant="body2" color="dark" fontWeight="bold">
                      {student.dob}
                    </ArgonTypography>
                  </ArgonBox>
                  <ArgonBox textAlign="center">
                    <ArgonBox display="flex" alignItems="center" justifyContent="center" mb={0.5}>
                      <i className="ni ni-single-02" style={{ fontSize: '16px', color: '#5e72e4', marginRight: '4px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="medium">
                        Giới tính
                      </ArgonTypography>
                    </ArgonBox>
                    <ArgonTypography variant="body2" color="dark" fontWeight="bold">
                      {student.gender}
                    </ArgonTypography>
                  </ArgonBox>
                  <ArgonBox textAlign="center">
                    <ArgonBox display="flex" alignItems="center" justifyContent="center" mb={0.5}>
                      <i className="ni ni-circle-08" style={{ fontSize: '16px', color: '#5e72e4', marginRight: '4px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="medium">
                        Quan hệ
                      </ArgonTypography>
                    </ArgonBox>
                    <ArgonTypography variant="body2" color="dark" fontWeight="bold">
                      {student.relationship}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>

                <Divider sx={{ my: 2 }} />

                <ArgonBox display="flex" justifyContent="space-around">
                  <ArgonBox textAlign="center">
                    <ArgonBox display="flex" alignItems="center" justifyContent="center" mb={0.5}>
                      <i className="ni ni-notification-70" style={{ fontSize: '16px', color: '#f44336', marginRight: '4px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="medium">
                        Dị ứng
                      </ArgonTypography>
                    </ArgonBox>
                    <Chip 
                      label={student.allergy || 'Không có'} 
                      color={student.allergy && student.allergy !== 'Không có' ? "warning" : "success"} 
                      size="small" 
                    />
                  </ArgonBox>
                  <ArgonBox textAlign="center">
                    <ArgonBox display="flex" alignItems="center" justifyContent="center" mb={0.5}>
                      <i className="ni ni-chart-bar-32" style={{ fontSize: '16px', color: '#5e72e4', marginRight: '4px' }} />
                      <ArgonTypography variant="body2" color="text" fontWeight="medium">
                        Trạng thái
                      </ArgonTypography>
                    </ArgonBox>
                    <Chip 
                      label={student.status === 1 ? "Đang học" : "Đã nghỉ"} 
                      color={student.status === 1 ? "success" : "error"} 
                    />
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>

            {/* Pickup Management */}
            <Card>
              <CardContent>
                <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                    Quản lý người đón
                  </ArgonTypography>
                  <Button
                    variant="contained"
                    startIcon={<i className="ni ni-fat-add" />}
                    onClick={handleAddPickup}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      px: 3
                    }}
                  >
                    Thêm người đón
                  </Button>
                </ArgonBox>

                {pickups.length === 0 ? (
                  <ArgonBox textAlign="center" py={4}>
                    <ArgonTypography variant="body2" color="text">
                      Chưa có người đón được đăng ký
                    </ArgonTypography>
                  </ArgonBox>
                ) : (
                  <Grid container spacing={2}>
                    {pickups.map((person, index) => (
                      <Grid item xs={12} key={person._id || index}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            border: "1px solid #e0e0e0",
                            boxShadow: 1,
                            backgroundColor: "white",
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: 4,
                              transform: 'translateY(-4px)'
                            }
                          }}
                        >
                          <CardContent>
                            <ArgonBox display="flex" alignItems="flex-start" gap={2}>
                              <Avatar
                                src={person.avatar_url}
                                alt={person.full_name}
                                sx={{ 
                                  width: 60, 
                                  height: 60,
                                  border: '2px solid',
                                  borderColor: 'primary.main'
                                }}
                              >
                                {person.full_name?.charAt(0) || 'P'}
                              </Avatar>
                              <ArgonBox flex={1}>
                                <ArgonBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                                  <ArgonBox>
                                    <ArgonTypography variant="body1" fontWeight="bold" color="dark" mb={0.5}>
                                      {person.full_name}
                                    </ArgonTypography>
                                    <Chip 
                                      label={person.relationship} 
                                      size="small" 
                                      color="info"
                                      sx={{ height: 20, fontSize: '10px' }}
                                    />
                                  </ArgonBox>
                                  <IconButton
                                      size="small"
                                      onClick={(e) => handleMenuOpen(e, person)}
                                      sx={{ 
                                        width: 32, 
                                        height: 32,
                                        color: 'text.secondary',
                                        '&:hover': {
                                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                          color: 'primary.main'
                                        }
                                      }}
                                    >
                                      <i className="ni ni-settings-gear-65" style={{ fontSize: '14px' }} />
                                    </IconButton>
                                </ArgonBox>
                                <Divider sx={{ my: 1 }} />
                                <ArgonBox display="flex" flexDirection="column" gap={0.5}>
                                  <ArgonTypography variant="body2" color="text">
                                    📞 {person.phone}
                                  </ArgonTypography>
                                  <ArgonTypography variant="body2" color="text">
                                    CCCD: {person.id_card_number}
                                  </ArgonTypography>
                                </ArgonBox>
                              </ArgonBox>
                            </ArgonBox>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </CardContent>
            </Card>

            {/* Menu for pickup options */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  minWidth: 180,
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(0,0,0,0.05)'
                }
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem 
                onClick={handleEditFromMenu}
                sx={{
                  py: 1,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(94, 114, 228, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <i className="ni ni-settings-gear-65" style={{ fontSize: '16px', color: '#5e72e4' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Chỉnh sửa"
                  primaryTypographyProps={{
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                />
              </MenuItem>
              
              <Divider sx={{ my: 0.5 }} />
              <MenuItem 
                onClick={handleDeleteFromMenu}
                sx={{
                  py: 1,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.08)'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <i className="ni ni-fat-remove" style={{ fontSize: '16px', color: '#f44336' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Xóa"
                  primaryTypographyProps={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#f44336'
                  }}
                />
              </MenuItem>
            </Menu>
          </Grid>

          {/* Right Column: Health Records */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
                  Lịch sử sức khỏe
                </ArgonTypography>

                {healthRecords.length === 0 ? (
                  <ArgonBox textAlign="center" py={4}>
                    <ArgonTypography variant="body2" color="text">
                      Chưa có hồ sơ sức khỏe
                    </ArgonTypography>
                  </ArgonBox>
                ) : (
                  <>
                    <List>
                      {healthRecords.map((record, index) => (
                        <ListItem key={record._id || index} sx={{ px: 0 }}>
                          <ListItemIcon>
                            <i 
                              className={record.type === 'Thông báo sức khỏe' ? "ni ni-notification-70" : "ni ni-ambulance"} 
                              style={{ color: record.type === 'Thông báo sức khỏe' ? "#f44336" : "#4caf50" }} 
                            />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                                <ArgonBox display="flex" alignItems="center" gap={1}>
                                  <ArgonTypography variant="body1" fontWeight="medium" color="dark">
                                    {record.type}
                                  </ArgonTypography>
                                  {record.type === 'Thông báo sức khỏe' && (
                                    <Chip 
                                      label="Quan trọng" 
                                      size="small" 
                                      color="error"
                                      sx={{ height: 20, fontSize: '10px' }}
                                    />
                                  )}
                                </ArgonBox>
                                <ArgonTypography variant="caption" color="text">
                                  {record.date} {record.time && `- ${record.time}`}
                                </ArgonTypography>
                              </ArgonBox>
                            }
                            secondary={
                              <ArgonBox>
                                {record.type === 'Khám sức khỏe' && (
                                  <ArgonTypography variant="body2" color="text" mb={1}>
                                    📏 Chiều cao: {record.height} - ⚖️ Cân nặng: {record.weight}
                                  </ArgonTypography>
                                )}
                                {record.type === 'Thông báo sức khỏe' && (
                                  <>
                                    {record.symptoms && (
                                      <ArgonTypography variant="body2" color="error" fontWeight="bold" mb={0.5}>
                                        🚨 Triệu chứng: {record.symptoms}
                                      </ArgonTypography>
                                    )}
                                    {record.medications && (
                                      <ArgonTypography variant="body2" color="warning" fontWeight="medium" mb={0.5}>
                                        💊 Thuốc đã dùng: {record.medications}
                                      </ArgonTypography>
                                    )}
                                    {record.actions_taken && (
                                      <ArgonTypography variant="body2" color="info" fontWeight="medium" mb={0.5}>
                                        🏥 Hành động: {record.actions_taken}
                                      </ArgonTypography>
                                    )}
                                  </>
                                )}
                                <ArgonTypography variant="body2" color="text" mb={1}>
                                  {record.note}
                                </ArgonTypography>
                                <ArgonTypography variant="caption" color="text">
                                  👨‍⚕️ {record.staff}
                                </ArgonTypography>
                              </ArgonBox>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>

      {/* Pickup Modal */}
      <PickupModal
        open={pickupModalOpen}
        onClose={() => {
          setPickupModalOpen(false);
          setEditingPickup(null);
        }}
        pickup={editingPickup}
        studentId={selectedChild?._id}
        onSubmit={handleSubmitPickup}
        onDelete={handleDeletePickup}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle>
          <ArgonBox display="flex" alignItems="center" gap={2}>
            <ArgonBox
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="ni ni-fat-remove" style={{ fontSize: '20px', color: '#f44336' }} />
            </ArgonBox>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
              Xác nhận xóa người đón
            </ArgonTypography>
          </ArgonBox>
        </DialogTitle>
        
        <DialogContent>
          <ArgonTypography variant="body1" color="text" mb={2}>
            Bạn có chắc chắn muốn xóa người đón <strong>{selectedPickup?.full_name}</strong> không?
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text.secondary">
            Hành động này sẽ xóa người đón này khỏi tất cả các con đang học của bạn. Hành động này không thể hoàn tác.
          </ArgonTypography>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={handleDeleteCancel}
            disabled={isDeleting}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 'bold',
              border: '1px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              color: 'dark',
              '&:hover': {
                backgroundColor: '#e9ecef',
                borderColor: '#d0d1d2'
              }
            }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            variant="contained"
            color="error"
            startIcon={isDeleting ? <i className="ni ni-spinner" /> : <i className="ni ni-fat-remove" />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              textTransform: 'none',
              fontWeight: 'bold',
              color: 'white !important',
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
                color: 'white !important'
              },
              '&:disabled': {
                background: 'rgba(244, 67, 54, 0.3)',
                color: 'rgba(255, 255, 255, 0.7) !important'
              },
              '& .MuiButton-label': {
                color: 'white !important'
              }
            }}
          >
            {isDeleting ? 'Đang xóa...' : 'Xóa người đón'}
          </Button>
        </DialogActions>
      </Dialog>
            <Footer />

    </DashboardLayout>
  );
}

export default ChildInformation;
