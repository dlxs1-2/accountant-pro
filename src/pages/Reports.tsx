import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, filterByDateRange, getCategoryTotals } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const COLORS = ['#1B4D3E', '#2D7A5E', '#C9A227', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function Reports() {
  const { transactions, invoices, contacts, businessSettings } = useApp();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [activeReport, setActiveReport] = useState('profit-loss');

  const filteredTransactions = useMemo(() => {
    return filterByDateRange(transactions, dateRange.start, dateRange.end);
  }, [transactions, dateRange]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const date = new Date(inv.date);
      return date >= new Date(dateRange.start) && date <= new Date(dateRange.end);
    });
  }, [invoices, dateRange]);

  // Profit & Loss
  const profitLoss = useMemo(() => {
    const income = filteredTransactions.filter(t => t.type === 'income');
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    
    const incomeByCategory = getCategoryTotals(filteredTransactions, 'income');
    const expenseByCategory = getCategoryTotals(filteredTransactions, 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    return {
      incomeByCategory,
      expenseByCategory,
      totalIncome,
      totalExpenses,
      netProfit
    };
  }, [filteredTransactions]);

  // Income by category chart data
  const incomeChartData = useMemo(() => {
    return Object.entries(profitLoss.incomeByCategory).map(([name, value]) => ({
      name,
      value
    }));
  }, [profitLoss.incomeByCategory]);

  // Expense by category chart data
  const expenseChartData = useMemo(() => {
    return Object.entries(profitLoss.expenseByCategory).map(([name, value]) => ({
      name,
      value
    }));
  }, [profitLoss.expenseByCategory]);

  // Monthly trends
  const monthlyTrends = useMemo(() => {
    const months: Record<string, { income: number; expenses: number }> = {};
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!months[key]) {
        months[key] = { income: 0, expenses: 0 };
      }
      if (t.type === 'income') {
        months[key].income += t.amount;
      } else {
        months[key].expenses += t.amount;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
        ...data,
        profit: data.income - data.expenses
      }));
  }, [filteredTransactions]);

  // Accounts Receivable Aging
  const receivables = useMemo(() => {
    const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
    const now = new Date();
    
    const aging = {
      current: 0,
      '1-30': 0,
      '31-60': 0,
      '61-90': 0,
      'over-90': 0
    };

    outstanding.forEach(inv => {
      const dueDate = new Date(inv.dueDate);
      const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = inv.total - inv.paidAmount;

      if (daysOverdue <= 0) {
        aging.current += amount;
      } else if (daysOverdue <= 30) {
        aging['1-30'] += amount;
      } else if (daysOverdue <= 60) {
        aging['31-60'] += amount;
      } else if (daysOverdue <= 90) {
        aging['61-90'] += amount;
      } else {
        aging['over-90'] += amount;
      }
    });

    return aging;
  }, [invoices]);

  // Top clients by revenue
  const topClients = useMemo(() => {
    const clientRevenue: Record<string, number> = {};
    
    filteredTransactions
      .filter(t => t.type === 'income' && t.clientId)
      .forEach(t => {
        clientRevenue[t.clientId!] = (clientRevenue[t.clientId!] || 0) + t.amount;
      });

    return Object.entries(clientRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([clientId, revenue]) => {
        const contact = contacts.find(c => c.id === clientId);
        return { name: contact?.name || 'Unknown', revenue };
      });
  }, [filteredTransactions, contacts]);

  const renderReport = () => {
    switch (activeReport) {
      case 'profit-loss':
        return (
          <div className="report-content">
            <div className="report-summary">
              <div className="summary-card income">
                <TrendingUp size={24} />
                <div>
                  <span className="summary-label">Total Income</span>
                  <span className="summary-value">{formatCurrency(profitLoss.totalIncome, businessSettings.currency)}</span>
                </div>
              </div>
              <div className="summary-card expense">
                <TrendingDown size={24} />
                <div>
                  <span className="summary-label">Total Expenses</span>
                  <span className="summary-value">{formatCurrency(profitLoss.totalExpenses, businessSettings.currency)}</span>
                </div>
              </div>
              <div className={`summary-card ${profitLoss.netProfit >= 0 ? 'profit' : 'loss'}`}>
                <DollarSign size={24} />
                <div>
                  <span className="summary-label">Net Profit</span>
                  <span className="summary-value">{formatCurrency(profitLoss.netProfit, businessSettings.currency)}</span>
                </div>
              </div>
            </div>

            <div className="charts-row">
              <div className="chart-card">
                <h3>Income by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {incomeChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number, businessSettings.currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3>Expenses by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {expenseChartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number, businessSettings.currency)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card full">
              <h3>Monthly Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                  <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => formatCurrency(value as number, businessSettings.currency)} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#22C55E" strokeWidth={2} name="Income" />
                  <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="profit" stroke="#1B4D3E" strokeWidth={2} name="Profit" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case 'receivables':
        return (
          <div className="report-content">
            <h3>Accounts Receivable Aging</h3>
            <div className="aging-grid">
              {Object.entries(receivables).map(([period, amount]) => (
                <div key={period} className="aging-card">
                  <span className="aging-period">{period === 'over-90' ? 'Over 90 days' : period === '1-30' ? '1-30 days' : period === '31-60' ? '31-60 days' : period === '61-90' ? '61-90 days' : 'Current'}</span>
                  <span className="aging-amount">{formatCurrency(amount, businessSettings.currency)}</span>
                </div>
              ))}
            </div>
            <div className="total-row">
              <span>Total Receivables</span>
              <span className="total-amount">
                {formatCurrency(Object.values(receivables).reduce((a, b) => a + b, 0), businessSettings.currency)}
              </span>
            </div>
          </div>
        );

      case 'top-clients':
        return (
          <div className="report-content">
            <h3>Top Clients by Revenue</h3>
            <div className="top-clients-chart">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topClients} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#6B7280" width={150} />
                  <Tooltip formatter={(value) => formatCurrency(value as number, businessSettings.currency)} />
                  <Bar dataKey="revenue" fill="#1B4D3E" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="top-clients-table">
              <table>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Client</th>
                    <th>Revenue</th>
                    <th>% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((client, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{client.name}</td>
                      <td>{formatCurrency(client.revenue, businessSettings.currency)}</td>
                      <td>{((client.revenue / profitLoss.totalIncome) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1>Reports</h1>
          <p>Financial reports and analytics</p>
        </div>
      </div>

      <div className="report-controls">
        <div className="date-range">
          <Calendar size={18} />
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
          />
          <span>to</span>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
          />
        </div>
      </div>

      <div className="report-tabs">
        <button 
          className={`tab ${activeReport === 'profit-loss' ? 'active' : ''}`}
          onClick={() => setActiveReport('profit-loss')}
        >
          <FileText size={18} />
          Profit & Loss
        </button>
        <button 
          className={`tab ${activeReport === 'receivables' ? 'active' : ''}`}
          onClick={() => setActiveReport('receivables')}
        >
          <TrendingUp size={18} />
          Receivables
        </button>
        <button 
          className={`tab ${activeReport === 'top-clients' ? 'active' : ''}`}
          onClick={() => setActiveReport('top-clients')}
        >
          <DollarSign size={18} />
          Top Clients
        </button>
      </div>

      <div className="report-container">
        {renderReport()}
      </div>
    </div>
  );
}
