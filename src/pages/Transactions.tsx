import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, PAYMENT_METHODS, Transaction } from '../types';
import { Plus, Search, Filter, Edit2, Trash2, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

export function Transactions() {
  const { transactions, contacts, addTransaction, updateTransaction, deleteTransaction, businessSettings } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'expense' as 'income' | 'expense',
    category: 'Other Expense',
    amount: '',
    description: '',
    clientId: '',
    vendorId: '',
    paymentMethod: 'Bank Transfer',
    reference: ''
  });

  const clients = contacts.filter(c => c.type === 'client');
  const vendors = contacts.filter(c => c.type === 'vendor');

  const categories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.reference.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [transactions, searchTerm, typeFilter, categoryFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      ...formData,
      amount: parseFloat(formData.amount),
      clientId: formData.clientId || undefined,
      vendorId: formData.vendorId || undefined
    };

    if (editingId) {
      updateTransaction(editingId, transactionData);
    } else {
      addTransaction(transactionData);
    }
    resetForm();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setFormData({
      date: transaction.date.split('T')[0],
      type: transaction.type,
      category: transaction.category,
      amount: transaction.amount.toString(),
      description: transaction.description,
      clientId: transaction.clientId || '',
      vendorId: transaction.vendorId || '',
      paymentMethod: transaction.paymentMethod,
      reference: transaction.reference
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      deleteTransaction(id);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: 'Other Expense',
      amount: '',
      description: '',
      clientId: '',
      vendorId: '',
      paymentMethod: 'Bank Transfer',
      reference: ''
    });
  };

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div className="transactions-page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p>Manage your income and expenses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Transaction
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search transactions..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {allCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Payment Method</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">No transactions found</td>
              </tr>
            ) : (
              filteredTransactions.map(transaction => (
                <tr key={transaction.id}>
                  <td>{formatDate(transaction.date)}</td>
                  <td>
                    <span className={`badge ${transaction.type}`}>
                      {transaction.type === 'income' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      {transaction.type}
                    </span>
                  </td>
                  <td>{transaction.category}</td>
                  <td>{transaction.description || '-'}</td>
                  <td>{transaction.reference || '-'}</td>
                  <td>{transaction.paymentMethod}</td>
                  <td className={`amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, businessSettings.currency)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => handleEdit(transaction)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon danger" onClick={() => handleDelete(transaction.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({
                      ...formData, 
                      type: e.target.value as 'income' | 'expense',
                      category: e.target.value === 'income' ? 'Sales' : 'Other Expense'
                    })}
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter description"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Client (for Income)</label>
                  <select 
                    value={formData.clientId}
                    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  >
                    <option value="">Select client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Vendor (for Expense)</label>
                  <select 
                    value={formData.vendorId}
                    onChange={(e) => setFormData({...formData, vendorId: e.target.value})}
                  >
                    <option value="">Select vendor</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Method</label>
                  <select 
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    {PAYMENT_METHODS.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Reference #</label>
                  <input 
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Invoice #, Check #, etc."
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
