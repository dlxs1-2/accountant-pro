import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  Users,
  BarChart3,
  Calculator,
  PiggyBank,
  Settings,
  ChevronLeft,
  ChevronRight,
  DollarSign
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/transactions', icon: Receipt, label: 'Transactions' },
  { path: '/invoices', icon: FileText, label: 'Invoices' },
  { path: '/contacts', icon: Users, label: 'Clients & Vendors' },
  { path: '/reports', icon: BarChart3, label: 'Reports' },
  { path: '/tax', icon: Calculator, label: 'Tax Center' },
  { path: '/budget', icon: PiggyBank, label: 'Budget' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, businessSettings } = useApp();
  const location = useLocation();

  return (
    <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <DollarSign size={24} />
          </div>
          {!sidebarCollapsed && (
            <span className="logo-text">{businessSettings.name}</span>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            end={path === '/'}
          >
            <Icon size={20} />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button 
        className="sidebar-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      >
        {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </aside>
  );
}
