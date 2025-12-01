const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const ConversationParticipant = require('../models/ConversationParticipant');
const Message = require('../models/Message');
const User = require('../models/User');
const Class = require('../models/Class');
const Teacher = require('../models/Teacher');
const StudentClass = require('../models/StudentClass');
const ParentStudent = require('../models/ParentStudent');
const Parent = require('../models/Parent');
const cloudinary = require('../utils/cloudinary');

// Tạo cuộc trò chuyện mới
exports.createConversation = async (req, res) => {
  try {
    let { class_id, title } = req.body;
    const user_id = req.user.id;

    // Kiểm tra class có tồn tại không
    const classExists = await Class.findById(class_id);
    if (!classExists) {
      return res.status(404).json({ error: 'Lớp học không tồn tại' });
    }

    // Tạo conversation (không phải nhóm lớp)
    const conversation = new Conversation({
      title: title || `${classExists.class_name} - Chat`,
      class_id: class_id,
      is_class_group: false,
      create_at: new Date(),
      last_message_at: new Date()
    });
    await conversation.save();

    // Thêm user hiện tại vào conversation
    const participant = new ConversationParticipant({
      user_id: user_id,
      conversation_id: conversation._id
    });
    await participant.save();

    // Populate thông tin
    await conversation.populate('class_id', 'class_name');

    res.status(201).json({
      message: 'Tạo cuộc trò chuyện thành công',
      conversation
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Lỗi khi tạo cuộc trò chuyện', details: error.message });
  }
};

// Thêm người tham gia vào conversation
exports.addParticipant = async (req, res) => {
  try {
    const { conversation_id, user_id } = req.body;
    const current_user_id = req.user.id;

    // Kiểm tra conversation có tồn tại không
    const conversation = await Conversation.findById(conversation_id);
    if (!conversation) {
      return res.status(404).json({ error: 'Cuộc trò chuyện không tồn tại' });
    }

    // Kiểm tra user hiện tại có trong conversation không
    const currentParticipant = await ConversationParticipant.findOne({
      conversation_id: conversation_id,
      user_id: current_user_id
    });
    if (!currentParticipant) {
      return res.status(403).json({ error: 'Bạn không có quyền thêm người tham gia' });
    }

    // Kiểm tra user cần thêm có tồn tại không
    const userExists = await User.findById(user_id);
    if (!userExists) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }

    // Kiểm tra đã tham gia chưa
    const existingParticipant = await ConversationParticipant.findOne({
      conversation_id: conversation_id,
      user_id: user_id
    });
    if (existingParticipant) {
      return res.status(400).json({ error: 'Người dùng đã tham gia cuộc trò chuyện này' });
    }

    // Thêm participant
    const participant = new ConversationParticipant({
      user_id: user_id,
      conversation_id: conversation_id
    });
    await participant.save();

    res.status(201).json({
      message: 'Thêm người tham gia thành công',
      participant
    });
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ error: 'Lỗi khi thêm người tham gia', details: error.message });
  }
};

// Lấy danh sách conversations của user
exports.getConversations = async (req, res) => {
  try {
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Lấy danh sách conversation_ids mà user tham gia
    const participants = await ConversationParticipant.find({ user_id })
      .select('conversation_id')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 });

    const conversationIds = participants.map(p => p.conversation_id);

    // Lấy thông tin conversations
    const conversations = await Conversation.find({
      _id: { $in: conversationIds }
    })
      .populate('class_id', 'class_name')
      .sort({ last_message_at: -1 });

    // Lấy tin nhắn cuối cùng và danh sách participants của mỗi conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await Message.findOne({
          conversation_id: conv._id
        })
          .populate('sender_id', 'full_name avatar_url')
          .sort({ send_at: -1 })
          .limit(1);

        const participants_count = await ConversationParticipant.countDocuments({
          conversation_id: conv._id
        });

        // Lấy danh sách participants để frontend có thể hiển thị tên đối phương
        const participants = await ConversationParticipant.find({ conversation_id: conv._id })
          .populate('user_id', 'full_name avatar_url role')
          .select('user_id');

        return {
          ...conv.toObject(),
          lastMessage: lastMessage || null,
          participants_count,
          participants: participants.map(p => ({
            _id: p.user_id?._id || p.user_id,
            full_name: p.user_id?.full_name,
            avatar_url: p.user_id?.avatar_url,
            role: p.user_id?.role
          }))
        };
      })
    );

    const total = await ConversationParticipant.countDocuments({ user_id });

    res.json({
      conversations: conversationsWithLastMessage,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách cuộc trò chuyện', details: error.message });
  }
};

