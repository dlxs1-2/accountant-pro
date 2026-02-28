import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BusinessSettings } from '../types';
import { Save, Building, Mail, Phone, MapPin, DollarSign, FileText } from 'lucide-react';

export function Settings() {
  const { businessSettings, updateBusinessSettings } = useApp();
  const [formData, setFormData] = useState<BusinessSettings>(businessSettings);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessSettings(formData);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Manage your business settings and preferences</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <div className="section-header">
            <Building size={20} />
            <h2>Business Information</h2>
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Business Name</label>
              <input 
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Your Business Name"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <div className="input-with-icon">
                <Mail size={16} />
                <input 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="business@example.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Phone</label>
              <div className="input-with-icon">
                <Phone size={16} />
                <input 
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Tax ID</label>
              <div className="input-with-icon">
                <FileText size={16} />
                <input 
                  type="text"
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                  placeholder="XX-XXXXXXX"
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Address</label>
              <div className="input-with-icon">
                <MapPin size={16} />
                <input 
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Street, City, State, ZIP"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <DollarSign size={20} />
            <h2>Currency & Regional</h2>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Currency</label>
              <select 
                value={formData.currency}
                onChange={(e) => setFormData({...formData, currency: e.target.value})}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary">
            <Save size={18} />
            {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </form>

      <div className="settings-section">
        <div className="section-header">
          <h2>Data Management</h2>
        </div>
        
        <div className="data-actions">
          <div className="data-card">
            <h3>Export Data</h3>
            <p>Download all your financial data as CSV files</p>
            <button className="btn btn-secondary" onClick={() => {
              const data = {
                transactions: localStorage.getItem('transactions'),
                invoices: localStorage.getItem('invoices'),
                contacts: localStorage.getItem('contacts'),
                budgets: localStorage.getItem('budgets'),
                settings: localStorage.getItem('businessSettings')
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'accountant-pro-backup.json';
              a.click();
            }}>
              Export All Data
            </button>
          </div>

          <div className="data-card danger">
            <h3>Clear All Data</h3>
            <p>Permanently delete all your data. This cannot be undone.</p>
            <button className="btn btn-danger" onClick={() => {
              if (window.confirm('Are you sure you want to delete ALL data? This cannot be undone!')) {
                localStorage.clear();
                window.location.reload();
              }
            }}>
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
