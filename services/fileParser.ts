/**
 * File Parser Service
 * Hỗ trợ đọc nội dung từ nhiều định dạng file: PDF, DOCX, ảnh, text
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for PDF.js v4.x
// Sử dụng unpkg CDN cho tương thích tốt hơn với Vite
const pdfWorkerUrl = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
console.log('PDF.js version:', pdfjsLib.version, 'Worker URL:', pdfWorkerUrl);

export type FileType = 'text' | 'pdf' | 'docx' | 'image' | 'unknown';

export interface ParsedFile {
    type: FileType;
    text?: string;
    imageBase64?: string;
    imageMimeType?: string;
    fileName: string;
}

/**
 * Phát hiện loại file dựa trên extension và MIME type
 */
export const detectFileType = (file: File): FileType => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeType = file.type;

    // Text files
    if (['txt', 'md', 'json'].includes(extension) || mimeType.startsWith('text/')) {
        return 'text';
    }

    // PDF
    if (extension === 'pdf' || mimeType === 'application/pdf') {
        return 'pdf';
    }

    // Word documents
    if (['docx', 'doc'].includes(extension) ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword') {
        return 'docx';
    }

    // Images
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension) ||
        mimeType.startsWith('image/')) {
        return 'image';
    }

    return 'unknown';
};

/**
 * Đọc file text thuần
 */
export const parseTextFile = async (file: File): Promise<string> => {
    return await file.text();
};

/**
 * Đọc file PDF và trích xuất text
 */
export const parsePdfFile = async (file: File): Promise<string> => {
    try {
        console.log('Bắt đầu đọc file PDF:', file.name, 'Size:', file.size, 'bytes');

        const arrayBuffer = await file.arrayBuffer();
        console.log('Đã đọc ArrayBuffer, size:', arrayBuffer.byteLength);

        // Tạo Uint8Array từ ArrayBuffer để tương thích tốt hơn
        const typedArray = new Uint8Array(arrayBuffer);

        // Sử dụng các tùy chọn cấu hình để tăng khả năng tương thích
        const loadingTask = pdfjsLib.getDocument({
            data: typedArray,
            useSystemFonts: true,
            // Tắt một số tính năng có thể gây lỗi
            disableFontFace: false,
            isEvalSupported: false,
            useWorkerFetch: false,
        });

        const pdf = await loadingTask.promise;
        console.log('PDF loaded, số trang:', pdf.numPages);

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str || '')
                .join(' ');
            fullText += pageText + '\n\n';
            console.log(`Đã đọc trang ${i}/${pdf.numPages}`);
        }

        const result = fullText.trim();
        console.log('Tổng text trích xuất:', result.length, 'ký tự');

        if (result.length === 0) {
            console.warn('Không tìm thấy text trong PDF. File có thể là ảnh scan.');
        }

        return result;
    } catch (error: any) {
        console.error('Lỗi đọc PDF chi tiết:', error);
        console.error('Error name:', error?.name);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);

        // Thông báo lỗi cụ thể hơn
        if (error?.message?.includes('Invalid PDF')) {
            throw new Error('File PDF không hợp lệ hoặc bị hỏng.');
        } else if (error?.message?.includes('password')) {
            throw new Error('File PDF được bảo vệ bằng mật khẩu.');
        } else if (error?.message?.includes('worker')) {
            throw new Error('Lỗi tải PDF worker. Vui lòng thử lại sau.');
        }

        throw new Error(`Không thể đọc file PDF: ${error?.message || 'Lỗi không xác định'}`);
    }
};

/**
 * Đọc file DOCX và trích xuất text
 */
export const parseDocxFile = async (file: File): Promise<string> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
    } catch (error) {
        console.error('Lỗi đọc DOCX:', error);
        throw new Error('Không thể đọc file Word. Vui lòng thử file khác.');
    }
};

/**
 * Đọc file ảnh và chuyển thành base64
 */
export const parseImageFile = async (file: File): Promise<{ base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix to get pure base64
            const base64 = result.split(',')[1];
            resolve({
                base64,
                mimeType: file.type
            });
        };

        reader.onerror = () => {
            reject(new Error('Không thể đọc file ảnh.'));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Parse file và trả về nội dung phù hợp
 */
export const parseFile = async (file: File): Promise<ParsedFile> => {
    const fileType = detectFileType(file);

    switch (fileType) {
        case 'text':
            return {
                type: 'text',
                text: await parseTextFile(file),
                fileName: file.name
            };

        case 'pdf':
            return {
                type: 'pdf',
                text: await parsePdfFile(file),
                fileName: file.name
            };

        case 'docx':
            return {
                type: 'docx',
                text: await parseDocxFile(file),
                fileName: file.name
            };

        case 'image':
            const imageData = await parseImageFile(file);
            return {
                type: 'image',
                imageBase64: imageData.base64,
                imageMimeType: imageData.mimeType,
                fileName: file.name
            };

        default:
            throw new Error(`Định dạng file không được hỗ trợ: ${file.name}`);
    }
};

/**
 * Lấy danh sách các định dạng file được hỗ trợ
 */
export const getSupportedFormats = (): string => {
    return '.txt, .md, .json, .pdf, .docx, .doc, .jpg, .jpeg, .png, .gif, .webp';
};

/**
 * Lấy accept string cho input file
 */
export const getFileAcceptString = (): string => {
    return '.txt,.md,.json,.pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';
};
