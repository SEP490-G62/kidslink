/**
=========================================================
* KidsLink Parent Dashboard - Chat Detail
=========================================================
*/

// React
import { useState, useRef, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function ChatDetail() {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef(null);

  const conversation = {
    id: 1,
    name: "Cô Lan - Giáo viên chủ nhiệm",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    status: "online",
    type: "teacher"
  };

  const messages = [
    {
      id: 1,
      sender: "teacher",
      content: "Chào anh/chị! Con Minh Anh hôm nay học rất tốt.",
      time: "14:30",
      date: "15/12/2024"
    },
    {
      id: 2,
      sender: "parent",
      content: "Cảm ơn cô Lan! Con có vẻ rất thích học.",
      time: "14:32",
      date: "15/12/2024"
    },
    {
      id: 3,
      sender: "teacher",
      content: "Đúng vậy! Con rất tích cực trong các hoạt động nhóm.",
      time: "14:35",
      date: "15/12/2024"
    },
    {
      id: 4,
      sender: "teacher",
      content: "Tôi muốn trao đổi về việc con có thể tham gia thêm các hoạt động ngoại khóa không?",
      time: "14:36",
      date: "15/12/2024"
    },
    {
      id: 5,
      sender: "parent",
      content: "Dạ được ạ! Con rất thích các hoạt động như vậy.",
      time: "14:38",
      date: "15/12/2024"
    },
    {
      id: 6,
      sender: "teacher",
      content: "Tuyệt vời! Tôi sẽ gửi thông tin chi tiết về các hoạt động sắp tới.",
      time: "14:40",
      date: "15/12/2024"
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Here you would typically send the message to the backend
      console.log("Sending message:", message);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Back Button */}
        <ArgonBox mb={3}>
          <Button
            startIcon={<i className="ni ni-bold-left" />}
            onClick={() => window.history.back()}
          >
            Quay lại
          </Button>
        </ArgonBox>

        <Grid container spacing={3}>
          {/* Chat Area */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: "70vh", display: "flex", flexDirection: "column" }}>
              {/* Chat Header */}
              <CardContent sx={{ borderBottom: "1px solid #e0e0e0" }}>
                <ArgonBox display="flex" alignItems="center">
                  <Avatar
                    src={conversation.avatar}
                    alt={conversation.name}
                    sx={{ width: 48, height: 48, mr: 2 }}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      {conversation.name}
                    </ArgonTypography>
                    <ArgonBox display="flex" alignItems="center">
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: conversation.status === "online" ? "#4caf50" : "#9e9e9e",
                          marginRight: 8
                        }}
                      />
                      <ArgonTypography variant="caption" color="text">
                        {conversation.status === "online" ? "Đang hoạt động" : "Không hoạt động"}
                      </ArgonTypography>
                    </ArgonBox>
                  </ArgonBox>
                  <Chip
                    label="Giáo viên"
                    color="primary"
                    size="small"
                    sx={{ ml: "auto" }}
                  />
                </ArgonBox>
              </CardContent>

              {/* Messages */}
              <CardContent sx={{ flex: 1, overflow: "auto", padding: 2 }}>
                <List>
                  {messages.map((msg) => (
                    <ListItem
                      key={msg.id}
                      sx={{
                        justifyContent: msg.sender === "parent" ? "flex-end" : "flex-start",
                        alignItems: "flex-start",
                        mb: 2
                      }}
                    >
                      {msg.sender === "teacher" && (
                        <ListItemAvatar>
                          <Avatar
                            src={conversation.avatar}
                            alt={conversation.name}
                            sx={{ width: 32, height: 32 }}
                          />
                        </ListItemAvatar>
                      )}
                      <Paper
                        elevation={1}
                        sx={{
                          p: 2,
                          maxWidth: "70%",
                          backgroundColor: msg.sender === "parent" ? "#e3f2fd" : "#f5f5f5",
                          borderRadius: 2
                        }}
                      >
                        <ArgonTypography variant="body1" color="dark">
                          {msg.content}
                        </ArgonTypography>
                        <ArgonTypography variant="caption" color="text" sx={{ mt: 1, display: "block" }}>
                          {msg.time}
                        </ArgonTypography>
                      </Paper>
                      {msg.sender === "parent" && (
                        <ListItemAvatar>
                          <Avatar
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                            alt="Parent"
                            sx={{ width: 32, height: 32 }}
                          />
                        </ListItemAvatar>
                      )}
                    </ListItem>
                  ))}
                </List>
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <CardContent sx={{ borderTop: "1px solid #e0e0e0" }}>
                <ArgonBox display="flex" gap={1}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    placeholder="Nhập tin nhắn..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    variant="outlined"
                    size="small"
                  />
                  <IconButton color="primary">
                    <i className="ni ni-image" />
                  </IconButton>
                  <IconButton color="primary">
                    <i className="ni ni-paperclip" />
                  </IconButton>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                  >
                    <i className="ni ni-send" />
                  </Button>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                  Thông tin cuộc trò chuyện
                </ArgonTypography>

                <ArgonBox mb={3}>
                  <ArgonBox display="flex" alignItems="center" mb={2}>
                    <Avatar
                      src={conversation.avatar}
                      alt={conversation.name}
                      sx={{ width: 48, height: 48, mr: 2 }}
                    />
                    <ArgonBox>
                      <ArgonTypography variant="body1" fontWeight="medium" color="dark">
                        {conversation.name}
                      </ArgonTypography>
                      <ArgonTypography variant="caption" color="text">
                        Giáo viên chủ nhiệm
                      </ArgonTypography>
                    </ArgonBox>
                  </ArgonBox>
                </ArgonBox>

                <Divider sx={{ my: 2 }} />

                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    📞 Liên hệ
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    Điện thoại: 0901234567
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    Email: lan.teacher@school.edu.vn
                  </ArgonTypography>
                </ArgonBox>

                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    🕒 Thời gian phản hồi
                  </ArgonTypography>
                  <ArgonTypography variant="body2" color="text">
                    Thường phản hồi trong vòng 2 giờ
                  </ArgonTypography>
                </ArgonBox>

                <ArgonBox mb={2}>
                  <ArgonTypography variant="body2" color="text" fontWeight="medium" mb={1}>
                    📚 Môn học phụ trách
                  </ArgonTypography>
                  <ArgonBox display="flex" flexWrap="wrap" gap={1}>
                    <Chip label="Toán" size="small" color="primary" />
                    <Chip label="Tiếng Việt" size="small" color="primary" />
                    <Chip label="Khoa học" size="small" color="primary" />
                  </ArgonBox>
                </ArgonBox>

                <Button variant="outlined" color="primary" fullWidth>
                  Xem hồ sơ giáo viên
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ChatDetail;
