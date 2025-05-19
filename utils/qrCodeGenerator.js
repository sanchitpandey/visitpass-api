// utils/qrCodeGenerator.js
const QRCode = require("qrcode");

const generateQRCode = async (data) => {
  try {
    // Generate QR code as data URL
    return data;
    const qrCodeDataURL = await QRCode.toDataURL(data);
    return qrCodeDataURL;
  } catch (error) {
    throw new Error(`QR Code generation failed: ${error.message}`);
  }
};

module.exports = generateQRCode;
