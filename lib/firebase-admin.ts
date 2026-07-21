import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { buildGrowthFeedPostData, type GrowthFeedPostInput } from '@/lib/growth-feed-post';

let adminApp: App | undefined;

const getAdminApp = () => {
  if (adminApp) {
    return adminApp;
  }

  if (getApps().length > 0) {
    adminApp = getApps()[0];
    return adminApp;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (serviceAccountKey) {
    adminApp = initializeApp({
      credential: cert(JSON.parse(serviceAccountKey)),
      projectId,
    });
    return adminApp;
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
      projectId,
    });
    return adminApp;
  }

  throw new Error(
    'Missing Firebase Admin credentials. Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY.',
  );
};

export const addFakeGrowthFeedPost = async (input: GrowthFeedPostInput) => {
  const app = getAdminApp();
  const db = getFirestore(app);
  const { createdAt, ...postData } = buildGrowthFeedPostData(input);
  const docRef = await db.collection('growth-feed-posts').add({
    ...postData,
    createdAt: Timestamp.fromDate(createdAt),
  });
  return docRef.id;
};
