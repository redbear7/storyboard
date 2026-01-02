
import React, { useState, useEffect } from 'react';
import { Key, X, ExternalLink, ShieldCheck, Save, Trash2 } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [manualKey, setManualKey] = useState('');
  const [isStored, setIsStored] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('LIFEDRAMA_API_KEY');
    if (stored) {
      setManualKey(stored);
      setIsStored(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenSelector = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      onSave();
      onClose();
    }
  };

  const handleSaveManualKey = () => {
    if (manualKey.trim()) {
      localStorage.setItem('LIFEDRAMA_API_KEY', manualKey.trim());
      setIsStored(true);
      onSave();
      alert('API 키가 로컬 기기에 안전하게 저장되었습니다.');
    }
  };

  const handleClearManualKey = () => {
    localStorage.removeItem('LIFEDRAMA_API_KEY');
    setManualKey('');
    setIsStored(false);
    onSave();
    alert('저장된 API 키가 삭제되었습니다.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-gray-800 rounded-[2rem] shadow-2xl overflow-hidden animate-scale-up my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-white tracking-tight">API 설정</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-500 hover:text-white" title="닫기">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Method 1: Platform Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest">
              <span>방법 1: 플랫폼 보안 선택 (권장)</span>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-400">
              AI Studio 플랫폼의 보안 키 선택기를 사용합니다. 가장 안전한 방식입니다.
            </p>
            <button
              onClick={handleOpenSelector}
              className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98]"
            >
              <Key className="w-5 h-5" /> API 키 선택하기
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-800"></span></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#1a1a1a] px-2 text-gray-600 font-bold">OR</span></div>
          </div>

          {/* Method 2: Manual Input */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest">
              <span>방법 2: 수동 API 키 입력 및 저장</span>
            </div>
            <p className="text-[13px] leading-relaxed text-gray-400">
              Gemini API 키를 직접 입력하여 브라우저 로컬 스토리지에 저장합니다.
            </p>
            <div className="space-y-2">
              <div className="relative">
                <input
                  type="password"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  placeholder="API 키를 입력하세요..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveManualKey}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-bold text-sm transition-all border border-gray-700"
                >
                  <Save className="w-4 h-4" /> 저장
                </button>
                {isStored && (
                  <button
                    onClick={handleClearManualKey}
                    className="px-4 py-3 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl border border-red-900/30 transition-all"
                    title="저장된 키 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 text-indigo-400 hover:text-indigo-300 font-medium text-xs transition-colors"
              >
                결제 및 요금 안내 확인하기 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black/30 p-4 border-t border-gray-800/50 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3 text-gray-600" />
          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">
            보안 키 설정 및 관리
          </span>
        </div>
      </div>
    </div>
  );
};
