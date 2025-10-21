import React from 'react';
import { useAuth } from 'context/AuthContext';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

const TeacherWelcome = () => {
  const { user } = useAuth();
  
  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  return (
    <ArgonBox mb={3}>
      <ArgonBox
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 2,
          p: 3,
          color: 'white',
        }}
      >
        <ArgonTypography variant="h4" fontWeight="bold" mb={1}>
          {getCurrentTimeGreeting()}, {user?.name || 'Giáo viên'}! 👋
        </ArgonTypography>
        <ArgonTypography variant="body1" opacity={0.9}>
          Chào mừng bạn quay trở lại KidsLink. Hôm nay là một ngày tuyệt vời để dạy học!
        </ArgonTypography>
      </ArgonBox>
    </ArgonBox>
  );
};

export default TeacherWelcome;
