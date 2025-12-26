const firebaseAdmin = require("../config/firebaseAdmin");

const bucket = firebaseAdmin.storage().bucket();

const uploadImageToFirebase = async (file, folder = "visitors") => {
  const fileName = `${folder}/${Date.now()}-${file.originalname}`;

  const fileUpload = bucket.file(fileName);

  await fileUpload.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
    public: true,
  });

  // Public URL
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};

module.exports = { uploadImageToFirebase };
