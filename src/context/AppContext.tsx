import React, { createContext, useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, Invoice, Contact, Budget, TaxConfig, BusinessSettings } from '../types';

interface AppContextType {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id' | 'balance' | 'createdAt'>) => void;
  updateContact: (id: string, contact: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, 'id' | 'createdAt'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  
  taxConfigs: TaxConfig[];
  addTaxConfig: (config: Omit<TaxConfig, 'id' | 'createdAt'>) => void;
  updateTaxConfig: (id: string, config: Partial<TaxConfig>) => void;
  deleteTaxConfig: (id: string) => void;
  
  businessSettings: BusinessSettings;
  updateBusinessSettings: (settings: Partial<BusinessSettings>) => void;
  
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const defaultSettings: BusinessSettings = {
  name: 'My Business',
  address: '',
  email: '',
  phone: '',
  taxId: '',
  currency: 'USD'
};

const defaultTaxConfigs: TaxConfig[] = [
  { id: '1', name: 'Sales Tax', rate: 8.25, category: 'sales', isActive: true, createdAt: new Date().toISOString() }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('invoices');
    return saved ? JSON.parse(saved) : [];
  });

  const [contacts, setContacts] = useState<Contact[]>(() => {
    const saved = localStorage.getItem('contacts');
    return saved ? JSON.parse(saved) : [];
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('budgets');
    return saved ? JSON.parse(saved) : [];
  });

  const [taxConfigs, setTaxConfigs] = useState<TaxConfig[]>(() => {
    const saved = localStorage.getItem('taxConfigs');
    return saved ? JSON.parse(saved) : defaultTaxConfigs;
  });

  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(() => {
    const saved = localStorage.getItem('businessSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('taxConfigs', JSON.stringify(taxConfigs));
  }, [taxConfigs]);

  useEffect(() => {
    localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
  }, [businessSettings]);

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const count = invoices.length + 1;
    return `INV-${year}-${String(count).padStart(4, '0')}`;
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTransaction: Transaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const updateTransaction = (id: string, transaction: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, ...transaction, updatedAt: new Date().toISOString() } : t
    ));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newInvoice: Invoice = {
      ...invoice,
      id: uuidv4(),
      invoiceNumber: generateInvoiceNumber(),
      createdAt: now,
      updatedAt: now
    };
    setInvoices(prev => [newInvoice, ...prev]);
  };

  const updateInvoice = (id: string, invoice: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => 
      i.id === id ? { ...i, ...invoice, updatedAt: new Date().toISOString() } : i
    ));
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const addContact = (contact: Omit<Contact, 'id' | 'balance' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newContact: Contact = {
      ...contact,
      id: uuidv4(),
      balance: 0,
      createdAt: now
    };
    setContacts(prev => [newContact, ...prev]);
  };

  const updateContact = (id: string, contact: Partial<Contact>) => {
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, ...contact } : c
    ));
  };

  const deleteContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  const addBudget = (budget: Omit<Budget, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newBudget: Budget = {
      ...budget,
      id: uuidv4(),
      createdAt: now
    };
    setBudgets(prev => [...prev, newBudget]);
  };

  const updateBudget = (id: string, budget: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => 
      b.id === id ? { ...b, ...budget } : b
    ));
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
  };

  const addTaxConfig = (config: Omit<TaxConfig, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newConfig: TaxConfig = {
      ...config,
      id: uuidv4(),
      createdAt: now
    };
    setTaxConfigs(prev => [...prev, newConfig]);
  };

  const updateTaxConfig = (id: string, config: Partial<TaxConfig>) => {
    setTaxConfigs(prev => prev.map(t => 
      t.id === id ? { ...t, ...config } : t
    ));
  };

  const deleteTaxConfig = (id: string) => {
    setTaxConfigs(prev => prev.filter(t => t.id !== id));
  };

  const updateBusinessSettings = (settings: Partial<BusinessSettings>) => {
    setBusinessSettings(prev => ({ ...prev, ...settings }));
  };

  return (
    <AppContext.Provider value={{
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      invoices,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      contacts,
      addContact,
      updateContact,
      deleteContact,
      budgets,
      addBudget,
      updateBudget,
      deleteBudget,
      taxConfigs,
      addTaxConfig,
      updateTaxConfig,
      deleteTaxConfig,
      businessSettings,
      updateBusinessSettings,
      sidebarCollapsed,
      setSidebarCollapsed
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
