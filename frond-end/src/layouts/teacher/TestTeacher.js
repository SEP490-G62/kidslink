import React from 'react';
import ArgonBox from 'components/ArgonBox';
import ArgonTypography from 'components/ArgonTypography';

const TestTeacher = () => {
  return (
    <ArgonBox p={3}>
      <ArgonTypography variant="h4" color="success">
        ✅ Teacher Component đang hoạt động!
      </ArgonTypography>
      <ArgonTypography variant="body1" mt={2}>
        Nếu bạn thấy thông báo này, có nghĩa là Teacher component đã được load thành công.
      </ArgonTypography>
    </ArgonBox>
  );
};

export default TestTeacher;

