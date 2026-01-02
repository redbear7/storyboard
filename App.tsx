
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ScriptInput } from './components/ScriptInput';
import { SceneCard } from './components/SceneCard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { Scene, AppState, Headline, Character, ImageStyle, Era, AspectRatio } from './types';
import { analyzeScript, generateImage } from './services/geminiService';
import { Clapperboard, Download, FileText, Check, Sparkles, Key, User, ArrowRight, RefreshCcw, Save, Upload, Image as ImageIcon, Copy } from 'lucide-react';

const STYLE_LABELS: Record<ImageStyle, string> = {
  cinematic: '시네마틱 사진',
  webtoon_action: '웹툰 (액션)',
  webtoon_romance: '웹툰 (로맨스)',
  webtoon_thriller: '웹툰 (스릴러)',
  webtoon_yadam: '웹툰 (한국 야담)',
};

export default function App() {
  const [script, setScript] = useState<string>('');
  const [chapterCount, setChapterCount] = useState<number>(6);
  const [selectedStyle, setSelectedStyle] = useState<ImageStyle>('cinematic');
  const [selectedEra, setSelectedEra] = useState<Era>('modern');
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<AspectRatio>('16:9');
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [headline, setHeadline] = useState<Headline | null>(null);
  const [styleGuide, setStyleGuide] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkApiKeyStatus = async () => {
    const manualKey = localStorage.getItem('LIFEDRAMA_API_KEY');
    if (manualKey) {
      setHasKey(true);
      return true;
    }
    if (window.aistudio) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
      return selected;
    }
    return false;
  };

  useEffect(() => {
    const init = async () => {
      const active = await checkApiKeyStatus();
      if (!active) {
        setIsApiModalOpen(true);
      }
    };
    init();
  }, []);

  const handleApiKeySelected = async () => {
    await checkApiKeyStatus();
    setError(null);
  };

  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleGenerateCharacterImage = async (charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) return;

    setCharacters(prev => prev.map(c => c.id === charId ? { ...c, isLoading: true, error: undefined } : c));
    try {
      const url = await generateImage(char.imagePrompt, selectedStyle, styleGuide, selectedEra, selectedAspectRatio, true);
      setCharacters(prev => prev.map(c => c.id === charId ? { ...c, imageUrl: url, isLoading: false } : c));
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
        await checkApiKeyStatus();
      }
      setCharacters(prev => prev.map(c => c.id === charId ? { ...c, isLoading: false, error: '생성 실패' } : c));
    }
  };

  const handleProcessScript = async () => {
    if (!script) return;
    
    setAppState(AppState.ANALYZING);
    setError(null);
    
    try {
      const analysis = await analyzeScript(script, chapterCount, selectedStyle, selectedEra);
      setHeadline(analysis.headline);
      setStyleGuide(analysis.visualStyleGuide);

      const initialChars: Character[] = analysis.characters.map((c, idx) => ({
        id: `char-${idx}`,
        name: c.name,
        description: c.description,
        imagePrompt: c.imagePrompt,
        isLoading: true
      }));
      setCharacters(initialChars);

      const climaxScene: Scene = {
        id: 'climax',
        title: analysis.climax.title,
        summary: analysis.climax.summary,
        scriptSegment: analysis.climax.scriptSegment,
        imagePrompt: analysis.climax.imagePrompt,
        isClimax: true,
        isLoading: false,
      };
      const chapterScenes: Scene[] = analysis.chapters.map((ch, idx) => ({
        id: `chapter-${idx}`,
        chapterNumber: idx + 1,
        title: ch.title,
        summary: ch.summary,
        scriptSegment: ch.scriptSegment,
        imagePrompt: ch.imagePrompt,
        isClimax: false,
        isLoading: false,
      }));
      setScenes([climaxScene, ...chapterScenes]);

      setAppState(AppState.CHARACTER_GEN);

      for (const char of initialChars) {
        try {
          const url = await generateImage(char.imagePrompt, selectedStyle, analysis.visualStyleGuide, selectedEra, selectedAspectRatio, true);
          setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, imageUrl: url, isLoading: false } : c));
        } catch (err: any) {
          if (err.message && err.message.includes("Requested entity was not found")) {
            await window.aistudio.openSelectKey();
            await checkApiKeyStatus();
          }
          setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, isLoading: false, error: '실패' } : c));
        }
      }
      setAppState(AppState.CHARACTER_CONFIRM);
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
        await checkApiKeyStatus();
      }
      setError(err.message || "오류 발생");
      setAppState(AppState.ERROR);
    }
  };

  const startStoryboardGen = async () => {
    setAppState(AppState.GENERATING_IMAGES);
    const climax = scenes.find(s => s.isClimax);
    if (climax) {
      setScenes(prev => prev.map(s => s.id === 'climax' ? { ...s, isLoading: true } : s));
      try {
        const url = await generateImage(climax.imagePrompt, selectedStyle, styleGuide, selectedEra, selectedAspectRatio);
        setScenes(prev => prev.map(s => s.id === 'climax' ? { ...s, imageUrl: url, isLoading: false } : s));
      } catch (err: any) {
        if (err.message && err.message.includes("Requested entity was not found")) {
          await window.aistudio.openSelectKey();
          await checkApiKeyStatus();
        }
        setScenes(prev => prev.map(s => s.id === 'climax' ? { ...s, isLoading: false, error: '실패' } : s));
      }
    }
    setAppState(AppState.COMPLETE);
  };

  const handleGenerateSceneImage = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoading: true, error: undefined } : s));
    try {
      const url = await generateImage(scene.imagePrompt, selectedStyle, styleGuide, selectedEra, selectedAspectRatio);
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, imageUrl: url, isLoading: false } : s));
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
        await window.aistudio.openSelectKey();
        await checkApiKeyStatus();
      }
      setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, isLoading: false, error: '실패' } : s));
    }
  };

  const saveProject = () => {
    const projectData = {
      script,
      chapterCount,
      selectedStyle,
      selectedEra,
      selectedAspectRatio,
      scenes,
      characters,
      headline,
      styleGuide,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lifedrama_프로젝트_${new Date().getTime()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const loadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        setScript(data.script || '');
        setChapterCount(data.chapterCount || 6);
        setSelectedStyle(data.selectedStyle || 'cinematic');
        setSelectedEra(data.selectedEra || 'modern');
        setSelectedAspectRatio(data.selectedAspectRatio || '16:9');
        setScenes(data.scenes || []);
        setCharacters(data.characters || []);
        setHeadline(data.headline || null);
        setStyleGuide(data.styleGuide || '');
        setAppState(AppState.COMPLETE);
      } catch (err) {
        setError('프로젝트 파일을 불러오는 데 실패했습니다.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 pb-20">
      <header className="border-b border-gray-800 bg-[#121212]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clapperboard className="text-purple-500 w-8 h-8" />
            <h1 className="text-2xl font-black tracking-tighter text-white">LifeDrama</h1>
          </div>
          <div className="flex items-center gap-3">
            {appState === AppState.COMPLETE && (
              <button 
                onClick={saveProject}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-xs font-bold flex items-center gap-2 border border-gray-700 transition-all"
              >
                <Save className="w-3 h-3 text-blue-400" /> 프로젝트 저장
              </button>
            )}
            <button 
              onClick={() => setIsApiModalOpen(true)} 
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-700 hover:to-gray-600 text-xs font-bold flex items-center gap-2 border border-gray-600 transition-all shadow-lg"
            >
              <Key className="w-3 h-3 text-yellow-500" /> API 설정
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {appState === AppState.IDLE && (
          <div className="space-y-8">
            <ScriptInput 
              script={script} setScript={setScript}
              chapterCount={chapterCount} setChapterCount={setChapterCount}
              selectedStyle={selectedStyle} setSelectedStyle={setSelectedStyle}
              selectedEra={selectedEra} setSelectedEra={setSelectedEra}
              selectedAspectRatio={selectedAspectRatio} setSelectedAspectRatio={setSelectedAspectRatio}
              onAnalyze={handleProcessScript}
              isLoading={false}
            />
            <div className="flex justify-center">
              <input type="file" accept=".json" ref={fileInputRef} className="hidden" onChange={loadProject} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-gray-400 hover:text-white bg-gray-900 border border-gray-800 rounded-2xl transition-all"
              >
                <Upload className="w-4 h-4" /> 기존 프로젝트 불러오기
              </button>
            </div>
          </div>
        )}

        {(appState === AppState.ANALYZING || appState === AppState.CHARACTER_GEN) && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-500/20 rounded-full"></div>
              <div className="absolute top-0 w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold animate-pulse text-purple-200 text-center">
              {appState === AppState.ANALYZING ? '대본의 시대와 핵심을 분석하고 있습니다...' : '등장캐릭터의 시각적 가이드를 생성 중입니다...'}
            </h2>
          </div>
        )}

        {(appState === AppState.CHARACTER_CONFIRM || appState === AppState.CHARACTER_GEN) && (
          <div className="space-y-12 animate-fade-in">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-black text-white">등장캐릭터 프로필 확인</h2>
              <p className="text-gray-400 text-lg">
                {selectedEra === 'joseon' ? '조선시대' : '현대'} 배경의 주인공들입니다. 마음에 드시나요?
              </p>
            </div>
            
            <div className={`grid gap-8 ${selectedAspectRatio === '16:9' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
              {characters.map((char) => (
                <div key={char.id} className="bg-gray-900/50 backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-800 shadow-2xl transition-all hover:border-purple-500/30 flex flex-col">
                  <div className={`bg-black relative flex items-center justify-center group ${selectedAspectRatio === '16:9' ? 'aspect-video' : 'aspect-[9/16]'}`}>
                    {char.imageUrl ? (
                      <>
                        <img src={char.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" alt={char.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button 
                            onClick={() => handleDownloadImage(char.imageUrl!, `${char.name}_프로필.png`)} 
                            className="p-3 bg-black/60 backdrop-blur-md rounded-full hover:bg-black/90 transition-all"
                            title="이미지 다운로드"
                          >
                            <Download className="w-4 h-4 text-white" />
                          </button>
                        </div>
                      </>
                    ) : char.isLoading ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCcw className="animate-spin text-purple-500 w-10 h-10" />
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">렌더링 중</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4 text-center px-6">
                         <span className="text-red-400 text-sm font-bold">생성 실패</span>
                         <button onClick={() => handleGenerateCharacterImage(char.id)} className="p-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full transition-all shadow-lg">
                           <RefreshCcw className="w-6 h-6" />
                         </button>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex-grow flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-purple-900/40 rounded-lg">
                          <User className="w-5 h-5 text-purple-400" />
                        </div>
                        <h3 className="text-xl font-black text-white">{char.name}</h3>
                      </div>
                      <span className="px-2 py-1 bg-gray-800 rounded-md text-[10px] text-gray-400 border border-gray-700 font-bold">
                        {STYLE_LABELS[selectedStyle]}
                      </span>
                    </div>
                    
                    <p className="text-gray-400 leading-relaxed text-xs line-clamp-3">{char.description}</p>
                    
                    <div className="bg-black/30 p-3 rounded-xl border border-gray-800/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Image Prompt (EN)</span>
                        <button onClick={() => handleCopyText(char.imagePrompt)} className="text-gray-500 hover:text-white transition-colors" title="프롬프트 복사">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 italic leading-relaxed line-clamp-2">
                        {char.imagePrompt}
                      </p>
                    </div>
                    
                    <button 
                      onClick={() => handleGenerateCharacterImage(char.id)}
                      disabled={char.isLoading}
                      className="mt-auto w-full py-3 bg-gray-800 hover:bg-purple-900/40 border border-gray-700 hover:border-purple-500/50 rounded-xl text-xs font-bold text-gray-300 hover:text-purple-300 transition-all flex items-center justify-center gap-2 group"
                    >
                      <RefreshCcw className={`w-3.5 h-3.5 ${char.isLoading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                      이미지 재생성
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <button
                onClick={startStoryboardGen}
                disabled={characters.some(c => c.isLoading)}
                className="flex items-center gap-4 px-16 py-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-3xl font-black text-2xl shadow-2xl shadow-purple-900/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                스토리보드 생성 시작 
                <ArrowRight className="w-8 h-8 transition-transform group-hover:translate-x-2" />
              </button>
            </div>
          </div>
        )}

        {(appState === AppState.COMPLETE || appState === AppState.GENERATING_IMAGES) && (
          <div className="space-y-12 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-2">
                <div className="inline-block px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 text-[10px] font-black tracking-widest uppercase mb-2">결과물</div>
                <h2 className="text-6xl font-black text-white tracking-tighter">스토리보드</h2>
                <p className="text-gray-400 text-xl font-medium">{selectedEra === 'joseon' ? '조선시대' : '현대'} 배경의 시네마틱 가이드</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button onClick={saveProject} className="flex-1 md:flex-none px-8 py-4 bg-gray-800 rounded-2xl hover:bg-gray-700 transition-all border border-gray-700 font-bold flex items-center justify-center gap-2">
                  <Save className="w-5 h-5 text-blue-400" /> 프로젝트 저장
                </button>
                <button onClick={() => window.location.reload()} className="flex-1 md:flex-none px-8 py-4 bg-white text-black rounded-2xl hover:bg-gray-200 transition-all font-bold">새로 만들기</button>
              </div>
            </div>

            <div className={`grid gap-10 ${selectedAspectRatio === '16:9' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
              {scenes.map((scene) => (
                <SceneCard 
                  key={scene.id} 
                  scene={scene} 
                  headline={scene.isClimax ? headline : undefined} 
                  aspectRatio={selectedAspectRatio}
                  onGenerateImage={handleGenerateSceneImage}
                />
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-12 p-8 bg-red-900/10 border border-red-800/50 text-red-200 rounded-3xl text-center max-w-2xl mx-auto shadow-2xl backdrop-blur-md">
            <div className="flex flex-col items-center gap-4">
              <div className="p-3 bg-red-900/30 rounded-full">
                <RefreshCcw className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <p className="font-black text-xl mb-1">문제가 발생했습니다</p>
                <p className="text-sm opacity-80 mb-6">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition-all"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <ApiKeyModal 
        isOpen={isApiModalOpen} 
        onClose={() => setIsApiModalOpen(false)} 
        onSave={handleApiKeySelected} 
      />
    </div>
  );
}