// Lấy thông tin chi tiết conversation
exports.getConversation = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const user_id = req.user.id;

    // Kiểm tra user có tham gia conversation không
    const participant = await ConversationParticipant.findOne({
      conversation_id,
      user_id
    });
    if (!participant) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
    }

    // Lấy thông tin conversation
    const conversation = await Conversation.findById(conversation_id)
      .populate('class_id', 'class_name');

    // Lấy danh sách participants
    const participants = await ConversationParticipant.find({ conversation_id })
      .populate('user_id', 'full_name avatar_url role');

    res.json({
      conversation,
      participants
    });
  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ error: 'Lỗi khi lấy thông tin cuộc trò chuyện', details: error.message });
  }
};

// Lấy danh sách messages trong conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const user_id = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Kiểm tra user có tham gia conversation không
    const participant = await ConversationParticipant.findOne({
      conversation_id,
      user_id
    });
    if (!participant) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
    }

    // Lấy messages
    const messages = await Message.find({ conversation_id })
      .populate('sender_id', 'full_name avatar_url role')
      .sort({ send_at: -1 })
      .skip(skip)
      .limit(limit);

    // Đảo ngược để hiển thị từ cũ đến mới
    messages.reverse();

    const total = await Message.countDocuments({ conversation_id });

    res.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting messages:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách tin nhắn', details: error.message });
  }
};

