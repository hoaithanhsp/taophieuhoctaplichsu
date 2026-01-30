import React from 'react';
import { Scroll, Settings, Crown } from 'lucide-react';

interface HeaderProps {
    onSettingsClick: () => void;
    hasApiKey: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, hasApiKey }) => {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-[#1A1510]/95 backdrop-blur-md border-b border-[#3D3428] no-print">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-[#D4AF37] to-[#B8860B] rounded-xl shadow-lg shadow-[#D4AF37]/20">
                        <Scroll className="w-6 h-6 text-[#1A1510]" />
                    </div>
                    <div>
                        <h1
                            className="font-bold text-lg text-[#D4AF37]"
                            style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}
                        >
                            Game Lịch Sử
                        </h1>
                        <p className="text-xs text-[#8B7355] hidden sm:block">Tác giả: Lê Thị Nga</p>
                        <p className="text-xs text-[#6B5C45] hidden sm:block">Đơn vị: Trường THCS Thanh Đình</p>
                    </div>
                </div>

                {/* Settings Button */}
                <button
                    onClick={onSettingsClick}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2A2318] hover:bg-[#3D3428] border border-[#3D3428] hover:border-[#D4AF37]/30 rounded-xl transition-all group"
                >
                    <Settings className="w-5 h-5 text-[#D4AF37] group-hover:rotate-90 transition-transform duration-300" />
                    <div className="text-left">
                        <span className="text-sm font-medium text-[#F5F0E1]">API Key</span>
                        {!hasApiKey && (
                            <p className="text-xs text-red-400 animate-pulse flex items-center gap-1">
                                <span>⚠️</span> Cần nhập key để sử dụng
                            </p>
                        )}
                        {hasApiKey && (
                            <p className="text-xs text-[#2E8B57] flex items-center gap-1">
                                <Crown className="w-3 h-3" /> Đã cấu hình
                            </p>
                        )}
                    </div>
                </button>
            </div>
        </header>
    );
};

export default Header;
