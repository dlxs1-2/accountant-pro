import React from 'react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate, getCurrentMonth, getCurrentYear, filterByMonth, getCategoryTotals } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Wallet, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#1B4D3E', '#2D7A5E', '#C9A227', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function Dashboard() {
  const { transactions, invoices, contacts, businessSettings } = useApp();
  const currentMonth = getCurrentMonth();
  const currentYear = getCurrentYear();

  const thisMonthTransactions = filterByMonth(transactions, currentMonth, currentYear);
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const lastMonthTransactions = filterByMonth(transactions, lastMonth, lastMonthYear);

  const thisMonthIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthIncome = lastMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthExpenses = lastMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRevenue = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalRevenue - totalExpenses;

  const outstandingInvoices = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((sum, i) => sum + (i.total - i.paidAmount), 0);

  const incomeChange = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
  const expenseChange = lastMonthExpenses > 0 ? ((thisMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

  // Get last 6 months data for chart
  const getMonthlyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1 - i, 1);
      const month = date.toLocaleString('default', { month: 'short' });
      const monthTransactions = filterByMonth(transactions, date.getMonth() + 1, date.getFullYear());
      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      months.push({ month, income, expenses, profit: income - expenses });
    }
    return months;
  };

  const monthlyData = getMonthlyData();

  // Expense by category
  const expenseByCategory = () => {
    const totals = getCategoryTotals(transactions, 'expense');
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  };

  const expenseData = expenseByCategory();

  // Recent transactions
  const recentTransactions = transactions.slice(0, 8);

  // Top clients
  const clientTotals: Record<string, number> = {};
  transactions.filter(t => t.type === 'income' && t.clientId).forEach(t => {
    clientTotals[t.clientId!] = (clientTotals[t.clientId!] || 0) + t.amount;
  });

  const topClients = Object.entries(clientTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id, total]) => {
      const contact = contacts.find(c => c.id === id);
      return { name: contact?.name || 'Unknown', total };
    });

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your financial overview.</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon income">
            <TrendingUp size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Revenue (This Month)</span>
            <span className="metric-value">{formatCurrency(thisMonthIncome, businessSettings.currency)}</span>
            <span className={`metric-change ${incomeChange >= 0 ? 'positive' : 'negative'}`}>
              {incomeChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(incomeChange).toFixed(1)}% vs last month
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon expense">
            <TrendingDown size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Expenses (This Month)</span>
            <span className="metric-value">{formatCurrency(thisMonthExpenses, businessSettings.currency)}</span>
            <span className={`metric-change ${expenseChange <= 0 ? 'positive' : 'negative'}`}>
              {expenseChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(expenseChange).toFixed(1)}% vs last month
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon profit">
            <Wallet size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Net Profit</span>
            <span className="metric-value">{formatCurrency(netProfit, businessSettings.currency)}</span>
            <span className="metric-subtitle">All time</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon pending">
            <AlertCircle size={20} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Outstanding</span>
            <span className="metric-value">{formatCurrency(outstandingInvoices, businessSettings.currency)}</span>
            <span className="metric-subtitle">{invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length} invoices</span>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card large">
          <h3>Revenue vs Expenses</h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(value) => formatCurrency(value as number, businessSettings.currency)}
                  contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="income" stroke="#1B4D3E" strokeWidth={2} dot={{ fill: '#1B4D3E' }} name="Revenue" />
                <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} name="Expenses" />
                <Line type="monotone" dataKey="profit" stroke="#C9A227" strokeWidth={2} dot={{ fill: '#C9A227' }} name="Profit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <h3>Expenses by Category</h3>
          <div className="chart-container donut">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {expenseData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number, businessSettings.currency)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {expenseData.slice(0, 5).map((item, index) => (
                <div key={item.name} className="legend-item">
                  <span className="legend-color" style={{ background: COLORS[index % COLORS.length] }} />
                  <span className="legend-label">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="tables-row">
        <div className="table-card">
          <h3>Recent Transactions</h3>
          <div className="transactions-list">
            {recentTransactions.length === 0 ? (
              <p className="empty-state">No transactions yet</p>
            ) : (
              recentTransactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                  <div className="transaction-info">
                    <span className={`transaction-type ${transaction.type}`}>
                      {transaction.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    </span>
                    <div>
                      <span className="transaction-category">{transaction.category}</span>
                      <span className="transaction-date">{formatDate(transaction.date)}</span>
                    </div>
                  </div>
                  <span className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount, businessSettings.currency)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="table-card">
          <h3>Top Clients</h3>
          <div className="clients-list">
            {topClients.length === 0 ? (
              <p className="empty-state">No client data yet</p>
            ) : (
              topClients.map((client, index) => (
                <div key={index} className="client-item">
                  <div className="client-rank">{index + 1}</div>
                  <div className="client-info">
                    <span className="client-name">{client.name}</span>
                    <span className="client-revenue">Total revenue</span>
                  </div>
                  <span className="client-total">{formatCurrency(client.total, businessSettings.currency)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
