/** ISO date string or Firestore Timestamp from client/admin SDK. */
export type FirestoreTimestamp =
  | string
  | {
      seconds: number;
      nanoseconds: number;
      toDate?: () => Date;
    };

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
