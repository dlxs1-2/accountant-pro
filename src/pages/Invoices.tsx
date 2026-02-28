import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Invoice, InvoiceItem } from '../types';
import { Plus, Search, Edit2, Trash2, FileText, Send, CheckCircle, Clock, AlertTriangle, X, Copy, Download } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function Invoices() {
  const { invoices, contacts, addInvoice, updateInvoice, deleteInvoice, taxConfigs, businessSettings } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'overdue'>('all');

  const [formData, setFormData] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue',
    items: [{ id: uuidv4(), description: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 }] as InvoiceItem[],
    taxRate: 8.25,
    discount: 0,
    notes: '',
    terms: 'Payment due within 30 days'
  });

  const clients = contacts.filter(c => c.type === 'client');

  const calculateSubtotal = (items: InvoiceItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateTax = (subtotal: number, taxRate: number) => {
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = (items: InvoiceItem[], taxRate: number, discount: number) => {
    const subtotal = calculateSubtotal(items);
    const tax = calculateTax(subtotal, taxRate);
    return subtotal + tax - discount;
  };

  const subtotal = calculateSubtotal(formData.items);
  const taxAmount = calculateTax(subtotal, formData.taxRate);
  const total = calculateTotal(formData.items, formData.taxRate, formData.discount);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const client = contacts.find(c => c.id === inv.clientId);
      const matchesSearch = 
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter, contacts]);

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id: uuidv4(), description: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData({ ...formData, items: newItems });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const invoiceData = {
      clientId: formData.clientId,
      date: formData.date,
      dueDate: formData.dueDate,
      status: formData.status,
      items: formData.items,
      subtotal,
      taxRate: formData.taxRate,
      taxAmount,
      discount: formData.discount,
      total,
      paidAmount: formData.status === 'paid' ? total : 0,
      notes: formData.notes,
      terms: formData.terms
    };

    if (editingId) {
      updateInvoice(editingId, invoiceData);
    } else {
      addInvoice(invoiceData);
    }
    resetForm();
  };

  const handleEdit = (invoice: Invoice) => {
    setEditingId(invoice.id);
    setFormData({
      clientId: invoice.clientId,
      date: invoice.date.split('T')[0],
      dueDate: invoice.dueDate.split('T')[0],
      status: invoice.status,
      items: invoice.items,
      taxRate: invoice.taxRate,
      discount: invoice.discount,
      notes: invoice.notes,
      terms: invoice.terms
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
    }
  };

  const handleStatusChange = (id: string, status: 'draft' | 'sent' | 'paid') => {
    updateInvoice(id, { status, paidAmount: status === 'paid' ? invoices.find(i => i.id === id)!.total : 0 });
  };

  const duplicateInvoice = (invoice: Invoice) => {
    const newDate = new Date().toISOString().split('T')[0];
    const newDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    addInvoice({
      clientId: invoice.clientId,
      date: newDate,
      dueDate: newDueDate,
      status: 'draft',
      items: invoice.items.map(item => ({ ...item, id: uuidv4() })),
      subtotal: invoice.subtotal,
      taxRate: invoice.taxRate,
      taxAmount: invoice.taxAmount,
      discount: invoice.discount,
      total: invoice.total,
      paidAmount: 0,
      notes: invoice.notes,
      terms: invoice.terms
    });
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      clientId: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'draft',
      items: [{ id: uuidv4(), description: '', quantity: 1, rate: 0, taxRate: 0, amount: 0 }],
      taxRate: 8.25,
      discount: 0,
      notes: '',
      terms: 'Payment due within 30 days'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText size={14} />;
      case 'sent': return <Send size={14} />;
      case 'paid': return <CheckCircle size={14} />;
      case 'overdue': return <AlertTriangle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  return (
    <div className="invoices-page">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>Manage and track your invoices</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Create Invoice
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search invoices..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="data-table">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Date</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Paid</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-cell">No invoices found</td>
              </tr>
            ) : (
              filteredInvoices.map(invoice => {
                const client = contacts.find(c => c.id === invoice.clientId);
                return (
                  <tr key={invoice.id}>
                    <td className="invoice-number">{invoice.invoiceNumber}</td>
                    <td>{client?.name || 'Unknown'}</td>
                    <td>{formatDate(invoice.date)}</td>
                    <td>{formatDate(invoice.dueDate)}</td>
                    <td>
                      <span className={`badge ${invoice.status}`}>
                        {getStatusIcon(invoice.status)}
                        {invoice.status}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(invoice.total, businessSettings.currency)}</td>
                    <td className="amount paid">{formatCurrency(invoice.paidAmount, businessSettings.currency)}</td>
                    <td>
                      <div className="action-buttons">
                        {invoice.status === 'draft' && (
                          <button className="btn-icon success" onClick={() => handleStatusChange(invoice.id, 'sent')} title="Mark as Sent">
                            <Send size={16} />
                          </button>
                        )}
                        {invoice.status === 'sent' && (
                          <button className="btn-icon success" onClick={() => handleStatusChange(invoice.id, 'paid')} title="Mark as Paid">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button className="btn-icon" onClick={() => handleEdit(invoice)} title="Edit">
                          <Edit2 size={16} />
                        </button>
                        <button className="btn-icon" onClick={() => duplicateInvoice(invoice)} title="Duplicate">
                          <Copy size={16} />
                        </button>
                        <button className="btn-icon danger" onClick={() => handleDelete(invoice.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Invoice' : 'Create Invoice'}</h2>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-section">
                <h3>Invoice Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Client</label>
                    <select 
                      value={formData.clientId}
                      onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                      required
                    >
                      <option value="">Select client</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name} - {client.company}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row three">
                  <div className="form-group">
                    <label>Invoice Date</label>
                    <input 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input 
                      type="date" 
                      value={formData.dueDate}
                      onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                      <option value="draft">Draft</option>
                      <option value="sent">Sent</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Line Items</h3>
                <div className="line-items">
                  <div className="line-item-header">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Rate</span>
                    <span>Tax %</span>
                    <span>Amount</span>
                    <span></span>
                  </div>
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="line-item-row">
                      <input 
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                      />
                      <input 
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                      />
                      <input 
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                      />
                      <span className="item-amount">{formatCurrency(item.amount, businessSettings.currency)}</span>
                      <button type="button" className="btn-icon danger" onClick={() => removeItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>
                    <Plus size={16} />
                    Add Item
                  </button>
                </div>
              </div>

              <div className="invoice-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal, businessSettings.currency)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax ({formData.taxRate}%)</span>
                  <span>{formatCurrency(taxAmount, businessSettings.currency)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount</span>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
                    className="discount-input"
                  />
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatCurrency(total, businessSettings.currency)}</span>
                </div>
              </div>

              <div className="form-section">
                <h3>Notes & Terms</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Notes</label>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      placeholder="Additional notes..."
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Terms & Conditions</label>
                    <textarea 
                      value={formData.terms}
                      onChange={(e) => setFormData({...formData, terms: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Create'} Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
