const { v2: cloudinary } = require('cloudinary');

// Cloudinary hỗ trợ cấu hình bằng biến môi trường CLOUDINARY_URL chuẩn:
// CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
// Nếu biến này tồn tại, cloudinary sẽ tự parse; ta vẫn gọi config() để nạp.
cloudinary.config({
  secure: true
});

const DEFAULT_UPLOAD_TRANSFORMATION = Object.freeze([{ quality: 'auto:eco', fetch_format: 'auto' }]);
const originalUpload = cloudinary.uploader.upload.bind(cloudinary.uploader);

/**
 * Gộp transformation mặc định để giảm chất lượng ảnh và dùng định dạng tối ưu.
 * Nếu người gọi đã chỉ định quality hoặc fetch_format, ta giữ nguyên.
 */
function mergeUploadOptions(options = {}) {
  const mergedOptions = { ...options };
  const transformation = options.transformation;

  if (!transformation) {
    mergedOptions.transformation = [...DEFAULT_UPLOAD_TRANSFORMATION];
    return mergedOptions;
  }

  const qualityAlreadySet = (step) => step && (step.quality || step.fetch_format);

  if (Array.isArray(transformation)) {
    const hasQualityStep = transformation.some(qualityAlreadySet);
    if (!hasQualityStep) {
      mergedOptions.transformation = [...transformation, ...DEFAULT_UPLOAD_TRANSFORMATION];
    }
    return mergedOptions;
  }

  if (typeof transformation === 'object') {
    if (!qualityAlreadySet(transformation)) {
      mergedOptions.transformation = { ...transformation, ...DEFAULT_UPLOAD_TRANSFORMATION[0] };
    }
    return mergedOptions;
  }

  mergedOptions.transformation = [...DEFAULT_UPLOAD_TRANSFORMATION];
  return mergedOptions;
}

cloudinary.uploader.upload = function uploadWithDefaults(file, options, callback) {
  let opts = options;
  let cb = callback;

  if (typeof opts === 'function') {
    cb = opts;
    opts = undefined;
  }

  const mergedOptions = mergeUploadOptions(opts || {});
  return originalUpload(file, mergedOptions, cb);
};

if (!process.env.CLOUDINARY_URL) {
  console.warn('⚠️ CLOUDINARY_URL chưa được cấu hình. Upload ảnh sẽ thất bại.');
}

module.exports = cloudinary;





