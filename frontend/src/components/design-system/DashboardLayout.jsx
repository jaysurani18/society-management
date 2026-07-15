import React from 'react';
import SidebarShell from './SidebarShell.jsx';
import Topbar from './Topbar.jsx';
import { Home, Users, Wrench, FileText, CheckCircle2, Bell, DollarSign, User, Activity, MessageSquare, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ConfirmModal from '../ConfirmModal.jsx';

export default function DashboardLayout({ activePath, role, children, currentSectionName }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Modal State for Sign Out confirmation
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);

  // Logo wordmark (Serif, gold, decorative)
  const logoWordmark = (
    <div className="flex items-center gap-2">
      <span className="font-serif font-extrabold text-lg text-brand-gold tracking-wider select-none">
        Society
      </span>
    </div>
  );

  // Define nav items based on role
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { label: 'Overview', path: '/admin/dashboard', icon: <Home size={14} /> },
          { label: 'Resident Directory', path: '/admin/directory', icon: <Users size={14} /> },
          { label: 'Financial Automations', path: '/admin/finance', icon: <DollarSign size={14} /> },
          { label: 'Service Requests', path: '/admin/operations', icon: <Wrench size={14} /> },
          { label: 'Society Notices', path: '/admin/notices', icon: <FileText size={14} /> },
          { label: 'System Audit Logs', path: '/admin/logs', icon: <Lock size={14} /> },
          { label: 'Reports & Analytics', path: '/admin/analytics', icon: <Activity size={14} /> },
          { label: 'Profile Settings', path: '/profile', icon: <User size={14} /> },
        ];
      case 'COMMITTEE':
        return [
          { label: 'Dashboard/Overview', path: '/committee/dashboard', icon: <Home size={14} /> },
          { label: 'Tickets & Complaints', path: '/committee/tickets', icon: <Wrench size={14} /> },
          { label: 'Finance & Dues', path: '/committee/finance', icon: <DollarSign size={14} /> },
          { label: 'Notices & Broadcasts', path: '/committee/notices', icon: <FileText size={14} /> },
          { label: 'Profile Settings', path: '/profile', icon: <User size={14} /> },
        ];
      case 'RESIDENT':
      default:
        return [
          { label: 'Dashboard', path: '/resident/dashboard', icon: <Home size={14} /> },
          { label: 'My Complaints', path: '/resident/complaints', icon: <MessageSquare size={14} /> },
          { label: 'My Service Requests', path: '/resident/requests', icon: <Wrench size={14} /> },
          { label: 'My Bills & Payments', path: '/resident/bills', icon: <DollarSign size={14} /> },
          { label: 'Announcements', path: '/resident/announcements', icon: <Bell size={14} /> },
          { label: 'My Profile', path: '/profile', icon: <User size={14} /> },
        ];
    }
  };

  const getEyebrow = () => {
    switch (role) {
      case 'ADMIN':
        return 'ADMIN MODE';
      case 'COMMITTEE':
        return 'COMMITTEE MODE';
      case 'RESIDENT':
      default:
        return 'RESIDENT MODE';
    }
  };

  const getMetaInfo = () => {
    if (role === 'RESIDENT') {
      // Find the unit block details if available
      return user?.email === 'resident@society.com' ? 'UNIT: C-102' : 'RESIDENT';
    }
    return user?.role || 'STAFF';
  };

  return (
    <div className="min-h-screen bg-brand-cream text-slate-800 flex font-sans antialiased">
      <SidebarShell
        logo={logoWordmark}
        navItems={getNavItems()}
        activePath={activePath}
        onItemClick={(path) => navigate(path)}
      />
      <div className="flex-1 flex flex-col min-h-screen bg-brand-cream">
        <Topbar
          eyebrow="CURRENT PANEL"
          modeLabel={getEyebrow()}
          userName={user ? `${user.firstName} ${user.lastName}` : 'Jane Resident'}
          metaInfo={getMetaInfo()}
          onSignOut={() => setShowLogoutModal(true)}
        />
        <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Confirm Sign Out"
        message="Are you sure you want to sign out of your dashboard session?"
        confirmLabel="Sign Out"
        cancelLabel="Cancel"
        onConfirm={() => {
          setShowLogoutModal(false);
          logout();
        }}
        onCancel={() => setShowLogoutModal(false)}
        type="warning"
      />
    </div>
  );
}
