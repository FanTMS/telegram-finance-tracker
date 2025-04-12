import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';

// Types
export interface User {
  id: string;
  telegramId: string;
  username: string;
  rank: number;
  points: number;
  achievements: string[];
  name: string;
  email?: string;
  photoURL?: string;
}

export interface Group {
  id: string;
  name: string;
  inviteCode: string;
  members: string[];
  createdAt: Timestamp;
  createdBy: string;
}

export interface Expense {
  id: string;
  groupId: string;
  amount: number;
  category: string;
  description: string;
  createdBy: string;
  createdAt: Timestamp;
  splitBetween: string[];
  paidBy: string[];
}

export interface Income {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: Timestamp;
}

export interface Goal {
  id: string;
  groupId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Timestamp;
  createdBy: string;
}

export interface Purchase {
  id: string;
  groupId: string;
  title: string;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  votes: { [key: string]: boolean };
  comments: { userId: string; text: string; timestamp: Timestamp }[];
}

export interface Payment {
  id: string;
  groupId: string;
  amount: number;
  fromUserId: string;
  toUserId: string;
  description: string;
  status: 'pending' | 'completed';
  expenseId?: string;
  createdAt: Timestamp;
}

// Collection references
const groupsCollection = collection(db, 'groups');
const expensesCollection = collection(db, 'expenses');
const usersCollection = collection(db, 'users');
const paymentsCollection = collection(db, 'payments');

// User operations
export const createUser = async (userData: Omit<User, 'id'>) => {
  const docRef = await addDoc(collection(db, 'users'), userData);
  return { id: docRef.id, ...userData };
};

export const updateUser = async (userId: string, userData: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, userData);
};

// Group operations
export const createGroup = async (groupData: Omit<Group, 'id'>): Promise<Group> => {
  try {
    const docRef = await addDoc(groupsCollection, {
      ...groupData,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...groupData
    };
  } catch (error) {
    console.error('Error creating group:', error);
    throw error;
  }
};

export const getGroups = async (userId: string): Promise<Group[]> => {
  try {
    const q = query(groupsCollection, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Group));
  } catch (error) {
    console.error('Error getting groups:', error);
    throw error;
  }
};

export const getGroupByInviteCode = async (inviteCode: string): Promise<Group | null> => {
  try {
    const q = query(groupsCollection, where('inviteCode', '==', inviteCode));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as Group;
  } catch (error) {
    console.error('Error getting group by invite code:', error);
    throw error;
  }
};

export const joinGroup = async (groupId: string, userId: string): Promise<void> => {
  try {
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }
    
    const group = groupSnap.data() as Omit<Group, 'id'>;
    
    if (group.members.includes(userId)) {
      throw new Error('User already in group');
    }
    
    await updateDoc(groupRef, {
      members: [...group.members, userId]
    });
  } catch (error) {
    console.error('Error joining group:', error);
    throw error;
  }
};

export const deleteGroup = async (groupId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'groups', groupId));
    
    // Delete associated expenses
    const q = query(expensesCollection, where('groupId', '==', groupId));
    const querySnapshot = await getDocs(q);
    
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting group:', error);
    throw error;
  }
};

