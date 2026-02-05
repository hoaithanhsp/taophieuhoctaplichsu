import { ParsedData, SavedGame } from '../types';

const STORAGE_KEY = 'game_history';
const MAX_GAMES = 20; // Giới hạn số lượng games lưu trữ

/**
 * Lấy danh sách games đã lưu từ localStorage
 */
export const getGameHistory = (): SavedGame[] => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        return JSON.parse(stored) as SavedGame[];
    } catch (error) {
        console.error('Lỗi khi đọc lịch sử games:', error);
        return [];
    }
};

/**
 * Lưu game mới vào lịch sử
 */
export const saveGame = (parsedData: ParsedData): SavedGame => {
    const history = getGameHistory();

    const newGame: SavedGame = {
        id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: parsedData.title || `Game ${new Date().toLocaleDateString('vi-VN')}`,
        createdAt: Date.now(),
        parsedData: parsedData
    };

    // Thêm game mới vào đầu danh sách
    const updatedHistory = [newGame, ...history];

    // Giới hạn số lượng games
    if (updatedHistory.length > MAX_GAMES) {
        updatedHistory.splice(MAX_GAMES);
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Lỗi khi lưu game:', error);
    }

    return newGame;
};

/**
 * Tải game theo ID
 */
export const loadGame = (id: string): SavedGame | null => {
    const history = getGameHistory();
    return history.find(game => game.id === id) || null;
};

/**
 * Xóa game khỏi lịch sử
 */
export const deleteGame = (id: string): void => {
    const history = getGameHistory();
    const updatedHistory = history.filter(game => game.id !== id);

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
        console.error('Lỗi khi xóa game:', error);
    }
};

/**
 * Xóa toàn bộ lịch sử games
 */
export const clearGameHistory = (): void => {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Lỗi khi xóa lịch sử:', error);
    }
};

/**
 * Format ngày giờ hiển thị
 */
export const formatGameDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};