// Gửi message (REST API - dùng khi cần fallback)
exports.sendMessage = async (req, res) => {
  try {
    const { conversation_id, content, image_base64 } = req.body;
    const sender_id = req.user.id;

    if ((!content || !content.trim()) && !image_base64) {
      return res.status(400).json({ error: 'Yêu cầu có nội dung hoặc ảnh' });
    }

    // Kiểm tra user có tham gia conversation không
    const participant = await ConversationParticipant.findOne({
      conversation_id,
      user_id: sender_id
    });
    if (!participant) {
      return res.status(403).json({ error: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này' });
    }

    // Nếu có ảnh, upload Cloudinary
    let uploadedImage = null;
    if (image_base64) {
      uploadedImage = await cloudinary.uploader.upload(image_base64, {
        folder: 'kidslink/messages',
        resource_type: 'image'
      });
    }

    // Tạo message
    const message = new Message({
      content: content && content.trim ? content.trim() : content,
      image_url: uploadedImage ? uploadedImage.secure_url : undefined,
      image_public_id: uploadedImage ? uploadedImage.public_id : undefined,
      conversation_id,
      sender_id,
      send_at: new Date(),
      read_status: 0
    });
    await message.save();

    // Cập nhật last_message_at của conversation
    await Conversation.findByIdAndUpdate(conversation_id, {
      last_message_at: new Date()
    });

    // Populate sender info
    await message.populate('sender_id', 'full_name avatar_url role');

    res.status(201).json({
      message: 'Gửi tin nhắn thành công',
      data: message
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Lỗi khi gửi tin nhắn', details: error.message });
  }
};

// Đánh dấu tin nhắn đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const user_id = req.user.id;

    // Kiểm tra user có tham gia conversation không
    const participant = await ConversationParticipant.findOne({
      conversation_id,
      user_id
    });
    if (!participant) {
      return res.status(403).json({ error: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
    }

    // Đánh dấu tất cả messages chưa đọc của conversation là đã đọc (trừ của chính người gửi)
    await Message.updateMany(
      {
        conversation_id,
        sender_id: { $ne: user_id },
        read_status: 0
      },
      {
        read_status: 1
      }
    );

    res.json({ message: 'Đánh dấu đã đọc thành công' });
  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Lỗi khi đánh dấu đã đọc', details: error.message });
  }
};

// Lấy số lượng tin nhắn chưa đọc
exports.getUnreadCount = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Lấy tất cả conversations mà user tham gia
    const participants = await ConversationParticipant.find({ user_id });
    const conversationIds = participants.map(p => p.conversation_id);

    // Đếm số tin nhắn chưa đọc (không phải của chính user)
    const unreadCount = await Message.countDocuments({
      conversation_id: { $in: conversationIds },
      sender_id: { $ne: user_id },
      read_status: 0
    });

    // Đếm theo từng conversation
    const unreadByConversation = await Message.aggregate([
      {
        $match: {
          conversation_id: { $in: conversationIds },
          sender_id: { $ne: new mongoose.Types.ObjectId(user_id) },
          read_status: 0
        }
      },
      {
        $group: {
          _id: '$conversation_id',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      total: unreadCount,
      byConversation: unreadByConversation
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Lỗi khi lấy số lượng tin nhắn chưa đọc', details: error.message });
  }
};

// Tạo cuộc trò chuyện riêng giữa phụ huynh và giáo viên (1-1)
exports.createDirectConversationWithTeacher = async (req, res) => {
  try {
    const requester_user_id = req.user.id;
    const requester_role = req.user.role;
    
    // Cho phép cả parent và teacher tạo conversation
    if (requester_role !== 'parent' && requester_role !== 'teacher') {
      return res.status(403).json({ error: 'Chỉ phụ huynh hoặc giáo viên mới có quyền tạo trò chuyện riêng' });
    }

    let parent_user_id, teacher_user_id, clazz;

    if (requester_role === 'parent') {
      // Logic cho parent tạo conversation với teacher
      const parent = await Parent.findOne({ user_id: requester_user_id });
      if (!parent) return res.status(404).json({ error: 'Không tìm thấy phụ huynh' });

      const parentStudents = await ParentStudent.find({ parent_id: parent._id }).select('student_id');
      let studentIds = parentStudents.map(ps => ps.student_id);
      // Nếu client chỉ định student_id, ưu tiên học sinh đó
      if (req.body.student_id) {
        const specified = req.body.student_id.toString();
        if (studentIds.some(id => id.toString() === specified)) {
          studentIds = [specified];
        }
      }
      if (studentIds.length === 0) return res.status(404).json({ error: 'Không tìm thấy học sinh liên kết' });

      // Tìm lớp mới nhất (theo academic_year) trong các lớp mà con đang/đã học
      const latestStudentClass = await StudentClass.find({ student_id: { $in: studentIds } })
        .populate('class_id')
        .sort({ 'class_id.academic_year': -1, createdAt: -1 })
        .limit(1);
      if (!latestStudentClass || latestStudentClass.length === 0 || !latestStudentClass[0].class_id) {
        return res.status(404).json({ error: 'Không tìm thấy lớp để xác định giáo viên' });
      }
      clazz = latestStudentClass[0].class_id;
      const mainTeacher = await Teacher.findById(clazz.teacher_id);
      const secondTeacher = clazz.teacher_id2 ? await Teacher.findById(clazz.teacher_id2) : null;
      if (!mainTeacher || !mainTeacher.user_id) return res.status(404).json({ error: 'Không tìm thấy giáo viên chủ nhiệm' });
      parent_user_id = requester_user_id;
      teacher_user_id = mainTeacher.user_id.toString();
      // Nếu client chỉ định giáo viên, và giáo viên đó thuộc lớp, ưu tiên giáo viên đó
      if (req.body.teacher_user_id) {
        const requested = req.body.teacher_user_id.toString();
        const validUserIds = [
          mainTeacher?.user_id?.toString(),
          secondTeacher?.user_id?.toString()
        ].filter(Boolean);
        if (validUserIds.includes(requested)) {
          teacher_user_id = requested;
        }
      }
    } else {
      // Logic cho teacher tạo conversation với parent
      const teacher = await Teacher.findOne({ user_id: requester_user_id });
      if (!teacher) return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });

      // Tìm lớp mới nhất (theo academic_year) của giáo viên
      const latestClass = await Class.find({
        $or: [
          { teacher_id: teacher._id },
          { teacher_id2: teacher._id }
        ]
      })
        .sort({ academic_year: -1, createdAt: -1 })
        .limit(1);

      if (!latestClass || latestClass.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy lớp học' });
      }
      clazz = latestClass[0];
      teacher_user_id = requester_user_id;

      // Nếu client chỉ định parent_user_id, sử dụng parent đó
      if (req.body.parent_user_id) {
        const parent = await Parent.findOne({ user_id: req.body.parent_user_id });
        if (!parent) return res.status(404).json({ error: 'Không tìm thấy phụ huynh' });
        parent_user_id = req.body.parent_user_id;
      } else {
        return res.status(400).json({ error: 'Yêu cầu parent_user_id khi giáo viên tạo conversation' });
      }
    }

    // Kiểm tra đã có conversation 1-1 giữa parent và teacher chưa (trong cùng class)
    const parentConvDocs = await ConversationParticipant.find({ user_id: parent_user_id }).select('conversation_id');
    const teacherConvDocs = await ConversationParticipant.find({ user_id: teacher_user_id }).select('conversation_id');
    const parentConvIds = new Set(parentConvDocs.map(c => c.conversation_id.toString()));
    const bothConvIds = teacherConvDocs
      .map(c => c.conversation_id.toString())
      .filter(id => parentConvIds.has(id));

    if (bothConvIds.length > 0) {
      const candidates = await Conversation.find({ _id: { $in: bothConvIds }, class_id: clazz._id });
      for (const conv of candidates) {
        const count = await ConversationParticipant.countDocuments({ conversation_id: conv._id });
        if (count === 2) {
          // Populate participants để trả về cho frontend
          const participants = await ConversationParticipant.find({ conversation_id: conv._id })
            .populate('user_id', 'full_name avatar_url role')
            .select('user_id');

          const conversationObj = conv.toObject();
          conversationObj.participants_count = 2;
          conversationObj.participants = participants.map(p => ({
            _id: p.user_id?._id || p.user_id,
            full_name: p.user_id?.full_name,
            avatar_url: p.user_id?.avatar_url,
            role: p.user_id?.role
          }));

          return res.status(200).json({ message: 'Đã có cuộc trò chuyện', conversation: conversationObj });
        }
      }
    }

    // Tạo conversation mới thuộc lớp mới nhất, tiêu đề: "Tên parent - Tên teacher"
    const teacherUserDoc = await User.findById(teacher_user_id).select('full_name');
    const parentUserDoc = await User.findById(parent_user_id).select('full_name');
    const teacherName = teacherUserDoc?.full_name || 'Giáo viên';
    const parentName = parentUserDoc?.full_name || 'Phụ huynh';
    const title = `${parentName} - ${teacherName}`;
    const conversation = new Conversation({
      title,
      class_id: clazz._id,
      is_class_group: false,
      create_at: new Date(),
      last_message_at: new Date()
    });
    await conversation.save();

    // Thêm 2 participants: parent và teacher
    await ConversationParticipant.create({ user_id: parent_user_id, conversation_id: conversation._id });
    await ConversationParticipant.create({ user_id: teacher_user_id, conversation_id: conversation._id });

    // Populate participants để trả về cho frontend
    const participants = await ConversationParticipant.find({ conversation_id: conversation._id })
      .populate('user_id', 'full_name avatar_url role')
      .select('user_id');

    const conversationObj = conversation.toObject();
    conversationObj.participants_count = 2;
    conversationObj.participants = participants.map(p => ({
      _id: p.user_id?._id || p.user_id,
      full_name: p.user_id?.full_name,
      avatar_url: p.user_id?.avatar_url,
      role: p.user_id?.role
    }));

    res.status(201).json({ message: 'Tạo trò chuyện thành công', conversation: conversationObj });
  } catch (error) {
    console.error('Error creating direct conversation:', error);
    res.status(500).json({ error: 'Lỗi khi tạo trò chuyện', details: error.message });
  }
};

// Lấy danh sách giáo viên của lớp mới nhất theo student
exports.getTeachersByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const latestStudentClass = await StudentClass.find({ student_id })
      .populate('class_id')
      .sort({ 'class_id.academic_year': -1, createdAt: -1 })
      .limit(1);
    if (!latestStudentClass || latestStudentClass.length === 0 || !latestStudentClass[0].class_id) {
      return res.status(404).json({ error: 'Không tìm thấy lớp' });
    }
    const clazz = latestStudentClass[0].class_id;
    const teachers = [];
    if (clazz.teacher_id) {
      const t = await Teacher.findById(clazz.teacher_id).populate({ path: 'user_id', select: 'full_name avatar_url' });
      if (t && t.user_id) teachers.push({ teacher_id: t._id, user_id: t.user_id._id, full_name: t.user_id.full_name, avatar_url: t.user_id.avatar_url, role: 'main' });
    }
    if (clazz.teacher_id2) {
      const t2 = await Teacher.findById(clazz.teacher_id2).populate({ path: 'user_id', select: 'full_name avatar_url' });
      if (t2 && t2.user_id) teachers.push({ teacher_id: t2._id, user_id: t2.user_id._id, full_name: t2.user_id.full_name, avatar_url: t2.user_id.avatar_url, role: 'assistant' });
    }
    res.json({ class: { _id: clazz._id, class_name: clazz.class_name, academic_year: clazz.academic_year }, teachers });
  } catch (error) {
    console.error('Error getTeachersByStudent:', error);
    res.status(500).json({ error: 'Lỗi khi lấy giáo viên', details: error.message });
  }
};

// Tạo nhóm chat cho lớp (chỉ dành cho giáo viên)
exports.createClassChatGroup = async (req, res) => {
  try {
    let { class_id, title } = req.body;
    const user_id = req.user.id;

    // Kiểm tra user là giáo viên
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Chỉ giáo viên mới có quyền tạo nhóm chat cho lớp' });
    }

    // Lấy thông tin giáo viên
    const teacher = await Teacher.findOne({ user_id });
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });
    }

    // Nếu không truyền class_id: tự động chọn lớp mới nhất theo academic_year của giáo viên
    if (!class_id) {
      const latestClass = await Class.find({
        $or: [
          { teacher_id: teacher._id },
          { teacher_id2: teacher._id }
        ]
      })
        .sort({ academic_year: -1, createdAt: -1 })
        .limit(1);
      if (!latestClass || latestClass.length === 0) {
        return res.status(404).json({ error: 'Không tìm thấy lớp phù hợp để tạo nhóm' });
      }
      class_id = latestClass[0]._id;
      // Nếu không truyền title, dùng tên lớp
      if (!title) {
        title = `Nhóm chat - ${latestClass[0].class_name}`;
      }
    }

    // Kiểm tra lớp học có tồn tại và giáo viên có quyền với lớp không
    const classExists = await Class.findOne({
      _id: class_id,
      $or: [
        { teacher_id: teacher._id },
        { teacher_id2: teacher._id }
      ]
    }).populate('teacher_id').populate('teacher_id2');

    if (!classExists) {
      return res.status(404).json({ error: 'Lớp học không tồn tại hoặc bạn không có quyền truy cập' });
    }

    // Kiểm tra lớp đã có nhóm chat chưa (chỉ xét các conversation là nhóm lớp)
    const existingConversation = await Conversation.findOne({ class_id, is_class_group: true });
    if (existingConversation) {
      // Nếu đã có, chỉ đảm bảo giáo viên hiện tại là thành viên (không đồng bộ lại toàn bộ phụ huynh)
      const existingParticipant = await ConversationParticipant.findOne({
        conversation_id: existingConversation._id,
        user_id
      });

      if (!existingParticipant) {
        await ConversationParticipant.create({
          user_id,
          conversation_id: existingConversation._id
        });
      }

      await existingConversation.populate('class_id', 'class_name');

      const participantsCountExisting = await ConversationParticipant.countDocuments({
        conversation_id: existingConversation._id
      });

      return res.status(200).json({
        message: 'Lớp học đã có nhóm chat. Bạn đã được thêm vào nhóm.',
        conversation: {
          ...existingConversation.toObject(),
          participants_count: participantsCountExisting
        }
      });
    }

    // Tạo conversation mới (nhóm chat lớp)
    const conversation = new Conversation({
      title: title || `Nhóm chat - ${classExists.class_name}`,
      class_id: class_id,
      is_class_group: true,
      create_at: new Date(),
      last_message_at: new Date()
    });
    await conversation.save();

    // Danh sách user_ids cần thêm vào conversation
    const participantUserIds = new Set();

    // 1. Thêm giáo viên chính
    if (classExists.teacher_id && classExists.teacher_id.user_id) {
      participantUserIds.add(classExists.teacher_id.user_id.toString());
    }

    // 2. Thêm giáo viên phụ (nếu có)
    if (classExists.teacher_id2 && classExists.teacher_id2.user_id) {
      participantUserIds.add(classExists.teacher_id2.user_id.toString());
    }

    // 3. Lấy tất cả học sinh trong lớp
    const studentClasses = await StudentClass.find({ class_id }).populate('student_id');
    const studentIds = studentClasses
      .filter(sc => sc.student_id)
      .map(sc => sc.student_id._id);

    // 4. Lấy tất cả phụ huynh của các học sinh trong lớp
    if (studentIds.length > 0) {
      const parentStudents = await ParentStudent.find({
        student_id: { $in: studentIds }
      }).populate('parent_id');

      // Lấy user_id của các phụ huynh
      parentStudents.forEach(ps => {
        if (ps.parent_id && ps.parent_id.user_id) {
          participantUserIds.add(ps.parent_id.user_id.toString());
        }
      });
    }

    // Thêm tất cả participants vào conversation
    const participantPromises = Array.from(participantUserIds).map(user_id_str => {
      return ConversationParticipant.create({
        user_id: user_id_str,
        conversation_id: conversation._id
      }).catch(err => {
        // Bỏ qua lỗi duplicate (có thể xảy ra nếu user_id trùng lặp)
        if (err.code !== 11000) {
          console.error('Error creating participant:', err);
        }
      });
    });

    await Promise.all(participantPromises);

    // Populate thông tin conversation
    await conversation.populate('class_id', 'class_name');

    // Lấy số lượng participants
    const participantsCount = await ConversationParticipant.countDocuments({
      conversation_id: conversation._id
    });

    // Thông báo qua socket cho tất cả participants về nhóm chat mới
    // (Có thể implement sau nếu cần)

    res.status(201).json({
      message: 'Tạo nhóm chat cho lớp thành công',
      conversation: {
        ...conversation.toObject(),
        participants_count: participantsCount
      }
    });
  } catch (error) {
    console.error('Error creating class chat group:', error);
    res.status(500).json({
      error: 'Lỗi khi tạo nhóm chat cho lớp',
      details: error.message
    });
  }
};