// Expense operations
export const createExpense = async (expenseData: Omit<Expense, 'id'>): Promise<Expense> => {
  try {
    const docRef = await addDoc(expensesCollection, {
      ...expenseData,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...expenseData
    };
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

export const getGroupExpenses = async (groupId: string): Promise<Expense[]> => {
  try {
    const q = query(expensesCollection, where('groupId', '==', groupId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
  } catch (error) {
    console.error('Error getting group expenses:', error);
    throw error;
  }
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    // Проверка существования расхода
    const expenseRef = doc(db, 'expenses', expenseId);
    const expenseSnap = await getDoc(expenseRef);
    
    if (!expenseSnap.exists()) {
      throw new Error('Расход не найден');
    }
    
    // Получаем данные о расходе
    const expense = expenseSnap.data() as Expense;
    
    // Проверка наличия связанных платежей
    const paymentsQuery = query(paymentsCollection, where('expenseId', '==', expenseId));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    // Удаляем связанные платежи, если они есть
    const deletePaymentsPromises = paymentsSnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePaymentsPromises);
    
    // После удаления связанных платежей удаляем сам расход
    await deleteDoc(expenseRef);
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Income operations
export const createIncome = async (incomeData: Omit<Income, 'id'>) => {
  const docRef = await addDoc(collection(db, 'incomes'), incomeData);
  return { id: docRef.id, ...incomeData };
};

export const getUserIncomes = async (userId: string): Promise<Income[]> => {
  try {
    const q = query(
      collection(db, 'incomes'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Income));
  } catch (error) {
    console.error('Error getting user incomes:', error);
    throw error;
  }
};

// Goal operations
export const createGoal = async (goalData: Omit<Goal, 'id'>) => {
  const docRef = await addDoc(collection(db, 'goals'), goalData);
  return { id: docRef.id, ...goalData };
};

export const updateGoalProgress = async (goalId: string, currentAmount: number) => {
  const goalRef = doc(db, 'goals', goalId);
  await updateDoc(goalRef, { currentAmount });
};

// Purchase operations
export const createPurchase = async (purchaseData: Omit<Purchase, 'id'>) => {
  const docRef = await addDoc(collection(db, 'purchases'), purchaseData);
  return { id: docRef.id, ...purchaseData };
};

export const voteOnPurchase = async (purchaseId: string, userId: string, vote: boolean) => {
  const purchaseRef = doc(db, 'purchases', purchaseId);
  await updateDoc(purchaseRef, {
    [`votes.${userId}`]: vote
  });
};

export const addPurchaseComment = async (
  purchaseId: string,
  userId: string,
  text: string
) => {
  const purchaseRef = doc(db, 'purchases', purchaseId);
  const comment = {
    userId,
    text,
    timestamp: Timestamp.now()
  };
  await updateDoc(purchaseRef, {
    comments: [...(await getDoc(purchaseRef)).data()?.comments || [], comment]
  });
};

// Payment operations
export const createPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'status'>): Promise<Payment> => {
  try {
    const docRef = await addDoc(paymentsCollection, {
      ...paymentData,
      status: 'pending',
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...paymentData,
      status: 'pending',
      createdAt: Timestamp.now(),
    };
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

export const completePayment = async (paymentId: string): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      status: 'completed'
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    throw error;
  }
};

export const getGroupPayments = async (groupId: string): Promise<Payment[]> => {
  try {
    const q = query(
      paymentsCollection, 
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  } catch (error) {
    console.error('Error getting group payments:', error);
    throw error;
  }
};

export const getUserReceivedPayments = async (userId: string): Promise<Payment[]> => {
  try {
    const q = query(
      paymentsCollection, 
      where('toUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  } catch (error) {
    console.error('Error getting user received payments:', error);
    throw error;
  }
};

export const getUserSentPayments = async (userId: string): Promise<Payment[]> => {
  try {
    const q = query(
      paymentsCollection, 
      where('fromUserId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  } catch (error) {
    console.error('Error getting user sent payments:', error);
    throw error;
  }
};

// User operations
export const createOrUpdateUser = async (userData: User): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userData.id);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // Convert User to a plain object that Firestore can accept
      const userDataForUpdate = {
        name: userData.name,
        email: userData.email || null,
        photoURL: userData.photoURL || null,
      };
      
      await updateDoc(userRef, userDataForUpdate);
    } else {
      // For new users, use setDoc instead of updateDoc
      await setDoc(userRef, {
        ...userData,
        createdAt: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    
    // In development, we can just log the error and continue
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Mock user creation/update due to Firebase error');
      // We don't throw an error in development mode
      return;
    }
    
    throw error;
  }
};

export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { ...userSnap.data(), id: userSnap.id } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    
    // In development, provide a mock user if there's an error
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Using mock user due to Firebase error');
      return {
        id: userId,
        telegramId: userId,
        username: 'dev_user',
        name: 'Development User',
        rank: 0,
        points: 0,
        achievements: []
      };
    }
    
    return null;
  }
};

// Get all expenses for a user (from all groups)
export const getUserExpenses = async (userId: string): Promise<Expense[]> => {
  try {
    const q = query(expensesCollection, where('splitBetween', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Expense));
  } catch (error) {
    console.error('Error getting user expenses:', error);
    throw error;
  }
};

// Calculate user's financial summary
export const getUserFinancialSummary = async (userId: string) => {
  try {
    // Get all expenses where the user is involved
    const expenses = await getUserExpenses(userId);
    
    // Get all incomes for the user
    const incomes = await getUserIncomes(userId);
    
    // Calculate total expenses that this user is responsible for
    let totalExpenses = 0;
    expenses.forEach(expense => {
      // Calculate user's share of this expense
      const userShare = expense.amount / expense.splitBetween.length;
      totalExpenses += userShare;
    });
    
    // Calculate total income
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    
    // Calculate balance
    const balance = totalIncome - totalExpenses;
    
    return {
      totalExpenses,
      totalIncome,
      balance,
      recentExpenses: expenses.slice(0, 5), // Get 5 most recent expenses
      recentIncomes: incomes.slice(0, 5)    // Get 5 most recent incomes
    };
  } catch (error) {
    console.error('Error calculating user financial summary:', error);
    throw error;
  }
}; 