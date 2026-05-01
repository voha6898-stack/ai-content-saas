const axios = require('axios');
const fs    = require('fs');

const TIKTOK_API = 'https://open.tiktokapis.com/v2';

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`,
  'Content-Type': 'application/json; charset=UTF-8',
});

/**
 * Đăng video lên TikTok (Content Posting API v2)
 * Flow: init → upload to uploadUrl → poll status
 */
const postVideo = async ({ content, videoPath, options = {} }) => {
  if (!videoPath || !fs.existsSync(videoPath)) {
    throw new Error('Video file không tồn tại: ' + videoPath);
  }

  const fileSize = fs.statSync(videoPath).size;

  // Step 1: Khởi tạo upload
  const initRes = await axios.post(
    `${TIKTOK_API}/post/publish/video/init/`,
    {
      post_info: {
        title:           content.output.title.substring(0, 150),
        privacy_level:   options.privacy || 'PUBLIC_TO_EVERYONE',
        disable_duet:    false,
        disable_comment: false,
        disable_stitch:  false,
        video_cover_timestamp_ms: 1000,
      },
      source_info: {
        source:     'FILE_UPLOAD',
        video_size: fileSize,
        chunk_size: fileSize,
        total_chunk_count: 1,
      },
    },
    { headers: getHeaders() }
  );

  const { publish_id, upload_url } = initRes.data.data;

  // Step 2: Upload video bytes
  const videoBuffer = fs.readFileSync(videoPath);
  await axios.put(upload_url, videoBuffer, {
    headers: {
      'Content-Type':  'video/mp4',
      'Content-Range': `bytes 0-${fileSize - 1}/${fileSize}`,
      'Content-Length': fileSize,
    },
  });

  // Step 3: Poll status
  const postId = await pollStatus(publish_id);

  return {
    postId,
    postUrl: `https://www.tiktok.com/@me/video/${postId}`,
  };
};

const pollStatus = async (publishId, maxAttempts = 30) => {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 4000));

    const res = await axios.post(
      `${TIKTOK_API}/post/publish/status/fetch/`,
      { publish_id: publishId },
      { headers: getHeaders() }
    );

    const { status, publicaly_available_post_id, fail_reason } = res.data.data;

    if (status === 'PUBLISH_COMPLETE') {
      return publicaly_available_post_id?.[0] || publishId;
    }
    if (status === 'FAILED') {
      throw new Error(`TikTok upload failed: ${fail_reason}`);
    }
    // PROCESSING_UPLOAD / PROCESSING_DOWNLOAD → tiếp tục poll
  }
  throw new Error('TikTok upload timeout sau 2 phút');
};

/**
 * Đăng photos carousel lên TikTok
 */
const postPhotos = async ({ content, imagePaths = [], options = {} }) => {
  const initRes = await axios.post(
    `${TIKTOK_API}/post/publish/content/init/`,
    {
      post_info: {
        title:         content.output.caption.substring(0, 150),
        privacy_level: options.privacy || 'PUBLIC_TO_EVERYONE',
        photo_cover_index: 0,
      },
      source_info: {
        source:      'FILE_UPLOAD',
        photo_count: imagePaths.length,
      },
    },
    { headers: getHeaders() }
  );

  const { publish_id, photo_upload_urls } = initRes.data.data;

  // Upload từng ảnh
  await Promise.all(
    imagePaths.map(async (imgPath, i) => {
      const buf = fs.readFileSync(imgPath);
      await axios.put(photo_upload_urls[i].upload_url, buf, {
        headers: { 'Content-Type': 'image/jpeg', 'Content-Length': buf.length },
      });
    })
  );

  const postId = await pollStatus(publish_id);
  return { postId, postUrl: `https://www.tiktok.com/@me/video/${postId}` };
};

module.exports = { postVideo, postPhotos };
