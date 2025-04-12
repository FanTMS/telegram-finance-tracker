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
  groupId?: string; // Optional field for group income
}

export interface RegularIncome {
  id: string;
  userId: string;
  description: string;
  amount: number;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  nextDate: Timestamp;
  active: boolean;
  groupId?: string; // Optional field for group income
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

export interface ShoppingItem {
  id: string;
  name: string;
  estimatedPrice: number;
  hasPriceEstimate: boolean;
  quantity?: number;
  hasQuantity: boolean;
  purchaseDate?: Timestamp;
  hasPurchaseDate: boolean;
  completed: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedBy?: string;
  updatedAt?: Timestamp;
}

export interface ShoppingList {
  id: string;
  title: string;
  groupId: string;
  items: ShoppingItem[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

// Collection references
const groupsCollection = collection(db, 'groups');
const expensesCollection = collection(db, 'expenses');
const usersCollection = collection(db, 'users');
const paymentsCollection = collection(db, 'payments');
const goalsCollection = collection(db, 'goals');

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

// Обновление существующего расхода
export const updateExpense = async (expenseId: string, expenseData: Partial<Expense>): Promise<void> => {
  try {
    const expenseRef = doc(db, 'expenses', expenseId);
    await updateDoc(expenseRef, expenseData);
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Income operations
export const createIncome = async (incomeData: Omit<Income, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'incomes'), incomeData);
    return { id: docRef.id, ...incomeData };
  } catch (error) {
    console.error('Error creating income:', error);
    throw error;
  }
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

// Get incomes for a specific group
export const getGroupIncomes = async (groupId: string): Promise<Income[]> => {
  try {
    const q = query(
      collection(db, 'incomes'),
      where('groupId', '==', groupId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Income));
  } catch (error) {
    console.error('Error getting group incomes:', error);
    throw error;
  }
};

export const deleteIncome = async (incomeId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'incomes', incomeId));
  } catch (error) {
    console.error('Error deleting income:', error);
    throw error;
  }
};

// Regular Income operations
export const createRegularIncome = async (incomeData: Omit<RegularIncome, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'regularIncomes'), incomeData);
    return { id: docRef.id, ...incomeData };
  } catch (error) {
    console.error('Error creating regular income:', error);
    throw error;
  }
};

export const getUserRegularIncomes = async (userId: string): Promise<RegularIncome[]> => {
  try {
    const q = query(
      collection(db, 'regularIncomes'),
      where('userId', '==', userId),
      orderBy('nextDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RegularIncome));
  } catch (error) {
    console.error('Error getting user regular incomes:', error);
    throw error;
  }
};

export const getGroupRegularIncomes = async (groupId: string): Promise<RegularIncome[]> => {
  try {
    const q = query(
      collection(db, 'regularIncomes'),
      where('groupId', '==', groupId),
      orderBy('nextDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as RegularIncome));
  } catch (error) {
    console.error('Error getting group regular incomes:', error);
    throw error;
  }
};

export const updateRegularIncome = async (id: string, data: Partial<RegularIncome>): Promise<void> => {
  try {
    const incomeRef = doc(db, 'regularIncomes', id);
    await updateDoc(incomeRef, data);
  } catch (error) {
    console.error('Error updating regular income:', error);
    throw error;
  }
};

export const deleteRegularIncome = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'regularIncomes', id));
  } catch (error) {
    console.error('Error deleting regular income:', error);
    throw error;
  }
};

// Goals operations
export const createGoal = async (goalData: Omit<Goal, 'id'>): Promise<Goal> => {
  try {
    const docRef = await addDoc(goalsCollection, {
      ...goalData,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...goalData
    };
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
};

export const getGoalsByGroup = async (groupId: string): Promise<Goal[]> => {
  try {
    const q = query(goalsCollection, where('groupId', '==', groupId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Goal));
  } catch (error) {
    console.error('Error getting goals:', error);
    throw error;
  }
};

export const updateGoalProgress = async (goalId: string, currentAmount: number): Promise<void> => {
  try {
    const goalRef = doc(db, 'goals', goalId);
    await updateDoc(goalRef, { 
      currentAmount,
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    console.error('Error updating goal progress:', error);
    throw error;
  }
};

export const deleteGoal = async (goalId: string): Promise<void> => {
  try {
    const goalRef = doc(db, 'goals', goalId);
    await deleteDoc(goalRef);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
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

// ShoppingList operations
export const createShoppingList = async (listData: Omit<ShoppingList, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'shoppingLists'), {
      ...listData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...listData };
  } catch (error) {
    console.error('Error creating shopping list:', error);
    throw error;
  }
};

export const getShoppingLists = async (groupId: string) => {
  try {
    const q = query(
      collection(db, 'shoppingLists'), 
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ShoppingList));
  } catch (error) {
    console.error('Error getting shopping lists:', error);
    throw error;
  }
};

export const updateShoppingList = async (listId: string, data: Partial<ShoppingList>) => {
  try {
    const listRef = doc(db, 'shoppingLists', listId);
    await updateDoc(listRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating shopping list:', error);
    throw error;
  }
};

export const deleteShoppingList = async (listId: string) => {
  try {
    await deleteDoc(doc(db, 'shoppingLists', listId));
  } catch (error) {
    console.error('Error deleting shopping list:', error);
    throw error;
  }
};

export const addShoppingItem = async (
  listId: string, 
  item: Omit<ShoppingItem, 'id' | 'createdAt'>,
  currentItems: ShoppingItem[]
) => {
  try {
    const newItem: ShoppingItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: Timestamp.now()
    };
    
    const listRef = doc(db, 'shoppingLists', listId);
    await updateDoc(listRef, {
      items: [...currentItems, newItem],
      updatedAt: serverTimestamp()
    });
    
    return newItem;
  } catch (error) {
    console.error('Error adding shopping item:', error);
    throw error;
  }
};

export const updateShoppingItem = async (
  listId: string,
  itemId: string,
  data: Partial<ShoppingItem>,
  currentItems: ShoppingItem[]
) => {
  try {
    const updatedItems = currentItems.map(item => 
      item.id === itemId 
        ? { ...item, ...data, updatedAt: Timestamp.now() } 
        : item
    );
    
    const listRef = doc(db, 'shoppingLists', listId);
    await updateDoc(listRef, {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating shopping item:', error);
    throw error;
  }
};

export const deleteShoppingItem = async (
  listId: string,
  itemId: string,
  currentItems: ShoppingItem[]
) => {
  try {
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    
    const listRef = doc(db, 'shoppingLists', listId);
    await updateDoc(listRef, {
      items: updatedItems,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error deleting shopping item:', error);
    throw error;
  }
}; 