const monetizationService = require('../services/monetization.service');
const AffiliateLink       = require('../models/AffiliateLink.model');

const getAffiliateLinks = async (req, res, next) => {
  try {
    const data = await monetizationService.findAffiliateLinks(req.params.contentId, req.user.id);
    res.json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
};

const generateCTA = async (req, res, next) => {
  try {
    const { affiliateLinkId } = req.body;
    if (!affiliateLinkId) {
      return res.status(400).json({ success: false, message: 'affiliateLinkId bắt buộc' });
    }
    const result = await monetizationService.generateOptimizedCTA(
      req.params.contentId, affiliateLinkId, req.user.id
    );
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

const getRPMOptimization = async (req, res, next) => {
  try {
    const result = await monetizationService.getRPMOptimization(req.params.contentId, req.user.id);
    res.json({ success: true, result });
  } catch (err) {
    next(err);
  }
};

// Thêm affiliate link tuỳ chỉnh của user
const addCustomLink = async (req, res, next) => {
  try {
    const { name, url, niche, description, keywords, commission, ctaTemplates } = req.body;
    if (!name || !url || !niche) {
      return res.status(400).json({ success: false, message: 'name, url, niche bắt buộc' });
    }
    const link = await AffiliateLink.create({
      name, url, niche, description, keywords: keywords || [],
      commission: commission || '', ctaTemplates: ctaTemplates || [],
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, link });
  } catch (err) {
    next(err);
  }
};

const getMyLinks = async (req, res, next) => {
  try {
    const links = await AffiliateLink.find({ createdBy: req.user.id, isActive: true })
      .sort({ createdAt: -1 });
    res.json({ success: true, links });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAffiliateLinks, generateCTA, getRPMOptimization, addCustomLink, getMyLinks };
