
import React, { useRef } from 'react';
import { Film, Sparkles, Upload, Image as ImageIcon, History, Globe, Maximize2, Smartphone } from 'lucide-react';
import { ImageStyle, Era, AspectRatio } from '../types';

interface ScriptInputProps {
  script: string;
  setScript: (s: string) => void;
  chapterCount: number;
  setChapterCount: (n: number) => void;
  selectedStyle: ImageStyle;
  setSelectedStyle: (s: ImageStyle) => void;
  selectedEra: Era;
  setSelectedEra: (e: Era) => void;
  selectedAspectRatio: AspectRatio;
  setSelectedAspectRatio: (a: AspectRatio) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const STYLES: { id: ImageStyle; label: string; description: string; emoji: string }[] = [
  { id: 'cinematic', label: '시네마틱 사진', description: 'K-드라마 실사 스타일', emoji: '🎬' },
  { id: 'webtoon_action', label: '웹툰 (액션)', description: '강렬하고 화려한 선화', emoji: '🔥' },
  { id: 'webtoon_romance', label: '웹툰 (로맨스)', description: '부드럽고 감성적인 작화', emoji: '🌸' },
  { id: 'webtoon_thriller', label: '웹툰 (스릴러)', description: '어둡고 거친 긴장감', emoji: '💀' },
  { id: 'webtoon_yadam', label: '웹툰 (한국 야담)', description: '전통적인 수묵화 작화', emoji: '🎎' },
];

const ERAS: { id: Era; label: string; description: string; emoji: string; color: string }[] = [
  { id: 'modern', label: '현대', description: '현재의 서울/도심 배경', emoji: '🏙️', color: 'indigo' },
  { id: 'joseon', label: '조선시대', description: '한복과 한옥 배경', emoji: '🏯', color: 'orange' },
];

const RATIOS: { id: AspectRatio; label: string; description: string; icon: React.ReactNode }[] = [
  { id: '16:9', label: '가로 (16:9)', description: '시네마틱 스크린 비율', icon: <Maximize2 className="w-6 h-6" /> },
  { id: '9:16', label: '세로 (9:16)', description: '숏폼/스마트폰 비율', icon: <Smartphone className="w-6 h-6" /> },
];

export const ScriptInput: React.FC<ScriptInputProps> = ({
  script,
  setScript,
  chapterCount,
  setChapterCount,
  selectedStyle,
  setSelectedStyle,
  selectedEra,
  setSelectedEra,
  selectedAspectRatio,
  setSelectedAspectRatio,
  onAnalyze,
  isLoading
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') setScript(text);
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* 1. 대본 입력 섹션 */}
      <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Film className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">1. 대본 입력</h2>
          </div>
          <input type="file" accept=".txt" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" /> 파일 업로드 (.txt)
          </button>
        </div>

        <textarea
          className="w-full h-48 bg-gray-800 text-gray-200 p-4 rounded-xl border border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none transition-all text-sm leading-relaxed mb-6"
          placeholder="드라마 대본을 입력하세요..."
          value={script}
          onChange={(e) => setScript(e.target.value)}
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">스토리보드 컷 수</label>
            <input
              type="number"
              min={1} max={12}
              value={chapterCount}
              onChange={(e) => setChapterCount(parseInt(e.target.value) || 1)}
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:ring-2 focus:ring-purple-500 outline-none"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 2. 시대적 배경 선택 섹션 */}
        <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <History className="w-6 h-6 text-orange-400" />
            <h2 className="text-xl font-bold text-white">2. 시대적 배경 선택</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {ERAS.map((era) => (
              <button
                key={era.id}
                onClick={() => setSelectedEra(era.id)}
                disabled={isLoading}
                className={`
                  relative flex items-center gap-4 p-4 rounded-2xl border transition-all overflow-hidden
                  ${selectedEra === era.id 
                    ? `bg-${era.color}-900/20 border-${era.color}-500 ring-2 ring-${era.color}-500/50 shadow-lg` 
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'}
                `}
              >
                <div className={`text-2xl p-2 rounded-xl bg-gray-900/50 shadow-inner`}>{era.emoji}</div>
                <div className="text-left">
                  <div className="font-bold text-base text-white">{era.label}</div>
                  <div className="text-[10px] text-gray-400">{era.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 4. 이미지 비율 선택 섹션 */}
        <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <Maximize2 className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">3. 이미지 비율 선택</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setSelectedAspectRatio(ratio.id)}
                disabled={isLoading}
                className={`
                  relative flex items-center gap-4 p-4 rounded-2xl border transition-all overflow-hidden
                  ${selectedAspectRatio === ratio.id 
                    ? 'bg-green-900/20 border-green-500 ring-2 ring-green-500/50 shadow-lg' 
                    : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'}
                `}
              >
                <div className={`p-2 rounded-xl bg-gray-900/50 text-green-400`}>{ratio.icon}</div>
                <div className="text-left">
                  <div className="font-bold text-base text-white">{ratio.label}</div>
                  <div className="text-[10px] text-gray-400">{ratio.description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 이미지 스타일 선택 섹션 */}
      <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl border border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <ImageIcon className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">4. 이미지 스타일 선택</h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => setSelectedStyle(style.id)}
              disabled={isLoading}
              className={`
                flex flex-col items-center text-center p-4 rounded-xl border transition-all
                ${selectedStyle === style.id 
                  ? 'bg-purple-900/40 border-purple-500 ring-2 ring-purple-500/50 shadow-lg shadow-purple-900/20' 
                  : 'bg-gray-800/50 border-gray-700 hover:border-gray-600 hover:bg-gray-800'}
              `}
            >
              <span className="text-3xl mb-2">{style.emoji}</span>
              <span className="font-bold text-[13px] text-white whitespace-nowrap">{style.label}</span>
              <span className="text-[10px] text-gray-400 mt-1">{style.description}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onAnalyze}
        disabled={!script.trim() || isLoading}
        className={`
          w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-xl transition-all
          ${!script.trim() || isLoading 
            ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-xl shadow-purple-900/30 transform hover:-translate-y-1'}
        `}
      >
        {isLoading ? <Sparkles className="animate-spin" /> : <Sparkles />}
        {isLoading ? '대본 분석 및 스토리보드 구성 중...' : '스토리보드 생성하기'}
      </button>
    </div>
  );
};
