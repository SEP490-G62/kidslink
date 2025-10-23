/**
=========================================================
* KidsLink Parent Dashboard - Chat List
=========================================================
*/

// React
import { useState } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import ListItemSecondaryAction from "@mui/material/ListItemSecondaryAction";
import Badge from "@mui/material/Badge";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function ChatList() {
  const [searchTerm, setSearchTerm] = useState("");

  const conversations = [
    {
      id: 1,
      name: "Cô Lan - Giáo viên chủ nhiệm",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Con Minh Anh hôm nay học rất tốt!",
      time: "14:30",
      unreadCount: 2,
      type: "teacher",
      status: "online"
    },
    {
      id: 2,
      name: "Y tá Minh - Phụ trách y tế",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Con cần uống thuốc đúng giờ nhé",
      time: "12:15",
      unreadCount: 0,
      type: "health",
      status: "offline"
    },
    {
      id: 3,
      name: "Cô Hương - Phụ trách dinh dưỡng",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Thực đơn tuần tới đã được cập nhật",
      time: "10:45",
      unreadCount: 1,
      type: "nutrition",
      status: "online"
    },
    {
      id: 4,
      name: "Ban Giám Hiệu",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Thông báo về lịch nghỉ lễ sắp tới",
      time: "09:20",
      unreadCount: 0,
      type: "admin",
      status: "offline"
    },
    {
      id: 5,
      name: "Thầy Nam - Giáo viên thể chất",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      lastMessage: "Con rất tích cực trong giờ thể dục",
      time: "Hôm qua",
      unreadCount: 0,
      type: "teacher",
      status: "offline"
    }
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "teacher":
        return "primary";
      case "health":
        return "success";
      case "nutrition":
        return "warning";
      case "admin":
        return "error";
      default:
        return "default";
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "teacher":
        return "Giáo viên";
      case "health":
        return "Y tế";
      case "nutrition":
        return "Dinh dưỡng";
      case "admin":
        return "Ban giám hiệu";
      default:
        return "Khác";
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Tin nhắn
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Liên lạc với giáo viên và nhân viên trường
          </ArgonTypography>
        </ArgonBox>

        {/* Search */}
        <ArgonBox mb={3}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm cuộc trò chuyện..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <i className="ni ni-zoom-split-in" />
                </InputAdornment>
              ),
            }}
          />
        </ArgonBox>

        {/* Conversations List */}
        <Card>
          <CardContent>
            <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
              Cuộc trò chuyện ({filteredConversations.length})
            </ArgonTypography>

            <List>
              {filteredConversations.map((conversation) => (
                <ListItem
                  key={conversation.id}
                  sx={{
                    cursor: "pointer",
                    "&:hover": { backgroundColor: "#f5f5f5" },
                    borderRadius: 2,
                    mb: 1
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      overlap="circular"
                      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                      badgeContent={
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: "50%",
                            backgroundColor: conversation.status === "online" ? "#4caf50" : "#9e9e9e"
                          }}
                        />
                      }
                    >
                      <Avatar
                        src={conversation.avatar}
                        alt={conversation.name}
                        sx={{ width: 56, height: 56 }}
                      />
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                        <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                          {conversation.name}
                        </ArgonTypography>
                        <ArgonBox display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={getTypeLabel(conversation.type)}
                            color={getTypeColor(conversation.type)}
                            size="small"
                          />
                          <ArgonTypography variant="caption" color="text">
                            {conversation.time}
                          </ArgonTypography>
                        </ArgonBox>
                      </ArgonBox>
                    }
                    secondary={
                      <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                        <ArgonTypography
                          variant="body2"
                          color="text"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "70%"
                          }}
                        >
                          {conversation.lastMessage}
                        </ArgonTypography>
                        {conversation.unreadCount > 0 && (
                          <Chip
                            label={conversation.unreadCount}
                            color="primary"
                            size="small"
                            sx={{ minWidth: 20, height: 20 }}
                          />
                        )}
                      </ArgonBox>
                    }
                  />
                  <ListItemSecondaryAction>
                    <i className="ni ni-bold-right" style={{ color: "#9e9e9e" }} />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>

            {filteredConversations.length === 0 && (
              <ArgonBox textAlign="center" py={4}>
                <i className="ni ni-chat-round" style={{ fontSize: 48, color: "#9e9e9e" }} />
                <ArgonTypography variant="h6" color="text" mt={2}>
                  Không tìm thấy cuộc trò chuyện nào
                </ArgonTypography>
                <ArgonTypography variant="body2" color="text">
                  Hãy thử tìm kiếm với từ khóa khác
                </ArgonTypography>
              </ArgonBox>
            )}
          </CardContent>
        </Card>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default ChatList;
