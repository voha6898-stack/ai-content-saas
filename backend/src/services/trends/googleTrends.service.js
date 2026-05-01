const googleTrends = require('google-trends-api');

/**
 * Lấy trending searches từ Google Trends cho Việt Nam
 * @returns {Array} [{ keyword, score, relatedQueries }]
 */
const fetchDailyTrends = async (geo = 'VN') => {
  try {
    const result = await googleTrends.dailyTrends({ geo, hl: 'vi' });
    const data   = JSON.parse(result);
    const items  = data?.default?.trendingSearchesDays?.[0]?.trendingSearches || [];

    return items.slice(0, 20).map((item) => ({
      keyword:    item.title?.query || '',
      score:      parseInt(item.formattedTraffic?.replace(/[^0-9]/g, '') || '0'),
      description: item.articles?.[0]?.snippet || '',
      url:        item.articles?.[0]?.url || null,
      imageUrl:   item.image?.imageUrl || null,
      relatedQueries: (item.relatedQueries || []).map((q) => q.query),
      source:     'google_trends',
      region:     geo,
    }));
  } catch (err) {
    console.error('Google Trends fetch error:', err.message);
    return [];
  }
};

/**
 * Lấy interest over time cho 1 keyword (để tính velocity)
 */
const getInterestOverTime = async (keyword, geo = 'VN') => {
  try {
    const result = await googleTrends.interestOverTime({
      keyword,
      geo,
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày
    });
    const data    = JSON.parse(result);
    const points  = data?.default?.timelineData || [];
    if (points.length < 2) return 50;

    const recent = points.slice(-3).reduce((s, p) => s + (p.value?.[0] || 0), 0) / 3;
    const older  = points.slice(0, 3).reduce((s, p) => s + (p.value?.[0] || 0), 0) / 3;
    // Velocity: % tăng từ tuần trước đến tuần này
    const velocity = older > 0 ? Math.min(100, Math.round((recent / older - 1) * 100)) : 50;
    return Math.max(0, velocity);
  } catch {
    return 50;
  }
};

module.exports = { fetchDailyTrends, getInterestOverTime };
