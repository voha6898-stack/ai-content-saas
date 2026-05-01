'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { contentAPI } from '@/lib/api';
import ContentForm from '@/components/ContentForm';
import ContentResult from '@/components/ContentResult';
import HistoryList from '@/components/HistoryList';

export default function CreatePage() {
  const { decrementCredits } = useAuth();
  const [result, setResult]     = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGenerate = async (topic, platform) => {
    const { data } = await contentAPI.generate({ topic, platform });
    setResult(data.content);
    decrementCredits();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Tạo nội dung mới</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <ContentForm onGenerate={handleGenerate} />
          {result && <ContentResult content={result} />}
        </div>
        <div>
          <HistoryList refreshKey={refreshKey} onSelect={(item) => setResult(item.output)} />
        </div>
      </div>
    </div>
  );
}
