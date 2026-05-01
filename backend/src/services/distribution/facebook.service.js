const axios  = require('axios');
const fs     = require('fs');
const FormData = require('form-data');

const FB_API     = 'https://graph.facebook.com/v20.0';
const PAGE_ID    = () => process.env.FACEBOOK_PAGE_ID;
const PAGE_TOKEN = () => process.env.FACEBOOK_PAGE_TOKEN;

/**
 * Đăng text post lên Facebook Page
 */
const postText = async ({ content, options = {} }) => {
  const message = [
    content.output.caption,
    '',
    content.output.hashtags.join(' '),
  ].join('\n');

  const res = await axios.post(`${FB_API}/${PAGE_ID()}/feed`, {
    message,
    published: options.published !== false,
    ...(options.scheduledPublishTime && {
      published: false,
      scheduled_publish_time: Math.floor(new Date(options.scheduledPublishTime).getTime() / 1000),
    }),
    access_token: PAGE_TOKEN(),
  });

  const postId = res.data.id;
  return {
    postId,
    postUrl: `https://facebook.com/${postId.replace('_', '/posts/')}`,
  };
};

/**
 * Đăng video lên Facebook Page
 */
const postVideo = async ({ content, videoPath, options = {} }) => {
  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error('Video file không tồn tại: ' + videoPath);
  }

  const form = new FormData();
  form.append('title',       content.output.title.substring(0, 255));
  form.append('description', `${content.output.caption}\n${content.output.hashtags.join(' ')}`);
  form.append('access_token', PAGE_TOKEN());
  form.append('source',       fs.createReadStream(videoPath));

  const res = await axios.post(
    `${FB_API}/${PAGE_ID()}/videos`,
    form,
    { headers: form.getHeaders(), maxContentLength: Infinity, maxBodyLength: Infinity }
  );

  const videoId = res.data.id;
  return {
    postId:  videoId,
    postUrl: `https://facebook.com/video/${videoId}`,
  };
};

/**
 * Đăng ảnh lên Facebook Page
 */
const postPhoto = async ({ content, imagePath, options = {} }) => {
  const form = new FormData();
  form.append('caption',      `${content.output.caption}\n${content.output.hashtags.join(' ')}`);
  form.append('access_token', PAGE_TOKEN());
  form.append('source',       fs.createReadStream(imagePath));

  const res = await axios.post(
    `${FB_API}/${PAGE_ID()}/photos`,
    form,
    { headers: form.getHeaders() }
  );

  const photoId = res.data.id;
  return { postId: photoId, postUrl: `https://facebook.com/photo/${photoId}` };
};

/**
 * Lấy insights của post
 */
const getPostInsights = async (postId) => {
  try {
    const res = await axios.get(`${FB_API}/${postId}/insights`, {
      params: {
        metric:       'post_impressions,post_reactions_by_type_total,post_clicks',
        access_token: PAGE_TOKEN(),
      },
    });

    const data = {};
    res.data.data.forEach((m) => { data[m.name] = m.values?.[0]?.value || 0; });

    return {
      views:  data.post_impressions || 0,
      likes:  data.post_reactions_by_type_total?.like || 0,
      clicks: data.post_clicks || 0,
    };
  } catch {
    return { views: 0, likes: 0, clicks: 0 };
  }
};

module.exports = { postText, postVideo, postPhoto, getPostInsights };