// Lấy danh sách phụ huynh theo lớp của giáo viên (lớp có academic_year mới nhất)
exports.getParentsByTeacherClass = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Kiểm tra user là giáo viên
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ error: 'Chỉ giáo viên mới có quyền xem danh sách phụ huynh' });
    }

    // Lấy thông tin giáo viên
    const teacher = await Teacher.findOne({ user_id });
    if (!teacher) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin giáo viên' });
    }

    // Tìm lớp mới nhất (theo academic_year) của giáo viên
    const latestClass = await Class.find({
      $or: [
        { teacher_id: teacher._id },
        { teacher_id2: teacher._id }
      ]
    })
      .sort({ academic_year: -1, createdAt: -1 })
      .limit(1);

    if (!latestClass || latestClass.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy lớp học' });
    }

    const clazz = latestClass[0];

    // Lấy tất cả học sinh trong lớp
    const studentClasses = await StudentClass.find({ class_id: clazz._id })
      .populate('student_id', 'full_name avatar_url');
    const studentIds = studentClasses
      .filter(sc => sc.student_id)
      .map(sc => sc.student_id._id);

    if (studentIds.length === 0) {
      return res.json({ 
        class: { _id: clazz._id, class_name: clazz.class_name, academic_year: clazz.academic_year },
        parents: [] 
      });
    }

    // Lấy tất cả phụ huynh của các học sinh trong lớp
    const parentStudents = await ParentStudent.find({
      student_id: { $in: studentIds }
    }).populate({
      path: 'parent_id',
      populate: {
        path: 'user_id',
        select: 'full_name avatar_url'
      }
    });

    // Tạo map để loại bỏ duplicate (một phụ huynh có thể có nhiều con trong cùng lớp)
    const parentMap = new Map();
    parentStudents.forEach(ps => {
      if (ps.parent_id && ps.parent_id.user_id) {
        const parentUserId = ps.parent_id.user_id._id.toString();
        if (!parentMap.has(parentUserId)) {
          parentMap.set(parentUserId, {
            parent_id: ps.parent_id._id,
            user_id: ps.parent_id.user_id._id,
            full_name: ps.parent_id.user_id.full_name,
            avatar_url: ps.parent_id.user_id.avatar_url
          });
        }
      }
    });

    const parents = Array.from(parentMap.values());

    res.json({
      class: {
        _id: clazz._id,
        class_name: clazz.class_name,
        academic_year: clazz.academic_year
      },
      parents: parents
    });
  } catch (error) {
    console.error('Error getParentsByTeacherClass:', error);
    res.status(500).json({ error: 'Lỗi khi lấy danh sách phụ huynh', details: error.message });
  }
};
