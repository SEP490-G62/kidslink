/**
=========================================================
* KidsLink Parent Dashboard - Recent Posts
=========================================================
*/

// @mui material components
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";

// Argon Dashboard 2 MUI components
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";

function RecentPosts() {
  const posts = [
    {
      id: 1,
      title: "Hoạt động ngoại khóa tuần này",
      content: "Các con đã có những hoạt động thú vị trong tuần qua...",
      author: "Cô Lan",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=200&fit=crop",
      date: "15/12/2024",
      category: "Hoạt động"
    },
    {
      id: 2,
      title: "Thực đơn tuần tới",
      content: "Thực đơn dinh dưỡng cho các con trong tuần tới...",
      author: "Cô Hương",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=200&fit=crop",
      date: "14/12/2024",
      category: "Dinh dưỡng"
    },
    {
      id: 3,
      title: "Lưu ý về sức khỏe",
      content: "Những lưu ý quan trọng về sức khỏe của các con...",
      author: "Y tá Minh",
      avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop",
      date: "13/12/2024",
      category: "Sức khỏe"
    }
  ];

  return (
    <Card>
      <CardContent>
        <ArgonBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <ArgonTypography variant="h6" fontWeight="bold" color="dark">
            Bài viết gần đây
          </ArgonTypography>
          <ArgonTypography 
            variant="body2" 
            color="primary" 
            sx={{ cursor: "pointer", textDecoration: "underline" }}
          >
            Xem tất cả
          </ArgonTypography>
        </ArgonBox>

        {posts.map((post) => (
          <ArgonBox key={post.id} mb={3} p={2} sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
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

            <CardMedia
              component="img"
              height="120"
              image={post.image}
              alt={post.title}
              sx={{ borderRadius: 1 }}
            />
          </ArgonBox>
        ))}
      </CardContent>
    </Card>
  );
}

export default RecentPosts;
