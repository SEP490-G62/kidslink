/**
=========================================================
* KidsLink Parent Dashboard - Post List
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Pagination from "@mui/material/Pagination";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function PostList() {
  const posts = [
    {
      id: 1,
      title: "Hoạt động ngoại khóa tuần này",
      content: "Các con đã có những hoạt động thú vị trong tuần qua với nhiều trò chơi và bài học bổ ích...",
      author: "Cô Lan",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop",
      date: "15/12/2024",
      category: "Hoạt động",
      likes: 25,
      comments: 8
    },
    {
      id: 2,
      title: "Thực đơn tuần tới",
      content: "Thực đơn dinh dưỡng cho các con trong tuần tới với đầy đủ chất dinh dưỡng cần thiết...",
      author: "Cô Hương",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=200&fit=crop",
      date: "14/12/2024",
      category: "Dinh dưỡng",
      likes: 18,
      comments: 5
    },
    {
      id: 3,
      title: "Lưu ý về sức khỏe",
      content: "Những lưu ý quan trọng về sức khỏe của các con trong mùa đông này...",
      author: "Y tá Minh",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop",
      date: "13/12/2024",
      category: "Sức khỏe",
      likes: 32,
      comments: 12
    },
    {
      id: 4,
      title: "Chương trình học tháng 12",
      content: "Chương trình học tập của các con trong tháng 12 với nhiều hoạt động thú vị...",
      author: "Cô Mai",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop",
      date: "12/12/2024",
      category: "Học tập",
      likes: 28,
      comments: 6
    },
    {
      id: 5,
      title: "Thông báo nghỉ lễ",
      content: "Thông báo về lịch nghỉ lễ Giáng Sinh và Tết Dương lịch sắp tới...",
      author: "Ban Giám Hiệu",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400&h=200&fit=crop",
      date: "11/12/2024",
      category: "Thông báo",
      likes: 15,
      comments: 3
    },
    {
      id: 6,
      title: "Hoạt động thể chất",
      content: "Các hoạt động thể chất và vận động cho các con trong tuần này...",
      author: "Thầy Nam",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop",
      date: "10/12/2024",
      category: "Thể chất",
      likes: 22,
      comments: 7
    }
  ];

  const categories = ["Tất cả", "Hoạt động", "Dinh dưỡng", "Sức khỏe", "Học tập", "Thông báo", "Thể chất"];

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <ArgonBox py={3}>
        {/* Header */}
        <ArgonBox mb={3}>
          <ArgonTypography variant="h4" fontWeight="bold" color="dark">
            Bài viết
          </ArgonTypography>
          <ArgonTypography variant="body2" color="text" fontWeight="regular">
            Cập nhật thông tin mới nhất từ trường
          </ArgonTypography>
        </ArgonBox>

        {/* Search and Filter */}
        <ArgonBox mb={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm bài viết..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <i className="ni ni-zoom-split-in" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <ArgonBox display="flex" gap={1} flexWrap="wrap">
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    color={category === "Tất cả" ? "primary" : "default"}
                    variant={category === "Tất cả" ? "filled" : "outlined"}
                    sx={{ cursor: "pointer" }}
                  />
                ))}
              </ArgonBox>
            </Grid>
          </Grid>
        </ArgonBox>

        {/* Posts Grid */}
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} md={6} lg={4} key={post.id}>
              <Card sx={{ height: "100%", cursor: "pointer", "&:hover": { boxShadow: 6 } }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={post.image}
                  alt={post.title}
                />
                <CardContent>
                  <ArgonBox display="flex" alignItems="center" mb={1}>
                    <Avatar
                      src={post.avatar}
                      alt={post.author}
                      sx={{ width: 32, height: 32, mr: 1 }}
                    />
                    <ArgonBox>
                      <ArgonTypography variant="body2" fontWeight="medium" color="dark">
                        {post.author}
                      </ArgonTypography>
                      <ArgonTypography variant="caption" color="text">
                        {post.date}
                      </ArgonTypography>
                    </ArgonBox>
                    <Chip 
                      label={post.category} 
                      size="small" 
                      color="primary" 
                      sx={{ ml: "auto" }}
                    />
                  </ArgonBox>

                  <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={1}>
                    {post.title}
                  </ArgonTypography>

                  <ArgonTypography variant="body2" color="text" mb={2}>
                    {post.content}
                  </ArgonTypography>

                  <ArgonBox display="flex" justifyContent="space-between" alignItems="center">
                    <ArgonBox display="flex" gap={2}>
                      <ArgonBox display="flex" alignItems="center">
                        <i className="ni ni-like-2" style={{ marginRight: 4 }} />
                        <ArgonTypography variant="caption" color="text">
                          {post.likes}
                        </ArgonTypography>
                      </ArgonBox>
                      <ArgonBox display="flex" alignItems="center">
                        <i className="ni ni-chat-round" style={{ marginRight: 4 }} />
                        <ArgonTypography variant="caption" color="text">
                          {post.comments}
                        </ArgonTypography>
                      </ArgonBox>
                    </ArgonBox>
                    <ArgonTypography variant="caption" color="primary" sx={{ cursor: "pointer" }}>
                      Đọc thêm →
                    </ArgonTypography>
                  </ArgonBox>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Pagination */}
        <ArgonBox display="flex" justifyContent="center" mt={4}>
          <Pagination count={3} color="primary" />
        </ArgonBox>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PostList;
