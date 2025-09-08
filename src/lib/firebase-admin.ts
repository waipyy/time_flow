import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: admin.app.App | undefined;

const initializeDb = () => {
  // The an environment variable is set when running on App Hosting.
  // The Firebase Admin SDK automatically uses this service account credential.
  if (process.env.APP_HOSTING_SECRET_FIREBASE_ADMIN_SDK) {
    console.log('--- Initializing Firebase Admin with App Hosting credentials ---');
    app = admin.initializeApp();
  } else if (admin.apps.length === 0) {
    // Fallback for local development if serviceAccountKey.json exists.
    try {
      console.log('--- Initializing Firebase Admin with serviceAccountKey.json ---');
      const serviceAccount = require('./serviceAccountKey.json');
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
    } catch (error: any) {
        if (error.code === 'MODULE_NOT_FOUND') {
            console.error(
              "Local credentials (serviceAccountKey.json) not found. " +
              "The app will not be able to connect to Firestore when running locally. " +
              "This is expected on the deployed server."
            );
          } else {
            console.error('Error initializing with local credentials:', error);
          }
    }
  } else {
     app = admin.apps[0]!;
  }
};

export const getDb = (): Firestore => {
  if (!app) {
    initializeDb();
  }
  if (!app) {
    throw new Error(
      'Firebase App is not available. Initialization failed. Ensure your environment is set up correctly.'
    );
  }
  // This uses the default database. You can specify a DB name if needed.
  return getFirestore(app);
};
