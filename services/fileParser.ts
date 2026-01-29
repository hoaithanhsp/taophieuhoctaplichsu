/**
 * File Parser Service
 * Hỗ trợ đọc nội dung từ nhiều định dạng file: PDF, DOCX, ảnh, text
 */

import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            fullText += pageText + '\n\n';
        }

        return fullText.trim();
    } catch (error) {
        console.error('Lỗi đọc PDF:', error);
        throw new Error('Không thể đọc file PDF. Vui lòng thử file khác.');
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
