/**
 * Trang giới thiệu nền tảng kết nối mẫu giáo đơn giản
 */
import ArgonBox from "components/ArgonBox";
import ArgonTypography from "components/ArgonTypography";
import ArgonButton from "components/ArgonButton";
import PageLayout from "examples/LayoutContainers/PageLayout";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Stack from "@mui/material/Stack";
import { Link, useNavigate } from "react-router-dom";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import { useRef } from "react";
import { useAuth } from "context/AuthContext";

// Import images
import kidslinkLogo from "assets/images/kll3.png";
import homeDecor3 from "assets/images/home-decor-3.jpg";
import img1 from "assets/images/img-1.jpg";
import logoSpotify from "assets/images/small-logos/logo-spotify.svg";
import logoSlack from "assets/images/small-logos/logo-slack.svg";
import logoAsana from "assets/images/small-logos/logo-asana.svg";
import logoAtlassian from "assets/images/small-logos/logo-atlassian.svg";
import logoInvision from "assets/images/small-logos/logo-invision.svg";

function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const aboutRef = useRef(null);
  const newsRef = useRef(null);
  const contactRef = useRef(null);

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const goLogin = () => {
    try {
      if (typeof isAuthenticated === 'function' && isAuthenticated() && user) {
        const role = user.role;
        switch (role) {
          case 'school_admin':
            navigate('/school-admin/classes');
            return;
          case 'teacher':
            navigate('/teacher');
            return;
          case 'parent':
            navigate('/parent');
            return;
          case 'health_care_staff':
            navigate('/health-care');
            return;
          default:
            navigate('/authentication/sign-in');
            return;
        }
      }
    } catch (e) {
      // fall-through to sign-in
    }
    navigate('/authentication/sign-in');
  };

  return (
    <PageLayout background="light">
      {/* Custom Header */}
      <AppBar position="absolute" color="transparent" elevation={0} sx={{ mt: 2 }}>
        <Container>
          <Toolbar disableGutters sx={{
            backgroundColor: (theme) => theme.functions.rgba(theme.palette.common.white, 0.8),
            backdropFilter: "saturate(200%) blur(30px)",
            borderRadius: 12,
            px: 2
          }}>
            <ArgonBox component={Link} to="/" py={1} px={2} lineHeight={1} display="flex" alignItems="center">
              <ArgonBox
                component="img"
                src={kidslinkLogo}
                alt="KidsLink Logo"
                height={32}
                sx={{ objectFit: "contain", mr: 1 }}
              />
              <ArgonTypography variant="button" fontWeight="bold">KidsLink</ArgonTypography>
            </ArgonBox>
            <ArgonBox flexGrow={1} />
            <Stack direction="row" spacing={1} alignItems="center">
              <ArgonButton 
                variant="text" 
                color="dark"
                onClick={() => scrollToSection(aboutRef)}
                sx={{ cursor: 'pointer' }}
              >
                Giới thiệu
              </ArgonButton>
              <ArgonButton 
                variant="text" 
                color="dark"
                onClick={() => scrollToSection(newsRef)}
                sx={{ cursor: 'pointer' }}
              >
                Tin tức
              </ArgonButton>
              <ArgonButton 
                variant="text" 
                color="dark"
                onClick={() => scrollToSection(contactRef)}
                sx={{ cursor: 'pointer' }}
              >
                Liên hệ
              </ArgonButton>
              <ArgonButton color="info" size="small" onClick={goLogin}>
                Đăng nhập
              </ArgonButton>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero */}
      <ArgonBox
        pt={16}
        pb={16}
        px={3}
        textAlign="center"
        sx={{
          backgroundImage:
            "linear-gradient(rgba(13,32,67,0.55), rgba(13,32,67,0.55)), url(https://image.benq.com/is/image/benqco/3-1-write-draw-create?$ResponsivePreset$)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          borderRadius: 2,
        }}
      >
        <Container>
          <ArgonTypography variant="h2" fontWeight="bold" mb={2} color="white">
            Người bạn đồng hành đáng tin cậy của Mầm non & Gia đình
          </ArgonTypography>
          <ArgonTypography variant="body1" color="white" opacity={0.95} mb={3} maxWidth={720} mx="auto">
            Nền tảng quản lý vận hành mầm non an toàn, tiết kiệm, kết nối nhà trường – giáo viên – phụ huynh theo thời gian thực.
          </ArgonTypography>
          <ArgonBox display="flex" justifyContent="center" gap={2}>
            <ArgonButton color="info" size="large" onClick={goLogin}>
              Đăng nhập
            </ArgonButton>

          </ArgonBox>
        </Container>
      </ArgonBox>

      {/* Features */}
      <ArgonBox py={6} px={3}>
        <Container>
          <Grid container spacing={3}>
            {[
              { icon: "shield", title: "Bảo mật & Quyền riêng tư", desc: "Chia sẻ an toàn hình ảnh hoạt động của trẻ tới phụ huynh." },
              { icon: "payments", title: "Hóa đơn & Thanh toán", desc: "Hóa đơn học phí, suất ăn, phí muộn... thanh toán không tiền mặt." },
              { icon: "forum", title: "Tương tác hai chiều", desc: "Trao đổi, khảo sát tiện lợi, tăng gắn kết giữa nhà trường và phụ huynh." },
              { icon: "insights", title: "Báo cáo đa chiều", desc: "Báo cáo chi tiết với biểu đồ trực quan, dễ theo dõi và phân tích." },
              { icon: "photo_library", title: "Nhật ký hình ảnh", desc: "Cập nhật ảnh/video bé chơi – học – ăn – ngủ mỗi ngày." },
              { icon: "tag_faces", title: "Điểm danh AI", desc: "Điểm danh tự động với nhận diện khuôn mặt chính xác cao." }
            ].map((f) => (
              <Grid item xs={12} sm={6} md={4} key={f.title}>
                <Card>
                  <ArgonBox p={3} textAlign="left">
                    <ArgonBox
                      width={48}
                      height={48}
                      borderRadius="md"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      bgColor="info"
                      color="white"
                      mb={2}
                    >
                      <Icon>{f.icon}</Icon>
                    </ArgonBox>
                    <ArgonTypography variant="h5" fontWeight="bold" mb={1}>
                      {f.title}
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text">
                      {f.desc}
                    </ArgonTypography>
                  </ArgonBox>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </ArgonBox>

      {/* About Section */}
      <ArgonBox ref={aboutRef} py={8} px={3} bgColor="white">
        <Container>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <ArgonTypography variant="h3" fontWeight="bold" mb={3}>
                Về KidsLink
              </ArgonTypography>
              <ArgonTypography variant="body1" color="text" mb={3}>
                KidsLink là nền tảng quản lý mầm non hàng đầu Việt Nam, được phát triển bởi đội ngũ chuyên gia 
                có nhiều năm kinh nghiệm trong lĩnh vực giáo dục mầm non và công nghệ thông tin.
              </ArgonTypography>
              <ArgonTypography variant="body1" color="text" mb={4}>
                Chúng tôi cam kết mang đến giải pháp toàn diện, giúp các trường mầm non vận hành hiệu quả, 
                tăng cường kết nối với phụ huynh và nâng cao chất lượng chăm sóc, giáo dục trẻ em.
              </ArgonTypography>
              <ArgonBox display="flex" gap={2}>
                <ArgonButton color="info" variant="contained">
                  Tìm hiểu thêm
                </ArgonButton>
                <ArgonButton color="info" variant="outlined">
                  Xem demo
                </ArgonButton>
              </ArgonBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <ArgonBox
                component="img"
                src="https://image.benq.com/is/image/benqco/2-3-story-time?$ResponsivePreset$&wid=300&dpr=off"
                alt="About KidsLink"
                width="100%"
                borderRadius="lg"
                shadow="lg"
              />
            </Grid>
          </Grid>
        </Container>
      </ArgonBox>

      {/* News Section */}
      <ArgonBox ref={newsRef} py={8} px={3}>
        <Container>
          <ArgonTypography variant="h3" fontWeight="bold" mb={6} textAlign="center">
            Tin tức & Cập nhật
          </ArgonTypography>
          <Grid container spacing={4}>
            {[
              {
                title: "KidsLink ra mắt tính năng điểm danh AI mới",
                date: "15/12/2024",
                excerpt: "Công nghệ nhận diện khuôn mặt tiên tiến giúp điểm danh tự động với độ chính xác 99.5%",
                image: "https://image.benq.com/is/image/benqco/2-3-story-time?$ResponsivePreset$&wid=300&dpr=off"
              },
              {
                title: "Hội thảo 'Số hóa mầm non' tại TP.HCM",
                date: "10/12/2024", 
                excerpt: "Tham gia cùng 200+ hiệu trưởng và chuyên gia giáo dục mầm non",
                image: homeDecor3
              },
              {
                title: "KidsLink đạt chứng nhận bảo mật ISO 27001",
                date: "05/12/2024",
                excerpt: "Đảm bảo an toàn tuyệt đối cho dữ liệu của trẻ em và gia đình",
                image: img1
              }
            ].map((news, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ height: "100%" }}>
                  <ArgonBox
                    component="img"
                    src={news.image}
                    alt={news.title}
                    width="100%"
                    height={200}
                    sx={{ objectFit: "cover" }}
                  />
                  <ArgonBox p={3}>
                    <ArgonTypography variant="caption" color="text" mb={1}>
                      {news.date}
                    </ArgonTypography>
                    <ArgonTypography variant="h6" fontWeight="bold" mb={2}>
                      {news.title}
                    </ArgonTypography>
                    <ArgonTypography variant="body2" color="text" mb={2}>
                      {news.excerpt}
                    </ArgonTypography>
                    <ArgonButton color="info" variant="text" size="small">
                      Đọc thêm →
                    </ArgonButton>
                  </ArgonBox>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </ArgonBox>

      {/* Contact Section */}
      <ArgonBox ref={contactRef} py={8} px={3} bgColor="white">
        <Container>
          <ArgonTypography variant="h3" fontWeight="bold" mb={6} textAlign="center">
            Liên hệ với chúng tôi
          </ArgonTypography>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <ArgonTypography variant="h5" fontWeight="bold" mb={3}>
                Thông tin liên hệ
              </ArgonTypography>
              <ArgonBox mb={3}>
                <ArgonBox display="flex" alignItems="center" mb={2}>
                  <Icon color="info" sx={{ mr: 2 }}>location_on</Icon>
                  <ArgonTypography variant="body1">
                    Tầng 5, Tòa nhà ABC, 123 Đường XYZ, Quận 1, TP.HCM
                  </ArgonTypography>
                </ArgonBox>
                <ArgonBox display="flex" alignItems="center" mb={2}>
                  <Icon color="info" sx={{ mr: 2 }}>phone</Icon>
                  <ArgonTypography variant="body1">
                    Hotline: 1900 1234
                  </ArgonTypography>
                </ArgonBox>
                <ArgonBox display="flex" alignItems="center" mb={2}>
                  <Icon color="info" sx={{ mr: 2 }}>email</Icon>
                  <ArgonTypography variant="body1">
                    support@kidslink.vn
                  </ArgonTypography>
                </ArgonBox>
                <ArgonBox display="flex" alignItems="center">
                  <Icon color="info" sx={{ mr: 2 }}>schedule</Icon>
                  <ArgonTypography variant="body1">
                    Thứ 2 - Thứ 6: 8:00 - 17:30
                  </ArgonTypography>
                </ArgonBox>
              </ArgonBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <ArgonBox p={4}>
                  <ArgonTypography variant="h6" fontWeight="bold" mb={3}>
                    Gửi tin nhắn
                  </ArgonTypography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <ArgonBox mb={3}>
                        <ArgonTypography variant="caption" color="text" mb={1}>
                          Họ và tên *
                        </ArgonTypography>
                        <ArgonBox
                          component="input"
                          type="text"
                          placeholder="Nhập họ tên"
                          sx={{
                            width: "100%",
                            p: 1.5,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            "&:focus": { outline: "none", borderColor: "info.main" }
                          }}
                        />
                      </ArgonBox>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ArgonBox mb={3}>
                        <ArgonTypography variant="caption" color="text" mb={1}>
                          Email *
                        </ArgonTypography>
                        <ArgonBox
                          component="input"
                          type="email"
                          placeholder="Nhập email"
                          sx={{
                            width: "100%",
                            p: 1.5,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            "&:focus": { outline: "none", borderColor: "info.main" }
                          }}
                        />
                      </ArgonBox>
                    </Grid>
                    <Grid item xs={12}>
                      <ArgonBox mb={3}>
                        <ArgonTypography variant="caption" color="text" mb={1}>
                          Tin nhắn *
                        </ArgonTypography>
                        <ArgonBox
                          component="textarea"
                          placeholder="Nhập tin nhắn của bạn"
                          rows={4}
                          sx={{
                            width: "100%",
                            p: 1.5,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            resize: "vertical",
                            "&:focus": { outline: "none", borderColor: "info.main" }
                          }}
                        />
                      </ArgonBox>
                    </Grid>
                    <Grid item xs={12}>
                      <ArgonButton color="info" variant="contained" fullWidth>
                        Gửi tin nhắn
                      </ArgonButton>
                    </Grid>
                  </Grid>
                </ArgonBox>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </ArgonBox>

      {/* Stats */}
      <ArgonBox py={6} px={3} bgColor="white">
        <Container>
          <Grid container spacing={3} textAlign="center">
            {[
              { value: "1,200+", label: "Trường mầm non" },
              { value: "20,000+", label: "Giáo viên" },
              { value: "150,000+", label: "Phụ huynh" }
            ].map((s) => (
              <Grid item xs={12} md={4} key={s.label}>
                <ArgonTypography variant="h3" fontWeight="bold">{s.value}</ArgonTypography>
                <ArgonTypography variant="button" color="text">{s.label}</ArgonTypography>
              </Grid>
            ))}
          </Grid>
        </Container>
      </ArgonBox>

      {/* Testimonials */}
      <ArgonBox py={6} px={3}>
        <Container>
          <ArgonTypography variant="h4" fontWeight="bold" mb={3} textAlign="center">
            Câu chuyện từ khách hàng
          </ArgonTypography>
          <Grid container spacing={3}>
            {[
              {
                quote: "Ứng dụng giúp kết nối phụ huynh – nhà trường nhanh chóng, chính xác.",
                author: "Sao Việt Kindergarten"
              },
              {
                quote: "Sổ liên lạc điện tử chuyên nghiệp, phụ huynh yên tâm gửi con.",
                author: "Peace Montessori"
              },
              {
                quote: "Hệ thống hiệu quả, được phụ huynh đánh giá rất cao.",
                author: "DreamSchool"
              }
            ].map((t) => (
              <Grid item xs={12} md={4} key={t.author}>
                <Card>
                  <ArgonBox p={3}>
                    <ArgonTypography variant="body1" mb={2}>“{t.quote}”</ArgonTypography>
                    <ArgonTypography variant="button" color="text">— {t.author}</ArgonTypography>
                  </ArgonBox>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </ArgonBox>

      {/* Partners */}
      <ArgonBox py={6} px={3} bgColor="white">
        <Container>
          <ArgonTypography variant="h6" color="text" mb={3} textAlign="center">
            Khách hàng & Đối tác
          </ArgonTypography>
          <Grid container spacing={3} alignItems="center" justifyContent="center">
            {[
              logoSpotify,
              logoSlack,
              logoAsana,
              logoAtlassian,
              logoInvision
            ].map((src, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <ArgonBox component="img" src={src} alt="partner" width="100%" opacity={0.8} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </ArgonBox>

      {/* CTA */}
      <ArgonBox py={8} px={3} textAlign="center">
        <Container>
          <ArgonTypography variant="h4" fontWeight="bold" mb={2}>
            Sẵn sàng chuyên nghiệp hóa vận hành mầm non?
          </ArgonTypography>
          <ArgonTypography variant="body1" color="text" mb={3}>
            Đăng nhập để bắt đầu
          </ArgonTypography>
          <ArgonBox display="flex" justifyContent="center" gap={2}>
            <ArgonButton color="info" onClick={goLogin}>
              Đăng nhập
            </ArgonButton>

          </ArgonBox>
        </Container>
      </ArgonBox>
    </PageLayout>
  );
}

export default Landing;


