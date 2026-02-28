import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { Invoices } from './pages/Invoices';
import { Contacts } from './pages/Contacts';
import { Reports } from './pages/Reports';
import { TaxCenter } from './pages/TaxCenter';
import { BudgetPage } from './pages/Budget';
import { Settings } from './pages/Settings';
import './App.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="contacts" element={<Contacts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="tax" element={<TaxCenter />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
