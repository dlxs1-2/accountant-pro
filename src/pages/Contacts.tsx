import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/formatters';
import { Contact } from '../types';
import { Plus, Search, Edit2, Trash2, User, Building, Mail, Phone, MapPin, X, Users, Briefcase } from 'lucide-react';

export function Contacts() {
  const { contacts, transactions, addContact, updateContact, deleteContact, businessSettings } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'client' | 'vendor'>('all');

  const [formData, setFormData] = useState({
    type: 'client' as 'client' | 'vendor',
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    paymentTerms: 'Net 30',
    notes: ''
  });

  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesSearch = 
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || contact.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [contacts, searchTerm, typeFilter]);

  const getContactBalance = (contactId: string, type: 'client' | 'vendor') => {
    const relatedTransactions = transactions.filter(t => 
      type === 'client' ? t.clientId === contactId : t.vendorId === contactId
    );
    
    if (type === 'client') {
      const income = relatedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const payments = relatedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      return income - payments;
    } else {
      const expenses = relatedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const payments = relatedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      return expenses - payments;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateContact(editingId, formData);
    } else {
      addContact(formData);
    }
    resetForm();
  };

  const handleEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setFormData({
      type: contact.type,
      name: contact.name,
      company: contact.company,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      taxId: contact.taxId,
      paymentTerms: contact.paymentTerms,
      notes: contact.notes
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      deleteContact(id);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      type: 'client',
      name: '',
      company: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      paymentTerms: 'Net 30',
      notes: ''
    });
  };

  const clients = contacts.filter(c => c.type === 'client');
  const vendors = contacts.filter(c => c.type === 'vendor');

  return (
    <div className="contacts-page">
      <div className="page-header">
        <div>
          <h1>Clients & Vendors</h1>
          <p>Manage your contacts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Contact
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon clients">
            <Users size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{clients.length}</span>
            <span className="stat-label">Clients</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon vendors">
            <Briefcase size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{vendors.length}</span>
            <span className="stat-label">Vendors</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <Building size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{contacts.length}</span>
            <span className="stat-label">Total Contacts</span>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Search contacts..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)}>
            <option value="all">All Types</option>
            <option value="client">Clients</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>
      </div>

      <div className="contacts-grid">
        {filteredContacts.length === 0 ? (
          <div className="empty-state-full">
            <Users size={48} />
            <p>No contacts found</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={18} />
              Add your first contact
            </button>
          </div>
        ) : (
          filteredContacts.map(contact => {
            const balance = getContactBalance(contact.id, contact.type);
            return (
              <div key={contact.id} className="contact-card">
                <div className="contact-header">
                  <div className={`contact-avatar ${contact.type}`}>
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <h4>{contact.name}</h4>
                    <span className={`badge ${contact.type}`}>{contact.type}</span>
                  </div>
                </div>
                <div className="contact-details">
                  {contact.company && (
                    <div className="detail-row">
                      <Building size={14} />
                      <span>{contact.company}</span>
                    </div>
                  )}
                  {contact.email && (
                    <div className="detail-row">
                      <Mail size={14} />
                      <span>{contact.email}</span>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="detail-row">
                      <Phone size={14} />
                      <span>{contact.phone}</span>
                    </div>
                  )}
                  {contact.address && (
                    <div className="detail-row">
                      <MapPin size={14} />
                      <span>{contact.address}</span>
                    </div>
                  )}
                </div>
                <div className="contact-balance">
                  <span>Balance</span>
                  <span className={`balance-amount ${balance >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(Math.abs(balance), businessSettings.currency)}
                  </span>
                </div>
                <div className="contact-actions">
                  <button className="btn-icon" onClick={() => handleEdit(contact)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(contact.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Contact' : 'Add Contact'}</h2>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as 'client' | 'vendor'})}
                >
                  <option value="client">Client</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Company</label>
                  <input 
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Company name"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Address</label>
                <input 
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Street, City, State, ZIP"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tax ID</label>
                  <input 
                    type="text"
                    value={formData.taxId}
                    onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                    placeholder="Tax ID number"
                  />
                </div>
                <div className="form-group">
                  <label>Payment Terms</label>
                  <select 
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
