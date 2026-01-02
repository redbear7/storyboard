
import React, { useState } from 'react';
import { Scene, Headline, AspectRatio } from '../types';
import { Loader2, Download, Copy, Check, Sparkles } from 'lucide-react';

interface SceneCardProps {
  scene: Scene;
  headline?: Headline | null;
  aspectRatio: AspectRatio;
  onGenerateImage?: (id: string) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({ scene, headline, aspectRatio, onGenerateImage }) => {
  const [copied, setCopied] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scene.imageUrl) return;
    const link = document.createElement('a');
    link.href = scene.imageUrl;
    const prefix = scene.isClimax ? '0.클라이맥스_' : `${scene.chapterNumber}.`;
    link.download = `${prefix}${scene.title}.png`;
    link.click();
  };

  const handleCopyScript = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!scene.scriptSegment) return;
    navigator.clipboard.writeText(scene.scriptSegment).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const isVertical = aspectRatio === '9:16';
  const gridSpanClasses = scene.isClimax 
    ? (isVertical ? 'col-span-2 row-span-2' : 'col-span-full md:col-span-2 row-span-2') 
    : '';

  return (
    <div className={`relative group overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 shadow-xl transition-all duration-500 hover:border-gray-700 ${gridSpanClasses}`}>
      <div className={`relative bg-black overflow-hidden ${isVertical ? 'aspect-[9/16]' : 'aspect-video'}`}>
        {scene.imageUrl ? (
          <>
            <img src={scene.imageUrl} alt={scene.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <button onClick={handleDownload} className="absolute top-4 right-4 p-3 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-black/90"><Download className="w-5 h-5 text-white" /></button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            {scene.isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                <span className="text-sm font-bold animate-pulse text-center px-4">컷 생성 중...</span>
              </div>
            ) : (
              <button onClick={() => onGenerateImage?.(scene.id)} className="flex flex-col items-center gap-2 px-6 py-3 bg-purple-600 rounded-full font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/40">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs">이미지 생성</span>
              </button>
            )}
          </div>
        )}
        <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase z-30 shadow-lg ${scene.isClimax ? 'bg-red-600 text-white shadow-red-900/40' : 'bg-gray-800/80 text-gray-200'}`}>
          {scene.isClimax ? '클라이맥스' : `스토리보드 ${scene.chapterNumber}`}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* 썸네일 문구 표시 섹션 (클라이맥스 전용) */}
        {scene.isClimax && headline && (
          <div className="mb-2 p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl text-center space-y-1">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">썸네일 문구</span>
              <Sparkles className="w-3 h-3 text-purple-400" />
            </div>
            <div className="text-white font-black leading-tight drop-shadow-sm">
              <div className="text-xl md:text-2xl">{headline.line1}</div>
              <div className="text-sm md:text-base opacity-90">{headline.line2}</div>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-xl font-bold text-white mb-2">{scene.title}</h3>
          <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">{scene.summary}</p>
        </div>
        
        {scene.scriptSegment && (
          <div className="bg-black/40 p-3 rounded-xl border border-gray-800/50">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">대본 내용</span>
              <button onClick={handleCopyScript} className="text-gray-500 hover:text-white transition-colors" title="복사하기">
                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
            <div className="text-[10px] text-gray-400 italic max-h-20 overflow-y-auto custom-scrollbar leading-relaxed">{scene.scriptSegment}</div>
          </div>
        )}
      </div>
    </div>
  );
};
