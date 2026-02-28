export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export function getMonthYear(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long'
  }).format(date);
}

export function getCurrentMonth(): number {
  return new Date().getMonth() + 1;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}

export function getMonthRange(month: number, year: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start, end };
}

export function filterByMonth(transactions: any[], month: number, year: number): any[] {
  return transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() + 1 === month && date.getFullYear() === year;
  });
}

export function filterByDateRange(transactions: any[], startDate: string, endDate: string): any[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return transactions.filter(t => {
    const date = new Date(t.date);
    return date >= start && date <= end;
  });
}

export function getCategoryTotals(transactions: any[], type: 'income' | 'expense'): Record<string, number> {
  const filtered = transactions.filter(t => t.type === type);
  return filtered.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);
}

export function getPercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
