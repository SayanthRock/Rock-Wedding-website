import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

if (typeof window !== "undefined") {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("Firestore persistence failed-precondition: multiple tabs open");
    } else if (err.code === 'unimplemented') {
      console.warn("Firestore persistence unimplemented: browser not supported");
    }
  });
}

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function getDetailedErrorMessage(error: any): string {
  const code = error?.code;
  const message = error?.message || "An unknown error occurred";

  switch (code) {
    case 'permission-denied':
      return "Access denied. Insufficient permissions for this neural sector.";
    case 'unavailable':
      return "Network synchronization failed. The cloud is currently unreachable.";
    case 'not-found':
      return "The requested data fragment could not be located in the archive.";
    case 'already-exists':
      return "Conflict detected: This data entity already exists in the registry.";
    case 'unauthenticated':
      return "Authentication signature missing. Please link your identity.";
    case 'quota-exceeded':
      return "Neural bandwidth exhausted. Please try again later.";
    case 'deadline-exceeded':
      return "Operation timed out. Neural link latency is too high.";
    case 'storage/unauthorized':
      return "Unauthorized access to storage vault.";
    case 'storage/canceled':
      return "Transmission manually aborted.";
    case 'storage/unknown':
      return "Critical system failure during transmission.";
    case 'auth/network-request-failed':
      return "Neural link offline. Check your network uplink.";
    case 'auth/user-disabled':
      return "Your identity has been restricted.";
    default:
      if (message.includes('offline')) return "Neural uplink disconnected. Retrying...";
      return message;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
