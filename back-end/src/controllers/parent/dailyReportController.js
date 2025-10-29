const DailyReport = require('../../models/DailyReport');

// GET /parent/daily-reports?student_id=...
async function getDailyReports(req, res) {
  try {
    const { student_id } = req.query;

    if (!student_id) {
      return res.status(400).json({ error: 'student_id là bắt buộc' });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(student_id)) {
      return res.status(400).json({ error: 'student_id không hợp lệ' });
    }

    const query = { student_id };

    const reports = await DailyReport.find(query)
      .sort({ report_date: -1 })
      .populate({ path: 'teacher_checkin_id', populate: { path: 'user_id', select: 'full_name avatar_url' } })
      .populate({ path: 'teacher_checkout_id', populate: { path: 'user_id', select: 'full_name avatar_url' } })
      .lean();

    // Attach health notices for the same day for the student
    const HealthNotice = require('../../models/HealthNotice');
    const reportsWithHealth = await Promise.all(reports.map(async (r) => {
      // Use local day boundaries to avoid UTC date-shift issues
      const d = new Date(r.report_date);
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, 0);
      const notices = await HealthNotice.find({
        student_id: r.student_id,
        createdAt: { $gte: dayStart, $lt: dayEnd }
      })
      .populate({ path: 'health_care_staff_id', populate: { path: 'user_id', select: 'full_name avatar_url' } })
      .lean();
      return { ...r, health_notices: notices };
    }));

    return res.json({ success: true, data: reportsWithHealth });
  } catch (err) {
    console.error('Parent getDailyReports error:', err);
    return res.status(500).json({ error: 'Lỗi server khi lấy daily reports', details: err.message });
  }
}

module.exports = { getDailyReports };


