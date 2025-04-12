import { Expense, Payment } from '../services/firebase';

export interface Debt {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface UserBalance {
  userId: string;
  balance: number; // Positive means they are owed money, negative means they owe money
}

/**
 * Calculate individual shares for an expense
 */
export const calculateExpenseShares = (expense: Expense): Map<string, number> => {
  const shares = new Map<string, number>();
  
  if (!expense.splitBetween || expense.splitBetween.length === 0) {
    return shares;
  }
  
  // Calculate individual share amount
  const individualShare = expense.amount / expense.splitBetween.length;
  
  // Assign share to each person
  expense.splitBetween.forEach(userId => {
    shares.set(userId, individualShare);
  });
  
  // Subtract the share from those who paid
  if (expense.paidBy && expense.paidBy.length > 0) {
    const paidShare = expense.amount / expense.paidBy.length;
    
    expense.paidBy.forEach(userId => {
      const currentShare = shares.get(userId) || 0;
      shares.set(userId, currentShare - paidShare);
    });
  }
  
  return shares;
};

/**
 * Calculate balances for all users in a group based on expenses and payments
 */
export const calculateGroupBalances = (
  expenses: Expense[],
  payments: Payment[] = []
): UserBalance[] => {
  const balances = new Map<string, number>();
  
  // Process each expense
  expenses.forEach(expense => {
    const shares = calculateExpenseShares(expense);
    
    // Update user balances
    shares.forEach((share, userId) => {
      const currentBalance = balances.get(userId) || 0;
      balances.set(userId, currentBalance - share); // Negative share means they owe money
    });
  });
  
  // Process payments
  payments.forEach(payment => {
    if (payment.status !== 'completed') return;
    
    // Sender's balance increases (they paid)
    const senderBalance = balances.get(payment.fromUserId) || 0;
    balances.set(payment.fromUserId, senderBalance + payment.amount);
    
    // Recipient's balance decreases (they received)
    const recipientBalance = balances.get(payment.toUserId) || 0;
    balances.set(payment.toUserId, recipientBalance - payment.amount);
  });
  
  // Convert to array
  return Array.from(balances.entries()).map(([userId, balance]) => ({
    userId,
    balance
  }));
};

/**
 * Calculate optimal debt settlement plan for a group
 */
export const calculateDebtSettlement = (balances: UserBalance[]): Debt[] => {
  const debts: Debt[] = [];
  
  // Create copies of the arrays for negative and positive balances
  const debtors = balances.filter(b => b.balance < 0)
    .map(b => ({ ...b, balance: -b.balance })) // Convert to positive amount for calculations
    .sort((a, b) => b.balance - a.balance); // Sort by highest debt first
  
  const creditors = balances.filter(b => b.balance > 0)
    .sort((a, b) => b.balance - a.balance); // Sort by highest credit first
  
  // Continue until all debts are settled
  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];
    
    // Calculate how much can be settled
    const amount = Math.min(debtor.balance, creditor.balance);
    
    if (amount > 0) {
      // Create a debt
      debts.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount
      });
      
      // Update balances
      debtor.balance -= amount;
      creditor.balance -= amount;
    }
    
    // Remove settled accounts
    if (debtor.balance < 0.01) debtors.shift();
    if (creditor.balance < 0.01) creditors.shift();
  }
  
  return debts;
};

/**
 * Get list of users who need to pay the specified user
 */
export const getIncomingDebts = (debts: Debt[], userId: string): Debt[] => {
  return debts.filter(debt => debt.toUserId === userId);
};

/**
 * Get list of users the specified user needs to pay
 */
export const getOutgoingDebts = (debts: Debt[], userId: string): Debt[] => {
  return debts.filter(debt => debt.fromUserId === userId);
}; 