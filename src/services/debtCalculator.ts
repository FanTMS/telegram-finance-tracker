import { Expense } from './firebase';

interface DebtItem {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

// Функция для расчета долгов на основе списка расходов
export const calculateDebts = (expenses: Expense[]): DebtItem[] => {
  try {
    if (!expenses || expenses.length === 0) {
      return [];
    }

    // Создаем баланс для каждого пользователя
    const balances: Record<string, number> = {};
    
    // Для каждого расхода
    expenses.forEach(expense => {
      const { amount, paidBy, splitBetween } = expense;
      
      if (!paidBy || paidBy.length === 0 || !splitBetween || splitBetween.length === 0) {
        return;
      }
      
      // Вычисляем, сколько каждый пользователь заплатил
      const payerAmount = amount / paidBy.length;
      
      // Добавляем в баланс каждого плательщика
      paidBy.forEach(payerId => {
        balances[payerId] = (balances[payerId] || 0) + payerAmount;
      });
      
      // Вычисляем, сколько каждый пользователь должен
      const splitAmount = amount / splitBetween.length;
      
      // Вычитаем из баланса каждого участника
      splitBetween.forEach(userId => {
        balances[userId] = (balances[userId] || 0) - splitAmount;
      });
    });
    
    // Делим пользователей на должников и кредиторов
    const debtors: Array<[string, number]> = [];
    const creditors: Array<[string, number]> = [];
    
    Object.entries(balances).forEach(([userId, balance]) => {
      if (balance < 0) {
        debtors.push([userId, balance]);
      } else if (balance > 0) {
        creditors.push([userId, balance]);
      }
      // Игнорируем нулевые балансы
    });
    
    // Сортируем по убыванию абсолютного значения
    debtors.sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
    creditors.sort((a, b) => b[1] - a[1]);
    
    // Создаем список долгов
    const debts: DebtItem[] = [];
    
    // Погашаем долги
    while (debtors.length > 0 && creditors.length > 0) {
      const [debtorId, debtorBalance] = debtors[0];
      const [creditorId, creditorBalance] = creditors[0];
      
      // Определяем сумму долга для погашения
      const paymentAmount = Math.min(Math.abs(debtorBalance), creditorBalance);
      
      // Если сумма больше 0, добавляем долг
      if (paymentAmount > 0.01) { // Избегаем очень маленьких сумм из-за погрешности вычислений
        debts.push({
          fromUserId: debtorId,
          toUserId: creditorId,
          amount: Math.round(paymentAmount * 100) / 100, // Округляем до 2 знаков
        });
      }
      
      // Обновляем балансы
      const newDebtorBalance = debtorBalance + paymentAmount;
      const newCreditorBalance = creditorBalance - paymentAmount;
      
      // Удаляем полностью погашенные балансы или обновляем частично погашенные
      if (Math.abs(newDebtorBalance) < 0.01) {
        debtors.shift();
      } else {
        debtors[0][1] = newDebtorBalance;
      }
      
      if (newCreditorBalance < 0.01) {
        creditors.shift();
      } else {
        creditors[0][1] = newCreditorBalance;
      }
    }
    
    return debts;
  } catch (error) {
    console.error('Error calculating debts:', error);
    return [];
  }
};

// Функция для оптимизации долгов (уменьшение количества транзакций)
export const optimizeDebts = (debts: DebtItem[]): DebtItem[] => {
  // Пока просто возвращаем исходные долги
  // В будущем здесь можно реализовать алгоритм оптимизации
  return debts;
}; 