import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Search, Bell, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export function Layout() {
  const { businessSettings } = useApp();

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="top-header">
          <div className="header-search">
            <Search size={18} />
            <input type="text" placeholder="Search transactions, invoices..." />
          </div>
          <div className="header-actions">
            <button className="icon-button">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>
            <div className="user-avatar">
              <User size={18} />
            </div>
          </div>
        </header>
        <div className="content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
