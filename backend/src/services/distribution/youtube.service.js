const { google } = require('googleapis');
const fs = require('fs');

const getYouTubeClient = () => {
  const auth = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.YOUTUBE_REFRESH_TOKEN });
  return google.youtube({ version: 'v3', auth });
};

/**
 * Đăng video lên YouTube
 * @param {object} job - { content, videoPath, options }
 */
const postVideo = async ({ content, videoPath, options = {} }) => {
  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error('Video file không tồn tại: ' + videoPath);
  }

  const youtube = getYouTubeClient();

  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title:       content.output.title.substring(0, 100),
        description: `${content.output.caption}\n\n${content.output.hashtags.join(' ')}`,
        tags:        content.output.hashtags.map((h) => h.replace('#', '')),
        categoryId:  options.categoryId || '22', // People & Blogs
        defaultLanguage: 'vi',
      },
      status: {
        privacyStatus: options.privacy || 'public',
        selfDeclaredMadeForKids: false,
      },
    },
    media: {
      body: fs.createReadStream(videoPath),
    },
  });

  const videoId = response.data.id;
  return {
    postId:  videoId,
    postUrl: `https://youtube.com/watch?v=${videoId}`,
  };
};

/**
 * Đăng text-only (Community post) — chỉ dành cho kênh đủ điều kiện
 */
const postText = async ({ content, options = {} }) => {
  const youtube = getYouTubeClient();

  // YouTube không có API community post công khai —
  // trả về mock để không crash, sẽ implement khi API mở
  throw new Error('YouTube Community Post chưa có public API. Hãy upload video thay thế.');
};

/**
 * Lấy thống kê video
 */
const getVideoStats = async (videoId) => {
  const youtube = getYouTubeClient();

  const res = await youtube.videos.list({
    part: ['statistics'],
    id:   [videoId],
  });

  const stats = res.data.items?.[0]?.statistics || {};
  return {
    views:    parseInt(stats.viewCount    || 0),
    likes:    parseInt(stats.likeCount    || 0),
    comments: parseInt(stats.commentCount || 0),
  };
};

module.exports = { postVideo, postText, getVideoStats };
