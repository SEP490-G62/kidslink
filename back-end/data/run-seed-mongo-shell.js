const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Lấy MongoDB URI từ .env hoặc giá trị mặc định
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/kidslink';

// Parse database name từ URI
function getDatabaseName(uri) {
  // Format: mongodb://host:port/database hoặc mongodb://host:port/database?options
  const match = uri.match(/mongodb:\/\/[^\/]+\/([^?]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Nếu không tìm thấy, thử lấy từ connection string khác
  const parts = uri.split('/');
  if (parts.length > 0) {
    const dbPart = parts[parts.length - 1].split('?')[0];
    if (dbPart && dbPart !== '') {
      return dbPart;
    }
  }
  return 'kidslink'; // Mặc định
}

const databaseName = getDatabaseName(mongoUri);
const scriptPath = path.join(__dirname, 'seed-sample-mongo-shell.js');

// Kiểm tra file script có tồn tại không
if (!fs.existsSync(scriptPath)) {
  console.error('❌ Không tìm thấy file script:', scriptPath);
  process.exit(1);
}

console.log('📊 Đang kết nối đến MongoDB...');
console.log(`📍 Database: ${databaseName}`);
console.log(`📝 Script: ${scriptPath}`);
console.log('');

// Hàm kiểm tra command có tồn tại không
function checkCommandExists(command) {
  return new Promise((resolve) => {
    const checkCmd = process.platform === 'win32' ? 'where' : 'which';
    const checkProcess = spawn(checkCmd, [command], { 
      shell: true,
      stdio: 'pipe'
    });

    checkProcess.on('close', (code) => {
      resolve(code === 0);
    });

    checkProcess.on('error', () => {
      resolve(false);
    });
  });
}

// Hàm chạy MongoDB shell
function runMongoShell(command, dbName, scriptPath) {
  console.log(`🔧 Sử dụng: ${command}`);
  console.log('');

  const mongoProcess = spawn(command, [dbName, scriptPath], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname
  });

  mongoProcess.on('error', (error) => {
    console.error('❌ Lỗi khi chạy MongoDB shell:', error.message);
    console.error('');
    console.error('💡 Hãy đảm bảo:');
    console.error('   1. MongoDB đã được cài đặt');
    console.error('   2. mongosh hoặc mongo đã được thêm vào PATH');
    console.error('   3. MongoDB service đang chạy');
    process.exit(1);
  });

  mongoProcess.on('close', (code) => {
    if (code === 0) {
      console.log('');
      console.log('✅ Hoàn thành! Dữ liệu mẫu đã được tạo thành công.');
    } else {
      console.error('');
      console.error(`❌ Script kết thúc với mã lỗi: ${code}`);
      process.exit(code);
    }
  });
}

// Thử dùng mongosh trước (MongoDB Shell mới), nếu không có thì dùng mongo
(async () => {
  const mongoshExists = await checkCommandExists('mongosh');
  const mongoExists = await checkCommandExists('mongo');

  if (mongoshExists) {
    runMongoShell('mongosh', databaseName, scriptPath);
  } else if (mongoExists) {
    console.log('⚠️  Không tìm thấy mongosh, sử dụng mongo...');
    runMongoShell('mongo', databaseName, scriptPath);
  } else {
    console.error('❌ Không tìm thấy mongosh hoặc mongo trong PATH');
    console.error('');
    console.error('💡 Hãy đảm bảo:');
    console.error('   1. MongoDB đã được cài đặt');
    console.error('   2. mongosh hoặc mongo đã được thêm vào PATH');
    console.error('   3. Trên Windows, có thể cần thêm đường dẫn MongoDB vào PATH');
    console.error('      Ví dụ: C:\\Program Files\\MongoDB\\Server\\7.0\\bin');
    process.exit(1);
  }
})();

