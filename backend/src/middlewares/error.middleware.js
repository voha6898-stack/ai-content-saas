const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Lỗi server, vui lòng thử lại sau.';

  // Log lỗi server (không log lỗi client 4xx)
  if (statusCode >= 500) {
    console.error('❌ SERVER ERROR:', err);
  }

  // Lỗi trùng key MongoDB (vd: email đã tồn tại)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} đã được sử dụng.`,
    });
  }

  // Lỗi validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  res.status(statusCode).json({ success: false, message });
};

module.exports = errorMiddleware;
