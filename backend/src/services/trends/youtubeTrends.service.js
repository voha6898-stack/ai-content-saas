const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth:    process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_CLIENT_ID, // simple API key preferred
});

/**
 * Lấy top trending videos tại Việt Nam
 * @param {string} categoryId - '' = all, '28' = Science&Tech, '22' = People&Blogs...
 */
const fetchTrendingVideos = async (categoryId = '', regionCode = 'VN', maxResults = 20) => {
  try {
    const res = await youtube.videos.list({
      part:       'snippet,statistics',
      chart:      'mostPopular',
      regionCode,
      ...(categoryId && { videoCategoryId: categoryId }),
      maxResults,
      hl:         'vi',
    });

    const items = res.data.items || [];
    return items.map((v) => {
      const stats    = v.statistics || {};
      const snippet  = v.snippet   || {};
      const viewCount = parseInt(stats.viewCount || 0);
      const age       = (Date.now() - new Date(snippet.publishedAt).getTime()) / 3600000; // hours
      const velocity  = age > 0 ? Math.min(100, Math.round(viewCount / age / 1000)) : 50; // k views/hour

      return {
        keyword:    snippet.title || '',
        description: snippet.description?.substring(0, 200) || '',
        url:        `https://youtube.com/watch?v=${v.id}`,
        imageUrl:   snippet.thumbnails?.medium?.url || null,
        source:     'youtube_trending',
        region:     regionCode,
        rawData: {
          videoId:      v.id,
          channelTitle: snippet.channelTitle,
          viewCount,
          likeCount:    parseInt(stats.likeCount || 0),
          commentCount: parseInt(stats.commentCount || 0),
          publishedAt:  snippet.publishedAt,
          tags:         snippet.tags || [],
          categoryId:   snippet.categoryId,
        },
        velocity, // views per hour (normalized 0-100)
      };
    });
  } catch (err) {
    console.error('YouTube Trends fetch error:', err.message);
    return [];
  }
};

module.exports = { fetchTrendingVideos };
