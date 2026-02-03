
import { User, LeaveRequest, Role, LeaveQuotas, AppState, LeaveStatus } from '../types';
import { INITIAL_USERS, DEFAULT_QUOTAS } from '../constants';
import {
  initializeApp,
  FirebaseApp,
} from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  doc,
  query,
  where,
  Firestore,
} from 'firebase/firestore';

// Firebase Configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA1234567890",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "scoe-leave-system.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "scoe-leave-system",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "scoe-leave-system.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123def456",
};

// Lazy initialize Firebase
let app: FirebaseApp | null = null;
let firestore: Firestore | null = null;
let initError: Error | null = null;

const initializeFirebase = () => {
  if (initError) {
    throw initError;
  }
  
  if (!app) {
    try {
      console.log('Initializing Firebase with config:', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain
      });
      
      app = initializeApp(firebaseConfig);
      firestore = getFirestore(app);
      
      console.log('✓ Firebase initialized successfully');
    } catch (error) {
      initError = error as Error;
      console.error('✗ Firebase initialization failed:', error);
      throw error;
    }
  }
  
  return { app: app!, firestore: firestore! };
};

// Simulated internal DB state (Global to the session) - kept for fallback
let dbState: AppState = {
  currentUser: null,
  users: [...INITIAL_USERS],
  leaveRequests: [],
  adminAccessCode: 'SCOE2024'
};

/**
 * Database Service with Firebase integration
 */
