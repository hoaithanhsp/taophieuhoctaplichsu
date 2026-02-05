import React, { useState, useEffect } from 'react';
import {
    FileText, Upload, Settings, Play, Share2, Award,
    ArrowLeft, Edit3, Clock, Zap, Puzzle, User, Scroll, Crown, BookOpen, Sparkles, Image, FileType
} from 'lucide-react';
import { parseContentWithGemini, parseImageWithGemini, getStoredApiKey, setStoredApiKey, getStoredModel, setStoredModel } from './services/geminiService';
import { parseFile, getFileAcceptString, getSupportedFormats } from './services/fileParser';
import { saveGame, getGameHistory, deleteGame, formatGameDate } from './services/gameHistoryService';
import { ParsedData, GameConfig, ScreenState, GameType, SavedGame } from './types';
import MatchGame from './components/MatchGame';
import TimelineGame from './components/TimelineGame';
import QuizGame from './components/QuizGame';
import PuzzleGame from './components/PuzzleGame';
import CharacterGame from './components/CharacterGame';
import ApiKeyModal from './components/ApiKeyModal';
import Header from './components/Header';

// Confetti global declaration
declare const confetti: any;

const App: React.FC = () => {
    // State
    const [screen, setScreen] = useState<ScreenState>('WELCOME');
    const [fileContent, setFileContent] = useState<string>('');
    const [parsedData, setParsedData] = useState<ParsedData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState('');

    const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
    const [gameConfig, setGameConfig] = useState<GameConfig>({
        difficulty: 'medium',
        soundEnabled: true,
        timeLimit: 120
    });

    const [gameScore, setGameScore] = useState(0);
    const [maxGameScore, setMaxGameScore] = useState(0);

    // API Key State
    const [apiKey, setApiKey] = useState<string>('');
    const [showApiKeyModal, setShowApiKeyModal] = useState(false);

    // Puzzle Image State
    const [puzzleImageUrl, setPuzzleImageUrl] = useState<string>('');
    const [puzzleImageName, setPuzzleImageName] = useState<string>('');

    // Pending Document State (file chờ phân tích)
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [pendingFileName, setPendingFileName] = useState<string>('');

    // Game History State
    const [gameHistory, setGameHistory] = useState<SavedGame[]>([]);

    // Load API key and game history on mount
    useEffect(() => {
        const storedKey = getStoredApiKey();
        if (storedKey) {
            setApiKey(storedKey);
        } else {
            setShowApiKeyModal(true);
        }
        // Load game history
        setGameHistory(getGameHistory());
    }, []);

    const handleSaveApiKey = (key: string, model: string) => {
        console.log('Saving API Key:', key ? 'Has key' : 'No key', 'Model:', model);
        setStoredApiKey(key);
        setStoredModel(model);
        setApiKey(key);
        setShowApiKeyModal(false);
    };

    // Handlers
    // Handler cho upload tài liệu - chỉ lưu file, chưa gọi AI
    const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingFile(file);
        setPendingFileName(file.name);
    };

    // Handler để xóa file đã chọn
    const clearPendingFile = () => {
        setPendingFile(null);
        setPendingFileName('');
    };

    // Handler để xóa ảnh puzzle đã chọn
    const clearPuzzleImage = () => {
        setPuzzleImageUrl('');
        setPuzzleImageName('');
    };

    // Handler để phân tích files - gọi AI khi người dùng bấm nút
    const handleAnalyzeFiles = async () => {
        if (!pendingFile && !fileContent.trim()) {
            setError('Vui lòng tải lên tài liệu hoặc dán nội dung trước khi phân tích');
            return;
        }

        if (!apiKey) {
            setShowApiKeyModal(true);
            return;
        }

        setLoading(true);
        setScreen('UPLOAD');
        setError('');

        try {
            let data: ParsedData;

            if (pendingFile) {
                // Có file tài liệu được upload
                setLoadingMessage(`Đang đọc file: ${pendingFile.name}...`);
                const parsedFile = await parseFile(pendingFile);

                if (parsedFile.type === 'image') {
                    // Nếu tài liệu là ảnh, phân tích bằng Gemini Vision
                    setLoadingMessage('Đang phân tích hình ảnh với AI...');
                    if (!parsedFile.imageBase64 || !parsedFile.imageMimeType) {
                        throw new Error('Không thể đọc dữ liệu ảnh');
                    }
                    data = await parseImageWithGemini(parsedFile.imageBase64, parsedFile.imageMimeType);
                } else {
                    // Phân tích text (từ txt, pdf, docx)
                    setLoadingMessage('Đang phân tích nội dung với AI...');
                    const text = parsedFile.text || '';
                    setFileContent(text);
                    data = await parseContentWithGemini(text);
                }
            } else {
                // Chỉ có text được dán vào
                setLoadingMessage('Đang phân tích nội dung với AI...');
                data = await parseContentWithGemini(fileContent);
            }

            // Thêm puzzleImageUrl vào data nếu có ảnh cho game ghép hình
            if (puzzleImageUrl) {
                data.puzzleImageUrl = puzzleImageUrl;
            }

            setParsedData(data);

            // Lưu game vào lịch sử
            saveGame(data);
            setGameHistory(getGameHistory());

            // Reset pending files
            setPendingFile(null);
            setPendingFileName('');

            setScreen('EDITOR');
        } catch (err) {
            console.error(err);
            const errorMessage = (err as Error).message;
            if (errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
                setError(`Lỗi API: ${errorMessage}. Vui lòng đổi API Key hoặc thử lại sau.`);
            } else {
                setError(`Lỗi: ${errorMessage}`);
            }
            setScreen('WELCOME');
        } finally {
            setLoading(false);
            setLoadingMessage('');
        }
    };

    // Handler cho nhập text thủ công (giữ lại để hỗ trợ dán nội dung)
    const handleManualText = async () => {
        await handleAnalyzeFiles();
    }

    // Handler cho upload ảnh puzzle
    const handlePuzzleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setPuzzleImageUrl(result);
            setPuzzleImageName(file.name);
        };
        reader.readAsDataURL(file);
    };

    // Handler để load game đã lưu
    const loadSavedGame = (game: SavedGame) => {
        setParsedData(game.parsedData);
        if (game.parsedData.puzzleImageUrl) {
            setPuzzleImageUrl(game.parsedData.puzzleImageUrl);
        }
        setScreen('MENU');
    };

    // Handler để xóa game khỏi lịch sử
    const handleDeleteGame = (gameId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        deleteGame(gameId);
        setGameHistory(getGameHistory());
    };

    const handleGameFinish = (score: number, max: number) => {
        setGameScore(score);
        setMaxGameScore(max);
        setScreen('RESULT');

        if (score > max * 0.7) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#D4AF37', '#B8860B', '#F4E5B1', '#722F37']
            });
        }
    };

    const resetApp = () => {
        setScreen('WELCOME');
        setFileContent('');
        setParsedData(null);
    }

    // Render Screens
    const renderWelcome = () => (
        <div className="flex flex-col items-center justify-start p-4 text-center space-y-8 animate-fade-in pt-28 pb-12 relative">
            {/* Decorative Background Elements */}
            <div className="absolute top-20 left-10 w-32 h-32 border border-[#D4AF37]/20 rotate-45 pointer-events-none"></div>
            <div className="absolute bottom-20 right-10 w-24 h-24 border border-[#D4AF37]/20 rotate-12 pointer-events-none"></div>

            {/* Hero Section */}
            <div className="space-y-4 relative">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Crown className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                    <span className="text-[#D4AF37] text-sm tracking-[0.3em] uppercase font-semibold">Ứng dụng Giáo Dục</span>
                    <Crown className="w-8 h-8 text-[#D4AF37] animate-pulse" />
                </div>

                <h1 className="text-5xl md:text-7xl font-bold" style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}>
                    <span className="text-[#F5F0E1]">Game</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4E5B1] to-[#D4AF37]"> Lịch Sử</span>
                </h1>

                <p className="text-[#8B7355] text-lg md:text-xl max-w-xl mx-auto" style={{ fontFamily: "'Lora', Georgia, serif" }}>
                    Biến những trang sử khô khan thành hành trình khám phá đầy thú vị
                </p>

                {/* Ornamental Divider */}
                <div className="flex items-center justify-center gap-4 py-4">
                    <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                    <Scroll className="w-6 h-6 text-[#D4AF37]" />
                    <div className="w-20 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                </div>
            </div>

            {/* Feature Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-8">
                {[
                    { icon: Zap, title: "Trắc Nghiệm", desc: "Thử thách kiến thức với câu hỏi đa dạng", color: "from-[#D4AF37] to-[#B8860B]" },
                    { icon: Clock, title: "Dòng Thời Gian", desc: "Sắp xếp sự kiện theo trình tự thời gian", color: "from-[#2E8B57] to-[#1E5631]" },
                    { icon: BookOpen, title: "AI Phân Tích", desc: "Tự động trích xuất dữ liệu với Gemini", color: "from-[#722F37] to-[#4A1F24]" }
                ].map((item, i) => (
                    <div
                        key={i}
                        className="glass-card p-6 rounded-2xl flex flex-col items-center hover:scale-105 transition-all duration-300 group cursor-pointer corner-decoration"
                    >
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                            <item.icon className="w-8 h-8 text-[#F5F0E1]" />
                        </div>
                        <h3 className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>{item.title}</h3>
                        <p className="text-[#8B7355] text-sm mt-2 text-center">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Input Section */}
            <div className="glass-card p-8 w-full max-w-2xl rounded-3xl mt-12 relative">
                {/* Gold accent line */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

                <h2 className="text-2xl font-bold text-[#F5F0E1] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Bắt Đầu Hành Trình
                </h2>
                <p className="text-[#8B7355] text-sm mb-6">Tải lên tài liệu và ảnh, sau đó bấm phân tích</p>

                <div className="flex flex-col gap-4">
                    {/* Upload Files Section - 2 ô song song */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Upload Tài liệu */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-[#D4AF37]" />
                                <span className="text-[#F5F0E1] text-sm font-medium">Tài liệu bài học</span>
                                <span className="text-[#D4AF37] text-xs">*Bắt buộc</span>
                            </div>
                            {pendingFileName ? (
                                <div className="flex items-center justify-between p-4 bg-[#2A2318] border border-[#D4AF37]/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center">
                                            <FileType className="w-5 h-5 text-[#D4AF37]" />
                                        </div>
                                        <div>
                                            <p className="text-[#F5F0E1] text-sm font-medium truncate max-w-[150px]">{pendingFileName}</p>
                                            <p className="text-[#6B5C45] text-xs">Đã chọn</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={clearPendingFile}
                                        className="p-2 text-[#6B5C45] hover:text-[#E8A9A9] hover:bg-[#722F37]/20 rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#D4AF37]/30 rounded-xl cursor-pointer hover:bg-[#D4AF37]/5 transition-all duration-300 group">
                                    <Upload className="w-6 h-6 text-[#D4AF37] mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-[#8B7355] text-xs text-center">PDF, Word, TXT, Ảnh</p>
                                    <input type="file" className="hidden" onChange={handleDocumentUpload} accept={getFileAcceptString()} />
                                </label>
                            )}
                        </div>

                        {/* Upload Ảnh cho Ghép Hình */}
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-2">
                                <Puzzle className="w-4 h-4 text-[#722F37]" />
                                <span className="text-[#F5F0E1] text-sm font-medium">Ảnh ghép hình</span>
                                <span className="text-[#6B5C45] text-xs">(Tùy chọn)</span>
                            </div>
                            {puzzleImageUrl ? (
                                <div className="flex items-center justify-between p-4 bg-[#2A2318] border border-[#722F37]/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={puzzleImageUrl}
                                            alt="Preview"
                                            className="w-10 h-10 object-cover rounded-lg border border-[#722F37]/50"
                                        />
                                        <div>
                                            <p className="text-[#F5F0E1] text-sm font-medium truncate max-w-[150px]">{puzzleImageName}</p>
                                            <p className="text-[#6B5C45] text-xs">Đã chọn</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={clearPuzzleImage}
                                        className="p-2 text-[#6B5C45] hover:text-[#E8A9A9] hover:bg-[#722F37]/20 rounded-lg transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[#722F37]/30 rounded-xl cursor-pointer hover:bg-[#722F37]/5 transition-all duration-300 group">
                                    <Image className="w-6 h-6 text-[#722F37] mb-2 group-hover:scale-110 transition-transform" />
                                    <p className="text-[#8B7355] text-xs text-center">JPG, PNG, WebP</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePuzzleImageUpload} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-4">
                        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]/30"></div>
                        <span className="text-[#D4AF37] text-sm uppercase tracking-wider">Hoặc dán nội dung</span>
                        <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]/30"></div>
                    </div>

                    <textarea
                        className="w-full h-24 bg-[#2A2318] border border-[#3D3428] rounded-xl p-4 text-[#F5F0E1] focus:ring-2 focus:ring-[#D4AF37]/50 focus:border-[#D4AF37] outline-none transition-all resize-none text-sm"
                        style={{ fontFamily: "'Lora', Georgia, serif" }}
                        placeholder="Dán nội dung bài học lịch sử vào đây..."
                        value={fileContent}
                        onChange={(e) => setFileContent(e.target.value)}
                    ></textarea>

                    {/* Nút Phân Tích */}
                    <button
                        onClick={handleAnalyzeFiles}
                        disabled={(!pendingFile && !fileContent.trim()) || loading}
                        className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#D4AF37] text-[#1A1510] font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 hover:-translate-y-0.5"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Sparkles className="w-5 h-5 animate-spin" />
                                Đang Phân Tích...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <Play className="w-5 h-5" />
                                Phân Tích & Tạo Game
                            </span>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-[#722F37]/20 border border-[#722F37]/50 rounded-xl">
                            <p className="text-[#E8A9A9] text-sm">{error}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Games đã tạo trước đó */}
            {gameHistory.length > 0 && (
                <div className="glass-card p-6 w-full max-w-2xl rounded-2xl mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[#D4AF37]" />
                            <h3 className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Games Đã Tạo
                            </h3>
                            <span className="px-2 py-0.5 bg-[#D4AF37]/10 text-[#D4AF37] text-xs rounded-full border border-[#D4AF37]/30">
                                {gameHistory.length}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                        {gameHistory.map((game) => (
                            <div
                                key={game.id}
                                onClick={() => loadSavedGame(game)}
                                className="p-4 bg-[#2A2318] hover:bg-[#3D3428] border border-[#3D3428] hover:border-[#D4AF37]/30 rounded-xl cursor-pointer transition-all duration-200 group flex items-center justify-between"
                            >
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[#F5F0E1] font-medium truncate group-hover:text-[#D4AF37] transition-colors">
                                        {game.title}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-[#6B5C45]">
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatGameDate(game.createdAt)}
                                        </span>
                                        <span>•</span>
                                        <span>{game.parsedData.events?.length || 0} sự kiện</span>
                                        <span>•</span>
                                        <span>{game.parsedData.questions?.length || 0} câu hỏi</span>
                                        {game.parsedData.puzzleImageUrl && (
                                            <>
                                                <span>•</span>
                                                <span className="text-[#722F37]">🧩 Có ảnh</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={(e) => handleDeleteGame(game.id, e)}
                                        className="p-2 text-[#6B5C45] hover:text-[#E8A9A9] hover:bg-[#722F37]/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        title="Xóa game"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <div className="p-2 text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderEditor = () => (
        <div className="p-6 md:p-12 pt-24 pb-12 min-h-screen">
            <div className="max-w-6xl mx-auto">
                {/* Sticky header with title and button */}
                <div className="sticky top-16 z-30 bg-[#1A1510]/95 backdrop-blur-md py-4 -mx-6 px-6 md:-mx-12 md:px-12 mb-6 border-b border-[#3D3428]/50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-[#D4AF37] flex items-center gap-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                                <Edit3 className="w-6 h-6 md:w-8 md:h-8" />
                                Xem Trước Dữ Liệu
                            </h2>
                            <p className="text-[#8B7355] mt-1 text-sm">Kiểm tra nội dung đã được AI phân tích</p>
                        </div>
                        <button
                            onClick={() => setScreen('MENU')}
                            className="px-6 py-3 bg-gradient-to-r from-[#2E8B57] to-[#1E5631] hover:from-[#1E5631] hover:to-[#2E8B57] text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg uppercase tracking-wider text-sm shrink-0"
                        >
                            Chọn Game <Play className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-card p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Clock className="w-6 h-6 text-[#D4AF37]" />
                            <h3 className="text-xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Sự Kiện Lịch Sử
                            </h3>
                            <span className="badge-historical">{parsedData?.events.length}</span>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {parsedData?.events.map((e, i) => (
                                <div key={i} className="p-3 bg-[#1A1510] border border-[#3D3428] rounded-lg flex justify-between items-center hover:border-[#D4AF37]/30 transition-colors">
                                    <span className="font-bold text-[#D4AF37] text-lg" style={{ fontFamily: "'Cinzel', serif" }}>{e.year}</span>
                                    <span className="text-[#F5F0E1] truncate ml-4 flex-1 text-right">{e.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <Zap className="w-6 h-6 text-[#2E8B57]" />
                            <h3 className="text-xl font-bold text-[#2E8B57]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Câu Hỏi Trắc Nghiệm
                            </h3>
                            <span className="badge-historical" style={{ borderColor: 'rgba(46, 139, 87, 0.3)', color: '#2E8B57', background: 'rgba(46, 139, 87, 0.1)' }}>
                                {parsedData?.questions.length}
                            </span>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {parsedData?.questions.map((q, i) => (
                                <div key={i} className="p-3 bg-[#1A1510] border border-[#3D3428] rounded-lg hover:border-[#2E8B57]/30 transition-colors">
                                    <p className="text-[#F5F0E1] text-sm">{q.question}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card p-6 rounded-xl md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <User className="w-6 h-6 text-[#722F37]" />
                            <h3 className="text-xl font-bold text-[#9B3D47]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Nhân Vật Lịch Sử
                            </h3>
                            <span className="badge-historical" style={{ borderColor: 'rgba(114, 47, 55, 0.3)', color: '#9B3D47', background: 'rgba(114, 47, 55, 0.1)' }}>
                                {parsedData?.characters.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                            {parsedData?.characters.map((c, i) => (
                                <div key={i} className="p-4 bg-[#1A1510] border border-[#3D3428] rounded-lg hover:border-[#722F37]/30 transition-colors">
                                    <span className="font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>{c.name}</span>
                                    <p className="text-xs text-[#8B7355] mt-2 line-clamp-2">{c.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMenu = () => (
        <div className="p-6 flex flex-col items-center justify-start pt-28 pb-12">
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4" style={{ fontFamily: "'Cinzel', 'Playfair Display', serif" }}>
                    Chọn Thử Thách
                </h2>
                <p className="text-[#8B7355]">Khám phá lịch sử qua các trò chơi tương tác</p>

                {/* Divider */}
                <div className="flex items-center justify-center gap-4 py-6">
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                    <Crown className="w-5 h-5 text-[#D4AF37]" />
                    <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
                </div>
            </div>

            {/* Config Bar */}
            <div className="flex flex-wrap gap-4 mb-12 bg-[#2A2318] p-4 rounded-full border border-[#3D3428]">
                <select
                    className="bg-[#1A1510] text-[#F5F0E1] border border-[#3D3428] rounded-lg px-4 py-2 focus:border-[#D4AF37] outline-none"
                    style={{ fontFamily: "'Lora', Georgia, serif" }}
                    value={gameConfig.difficulty}
                    onChange={(e) => setGameConfig({ ...gameConfig, difficulty: e.target.value as any })}
                >
                    <option value="easy">🌱 Dễ</option>
                    <option value="medium">⚔️ Trung Bình</option>
                    <option value="hard">🔥 Khó</option>
                </select>
                <button
                    onClick={() => setGameConfig(p => ({ ...p, soundEnabled: !p.soundEnabled }))}
                    className={`px-4 py-2 rounded-lg border transition-all ${gameConfig.soundEnabled
                        ? 'bg-[#D4AF37]/10 border-[#D4AF37] text-[#D4AF37]'
                        : 'border-[#3D3428] text-[#6B5C45]'}`}
                >
                    🔊 Âm thanh: {gameConfig.soundEnabled ? 'BẬT' : 'TẮT'}
                </button>
            </div>

            {/* Game Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl w-full">
                {[
                    { type: GameType.MATCHING, name: 'Nối Sự Kiện', icon: Share2, color: 'from-[#1E3A5F] to-[#0D1F33]', accent: '#4A90D9' },
                    { type: GameType.TIMELINE, name: 'Dòng Thời Gian', icon: Clock, color: 'from-[#2E8B57] to-[#1E5631]', accent: '#5FD89E' },
                    { type: GameType.QUIZ, name: 'Trắc Nghiệm', icon: Zap, color: 'from-[#D4AF37] to-[#8B6914]', accent: '#F4E5B1' },
                    { type: GameType.PUZZLE, name: 'Ghép Hình', icon: Puzzle, color: 'from-[#722F37] to-[#4A1F24]', accent: '#E8A9A9' },
                    { type: GameType.CHARACTER, name: 'Đoán Nhân Vật', icon: User, color: 'from-[#5D3A8C] to-[#3A2458]', accent: '#B88DD8' },
                ].map(g => (
                    <button
                        key={g.type}
                        onClick={() => {
                            setSelectedGame(g.type);
                            setScreen('PLAYING');
                        }}
                        className="game-card group relative h-64 rounded-2xl overflow-hidden transition-all duration-500"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${g.color}`}></div>

                        {/* Pattern overlay */}
                        <div className="absolute inset-0 opacity-10" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0L40 20L20 40L0 20L20 0z' fill='%23ffffff' fill-opacity='0.1'/%3E%3C/svg%3E")`
                        }}></div>

                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm transition-all duration-300 group-hover:scale-110"
                                style={{ background: `linear-gradient(135deg, ${g.accent}20, ${g.accent}40)`, border: `2px solid ${g.accent}50` }}>
                                <g.icon className="w-10 h-10" style={{ color: g.accent }} />
                            </div>
                            <h3 className="text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{g.name}</h3>
                            <span className="mt-4 px-6 py-2 rounded-full text-xs font-bold text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all uppercase tracking-wider"
                                style={{ background: `${g.accent}30`, border: `1px solid ${g.accent}50` }}>
                                Chơi Ngay
                            </span>
                        </div>
                    </button>
                ))}
            </div>

            <button onClick={() => setScreen('EDITOR')} className="mt-12 text-[#8B7355] hover:text-[#D4AF37] flex items-center gap-2 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Quay lại xem dữ liệu
            </button>
        </div>
    );

    const renderGame = () => {
        if (!parsedData || !selectedGame) return null;

        return (
            <div className="h-screen flex flex-col">
                {/* Game Header */}
                <div className="h-16 border-b border-[#3D3428] flex items-center justify-between px-6 bg-[#1A1510]/95 backdrop-blur-md z-50">
                    <button onClick={() => setScreen('MENU')} className="text-[#D4AF37] hover:bg-[#D4AF37]/10 p-2 rounded-full transition-colors">
                        <ArrowLeft />
                    </button>
                    <h2 className="text-lg font-bold text-[#D4AF37]" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {selectedGame === GameType.MATCHING && '⚔️ Nối Sự Kiện'}
                        {selectedGame === GameType.TIMELINE && '📜 Dòng Thời Gian'}
                        {selectedGame === GameType.QUIZ && '💡 Trắc Nghiệm Tốc Độ'}
                        {selectedGame === GameType.PUZZLE && '🧩 Ghép Hình'}
                        {selectedGame === GameType.CHARACTER && '👤 Đoán Nhân Vật'}
                    </h2>
                    <div className="w-8"></div>
                </div>

                {/* Game Container */}
                <div className="flex-1 overflow-hidden relative bg-[#1A1510]">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#D4AF37] rounded-full blur-[200px] opacity-5"></div>
                        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#722F37] rounded-full blur-[200px] opacity-5"></div>
                    </div>

                    <div className="relative z-10 w-full h-full flex flex-col p-4">
                        {selectedGame === GameType.MATCHING && (
                            <MatchGame data={parsedData.events} config={gameConfig} onFinish={handleGameFinish} />
                        )}
                        {selectedGame === GameType.TIMELINE && (
                            <TimelineGame data={parsedData.events} config={gameConfig} onFinish={handleGameFinish} />
                        )}
                        {selectedGame === GameType.QUIZ && (
                            <QuizGame data={parsedData.questions} config={gameConfig} onFinish={handleGameFinish} />
                        )}
                        {selectedGame === GameType.CHARACTER && (
                            <CharacterGame data={parsedData.characters} config={gameConfig} onFinish={handleGameFinish} />
                        )}
                        {selectedGame === GameType.PUZZLE && (
                            <PuzzleGame data={parsedData} config={gameConfig} onFinish={handleGameFinish} />
                        )}
                    </div>
                </div>
            </div>
        )
    };

    const renderResult = () => (
        <div className="flex flex-col items-center justify-center p-4 pt-28 pb-12">
            <div className="glass-card p-12 rounded-3xl text-center max-w-lg w-full relative overflow-hidden">
                {/* Gold accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>

                <div className="animate-float">
                    <Award className="w-24 h-24 text-[#D4AF37] mx-auto mb-6" />
                </div>

                <h2 className="text-4xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: "'Cinzel', serif" }}>Hoàn Thành!</h2>
                <p className="text-[#8B7355] mb-8">Bạn đã chinh phục thử thách này</p>

                <div className="flex justify-center gap-12 mb-10">
                    <div className="text-center">
                        <p className="text-sm text-[#6B5C45] uppercase tracking-wider mb-2">Điểm Số</p>
                        <p className="text-5xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Cinzel', serif" }}>{gameScore}</p>
                    </div>
                    <div className="w-[1px] bg-gradient-to-b from-transparent via-[#3D3428] to-transparent"></div>
                    <div className="text-center">
                        <p className="text-sm text-[#6B5C45] uppercase tracking-wider mb-2">Tối đa</p>
                        <p className="text-5xl font-bold text-[#6B5C45]" style={{ fontFamily: "'Cinzel', serif" }}>{maxGameScore}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setScreen('MENU')}
                        className="py-3 px-6 bg-[#2A2318] hover:bg-[#3D3428] text-[#F5F0E1] rounded-xl font-bold transition-all border border-[#3D3428]"
                    >
                        Menu Chính
                    </button>
                    <button
                        onClick={() => setScreen('PLAYING')}
                        className="py-3 px-6 bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#B8860B] hover:to-[#D4AF37] text-[#1A1510] rounded-xl font-bold transition-all shadow-lg shadow-[#D4AF37]/30"
                    >
                        Chơi Lại
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="flex-1 bg-[#1A1510] text-[#F5F0E1] flex flex-col overflow-y-auto" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            {/* Header */}
            {screen !== 'PLAYING' && (
                <Header
                    onSettingsClick={() => setShowApiKeyModal(true)}
                    hasApiKey={!!apiKey}
                />
            )}

            {/* API Key Modal */}
            <ApiKeyModal
                isOpen={showApiKeyModal}
                onClose={() => setShowApiKeyModal(false)}
                onSave={handleSaveApiKey}
                currentApiKey={apiKey}
                currentModel={getStoredModel()}
            />

            {/* Main Content */}
            <main className="flex-1">
                {screen === 'WELCOME' && renderWelcome()}
                {screen === 'UPLOAD' && (
                    <div className="h-screen flex items-center justify-center flex-col pt-24">
                        <div className="relative">
                            <div className="w-20 h-20 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
                            <Scroll className="w-8 h-8 text-[#D4AF37] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <p className="text-[#D4AF37] text-lg mt-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                            {loadingMessage || 'Đang phân tích tài liệu...'}
                        </p>
                        <p className="text-[#6B5C45] text-sm mt-2">AI đang trích xuất dữ liệu lịch sử</p>
                    </div>
                )}
                {screen === 'EDITOR' && renderEditor()}
                {screen === 'MENU' && renderMenu()}
                {screen === 'PLAYING' && renderGame()}
                {screen === 'RESULT' && renderResult()}
            </main>


        </div>
    );
};

export default App;