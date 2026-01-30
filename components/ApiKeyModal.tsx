import React, { useState } from 'react';
import { Settings, Key, ExternalLink, X, Sparkles, CheckCircle, Crown, Scroll } from 'lucide-react';

// Model definitions
export const AI_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', description: 'Nhanh và hiệu quả', isDefault: true, icon: '⚡' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Mạnh mẽ và chính xác', isDefault: false, icon: '🏆' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Phiên bản ổn định', isDefault: false, icon: '🛡️' },
];

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (apiKey: string, model: string) => void;
  currentApiKey?: string;
  currentModel?: string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentApiKey = '',
  currentModel = 'gemini-3-flash-preview'
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [selectedModel, setSelectedModel] = useState(currentModel);

  if (!isOpen) return null;

  const handleSave = () => {
    if (apiKey.trim()) {
      onSave(apiKey.trim(), selectedModel);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className="bg-[#1A1510] border border-[#3D3428] rounded-2xl max-w-lg w-full shadow-2xl animate-fade-in relative overflow-hidden"
        style={{ fontFamily: "'Lora', Georgia, serif" }}
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3D3428]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-xl shadow-lg shadow-[#D4AF37]/20">
              <Key className="w-6 h-6 text-[#1A1510]" />
            </div>
            <div>
              <h2
                className="text-xl font-bold text-[#D4AF37]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Thiết Lập API Key
              </h2>
              <p className="text-sm text-[#6B5C45]">Kết nối với AI để phân tích tài liệu</p>
            </div>
          </div>
          {currentApiKey && (
            <button onClick={onClose} className="p-2 hover:bg-[#2A2318] rounded-lg transition-colors">
              <X className="w-5 h-5 text-[#6B5C45]" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-track-[#2A2318] scrollbar-thumb-[#D4AF37]/50 hover:scrollbar-thumb-[#D4AF37]">
          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-[#8B7355] mb-3 uppercase tracking-wider text-xs">
              Chọn Model AI
            </label>
            <div className="grid grid-cols-1 gap-3">
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${selectedModel === model.id
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                      : 'border-[#3D3428] hover:border-[#6B5C45] bg-[#2A2318]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div>
                      <p className="font-semibold text-[#F5F0E1]">{model.name}</p>
                      <p className="text-xs text-[#6B5C45]">{model.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {model.isDefault && (
                      <span className="px-2 py-0.5 text-xs bg-[#2E8B57]/20 text-[#5FD89E] rounded-full border border-[#2E8B57]/30">
                        Mặc định
                      </span>
                    )}
                    {selectedModel === model.id && (
                      <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-[#8B7355] mb-2 uppercase tracking-wider text-xs">
              API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập API key của bạn..."
              className="w-full px-4 py-3 bg-[#2A2318] border border-[#3D3428] rounded-xl text-[#F5F0E1] placeholder-[#6B5C45] focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 outline-none transition-all"
            />
          </div>

          {/* Help Links */}
          <div className="bg-gradient-to-r from-[#2A2318] to-[#1A1510] p-4 rounded-xl border border-[#D4AF37]/20">
            <p className="text-sm text-[#8B7355] mb-3 flex items-center gap-2">
              <Scroll className="w-4 h-4 text-[#D4AF37]" />
              Hướng dẫn lấy API Key:
            </p>
            <div className="space-y-2">
              <a
                href="https://aistudio.google.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F4E5B1] text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Truy cập Google AI Studio để tạo key
              </a>
              <a
                href="https://drive.google.com/drive/folders/1G6eiVeeeEvsYgNk2Om7FEybWf30EP1HN?usp=drive_link"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-[#2E8B57] hover:text-[#5FD89E] text-sm transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Xem video hướng dẫn chi tiết
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[#3D3428]">
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#D4AF37] disabled:from-[#3D3428] disabled:to-[#2A2318] disabled:cursor-not-allowed text-[#1A1510] disabled:text-[#6B5C45] font-bold rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-wider text-sm shadow-lg shadow-[#D4AF37]/20"
          >
            <Crown className="w-5 h-5" />
            Lưu Cài Đặt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
