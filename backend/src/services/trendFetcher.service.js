const { fetchDailyTrends }   = require('./trends/googleTrends.service');
const { fetchTrendingVideos } = require('./trends/youtubeTrends.service');
const { fetchRSSTrends }      = require('./trends/rssTrends.service');

const RSS_SOURCES = ['rss_vnexpress', 'rss_tuoitre', 'rss_dantri'];

/**
 * Lấy trends từ tất cả nguồn được chỉ định
 * @param {string[]} sources - ['google_trends', 'youtube_trending', 'rss_vnexpress', ...]
 * @returns {Array} Raw trend items
 */
const fetchAllTrends = async (sources = ['google_trends', 'youtube_trending', 'rss_vnexpress']) => {
  const promises = [];

  if (sources.includes('google_trends')) {
    promises.push(fetchDailyTrends('VN').catch(() => []));
  }

  if (sources.includes('youtube_trending')) {
    promises.push(fetchTrendingVideos('', 'VN', 20).catch(() => []));
  }

  // RSS sources
  const rssSources = sources.filter((s) => RSS_SOURCES.includes(s));
  if (rssSources.length > 0) {
    promises.push(fetchRSSTrends(rssSources).catch(() => []));
  }

  const results = await Promise.all(promises);
  const all     = results.flat();

  // Dedup toàn cục bằng keyword (giữ 1 bản tốt nhất)
  const map = new Map();
  for (const item of all) {
    const key = normalizeKeyword(item.keyword);
    if (!key || key.length < 3) continue;
    if (!map.has(key) || (item.velocity || 0) > (map.get(key).velocity || 0)) {
      map.set(key, item);
    }
  }

  console.log(`📡 Fetched ${all.length} raw trends → ${map.size} unique`);
  return Array.from(map.values());
};

const normalizeKeyword = (kw = '') =>
  kw.toLowerCase().replace(/[^\w\s]/g, '').trim().substring(0, 60);

module.exports = { fetchAllTrends };
