import React, { useEffect } from 'react';
import { useAuth } from 'context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

const TeacherRedirectTest = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra nếu user đã đăng nhập và có role teacher
    if (isAuthenticated() && user?.role === 'teacher') {
      console.log('✅ Teacher đã đăng nhập thành công!');
      console.log('👤 User info:', user);
      console.log('🔗 Sẽ chuyển hướng đến /teacher');
    } else if (isAuthenticated() && user?.role !== 'teacher') {
      console.log('❌ User không phải teacher, role hiện tại:', user?.role);
    } else {
      console.log('❌ User chưa đăng nhập');
    }
  }, [user, isAuthenticated]);

  return (
    <ArgonBox p={3}>
      <ArgonTypography variant="h6" color="success" mb={2}>
        🎉 Teacher Dashboard Test
      </ArgonTypography>
      
      <ArgonBox mb={2}>
        <ArgonTypography variant="body1">
          <strong>Trạng thái đăng nhập:</strong> {isAuthenticated() ? '✅ Đã đăng nhập' : '❌ Chưa đăng nhập'}
        </ArgonTypography>
      </ArgonBox>
      
      <ArgonBox mb={2}>
        <ArgonTypography variant="body1">
          <strong>Role hiện tại:</strong> {user?.role || 'Không xác định'}
        </ArgonTypography>
      </ArgonBox>
      
      <ArgonBox mb={2}>
        <ArgonTypography variant="body1">
          <strong>Tên user:</strong> {user?.name || 'Không xác định'}
        </ArgonTypography>
      </ArgonBox>
      
      <ArgonBox mb={2}>
        <ArgonTypography variant="body1">
          <strong>URL hiện tại:</strong> {window.location.pathname}
        </ArgonTypography>
      </ArgonBox>
      
      {isAuthenticated() && user?.role === 'teacher' ? (
        <ArgonBox p={2} bgColor="success.light" borderRadius={1}>
          <ArgonTypography variant="body2" color="success.dark">
            ✅ Thành công! Teacher đã được chuyển hướng đến trang Teacher Dashboard.
          </ArgonTypography>
        </ArgonBox>
      ) : (
        <ArgonBox p={2} bgColor="error.light" borderRadius={1}>
          <ArgonTypography variant="body2" color="error.dark">
            ❌ Lỗi! User không có quyền truy cập trang Teacher Dashboard.
          </ArgonTypography>
        </ArgonBox>
      )}
    </ArgonBox>
  );
};

export default TeacherRedirectTest;
