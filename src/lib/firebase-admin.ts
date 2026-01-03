import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { debugDbConnection } from './data';

let app: admin.app.App | undefined;
let db: Firestore | undefined;

const initializeDb = () => {
  if (admin.apps.length > 0) {
    console.log('--- Firebase Admin SDK already initialized ---');
    app = admin.apps[0]!;
    return;
  }

  // Check if using Firebase Emulator
  const useEmulator = process.env.FIRESTORE_EMULATOR_HOST;
  if (useEmulator) {
    console.log('--- Using Firestore Emulator ---');
    console.log('FIRESTORE_EMULATOR_HOST:', useEmulator);

    // Initialize with a minimal config for emulator
    app = admin.initializeApp({
      projectId: 'demo-timeflow', // Use demo- prefix for emulator
    });

    console.log('Firebase Admin initialized for emulator use.');
    return;
  }

  try {
    console.log('--- Initializing Firebase Admin with require(serviceAccountKey.json) ---');
    const serviceAccountJson = process.env.SERVICE_ACCOUNT_JSON;

    if (!serviceAccountJson) {
      throw new Error('SERVICE_ACCOUNT_JSON environment variable not found');
    }

    const serviceAccount = JSON.parse(serviceAccountJson);

    console.log('--- Raw Service Account Debug ---');
    console.log('Type of serviceAccount:', typeof serviceAccount);
    console.log('Is serviceAccount an object?:', serviceAccount && typeof serviceAccount === 'object');
    if (serviceAccount && typeof serviceAccount === 'object') {
      console.log('Service account keys:', Object.keys(serviceAccount));
      console.log('Raw project_id value:', JSON.stringify(serviceAccount.project_id));
      console.log('Raw client_email value:', JSON.stringify(serviceAccount.client_email));
    }
    console.log('----------------------------------');

    console.log('--- Testing Credential Creation ---');
    const credential = admin.credential.cert(serviceAccount);
    console.log('Credential created successfully:', !!credential);
    console.log('------------------------------------');

    app = admin.initializeApp({
      credential,
      projectId: serviceAccount.project_id,
    });

    console.log('--- App Details ---');
    console.log(
      'App options:',
      JSON.stringify(app.options, null, 2)
    );
    console.log('------------------');

    const dbName = 'timeflow';
    console.log(`Attempting to connect to database: ${dbName}`);

    // Perform initial connection test
    const initialDb = getFirestore(app, dbName);

    if (initialDb) {
      console.log('Initial DB connection successful. Running debug checks...');
      debugDbConnection(initialDb).catch(console.error);
    }

  } catch (error) {
    console.error('--- Failed to initialize Firebase Admin SDK ---');
    if (error instanceof Error) {
      if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
        console.error(
          "ERROR: serviceAccountKey.json not found. Please ensure it's in src/lib."
        );
      } else {
        console.error('Full error:', error.message);
        console.error(error.stack);
      }
    } else {
      console.error('An unknown error occurred during initialization:', error);
    }
  }
};

export const getDb = (): Firestore => {
  if (!app) {
    initializeDb();
  }
  if (!app) {
    throw new Error(
      'Firebase App is not available. Initialization failed.'
    );
  }
  // Always get a fresh Firestore instance from the initialized app
  // This is more resilient in serverless environments.
  return getFirestore(app, 'timeflow');
};
