import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, getCurrentMonth, getCurrentYear, filterByMonth, getCategoryTotals } from '../utils/formatters';
import { EXPENSE_CATEGORIES, Budget } from '../types';
import { Plus, Edit2, Trash2, Target, AlertTriangle, CheckCircle, X, TrendingUp, TrendingDown } from 'lucide-react';

export function BudgetPage() {
  const { budgets, transactions, addBudget, updateBudget, deleteBudget, businessSettings } = useApp();
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewPeriod, setViewPeriod] = useState<'monthly' | 'annual'>('monthly');

  const [formData, setFormData] = useState({
    category: 'Other Expense',
    amount: '',
    period: 'monthly' as 'monthly' | 'annual',
    month: currentMonth,
    year: currentYear
  });

  // Calculate actual spending by category
  const actualSpending = useMemo(() => {
    const filteredTransactions = viewPeriod === 'monthly'
      ? filterByMonth(transactions, currentMonth, currentYear)
      : transactions.filter(t => {
          const date = new Date(t.date);
          return date.getFullYear() === currentYear;
        });

    return getCategoryTotals(filteredTransactions, 'expense');
  }, [transactions, currentMonth, currentYear, viewPeriod]);

  // Budget vs Actual comparison
  const budgetComparison = useMemo(() => {
    return budgets
      .filter(b => b.period === viewPeriod && (viewPeriod === 'annual' || (b.month === currentMonth && b.year === currentYear)))
      .map(budget => {
        const actual = actualSpending[budget.category] || 0;
        const variance = budget.amount - actual;
        const percentUsed = (actual / budget.amount) * 100;
        
        return {
          ...budget,
          actual,
          variance,
          percentUsed,
          status: percentUsed >= 100 ? 'over' : percentUsed >= 80 ? 'warning' : 'good'
        };
      });
  }, [budgets, actualSpending, viewPeriod, currentMonth, currentYear]);

  const totalBudgeted = budgetComparison.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetComparison.reduce((sum, b) => sum + b.actual, 0);
  const totalVariance = totalBudgeted - totalSpent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const budgetData = {
      category: formData.category,
      amount: parseFloat(formData.amount),
      period: formData.period,
      month: formData.period === 'monthly' ? formData.month : undefined,
      year: formData.year
    };

    if (editingId) {
      updateBudget(editingId, budgetData);
    } else {
      addBudget(budgetData);
    }
    resetForm();
  };

  const handleEdit = (budget: Budget) => {
    setEditingId(budget.id);
    setFormData({
      category: budget.category,
      amount: budget.amount.toString(),
      period: budget.period,
      month: budget.month || currentMonth,
      year: budget.year
    });
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(id);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      category: 'Other Expense',
      amount: '',
      period: 'monthly',
      month: currentMonth,
      year: currentYear
    });
  };

  // Categories not yet budgeted
  const unbudgetedCategories = EXPENSE_CATEGORIES.filter(
    cat => !budgets.some(b => b.category === cat && b.period === viewPeriod && 
      (viewPeriod === 'annual' || (b.month === currentMonth && b.year === currentYear)))
  );

  return (
    <div className="budget-page">
      <div className="page-header">
        <div>
          <h1>Budget Management</h1>
          <p>Track and manage your spending by category</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Add Budget
        </button>
      </div>

      <div className="budget-controls">
        <div className="period-toggle">
          <button 
            className={`toggle-btn ${viewPeriod === 'monthly' ? 'active' : ''}`}
            onClick={() => setViewPeriod('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`toggle-btn ${viewPeriod === 'annual' ? 'active' : ''}`}
            onClick={() => setViewPeriod('annual')}
          >
            Annual
          </button>
        </div>
        <div className="period-display">
          {viewPeriod === 'monthly' 
            ? new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
            : `Year ${currentYear}`
          }
        </div>
      </div>

      <div className="budget-overview">
        <div className="overview-stat">
          <div className="stat-icon">
            <Target size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Budget</span>
            <span className="stat-value">{formatCurrency(totalBudgeted, businessSettings.currency)}</span>
          </div>
        </div>
        <div className="overview-stat">
          <div className="stat-icon spent">
            <TrendingDown size={20} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Spent</span>
            <span className="stat-value">{formatCurrency(totalSpent, businessSettings.currency)}</span>
          </div>
        </div>
        <div className="overview-stat">
          <div className={`stat-icon ${totalVariance >= 0 ? 'positive' : 'negative'}`}>
            {totalVariance >= 0 ? <TrendingUp size={20} /> : <AlertTriangle size={20} />}
          </div>
          <div className="stat-content">
            <span className="stat-label">Remaining</span>
            <span className={`stat-value ${totalVariance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(totalVariance, businessSettings.currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="budget-progress">
        <div className="progress-bar-container">
          <div 
            className="progress-bar"
            style={{ 
              width: `${Math.min((totalSpent / totalBudgeted) * 100, 100)}%`,
              backgroundColor: totalSpent > totalBudgeted ? '#EF4444' : totalSpent > totalBudgeted * 0.8 ? '#F59E0B' : '#1B4D3E'
            }}
          />
        </div>
        <span className="progress-label">
          {totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : 0}% used
        </span>
      </div>

      {budgetComparison.length === 0 ? (
        <div className="empty-budget">
          <Target size={48} />
          <h3>No budgets set</h3>
          <p>Create your first budget to start tracking spending</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            Add Budget
          </button>
        </div>
      ) : (
        <div className="budget-list">
          {budgetComparison.map(budget => (
            <div key={budget.id} className="budget-item">
              <div className="budget-header">
                <div className="budget-category">
                  <span className="category-name">{budget.category}</span>
                  <span className={`budget-status ${budget.status}`}>
                    {budget.status === 'over' && <AlertTriangle size={14} />}
                    {budget.status === 'warning' && <AlertTriangle size={14} />}
                    {budget.status === 'good' && <CheckCircle size={14} />}
                    {budget.status === 'over' ? 'Over Budget' : budget.status === 'warning' ? 'Near Limit' : 'On Track'}
                  </span>
                </div>
                <div className="budget-actions">
                  <button className="btn-icon" onClick={() => handleEdit(budget)}>
                    <Edit2 size={16} />
                  </button>
                  <button className="btn-icon danger" onClick={() => handleDelete(budget.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="budget-details">
                <div className="budget-amounts">
                  <span className="spent">
                    Spent: {formatCurrency(budget.actual, businessSettings.currency)}
                  </span>
                  <span className="budget">
                    Budget: {formatCurrency(budget.amount, businessSettings.currency)}
                  </span>
                </div>
                <span className={`variance ${budget.variance >= 0 ? 'positive' : 'negative'}`}>
                  {budget.variance >= 0 ? '+' : ''}{formatCurrency(budget.variance, businessSettings.currency)} remaining
                </span>
              </div>
              <div className="budget-progress-bar">
                <div 
                  className={`progress ${budget.status}`}
                  style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                />
              </div>
              <span className="percent-label">{budget.percentUsed.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingId ? 'Edit Budget' : 'Add Budget'}</h2>
              <button className="btn-icon" onClick={resetForm}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  {unbudgetedCategories.length > 0 ? unbudgetedCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  )) : EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount</label>
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

              <div className="form-group">
                <label>Period</label>
                <select 
                  value={formData.period}
                  onChange={(e) => setFormData({...formData, period: e.target.value as 'monthly' | 'annual'})}
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              {formData.period === 'monthly' && (
                <div className="form-row">
                  <div className="form-group">
                    <label>Month</label>
                    <select 
                      value={formData.month}
                      onChange={(e) => setFormData({...formData, month: parseInt(e.target.value)})}
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>
                          {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year</label>
                    <select 
                      value={formData.year}
                      onChange={(e) => setFormData({...formData, year: parseInt(e.target.value)})}
                    >
                      {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Add'} Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
