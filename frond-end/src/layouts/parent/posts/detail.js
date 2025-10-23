/**
=========================================================
* KidsLink Parent Dashboard - Post Detail
=========================================================
*/

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

// Argon Dashboard 2 MUI example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function PostDetail() {
  const post = {
    id: 1,
    title: "Hoạt động ngoại khóa tuần này",
    content: `Tuần vừa qua, các con đã có những hoạt động ngoại khóa rất thú vị và bổ ích. Chúng tôi đã tổ chức nhiều hoạt động khác nhau để giúp các con phát triển toàn diện về cả thể chất và trí tuệ.

    <strong>Hoạt động chính:</strong>
    • Trò chơi vận động ngoài trời
    • Thí nghiệm khoa học đơn giản
    • Vẽ tranh và làm thủ công
    • Kể chuyện và đọc sách
    • Hoạt động nhóm và teamwork

    Các con đã thể hiện sự hào hứng và tích cực trong tất cả các hoạt động. Chúng tôi rất vui khi thấy các con học hỏi và phát triển từng ngày.

    <strong>Lưu ý:</strong> Tuần tới chúng tôi sẽ tiếp tục với chủ đề "Khám phá thiên nhiên" với nhiều hoạt động thú vị khác.`,
    author: "Cô Lan",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop",
    date: "15/12/2024",
    category: "Hoạt động",
    likes: 25,
    comments: 8,
    images: [
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
      "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=400&h=300&fit=crop"
    ]
  };

  const comments = [
    {
      id: 1,
      author: "Phụ huynh Minh Anh",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "Cảm ơn cô Lan đã chia sẻ! Con tôi về nhà kể rất nhiều về hoạt động hôm nay.",
      date: "15/12/2024 16:30"
    },
    {
      id: 2,
      author: "Phụ huynh Hoa Mai",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      content: "Hoạt động rất bổ ích! Con tôi rất thích phần thí nghiệm khoa học.",
      date: "15/12/2024 17:15"
    },
    {
      id: 3,
      author: "Phụ huynh Tuấn Anh",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "Chúc mừng các con đã có một ngày học tập vui vẻ!",
      date: "15/12/2024 18:00"
    }
  ];

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
          {/* Main Content */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                {/* Post Header */}
                <ArgonBox display="flex" alignItems="center" mb={2}>
                  <Avatar
                    src={post.avatar}
                    alt={post.author}
                    sx={{ width: 48, height: 48, mr: 2 }}
                  />
                  <ArgonBox>
                    <ArgonTypography variant="h6" fontWeight="bold" color="dark">
                      {post.author}
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text">
                      {post.date}
                    </ArgonTypography>
                  </ArgonBox>
                  <Chip 
                    label={post.category} 
                    color="primary" 
                    sx={{ ml: "auto" }}
                  />
                </ArgonBox>

                {/* Post Title */}
                <ArgonTypography variant="h4" fontWeight="bold" color="dark" mb={2}>
                  {post.title}
                </ArgonTypography>

                {/* Post Image */}
                <CardMedia
                  component="img"
                  height="400"
                  image={post.image}
                  alt={post.title}
                  sx={{ borderRadius: 2, mb: 3 }}
                />

                {/* Post Content */}
                <ArgonTypography 
                  variant="body1" 
                  color="text" 
                  mb={3}
                  sx={{ lineHeight: 1.8 }}
                  dangerouslySetInnerHTML={{ __html: post.content }}
                />

                {/* Additional Images */}
                <Grid container spacing={2} mb={3}>
                  {post.images.map((image, index) => (
                    <Grid item xs={12} md={4} key={index}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={image}
                        alt={`Hình ${index + 1}`}
                        sx={{ borderRadius: 1 }}
                      />
                    </Grid>
                  ))}
                </Grid>

                {/* Actions */}
                <ArgonBox display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                  <ArgonBox display="flex" gap={3}>
                    <Button
                      startIcon={<i className="ni ni-like-2" />}
                      color="primary"
                      variant="outlined"
                    >
                      Thích ({post.likes})
                    </Button>
                    <Button
                      startIcon={<i className="ni ni-chat-round" />}
                      color="primary"
                      variant="outlined"
                    >
                      Bình luận ({post.comments})
                    </Button>
                    <Button
                      startIcon={<i className="ni ni-share" />}
                      color="primary"
                      variant="outlined"
                    >
                      Chia sẻ
                    </Button>
                  </ArgonBox>
                </ArgonBox>

                {/* Comments Section */}
                <ArgonBox>
                  <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                    Bình luận ({comments.length})
                  </ArgonTypography>

                  {/* Comment Input */}
                  <ArgonBox mb={3}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      placeholder="Viết bình luận..."
                      variant="outlined"
                    />
                    <ArgonBox display="flex" justifyContent="flex-end" mt={1}>
                      <Button variant="contained" color="primary">
                        Gửi bình luận
                      </Button>
                    </ArgonBox>
                  </ArgonBox>

                  {/* Comments List */}
                  <List>
                    {comments.map((comment) => (
                      <ListItem key={comment.id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar src={comment.avatar} alt={comment.author} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <ArgonBox display="flex" alignItems="center" justifyContent="space-between">
                              <ArgonTypography variant="body1" fontWeight="medium" color="dark">
                                {comment.author}
                              </ArgonTypography>
                              <ArgonTypography variant="caption" color="text">
                                {comment.date}
                              </ArgonTypography>
                            </ArgonBox>
                          }
                          secondary={
                            <ArgonTypography variant="body2" color="text">
                              {comment.content}
                            </ArgonTypography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <ArgonTypography variant="h6" fontWeight="bold" color="dark" mb={2}>
                  Bài viết liên quan
                </ArgonTypography>
                
                <ArgonBox>
                  <ArgonBox mb={2} p={2} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <ArgonTypography variant="body1" fontWeight="medium" color="dark" mb={1}>
                      Thực đơn tuần tới
                    </ArgonTypography>
                    <ArgonTypography variant="caption" color="text">
                      Cô Hương • 14/12/2024
                    </ArgonTypography>
                  </ArgonBox>

                  <ArgonBox mb={2} p={2} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <ArgonTypography variant="body1" fontWeight="medium" color="dark" mb={1}>
                      Lưu ý về sức khỏe
                    </ArgonTypography>
                    <ArgonTypography variant="caption" color="text">
                      Y tá Minh • 13/12/2024
                    </ArgonTypography>
                  </ArgonBox>

                  <ArgonBox p={2} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <ArgonTypography variant="body1" fontWeight="medium" color="dark" mb={1}>
                      Chương trình học tháng 12
                    </ArgonTypography>
                    <ArgonTypography variant="caption" color="text">
                      Cô Mai • 12/12/2024
                    </ArgonTypography>
                  </ArgonBox>
                </ArgonBox>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </ArgonBox>
      <Footer />
    </DashboardLayout>
  );
}

export default PostDetail;
