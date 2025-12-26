const admin = require('firebase-admin');

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
const bucket = process.env.FIREBASE_STORAGE_BUCKET;

let firebaseAdmin;

if (!serviceAccountString) {
  console.warn('FIREBASE_SERVICE_ACCOUNT environment variable not set. Firebase Admin SDK will not be initialized.');
  firebaseAdmin = null;
} else {
  try {
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: bucket,
    });


    console.log('Firebase Admin SDK initialized successfully.');
    firebaseAdmin = admin;
  } catch (error) {
    console.error('Error parsing FIREBASE_SERVICE_ACCOUNT or initializing Firebase Admin SDK:', error);
    firebaseAdmin = null;
  }
}

module.exports = firebaseAdmin;