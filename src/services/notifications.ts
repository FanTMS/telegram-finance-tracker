import { doc, collection, addDoc, getDocs, query, where, updateDoc, Timestamp, orderBy, limit, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface Notification {
  id: string;
  userId: string;
  type: 'expense' | 'payment' | 'debt' | 'invitation';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp;
  data: {
    groupId?: string;
    expenseId?: string;
    paymentId?: string;
    amount?: number;
    fromUserId?: string;
  };
}

const notificationsCollection = collection(db, 'notifications');

// Create a new notification
export const createNotification = async (notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
  try {
    const docRef = await addDoc(notificationsCollection, {
      ...notificationData,
      isRead: false,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...notificationData,
      createdAt: Timestamp.now(),
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const q = query(
      notificationsCollection, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Get unread notifications count
export const getUnreadNotificationsCount = async (userId: string): Promise<number> => {
  try {
    const q = query(
      notificationsCollection, 
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      isRead: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      notificationsCollection, 
      where('userId', '==', userId),
      where('isRead', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { isRead: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Create expense split notification for all group members
export const createExpenseSplitNotifications = async (
  groupId: string, 
  expenseId: string, 
  amount: number, 
  description: string, 
  fromUserId: string,
  splitBetweenUsers: string[]
): Promise<void> => {
  try {
    // Get group information
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }
    
    const group = groupSnap.data();
    const groupName = group.name;
    
    // Get creator information 
    const creatorRef = doc(db, 'users', fromUserId);
    const creatorSnap = await getDoc(creatorRef);
    const creatorName = creatorSnap.exists() ? creatorSnap.data().name : 'Пользователь';
    
    // Calculate individual amount
    const individualAmount = amount / splitBetweenUsers.length;
    
    // Create notifications for each user except the creator
    const notificationPromises = splitBetweenUsers
      .filter(userId => userId !== fromUserId)
      .map(userId => 
        createNotification({
          userId,
          type: 'expense',
          title: `Новый расход в группе ${groupName}`,
          message: `${creatorName} добавил новый расход "${description}" на сумму ${amount} ₽. Ваша часть: ${individualAmount.toFixed(2)} ₽`,
          isRead: false,
          data: {
            groupId,
            expenseId,
            amount: individualAmount,
            fromUserId
          }
        })
      );
    
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating expense split notifications:', error);
    throw error;
  }
};

// Создание уведомлений об изменении расхода
export const createExpenseUpdateNotifications = async (
  groupId: string, 
  expenseId: string, 
  amount: number, 
  description: string, 
  fromUserId: string,
  splitBetweenUsers: string[],
  paidByUsers: string[]
): Promise<void> => {
  try {
    // Get group information
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }
    
    const group = groupSnap.data();
    const groupName = group.name;
    
    // Get editor information 
    const editorRef = doc(db, 'users', fromUserId);
    const editorSnap = await getDoc(editorRef);
    const editorName = editorSnap.exists() ? editorSnap.data().name : 'Пользователь';
    
    // Определяем получателей уведомлений
    let notificationRecipients: string[] = [];
    
    // Добавляем пользователей, которые должны оплатить
    if (splitBetweenUsers.length > 0) {
      notificationRecipients = [...splitBetweenUsers];
    } 
    // Если не указаны участники для разделения, уведомляем всех участников группы
    else if (group.members && group.members.length > 0) {
      notificationRecipients = [...group.members];
    }
    
    // Добавляем тех, кто оплатил, если они ещё не в списке
    if (paidByUsers && paidByUsers.length > 0) {
      paidByUsers.forEach(userId => {
        if (!notificationRecipients.includes(userId)) {
          notificationRecipients.push(userId);
        }
      });
    }
    
    // Удаляем редактора из списка получателей
    notificationRecipients = notificationRecipients.filter(userId => userId !== fromUserId);
    
    // Расчет суммы на одного человека, если указаны участники
    const individualAmount = splitBetweenUsers.length > 0 ? 
      amount / splitBetweenUsers.length : 0;
    
    // Создаем уведомления для всех получателей
    const notificationPromises = notificationRecipients.map(userId => {
      const isPayer = paidByUsers.includes(userId);
      const isSplitUser = splitBetweenUsers.includes(userId);
      
      let title = `Расход изменен в группе ${groupName}`;
      let message = `${editorName} изменил расход "${description}" на сумму ${amount} ₽.`;
      
      if (isSplitUser) {
        message += ` Ваша часть: ${individualAmount.toFixed(2)} ₽.`;
      }
      
      if (isPayer) {
        message += ` Вы отмечены как оплативший.`;
      }
      
      return createNotification({
        userId,
        type: 'expense',
        title,
        message,
        isRead: false,
        data: {
          groupId,
          expenseId,
          amount: isSplitUser ? individualAmount : amount,
          fromUserId
        }
      });
    });
    
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating expense update notifications:', error);
    throw error;
  }
};

// Create payment notification
export const createPaymentNotification = async (
  groupId: string,
  paymentId: string,
  amount: number,
  fromUserId: string,
  toUserId: string
): Promise<void> => {
  try {
    // Get group information
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }
    
    const group = groupSnap.data();
    const groupName = group.name;
    
    // Get payer information
    const payerRef = doc(db, 'users', fromUserId);
    const payerSnap = await getDoc(payerRef);
    const payerName = payerSnap.exists() ? payerSnap.data().name : 'Пользователь';
    
    // Create notification for payment recipient
    await createNotification({
      userId: toUserId,
      type: 'payment',
      title: `Получен платеж в группе ${groupName}`,
      message: `${payerName} отправил вам ${amount.toFixed(2)} ₽ для оплаты расходов`,
      isRead: false,
      data: {
        groupId,
        paymentId,
        amount,
        fromUserId
      }
    });
  } catch (error) {
    console.error('Error creating payment notification:', error);
    throw error;
  }
};

// Create notification for new recurring expense
export const createRecurringExpenseNotification = async (
  groupId: string,
  expenseId: string,
  amount: number,
  description: string,
  fromUserId: string,
  notifyUserIds: string[]
): Promise<void> => {
  try {
    // Get group information
    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await getDoc(groupRef);
    
    if (!groupSnap.exists()) {
      throw new Error('Group not found');
    }
    
    const group = groupSnap.data();
    const groupName = group.name;
    
    // Get creator information 
    const creatorRef = doc(db, 'users', fromUserId);
    const creatorSnap = await getDoc(creatorRef);
    const creatorName = creatorSnap.exists() ? creatorSnap.data().name : 'Пользователь';
    
    // Create notifications for each user except the creator
    const notificationPromises = notifyUserIds
      .filter(userId => userId !== fromUserId)
      .map(userId => 
        createNotification({
          userId,
          type: 'expense',
          title: `Новый регулярный расход в группе ${groupName}`,
          message: `${creatorName} добавил новый регулярный расход "${description}" на сумму ${amount} ₽`,
          isRead: false,
          data: {
            groupId,
            expenseId,
            amount,
            fromUserId
          }
        })
      );
    
    await Promise.all(notificationPromises);
  } catch (error) {
    console.error('Error creating recurring expense notifications:', error);
    throw error;
  }
}; 