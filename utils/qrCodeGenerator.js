// utils/qrCodeGenerator.js
const QRCode = require('qrcode');

const generateQRCode = async (data) => {
    try {
        const url = await QRCode.toDataURL(data);
        return url;
    } catch (err) {
        console.error('Error generating QR code:', err);
        throw new Error('Could not generate QR code.');
    }
};

module.exports = generateQRCode;
