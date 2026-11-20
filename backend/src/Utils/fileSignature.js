'use strict';

function detectFileType(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12)
        return null;

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff)
        return 'jpeg';
    
    if (buffer.subarray(0, 8).equals(PNG_SIGNATURE))
        return 'png';

    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP')
        return 'webp';

    if (buffer.toString('ascii', 0, 5) === '%PDF-')
        return 'pdf';

    return null;
}

const MIME_TYPES = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    pdf: 'application/pdf'
};

const EXTENSIONS = {
    jpeg: 'jpg',
    png: 'png',
    webp: 'webp',
    pdf: 'pdf'
};

const mimeFor = (type) => MIME_TYPES[type] || 'application/octet-stream';
const extensionFor = (type) => EXTENSIONS[type] || 'bin';

module.exports = { detectFileType, mimeFor, extensionFor };