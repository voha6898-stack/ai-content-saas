'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, DollarSign, Link as LinkIcon, Sparkles,
  TrendingUp, Loader2, Copy, Check, ChevronRight,
} from 'lucide-react';
import { monetizationAPI, contentAPI } from '@/lib/api';

const NICHES = ['technology', 'finance', 'lifestyle', 'food', 'travel', 'fitness', 'education', 'entertainment', 'business', 'gaming', 'other'];

export default function MonetizationPage() {
  const [recentContent, setRecentContent] = useState([]);
  const [selectedContent, setSelectedContent] = useState('');
  const [affiliateData, setAffiliateData]     = useState(null);
  const [ctaResult, setCtaResult]             = useState(null);
  const [rpmResult, setRpmResult]             = useState(null);
  const [loading, setLoading]   = useState({});
  const [copied, setCopied]     = useState('');
  const [activeTab, setActiveTab] = useState('affiliate');

  // Custom link form
  const [linkForm, setLinkForm]   = useState({ name: '', url: '', niche: 'technology', description: '', commission: '' });
  const [addingLink, setAddingLink] = useState(false);
  const [myLinks, setMyLinks]       = useState([]);

  useEffect(() => {
    contentAPI.getHistory(1, 30).then(({ data }) => setRecentContent(data.items)).catch(() => {});
    monetizationAPI.getMyLinks().then(({ data }) => setMyLinks(data.links)).catch(() => {});
  }, []);

  const setLoad = (key, val) => setLoading((prev) => ({ ...prev, [key]: val }));

  const handleFindAffiliate = async () => {
    if (!selectedContent) return;
    setLoad('affiliate', true); setAffiliateData(null); setCtaResult(null);
    try {
      const { data } = await monetizationAPI.getAffiliateLinks(selectedContent);
      setAffiliateData(data);
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
    finally { setLoad('affiliate', false); }
  };

  const handleGenerateCTA = async (affiliateLinkId) => {
    setLoad('cta', true); setCtaResult(null);
    try {
      const { data } = await monetizationAPI.generateCTA(selectedContent, affiliateLinkId);
      setCtaResult(data.result);
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
    finally { setLoad('cta', false); }
  };

  const handleRPM = async () => {
    if (!selectedContent) return;
    setLoad('rpm', true); setRpmResult(null);
    try {
      const { data } = await monetizationAPI.getRPMOptimization(selectedContent);
      setRpmResult(data.result);
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
    finally { setLoad('rpm', false); }
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    setAddingLink(true);
    try {
      const { data } = await monetizationAPI.addCustomLink(linkForm);
      setMyLinks((prev) => [data.link, ...prev]);
      setLinkForm({ name: '', url: '', niche: 'technology', description: '', commission: '' });
    } catch (err) { alert(err.response?.data?.message || 'Lỗi'); }
    finally { setAddingLink(false); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <Link href="/dashboard" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" /> Dashboard
      </Link>
      <h1 className="text-2xl font-bold mb-2">Monetization</h1>
      <p className="text-slate-400 text-sm mb-6">Tối ưu nội dung để tăng doanh thu — Affiliate links, CTA, RPM</p>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-800 mb-6">
        {[
          { key: 'affiliate', label: 'Affiliate Links', icon: LinkIcon     },
          { key: 'rpm',       label: 'RPM Optimizer',  icon: TrendingUp    },
          { key: 'mylinks',   label: 'Links của tôi',  icon: DollarSign    },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px
              ${activeTab === key ? 'border-sky-400 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Content selector — dùng chung */}
      {activeTab !== 'mylinks' && (
        <div className="flex gap-3 mb-6">
          <select value={selectedContent} onChange={(e) => setSelectedContent(e.target.value)} className="input-field flex-1">
            <option value="">-- Chọn nội dung để phân tích --</option>
            {recentContent.map((c) => (
              <option key={c._id} value={c._id}>[{c.platform}] {c.output?.title?.substring(0, 60)}</option>
            ))}
          </select>
          {activeTab === 'affiliate' && (
            <button onClick={handleFindAffiliate} disabled={!selectedContent || loading.affiliate}
              className="btn-primary flex items-center gap-2 shrink-0">
              {loading.affiliate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Tìm links
            </button>
          )}
          {activeTab === 'rpm' && (
            <button onClick={handleRPM} disabled={!selectedContent || loading.rpm}
              className="btn-primary flex items-center gap-2 shrink-0">
              {loading.rpm ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
              Phân tích RPM
            </button>
          )}
        </div>
      )}

      {/* ── AFFILIATE TAB ── */}
      {activeTab === 'affiliate' && (
        <div className="space-y-6">
          {affiliateData && (
            <>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>Niche phát hiện:</span>
                <span className="bg-sky-500/10 border border-sky-500/30 text-sky-400 px-2 py-0.5 rounded-full text-xs font-medium">{affiliateData.niche}</span>
                <span>·</span>
                <span>{affiliateData.links.length} links phù hợp</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {affiliateData.links.map((link) => (
                  <div key={link._id} className="card border-slate-700 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{link.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{link.network} · {link.commission}</p>
                      </div>
                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                        score: {link.relevanceScore}
                      </span>
                    </div>
                    {link.description && <p className="text-xs text-slate-400 mb-3">{link.description}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => handleGenerateCTA(link._id)} disabled={loading.cta}
                        className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5">
                        {loading.cta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Tạo CTA
                      </button>
                      <a href={link.url} target="_blank" rel="noopener noreferrer"
                        className="btn-secondary text-xs flex items-center gap-1.5">
                        <LinkIcon className="w-3.5 h-3.5" /> Link
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {ctaResult && (
                <div className="card border-sky-500/30 bg-sky-500/5">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-sky-400" /> CTA được tạo bởi AI
                  </h3>
                  <div className="space-y-3">
                    {ctaResult.ctas?.map((cta, i) => (
                      <div key={i} className="bg-slate-800 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-500 font-medium uppercase">{cta.type}</span>
                          <button onClick={() => copyText(cta.fullText, `cta-${i}`)} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
                            {copied === `cta-${i}` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{cta.fullText}</p>
                      </div>
                    ))}
                  </div>
                  {ctaResult.integratedCaption && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-300">Caption tích hợp sẵn CTA</h4>
                        <button onClick={() => copyText(ctaResult.integratedCaption, 'caption')} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white">
                          {copied === 'caption' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-sm text-slate-300 bg-slate-800 rounded-xl p-3 whitespace-pre-wrap">{ctaResult.integratedCaption}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── RPM TAB ── */}
      {activeTab === 'rpm' && rpmResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card text-center">
              <p className="text-slate-400 text-sm mb-1">Estimated RPM</p>
              <p className="text-2xl font-bold text-yellow-400">{rpmResult.estimatedRPMRange}</p>
            </div>
            <div className="card text-center">
              <p className="text-slate-400 text-sm mb-1">Video length tối ưu</p>
              <p className="text-2xl font-bold text-sky-400">{rpmResult.videoLengthMin} phút</p>
            </div>
            <div className="card text-center">
              <p className="text-slate-400 text-sm mb-1">Upload time tốt nhất</p>
              <p className="text-2xl font-bold text-green-400">{rpmResult.bestUploadTime}</p>
            </div>
          </div>

          {rpmResult.optimizedTitle && (
            <div className="card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Title tối ưu cho RPM cao</h3>
                <button onClick={() => copyText(rpmResult.optimizedTitle, 'title')} className="p-1.5 rounded hover:bg-slate-800">
                  {copied === 'title' ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              <p className="text-sky-400 font-medium">{rpmResult.optimizedTitle}</p>
            </div>
          )}

          {rpmResult.highCPMKeywords?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-3">Keywords CPM cao nên thêm vào description</h3>
              <div className="flex flex-wrap gap-2">
                {rpmResult.highCPMKeywords.map((kw) => (
                  <span key={kw} className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs px-2.5 py-1 rounded-full">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {rpmResult.recommendations?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold mb-4">Khuyến nghị tối ưu</h3>
              <div className="space-y-3">
                {rpmResult.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-800 last:border-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 mt-0.5
                      ${rec.impact === 'high' ? 'bg-red-500/10 text-red-400' : rec.impact === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                      {rec.impact}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{rec.category}</p>
                      <p className="text-sm text-slate-400 mt-0.5">{rec.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MY LINKS TAB ── */}
      {activeTab === 'mylinks' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Thêm affiliate link</h3>
            <form onSubmit={handleAddLink} className="space-y-3">
              <input value={linkForm.name} onChange={(e) => setLinkForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Tên sản phẩm" required className="input-field text-sm" />
              <input value={linkForm.url} onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="Affiliate URL" required type="url" className="input-field text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <select value={linkForm.niche} onChange={(e) => setLinkForm((f) => ({ ...f, niche: e.target.value }))} className="input-field text-sm">
                  {NICHES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <input value={linkForm.commission} onChange={(e) => setLinkForm((f) => ({ ...f, commission: e.target.value }))}
                  placeholder="Commission (10%)" className="input-field text-sm" />
              </div>
              <input value={linkForm.description} onChange={(e) => setLinkForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả ngắn" className="input-field text-sm" />
              <button type="submit" disabled={addingLink} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                {addingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                Thêm link
              </button>
            </form>
          </div>

          <div className="xl:col-span-2 space-y-3">
            {myLinks.length === 0
              ? <div className="card text-center py-10 text-slate-500 text-sm">Chưa có link nào. Thêm link đầu tiên!</div>
              : myLinks.map((link) => (
                <div key={link._id} className="card border-slate-700 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{link.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{link.niche} · {link.commission}</p>
                  </div>
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-sky-400 hover:underline flex items-center gap-1">
                    Xem link <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
}
