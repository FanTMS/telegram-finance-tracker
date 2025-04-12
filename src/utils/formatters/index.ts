/**
 * Форматирует число в денежный формат с указанной валютой
 * @param amount - сумма для форматирования
 * @param currency - валюта (по умолчанию - рубль)
 * @param locale - локаль для форматирования
 * @returns отформатированная строка с валютой
 */
export const formatCurrency = (
  amount: number, 
  currency: string = 'RUB', 
  locale: string = 'ru-RU'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
      minimumFractionDigits: 0
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount.toLocaleString(locale)} ₽`;
  }
};

/**
 * Форматирует процент с указанным количеством десятичных знаков
 * @param value - значение для форматирования
 * @param digits - количество десятичных знаков
 * @returns отформатированная строка процента
 */
export const formatPercent = (
  value: number, 
  digits: number = 1
): string => {
  try {
    return `${value.toFixed(digits)}%`;
  } catch (error) {
    console.error('Error formatting percent:', error);
    return `${value}%`;
  }
};

/**
 * Форматирует дату в локализованную строку
 * @param date - дата для форматирования
 * @param locale - локаль для форматирования
 * @param options - дополнительные опции форматирования
 * @returns отформатированная строка даты
 */
export const formatDate = (
  date: Date | string | number,
  locale: string = 'ru-RU',
  options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }
): string => {
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString(locale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return String(date);
  }
}; 