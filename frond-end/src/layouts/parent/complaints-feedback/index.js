/**
=========================================================
* KidsLink Parent Dashboard - Complaints and Feedback
=========================================================
*/

// React
import { useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function ComplaintsAndFeedback() {
  const [newComplaintDialogOpen, setNewComplaintDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [complaintTitle, setComplaintTitle] = useState("");
  const [complaintContent, setComplaintContent] = useState("");

  const categories = [
    { value: "complaint", label: "Khiếu nại", icon: "ni ni-notification-70", color: "error" },
    { value: "inquiry", label: "Thắc mắc", icon: "ni ni-chat-round", color: "warning" },
    { value: "feedback", label: "Phản hồi", icon: "ni ni-like-2", color: "success" },
    { value: "suggestion", label: "Đề xuất", icon: "ni ni-bulb-61", color: "info" }
  ];

  const complaints = [
    {
      id: 1,
      title: "Thắc mắc về học phí tháng 12",
      category: "inquiry",
      content: "Tôi muốn hỏi về việc tính toán học phí tháng 12 có bao gồm những khoản nào?",
      status: "Đã phản hồi",
      priority: "Trung bình",
      createdAt: "15/12/2024",
      response: "Học phí tháng 12 bao gồm học phí chính thức và phí ăn uống. Chi tiết đã được gửi qua email.",
      responseDate: "15/12/2024"
    },
    {
      id: 2,
      title: "Phản hồi về hoạt động ngoại khóa",
      category: "feedback",
      content: "Con tôi rất thích các hoạt động ngoại khóa tuần này. Cảm ơn các thầy cô!",
      status: "Đã phản hồi",
      priority: "Thấp",
      createdAt: "14/12/2024",
      response: "Cảm ơn anh/chị đã phản hồi tích cực. Chúng tôi sẽ tiếp tục tổ chức các hoạt động bổ ích.",
      responseDate: "14/12/2024"
    },
    {
      id: 3,
      title: "Khiếu nại về chất lượng bữa ăn",
      category: "complaint",
      content: "Con tôi phản ánh bữa ăn hôm nay không ngon và có mùi lạ.",
      status: "Đang xử lý",
      priority: "Cao",
      createdAt: "13/12/2024",
      response: "",
      responseDate: ""
    },
    {
      id: 4,
      title: "Đề xuất cải thiện giao thông",
      category: "suggestion",
      content: "Đề xuất nhà trường có biện pháp giảm ùn tắc giao thông vào giờ đón trẻ.",
      status: "Chưa phản hồi",
      priority: "Trung bình",
      createdAt: "12/12/2024",
      response: "",
      responseDate: ""
    }
  ];

  const getCategoryInfo = (categoryValue) => {
    return categories.find(cat => cat.value === categoryValue) || categories[0];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Đã phản hồi":
        return "success";
      case "Đang xử lý":
        return "warning";
      case "Chưa phản hồi":
        return "error";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Cao":
        return "error";
      case "Trung bình":
        return "warning";
      case "Thấp":
        return "success";
      default:
        return "default";
    }
  };

  const handleSubmitComplaint = () => {
    // Here you would typically send the complaint to the backend
    console.log("Submitting complaint:", {
      category: selectedCategory,
      title: complaintTitle,
      content: complaintContent
    });
    
    // Reset form and close dialog
    setSelectedCategory("");
    setComplaintTitle("");
    setComplaintContent("");
    setNewComplaintDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Khiếu nại & Phản hồi
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Gửi khiếu nại, thắc mắc và phản hồi cho nhà trường
          </ArgonTypography>
        </ArgonBox>

        {/* Action Buttons */}
        <ArgonBox mb={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<i className="ni ni-fat-add" />}
            onClick={() => setNewComplaintDialogOpen(true)}
          >
            Gửi khiếu nại/phản hồi mới
          </Button>
        </ArgonBox>

        {/* Statistics Cards */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-notification-70"
                    color="error"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Tổng số
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="error">
                      {complaints.length}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
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
                      Đã phản hồi
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="success">
                      {complaints.filter(c => c.status === "Đã phản hồi").length}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-time"
                    color="warning"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Đang xử lý
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="warning">
                      {complaints.filter(c => c.status === "Đang xử lý").length}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <ArgonBox display="flex" alignItems="center">
                  <ArgonBox
                    component="i"
                    className="ni ni-circle-08"
                    color="error"
                    fontSize="24px"
                    mr={2}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      Chưa phản hồi
                    </ArgonTypography>
                    <ArgonTypography variant="h4" fontWeight="bold" color="error">
                      {complaints.filter(c => c.status === "Chưa phản hồi").length}
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Complaints List */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={3}>
              Danh sách khiếu nại & phản hồi
            </ArgonTypography>

            <List>
              {complaints.map((complaint) => {
                const categoryInfo = getCategoryInfo(complaint.category);
                return (
                  <ListItem key={complaint.id} sx={{ px: 0, mb: 2 }}>
                    <ListItemIcon>
                      <i className={categoryInfo.icon} style={{ color: `var(--${categoryInfo.color}-main)` }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <ArgonBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                            {complaint.title}
                          </ArgonTypography>
                          <ArgonBox display="flex" gap={1}>
                            <Chip
                              label={categoryInfo.label}
                              color={categoryInfo.color}
                              size="small"
                            />
                            <Chip
                              label={complaint.status}
                              color={getStatusColor(complaint.status)}
                              size="small"
                            />
                            <Chip
                              label={complaint.priority}
                              color={getPriorityColor(complaint.priority)}
                              size="small"
                            />
                          </ArgonBox>
                        </ArgonBox>
                      }
                      secondary={
                        <ArgonBox>
                          <ArgonTypography variant="body2" color="text" mb={1}>
                            {complaint.content}
                          </ArgonTypography>
                          <ArgonTypography variant="caption" color="text" mb={1}>
                            📅 Gửi lúc: {complaint.createdAt}
                          </ArgonTypography>
                          {complaint.response && (
                            <ArgonBox mt={2} p={2} sx={{ backgroundColor: "#f5f5f5", borderRadius: 1 }}>
                              <ArgonTypography variant="body2" fontWeight="medium" color="dark" mb={1}>
                                Phản hồi từ nhà trường:
                              </ArgonTypography>
                              <ArgonTypography variant="body2" color="text" mb={1}>
                                {complaint.response}
                              </ArgonTypography>
                              <ArgonTypography variant="caption" color="text">
                                📅 Phản hồi lúc: {complaint.responseDate}
                              </ArgonTypography>
                            </ArgonBox>
                          )}
                        </ArgonBox>
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>

        {/* New Complaint Dialog */}
        <Dialog
          open={newComplaintDialogOpen}
          onClose={() => setNewComplaintDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark">
              Gửi khiếu nại/phản hồi mới
            </ArgonTypography>
          </DialogTitle>
          <DialogContent>
            <ArgonBox mt={2}>
              <FormControl fullWidth mb={2}>
                <InputLabel>Loại</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Loại"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category.value} value={category.value}>
                      <ArgonBox display="flex" alignItems="center">
                        <i className={category.icon} style={{ marginRight: 8 }} />
                        {category.label}
                      </ArgonBox>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Tiêu đề"
                value={complaintTitle}
                onChange={(e) => setComplaintTitle(e.target.value)}
                variant="outlined"
                mb={2}
              />

              <TextField
                fullWidth
                label="Nội dung"
                value={complaintContent}
                onChange={(e) => setComplaintContent(e.target.value)}
                variant="outlined"
                multiline
                rows={4}
                placeholder="Mô tả chi tiết khiếu nại, thắc mắc hoặc phản hồi của bạn..."
              />
            </ArgonBox>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setNewComplaintDialogOpen(false)}>
              Hủy
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitComplaint}
              disabled={!selectedCategory || !complaintTitle || !complaintContent}
            >
              Gửi
            </Button>
          </DialogActions>
        </Dialog>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ComplaintsAndFeedback;
