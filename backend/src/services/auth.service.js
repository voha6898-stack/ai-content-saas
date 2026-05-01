const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    const err = new Error('Email đã được sử dụng');
    err.statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password });
  const token = signToken(user._id);

  return { token, user: user.toSafeObject() };
};

const login = async ({ email, password }) => {
  // Lấy kèm password (bị select: false)
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    const err = new Error('Email hoặc mật khẩu không đúng');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Email hoặc mật khẩu không đúng');
    err.statusCode = 401;
    throw err;
  }

  const token = signToken(user._id);
  return { token, user: user.toSafeObject() };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('Người dùng không tồn tại');
    err.statusCode = 404;
    throw err;
  }
  return user.toSafeObject();
};

module.exports = { register, login, getMe };
