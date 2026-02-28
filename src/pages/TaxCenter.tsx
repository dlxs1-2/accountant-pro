import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getCurrentYear, getCurrentMonth, filterByMonth } from '../utils/formatters';
import { TaxConfig } from '../types';
import { Plus, Search, Edit2, Trash2, Calculator, AlertCircle, CheckCircle, X, Calendar, TrendingUp } from 'lucide-react';

export function TaxCenter() {
  const { transactions, taxConfigs, addTaxConfig, updateTaxConfig, deleteTaxConfig, businessSettings } = useApp();
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    rate: 0,
    category: 'sales',
    isActive: true
  });

  // Calculate tax summary
  const taxSummary = useMemo(() => {
    const yearTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getFullYear() === currentYear;
    });

    // Tax collected (income transactions)
    const taxCollected = yearTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount * 0.0825, 0); // Assuming 8.25% average

    // Tax paid (expense transactions with tax)
    const taxPaid = yearTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount * 0.0825, 0);

    // Quarterly estimates
    const quarters = [
      { name: 'Q1', months: [1, 2, 3] },
      { name: 'Q2', months: [4, 5, 6] },
      { name: 'Q3', months: [7, 8, 9] },
      { name: 'Q4', months: [10, 11, 12] }
    ];

    const quarterlyEstimates = quarters.map(q => {
      const quarterIncome = yearTransactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'income' && q.months.includes(date.getMonth() + 1);
        })
        .reduce((sum, t) => sum + t.amount, 0);
      
      const quarterExpense = yearTransactions
        .filter(t => {
          const date = new Date(t.date);
          return t.type === 'expense' && q.months.includes(date.getMonth() + 1);
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const netProfit = quarterIncome - quarterExpense;
      const estimatedTax = netProfit > 0 ? netProfit * 0.25 : 0; // 25% estimated tax

      return {
        quarter: q.name,
        income: quarterIncome,
        expenses: quarterExpense,
        netProfit,
        estimatedTax
      };
    });

    // This quarter
    const thisQuarter = Math.ceil(currentMonth / 3);
    const thisQuarterData = quarterlyEstimates.find(q => q.quarter === `Q${thisQuarter}`);

    return {
      taxCollected,
      taxPaid,
      netTax: taxCollected - taxPaid,
      quarterlyEstimates,
      thisQuarter: thisQuarterData
    };
  }, [transactions, currentYear, currentMonth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateTaxConfig(editingId, formData);
    } else {
      addTaxConfig(formData);
    }
    resetForm();
  };

  const handleEdit = (config: TaxConfig) => {
    setEditingId(config.id);
    setFormData({
      name: config.name,
      rate: config.rate,
      category: config.category,
      isActive: config.isActive
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this tax configuration?')) {
      deleteTaxConfig(id);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      rate: 0,
      category: 'sales',
      isActive: true
    });
  };

  return (
    <div className="tax-page">
      <div className="page-header">
        <div>
          <h1>Tax Center</h1>
          <p>Manage taxes and generate tax reports</p>
        </div>
      </div>

      <div className="tax-overview">
        <div className="overview-card">
          <div className="overview-header">
            <Calculator size={24} />
            <span>Year {currentYear} Summary</span>
          </div>
          <div className="overview-stats">
            <div className="stat">
              <span className="stat-label">Tax Collected</span>
              <span className="stat-value positive">{formatCurrency(taxSummary.taxCollected, businessSettings.currency)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Tax Paid</span>
              <span className="stat-value negative">{formatCurrency(taxSummary.taxPaid, businessSettings.currency)}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Net Tax Liability</span>
              <span className={`stat-value ${taxSummary.netTax >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(Math.abs(taxSummary.netTax), businessSettings.currency)}
              </span>
            </div>
          </div>
        </div>

        <div className="overview-card highlight">
          <div className="overview-header">
            <Calendar size={24} />
            <span>Quarterly Estimates (Q{Math.ceil(currentMonth / 3)})</span>
          </div>
          {taxSummary.thisQuarter && (
            <div className="quarterly-details">
              <div className="detail-row">
                <span>Quarterly Income</span>
                <span>{formatCurrency(taxSummary.thisQuarter.income, businessSettings.currency)}</span>
              </div>
              <div className="detail-row">
                <span>Quarterly Expenses</span>
                <span>{formatCurrency(taxSummary.thisQuarter.expenses, businessSettings.currency)}</span>
              </div>
              <div className="detail-row">
                <span>Net Profit</span>
                <span className={taxSummary.thisQuarter.netProfit >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(taxSummary.thisQuarter.netProfit, businessSettings.currency)}
                </span>
              </div>
              <div className="detail-row total">
                <span>Estimated Tax Due</span>
                <span>{formatCurrency(taxSummary.thisQuarter.estimatedTax, businessSettings.currency)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="quarterly-table">
        <h3>Quarterly Breakdown</h3>
        <table>
          <thead>
            <tr>
              <th>Quarter</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Net Profit</th>
              <th>Estimated Tax</th>
            </tr>
          </thead>
          <tbody>
            {taxSummary.quarterlyEstimates.map(q => (
              <tr key={q.quarter}>
                <td>{q.quarter}</td>
                <td>{formatCurrency(q.income, businessSettings.currency)}</td>
                <td>{formatCurrency(q.expenses, businessSettings.currency)}</td>
                <td className={q.netProfit >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(q.netProfit, businessSettings.currency)}
                </td>
                <td>{formatCurrency(q.estimatedTax, businessSettings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="tax-configs">
        <div className="section-header">
          <h3>Tax Configurations</h3>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Add Tax Rate
          </button>
        </div>

        <div className="configs-grid">
          {taxConfigs.map(config => (
            <div key={config.id} className={`config-card ${config.isActive ? 'active' : 'inactive'}`}>
              <div className="config-header">
                <span className="config-name">{config.name}</span>
                <span className={`config-status ${config.isActive ? 'active' : ''}`}>
                  {config.isActive ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                  {config.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="config-rate">
                <span className="rate-value">{config.rate}%</span>
                <span className="rate-category">{config.category}</span>
              </div>
              <div className="config-actions">
                <button className="btn-icon" onClick={() => handleEdit(config)}>
                  <Edit2 size={16} />
                </button>
                <button className="btn-icon danger" onClick={() => handleDelete(config.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Tax Configuration' : 'Add Tax Configuration'}</h2>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Tax Name</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Sales Tax, VAT"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Rate (%)</label>
                  <input 
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.rate}
                    onChange={(e) => setFormData({...formData, rate: parseFloat(e.target.value) || 0})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="sales">Sales Tax</option>
                    <option value="income">Income Tax</option>
                    <option value="property">Property Tax</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input 
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  <span>Active</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Tax Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
