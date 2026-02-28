export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  clientId?: string;
  vendorId?: string;
  paymentMethod: string;
  reference: string;
  recurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  taxRate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  date: string;
  dueDate: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  paidAmount: number;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  type: 'client' | 'vendor';
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  paymentTerms: string;
  notes: string;
  balance: number;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  amount: number;
  period: 'monthly' | 'annual';
  month?: number;
  year: number;
  createdAt: string;
}

export interface TaxConfig {
  id: string;
  name: string;
  rate: number;
  category: string;
  isActive: boolean;
  createdAt: string;
}

export interface BusinessSettings {
  name: string;
  address: string;
  email: string;
  phone: string;
  taxId: string;
  currency: string;
  logo?: string;
}

export const INCOME_CATEGORIES = [
  'Sales',
  'Services',
  'Investments',
  'Other Income'
] as const;

export const EXPENSE_CATEGORIES = [
  'Salaries',
  'Rent',
  'Utilities',
  'Marketing',
  'Software',
  'Travel',
  'Supplies',
  'Professional Services',
  'Other Expense'
] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'Check',
  'Bank Transfer',
  'Credit Card',
  'Debit Card',
  'PayPal',
  'Other'
] as const;

export type IncomeCategory = typeof INCOME_CATEGORIES[number];
export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];
export type PaymentMethod = typeof PAYMENT_METHODS[number];