export const db = {
  // Delay helper to simulate network latency
  delay: (ms = 300) => new Promise(resolve => setTimeout(resolve, ms)),
  getLeaveTypeKey: (type: string): keyof LeaveQuotas => {
    const match = type.match(/\(([^)]+)\)/);
    if (match && match[1]) return match[1] as keyof LeaveQuotas;
    const fallback = type.split(' ')[0];
    return fallback as keyof LeaveQuotas;
  },
  countWorkingDays: (startDateStr: string, endDateStr: string): number => {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;

    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    if (end < start) return 0;

    let count = 0;
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) count += 1;
    }
    return count;
  },

  async getUsers(): Promise<User[]> {
    try {
      const { firestore: db } = initializeFirebase();
      const querySnapshot = await getDocs(collection(db, 'users'));
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as User;
        users.push({ ...data, id: data.id || doc.id });
      });
      return users;
    } catch (error) {
      console.error('Error fetching users from Firebase:', error);
      return [...dbState.users];
    }
  },

  async saveUser(user: User): Promise<User> {
    try {
      const { firestore: db } = initializeFirebase();
      const userRef = doc(db, 'users', user.id);
      await setDoc(userRef, user, { merge: true });
      return user;
    } catch (error) {
      console.error('Error saving user to Firebase:', error);
      const index = dbState.users.findIndex(u => u.id === user.id);
      if (index >= 0) {
        dbState.users[index] = user;
      } else {
        dbState.users.push(user);
      }
      return user;
    }
  },

  async deleteUser(userId: string): Promise<void> {
    try {
      const { firestore: db } = initializeFirebase();
      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      const q = query(collection(db, 'leaveRequests'), where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (docSnapshot) => {
        await deleteDoc(docSnapshot.ref);
      });
    } catch (error) {
      console.error('Error deleting user from Firebase:', error);
      dbState.users = dbState.users.filter(u => u.id !== userId);
      dbState.leaveRequests = dbState.leaveRequests.filter(r => r.userId !== userId);
    }
  },

  async updateQuotas(userId: string, quotas: LeaveQuotas): Promise<void> {
    try {
      const { firestore: db } = initializeFirebase();
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, { quotas });
        return;
      }
      // Fallback: locate by stored id field if doc id doesn't match
      const userDoc = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
      const docId = userDoc.docs[0]?.id;
      if (docId) {
        await updateDoc(doc(db, 'users', docId), { quotas });
        return;
      }
      throw new Error('User not found for quota update');
    } catch (error) {
      console.error('Error updating quotas in Firebase:', error);
      dbState.users = dbState.users.map(u => 
        u.id === userId ? { ...u, quotas } : u
      );
    }
  },

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    try {
      const { firestore: db } = initializeFirebase();
      const querySnapshot = await getDocs(collection(db, 'leaveRequests'));
      const requests: LeaveRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as LeaveRequest;
        requests.push({ ...data, id: data.id || doc.id });
      });
      return requests.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
    } catch (error) {
      console.error('Error fetching leave requests from Firebase:', error);
      return [...dbState.leaveRequests];
    }
  },

  async applyLeave(request: LeaveRequest): Promise<LeaveRequest> {
    try {
      const { firestore: db } = initializeFirebase();
      const docRef = await addDoc(collection(db, 'leaveRequests'), request);
      await updateDoc(doc(db, 'leaveRequests', docRef.id), { id: docRef.id });
      return { ...request, id: docRef.id };
    } catch (error) {
      console.error('Error applying leave in Firebase:', error);
      dbState.leaveRequests = [request, ...dbState.leaveRequests];
      return request;
    }
  },

  async updateLeaveStatus(requestId: string, status: LeaveStatus): Promise<void> {
    try {
      const { firestore: firestoreDb } = initializeFirebase();
      const requestRef = doc(firestoreDb, 'leaveRequests', requestId);

      let requestDoc = await getDoc(requestRef);
      if (!requestDoc.exists()) {
        // Fallback: older records may store custom id field
        const requestSnapshot = await getDocs(query(collection(firestoreDb, 'leaveRequests'), where('id', '==', requestId)));
        if (requestSnapshot.empty) {
          console.error('Leave request not found:', requestId);
          throw new Error('Leave request not found');
        }
        requestDoc = requestSnapshot.docs[0];
      }

      const request = requestDoc.data() as LeaveRequest;
      
      const previousStatus = request.status;

      // Update the leave status using the document ID
      await updateDoc(doc(firestoreDb, 'leaveRequests', requestDoc.id), { status });

      // If approved, deduct from user quotas
      if (status === LeaveStatus.APPROVED && previousStatus !== LeaveStatus.APPROVED) {
        // Calculate number of working days (Mon-Fri only) unless manually provided
        const daysRequested = request.manualDays && request.manualDays > 0
          ? request.manualDays
          : db.countWorkingDays(request.startDate, request.endDate);
        
        const typeKey = db.getLeaveTypeKey(request.type);
        const userRef = doc(firestoreDb, 'users', request.userId);
        const userSnap = await getDoc(userRef);
        let user: User | undefined;
        let userDocId: string | undefined;

        if (userSnap.exists()) {
          user = userSnap.data() as User;
          userDocId = userRef.id;
        } else {
          // Legacy fallback: find user by stored id field if doc id doesn't match
          const userDoc = await getDocs(query(collection(firestoreDb, 'users'), where('id', '==', request.userId)));
          user = userDoc.docs[0]?.data() as User;
          userDocId = userDoc.docs[0]?.id;
        }

        if (user && userDocId) {
          await updateDoc(doc(firestoreDb, 'users', userDocId), {
            quotas: {
              ...user.quotas,
              [typeKey]: Math.max(0, user.quotas[typeKey] - daysRequested)
            }
          });
        }
      }
    } catch (error) {
      console.error('Error updating leave status in Firebase:', error);
      const reqIndex = dbState.leaveRequests.findIndex(r => r.id === requestId);
      if (reqIndex === -1) return;

      const request = dbState.leaveRequests[reqIndex];
      const previousStatus = request.status;
      dbState.leaveRequests[reqIndex] = { ...request, status };

      if (status === LeaveStatus.APPROVED && previousStatus !== LeaveStatus.APPROVED) {
        // Calculate number of working days (Mon-Fri only) unless manually provided
        const daysRequested = request.manualDays && request.manualDays > 0
          ? request.manualDays
          : db.countWorkingDays(request.startDate, request.endDate);
        
        const typeKey = db.getLeaveTypeKey(request.type);
        dbState.users = dbState.users.map(u => {
          if (u.id === request.userId) {
            return {
              ...u,
              quotas: {
                ...u.quotas,
                [typeKey]: Math.max(0, u.quotas[typeKey] - daysRequested)
              }
            };
          }
          return u;
        });
      }
    }
  },

  async getAccessCode(): Promise<string> {
    try {
      const { firestore: db } = initializeFirebase();
      const querySnapshot = await getDocs(query(collection(db, 'config')));
      if (querySnapshot.docs.length > 0) {
        return querySnapshot.docs[0].data().code || 'SCOE2024';
      }
      return 'SCOE2024';
    } catch (error) {
      console.error('Error fetching access code from Firebase:', error);
      return dbState.adminAccessCode;
    }
  },

  async setAccessCode(code: string): Promise<void> {
    try {
      const { firestore: db } = initializeFirebase();
      const docRef = doc(db, 'config', 'adminAccessCode');
      await setDoc(docRef, { code }, { merge: true });
    } catch (error) {
      console.error('Error setting access code in Firebase:', error);
      dbState.adminAccessCode = code;
    }
  }
};
