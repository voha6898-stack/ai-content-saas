'use client';

import { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Hash } from 'lucide-react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-sky-400 transition-colors bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg">
      {copied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Đã copy</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
    </button>
  );
}

function Section({ label, content, mono = false }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 hover:bg-slate-800 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          <CopyButton text={content} />
          {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </div>
      </button>
      {open && (
        <div className={`px-4 py-3 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap ${mono ? 'font-mono text-xs bg-slate-950/50' : ''}`}>
          {content}
        </div>
      )}
    </div>
  );
}

export default function ContentResult({ content }) {
  if (!content) return null;

  const { topic, platform, output, createdAt } = content;
  const hashtagsText = output.hashtags?.join(' ') || '';

  return (
    <div className="card animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
        <div>
          <h2 className="font-semibold text-lg">Kết quả</h2>
          <p className="text-slate-500 text-sm mt-0.5 truncate max-w-xs">
            {platform} · {topic}
          </p>
        </div>
        {createdAt && (
          <span className="text-xs text-slate-600">
            {new Date(createdAt).toLocaleTimeString('vi-VN')}
          </span>
        )}
      </div>

      <div className="space-y-3">
        <Section label="🎯 Tiêu đề / Title"   content={output.title}   />
        <Section label="📝 Kịch bản / Script"  content={output.script}  mono />
        <Section label="✍️ Caption"            content={output.caption} />

        {/* Hashtags */}
        {output.hashtags?.length > 0 && (
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5">
                <Hash className="w-4 h-4" /> Hashtags
              </span>
              <CopyButton text={hashtagsText} />
            </div>
            <div className="px-4 py-3 flex flex-wrap gap-2">
              {output.hashtags.map((tag, i) => (
                <span key={i} className="bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-lg px-2.5 py-1 text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
