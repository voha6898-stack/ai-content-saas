const RssParser = require('rss-parser');

const parser = new RssParser({
  timeout: 10000,
  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentAI/1.0)' },
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure'],
  },
});

// Nguồn RSS Việt Nam uy tín + Reddit (tiếng Anh trends)
const RSS_SOURCES = {
  rss_vnexpress: [
    'https://vnexpress.net/rss/tin-moi-nhat.rss',
    'https://vnexpress.net/rss/kinh-doanh.rss',
    'https://vnexpress.net/rss/so-hoa.rss',
  ],
  rss_tuoitre: [
    'https://tuoitre.vn/rss/tin-moi-nhat.rss',
    'https://tuoitre.vn/rss/kinh-doanh.rss',
  ],
  rss_dantri: [
    'https://dantri.com.vn/rss/home.rss',
    'https://dantri.com.vn/rss/kinh-doanh.rss',
  ],
};

/**
 * Fetch và parse 1 RSS feed
 */
const parseFeed = async (url, sourceKey) => {
  try {
    const feed  = await parser.parseURL(url);
    const items = (feed.items || []).slice(0, 15);

    return items.map((item) => {
      const ageHours = (Date.now() - new Date(item.pubDate || item.isoDate || 0)) / 3600000;
      // Sắp xếp ưu tiên bài mới — recency score
      const recencyScore = Math.max(0, Math.min(100, Math.round(100 - ageHours * 4)));

      return {
        keyword:     item.title?.trim()  || '',
        description: item.contentSnippet?.substring(0, 200) || item.summary?.substring(0, 200) || '',
        url:         item.link           || null,
        imageUrl:    item['media:content']?.['$']?.url
                  || item.enclosure?.url
                  || null,
        source:      sourceKey,
        region:      'VN',
        rawData: {
          pubDate:    item.pubDate || item.isoDate,
          categories: item.categories || [],
          ageHours:   Math.round(ageHours),
        },
        recencyScore,
      };
    });
  } catch (err) {
    console.error(`RSS parse error [${url}]:`, err.message);
    return [];
  }
};

/**
 * Fetch từ tất cả RSS sources được chọn
 * @param {string[]} sources - ['rss_vnexpress', 'rss_tuoitre', ...]
 */
const fetchRSSTrends = async (sources = ['rss_vnexpress']) => {
  const results = [];

  for (const sourceKey of sources) {
    const urls = RSS_SOURCES[sourceKey] || [];
    for (const url of urls) {
      const items = await parseFeed(url, sourceKey);
      results.push(...items);
    }
  }

  // Dedup bằng keyword (case-insensitive)
  const seen = new Set();
  return results.filter((item) => {
    if (!item.keyword) return false;
    const key = item.keyword.toLowerCase().substring(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

module.exports = { fetchRSSTrends };
