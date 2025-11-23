const jwt = require('jsonwebtoken');
const Conversation = require('../models/Conversation');
const ConversationParticipant = require('../models/ConversationParticipant');
const Message = require('../models/Message');
const User = require('../models/User');

// Lưu trữ mapping user_id -> socket_id
const userSockets = new Map();
// Lưu trữ mapping socket_id -> user_id
const socketUsers = new Map();

// Xác thực socket connection
function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token || socket.handshake.query.token;

  if (!token) {
    return next(new Error('Thiếu token xác thực'));
  }

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_change_me';
    const payload = jwt.verify(token, secret);
    socket.user = payload; // { id, role, username }
    next();
  } catch (err) {
    next(new Error('Token không hợp lệ hoặc đã hết hạn'));
  }
}

function initializeSocket(io) {
  // Middleware xác thực
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const user_id = socket.user.id;
    console.log(`User ${user_id} connected with socket ${socket.id}`);

    // Lưu mapping
    if (!userSockets.has(user_id)) {
      userSockets.set(user_id, new Set());
    }
    userSockets.get(user_id).add(socket.id);
    socketUsers.set(socket.id, user_id);

    // Join room theo user_id để có thể gửi thông báo cho user cụ thể
    socket.join(`user:${user_id}`);

    // Join các conversation rooms mà user tham gia
    // Skip cho admin user (user_id = "admin" không phải ObjectId)
    (async () => {
      try {
        // Skip nếu user_id không phải ObjectId hợp lệ (như "admin")
        if (user_id === 'admin' || !require('mongoose').Types.ObjectId.isValid(user_id)) {
          return;
        }
        const participants = await ConversationParticipant.find({ user_id });
        participants.forEach(participant => {
          socket.join(`conversation:${participant.conversation_id}`);
        });
      } catch (error) {
        console.error('Error joining conversation rooms:', error);
      }
    })();

    // Lắng nghe sự kiện gửi tin nhắn (text/ảnh)
    socket.on('send_message', async (data) => {
      try {
        const { conversation_id, content, image_base64, tempId } = data;

        if (!conversation_id) {
          socket.emit('error', { message: 'Thiếu conversation_id', tempId });
          return;
        }

        if ((!content || !content.trim()) && !image_base64) {
          socket.emit('error', { message: 'Yêu cầu có nội dung hoặc ảnh', tempId });
          return;
        }

        // Kiểm tra user có tham gia conversation không
        const participant = await ConversationParticipant.findOne({
          conversation_id,
          user_id
        });

        if (!participant) {
          socket.emit('error', { message: 'Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này', tempId });
          return;
        }

        // Upload ảnh nếu có
        let uploadedImage = null;
        if (image_base64) {
          try {
            const cloudinary = require('./cloudinary');
            uploadedImage = await cloudinary.uploader.upload(image_base64, {
              folder: 'kidslink/messages',
              resource_type: 'auto'
            });
          } catch (uploadErr) {
            console.error('Cloudinary upload error:', uploadErr);
            socket.emit('error', { message: 'Tải ảnh lên thất bại', details: uploadErr.message, tempId });
            return;
          }
        }

        // Tạo message
        const message = new Message({
          content: content && content.trim ? content.trim() : content,
          image_url: uploadedImage ? uploadedImage.secure_url : undefined,
          image_public_id: uploadedImage ? uploadedImage.public_id : undefined,
          conversation_id,
          sender_id: user_id,
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

        // Đảm bảo người gửi đã join conversation room
        socket.join(`conversation:${conversation_id}`);

        // Gửi message đến tất cả users trong conversation room (bao gồm cả người gửi)
        io.to(`conversation:${conversation_id}`).emit('new_message', {
          message: message,
          tempId
        });

        // Đảm bảo người gửi nhận được tin nhắn (emit trực tiếp để chắc chắn)
        // Frontend sẽ xử lý duplicate nếu đã nhận qua room
        socket.emit('new_message', {
          message: message,
          tempId
        });

        // Gửi thông báo đến các participants khác (trừ người gửi)
        const participants = await ConversationParticipant.find({
          conversation_id,
          user_id: { $ne: user_id }
        });

        participants.forEach(async (p) => {
          // Gửi thông báo có tin nhắn mới
          io.to(`user:${p.user_id}`).emit('new_message_notification', {
            conversation_id,
            message: message
          });
        });

        // Xác nhận gửi thành công
        socket.emit('message_sent', {
          message_id: message._id,
          conversation_id,
          tempId
        });

      } catch (error) {
        console.error('Error sending message via socket:', error);
        socket.emit('error', { message: 'Lỗi khi gửi tin nhắn', details: error.message });
      }
    });

    // Lắng nghe sự kiện đánh dấu đã đọc
    socket.on('mark_as_read', async (data) => {
      try {
        const { conversation_id } = data;

        if (!conversation_id) {
          socket.emit('error', { message: 'Thiếu conversation_id' });
          return;
        }

        // Kiểm tra user có tham gia conversation không
        const participant = await ConversationParticipant.findOne({
          conversation_id,
          user_id
        });

        if (!participant) {
          socket.emit('error', { message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
          return;
        }

        // Đánh dấu tất cả messages chưa đọc là đã đọc (trừ của chính người gửi)
        const result = await Message.updateMany(
          {
            conversation_id,
            sender_id: { $ne: user_id },
            read_status: 0
          },
          {
            read_status: 1
          }
        );

        // Thông báo cho các participants khác (optional - để cập nhật UI)
        io.to(`conversation:${conversation_id}`).emit('messages_read', {
          conversation_id,
          read_by: user_id,
          count: result.modifiedCount
        });

        socket.emit('marked_as_read', {
          conversation_id,
          count: result.modifiedCount
        });

      } catch (error) {
        console.error('Error marking as read via socket:', error);
        socket.emit('error', { message: 'Lỗi khi đánh dấu đã đọc', details: error.message });
      }
    });

    // Lắng nghe sự kiện join conversation
    socket.on('join_conversation', async (data) => {
      try {
        const { conversation_id } = data;

        if (!conversation_id) {
          socket.emit('error', { message: 'Thiếu conversation_id' });
          return;
        }

        // Kiểm tra user có tham gia conversation không
        const participant = await ConversationParticipant.findOne({
          conversation_id,
          user_id
        });

        if (!participant) {
          socket.emit('error', { message: 'Bạn không có quyền truy cập cuộc trò chuyện này' });
          return;
        }

        socket.join(`conversation:${conversation_id}`);
        socket.emit('joined_conversation', { conversation_id });

      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Lỗi khi tham gia cuộc trò chuyện', details: error.message });
      }
    });

    // Lắng nghe sự kiện leave conversation
    socket.on('leave_conversation', (data) => {
      const { conversation_id } = data;
      if (conversation_id) {
        socket.leave(`conversation:${conversation_id}`);
        socket.emit('left_conversation', { conversation_id });
      }
    });

    // Lắng nghe sự kiện typing
    socket.on('typing', async (data) => {
      try {
        const { conversation_id, is_typing } = data;

        if (!conversation_id) {
          return;
        }

        // Kiểm tra user có tham gia conversation không
        const participant = await ConversationParticipant.findOne({
          conversation_id,
          user_id
        });

        if (!participant) {
          return;
        }

        // Gửi thông báo typing đến các users khác trong conversation
        socket.to(`conversation:${conversation_id}`).emit('user_typing', {
          conversation_id,
          user_id,
          is_typing: is_typing !== false // mặc định là true
        });

      } catch (error) {
        console.error('Error handling typing:', error);
      }
    });

    // Xử lý khi disconnect
    socket.on('disconnect', () => {
      console.log(`User ${user_id} disconnected (socket ${socket.id})`);

      // Xóa mapping
      const userSocketSet = userSockets.get(user_id);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(user_id);
        }
      }
      socketUsers.delete(socket.id);
    });
  });

  return io;
}

// Hàm helper để gửi notification đến user cụ thể
function sendNotificationToUser(io, user_id, event, data) {
  const sockets = userSockets.get(user_id);
  if (sockets) {
    sockets.forEach(socket_id => {
      io.to(socket_id).emit(event, data);
    });
  }
}

module.exports = {
  initializeSocket,
  userSockets,
  socketUsers,
  sendNotificationToUser
};
