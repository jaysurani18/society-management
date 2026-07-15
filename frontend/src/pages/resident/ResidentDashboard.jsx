import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { CreditCard, Wrench, Plus, Bell, Building, FileText, Landmark, ShieldCheck, DollarSign, MessageSquare } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import DashboardLayout from '../../components/design-system/DashboardLayout.jsx';
import Card from '../../components/design-system/Card.jsx';
import Button from '../../components/design-system/Button.jsx';
import Badge from '../../components/design-system/Badge.jsx';

export default function ResidentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Custom Popups State
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    onConfirm: null,
    isAlert: false,
    type: 'default'
  });

  const triggerAlert = (title, message, type = 'default') => {
    setModal({
      isOpen: true,
      title,
      message,
      confirmLabel: 'OK',
      cancelLabel: '',
      onConfirm: closeModal,
      isAlert: true,
      type
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  // Data States
  const [bills, setBills] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [summary, setSummary] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Service Request Form States
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Plumbing');
  const [submittingReq, setSubmittingReq] = useState(false);
  const [showReqForm, setShowReqForm] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Maintenance Bills
      const billsRes = await api.get('/bills?limit=50');
      const billsList = billsRes.data?.data?.bills || billsRes.data?.bills || billsRes.data || [];
      setBills(Array.isArray(billsList) ? billsList : []);

      // 2. Fetch Service Requests
      const reqsRes = await api.get('/service-requests?limit=50');
      const requestsList = reqsRes.data?.data?.requests || reqsRes.data?.requests || reqsRes.data || [];
      setRequests(Array.isArray(requestsList) ? requestsList : []);

      // 3. Fetch Society Announcements
      setLoadingNotices(true);
      try {
        const noticesRes = await api.get('/announcements');
        const noticesList = noticesRes.data?.data?.announcements || noticesRes.data?.data || [];
        setNotices(Array.isArray(noticesList) ? noticesList : []);
      } catch (err) {
        console.error('Announcements fetch error:', err);
      } finally {
        setLoadingNotices(false);
      }

      // 4. Fetch Dashboard Summary
      setLoadingSummary(true);
      try {
        const summaryRes = await api.get('/dashboard/summary');
        setSummary(summaryRes.data?.data || null);
      } catch (err) {
        console.error('Dashboard summary fetch error:', err);
      } finally {
        setLoadingSummary(false);
      }

      // 5. Fetch Profile Details for Sidebar Allotment details
      try {
        const userRes = await api.get('/users/me');
        setProfile(userRes.data?.data?.user || userRes.data?.user || null);
      } catch (err) {
        console.error('Profile fetch error on dashboard:', err);
      }

    } catch (err) {
      console.error('Resident data fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch personal ledger or service tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch and show receipt details
  const handleViewReceipt = async (billId, autoPrint = false) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.get(`/bills/${billId}/receipt`);
      const receipt = res.data?.data?.receipt || res.data?.receipt || res.data || null;
      if (!receipt) {
        triggerAlert('Receipt Unavailable', 'Receipt details could not be loaded.', 'warning');
        return;
      }

      const flatLabel = receipt.bill?.flat 
        ? `${receipt.bill.flat.block} - ${receipt.bill.flat.number}` 
        : 'Flat Unit';
      const collectedByName = receipt.collectedBy 
        ? `${receipt.collectedBy.firstName} ${receipt.collectedBy.lastName || ''}` 
        : 'Society Admin';

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        triggerAlert('Pop-up Blocked', 'Pop-up blocked. Please allow pop-ups to view and print receipt files.', 'warning');
        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Payment Receipt #${receipt.receiptNumber}</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #334155; padding: 40px; margin: 0; background-color: #f8fafc; }
            .receipt-box { max-width: 600px; margin: 30px auto; padding: 40px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; }
            .header { border-bottom: 2px solid #a5b4fc; padding-bottom: 20px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 20px; font-weight: bold; color: #1B2340; margin: 0; }
            .receipt-no { font-size: 11px; color: #64748b; font-family: monospace; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 16px; margin-bottom: 25px; }
            .label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
            .value { font-size: 13px; font-weight: 600; color: #0f172a; margin-top: 4px; }
            .amount-section { background-color: #FAF8F5; border: 1px solid #EAE5D8; padding: 15px; border-radius: 6px; text-align: center; margin-bottom: 25px; }
            .amount { font-size: 24px; font-weight: bold; color: #1B2340; }
            .footer { border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8; margin-top: 30px; }
            .actions-bar { display: flex; gap: 12px; margin-top: 25px; }
            .btn-action { flex: 1; text-align: center; padding: 10px; border-radius: 6px; font-weight: 600; font-size: 13px; cursor: pointer; text-decoration: none; }
            .btn-print { background-color: #1B2340; color: #ffffff; border: 1px solid #1B2340; }
            .btn-close { background-color: #ffffff; color: #475569; border: 1px solid #e2e8f0; }
            @media print {
              .actions-bar, .btn-action { display: none !important; }
              body { padding: 0; background-color: #ffffff; }
              .receipt-box { border: none; box-shadow: none; margin: 0; padding: 0; max-width: 100%; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h1 class="title">SOCIETY PAYMENT RECEIPT</h1>
              <span class="receipt-no">No: ${receipt.receiptNumber}</span>
            </div>
            
            <div class="amount-section">
              <div class="label">Amount Paid</div>
              <div class="amount">₹${receipt.amountPaid.toFixed(2)}</div>
            </div>

            <div class="grid">
              <div>
                <div class="label">Property Unit</div>
                <div class="value">${flatLabel}</div>
              </div>
              <div>
                <div class="label">Billing Period</div>
                <div class="value">${receipt.bill?.billingPeriod || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Paid By</div>
                <div class="value">${receipt.paidByName}</div>
              </div>
              <div>
                <div class="label">Collected By</div>
                <div class="value">${collectedByName}</div>
              </div>
              <div>
                <div class="label">Transaction Date</div>
                <div class="value">${new Date(receipt.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div class="label">Payment Method</div>
                <div class="value">${receipt.paymentMethod}</div>
              </div>
            </div>

            <div class="footer">
              <p>This is a system-generated document confirming cash/online settlement of maintenance dues.</p>
              <p>Society Management System &copy; 2026</p>
            </div>

            <div class="actions-bar">
              <button class="btn-action btn-print" onclick="window.print()">Print / Save as PDF</button>
              <button class="btn-action btn-close" onclick="window.close()">Close Window</button>
            </div>
          </div>
          <script>
            ${autoPrint ? 'window.onload = function() { setTimeout(function() { window.print(); }, 300); }' : ''}
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error('Receipt lookup error:', err);
      triggerAlert('Receipt Error', err.response?.data?.message || 'Failed to fetch receipt details.', 'danger');
    }
  };

  // Submit service request
  const handleRaiseRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newTitle.trim() || !newDesc.trim()) {
      setError('Please fill in request title and description.');
      return;
    }

    setSubmittingReq(true);
    try {
      const response = await api.post('/service-requests', {
        title: newTitle.trim(),
        description: newDesc.trim(),
        category: newCategory,
      });

      if (response.data?.status === 'success') {
        setSuccessMsg('Service request raised successfully!');
        setNewTitle('');
        setNewDesc('');
        setShowReqForm(false);
        await fetchData(); // Refresh request queue
      }
    } catch (err) {
      console.error('Raise request error:', err);
      setError(err.response?.data?.message || 'Failed to file service ticket.');
    } finally {
      setSubmittingReq(false);
    }
  };

  const getInitials = (firstName, lastName) => {
    const f = firstName ? firstName.charAt(0) : '';
    const l = lastName ? lastName.charAt(0) : '';
    return (f + l).toUpperCase() || 'R';
  };

  const isOverview = location.pathname === '/resident/dashboard' || location.pathname === '/resident';
  const isRequests = location.pathname.includes('/resident/requests');
  const isBills = location.pathname === '/resident/bills' || location.pathname === '/resident/payments';
  const isAnnouncements = location.pathname.includes('/resident/announcements');

  const getSectionTitle = () => {
    if (isRequests) return 'My Service Requests';
    if (isBills) return 'My Bills & Payments';
    if (isAnnouncements) return 'Announcements';
    return 'Dashboard';
  };

  return (
    <DashboardLayout
      activePath={location.pathname === '/resident/overview' ? '/resident/dashboard' : location.pathname}
      role="RESIDENT"
      currentSectionName={getSectionTitle()}
    >
      {/* Resident Summary Stats Strip (Refined Colors) - ONLY on Dashboard Overview */}
      {isOverview && summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left mb-6">
          {/* Outstanding Balance */}
          <div className={`border rounded-brand-lg p-5 space-y-2 flex items-center justify-between transition-all duration-300 ${(summary.outstandingBalance || 0) > 0 ? 'bg-rose-50/70 border-rose-100' : 'bg-emerald-50/70 border-emerald-100'}`}>
            <div className="space-y-1">
              <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block ${(summary.outstandingBalance || 0) > 0 ? 'text-brand-brick' : 'text-emerald-700'}`}>Outstanding Balance</span>
              <p className={`text-2xl font-extrabold tracking-tight font-sans ${(summary.outstandingBalance || 0) > 0 ? 'text-brand-brick' : 'text-emerald-800'}`}>
                ₹{(summary.outstandingBalance || 0).toFixed(2)}
              </p>
            </div>
            <div className={`w-8 h-8 rounded-brand-md border flex items-center justify-center ${ (summary.outstandingBalance || 0) > 0 ? 'bg-white border-rose-200 text-brand-brick' : 'bg-white border-emerald-200 text-emerald-700' }`}>
              <Landmark size={15} />
            </div>
          </div>
          
          {/* Unpaid Invoices */}
          <div className="bg-slate-50 border border-slate-200 rounded-brand-lg p-5 space-y-2 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">Unpaid Invoices</span>
              <p className="text-2xl font-extrabold tracking-tight text-slate-800 font-sans">
                {summary.unpaidBillsCount || 0}
              </p>
            </div>
            <div className="w-8 h-8 rounded-brand-md bg-white border border-slate-200 flex items-center justify-center text-slate-600">
              <FileText size={15} />
            </div>
          </div>

          {/* My Open Complaints */}
          <div className="bg-amber-50 border border-amber-100 rounded-brand-lg p-5 space-y-2 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 block">My Open Complaints</span>
              <p className="text-2xl font-extrabold tracking-tight text-amber-800 font-sans">
                {(summary.complaintsCount?.PENDING || 0) + (summary.complaintsCount?.ASSIGNED || 0)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-brand-md bg-white border border-amber-200 flex items-center justify-center text-amber-650">
              <Bell size={15} />
            </div>
          </div>

          {/* My Pending Requests */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-brand-lg p-5 space-y-2 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">My Pending Requests</span>
              <p className="text-2xl font-extrabold tracking-tight text-brand-navy font-sans">
                {(summary.serviceRequestsCount?.PENDING || 0) + (summary.serviceRequestsCount?.APPROVED || 0)}
              </p>
            </div>
            <div className="w-8 h-8 rounded-brand-md bg-white border border-slate-200 flex items-center justify-center text-brand-navy">
              <Wrench size={15} />
            </div>
          </div>
        </div>
      )}
      
      {/* Error/Success Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-100 text-brand-brick text-xs px-4 py-3 rounded-brand-md mb-6 text-left">
          <span className="font-bold font-mono text-[9px] uppercase tracking-wider block mb-0.5 font-bold">Operation Failed</span>
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-4 py-3 rounded-brand-md mb-6 text-left">
          <span className="font-bold block mb-0.5 font-bold">Success</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content Sections */}
      {isOverview && (
        <div className="space-y-6">
          {/* Premium Welcome & Society Quick Launch Guide Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-lg p-6 shadow-sm border border-slate-800 space-y-4">
            <div className="space-y-1 text-left">
              <h2 className="text-lg font-bold tracking-tight">
                Welcome Back, {profile?.firstName ? `${profile.firstName} ${profile.lastName}` : 'Resident Member'}
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Registered Flat Unit Address: Block {profile?.residentProfile?.flat?.block || 'C'} - Unit {profile?.residentProfile?.flat?.number || '102'} ({profile?.residentProfile?.status || 'OWNER'})
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left Column (2/3 width) - Quick Actions Grid */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
              
              {/* Card 1: Bills & Payments */}
              <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <DollarSign size={16} />
                    <h3>Bills & Payments Ledger</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Review pending monthly maintenance invoices, download receipt copies, and check past payment records.
                  </p>
                </div>
                <Button onClick={() => navigate('/resident/bills')} variant="primary" className="w-full">
                  Bills & Payments
                </Button>
              </div>

              {/* Card 2: Service Desk */}
              <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <Wrench size={16} />
                    <h3>Service Request Desk</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Lodge facility service tickets (plumbing, electrical repairs, structural maintenance) and track resolution states.
                  </p>
                </div>
                <Button onClick={() => navigate('/resident/requests')} variant="primary" className="w-full">
                  Open Service Desk
                </Button>
              </div>

              {/* Card 3: Complaints Log */}
              <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <MessageSquare size={16} />
                    <h3>Personal Complaints</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    File neighborhood complaints (parking violations, noise issues) and participate in direct discussion threads.
                  </p>
                </div>
                <Button onClick={() => navigate('/resident/complaints')} variant="primary" className="w-full">
                  Open Complaints Log
                </Button>
              </div>

              {/* Card 4: Notice Board announcements */}
              <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <Bell size={16} />
                    <h3>Announcements & Bulletins</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Stay updated with critical society announcements, scheduled shutdowns, and guidelines circulars.
                  </p>
                </div>
                <Button onClick={() => navigate('/resident/announcements')} variant="primary" className="w-full">
                  Read Announcements
                </Button>
              </div>

            </div>

            {/* Right Column (1/3 width) - Flat Allotment Details */}
            <div className="lg:col-span-1 space-y-6">
              {profile?.residentProfile?.flat && (
                <Card
                  title="Allotment Registry"
                  badge={<ShieldCheck size={16} className="text-brand-gold" />}
                  className="p-5 border border-slate-200 text-left"
                >
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Flat Address</span>
                      <span className="font-bold text-slate-900 font-sans">
                        Wing {profile.residentProfile.flat.block} - {profile.residentProfile.flat.number}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Floor Level</span>
                      <span className="font-semibold text-slate-800 font-sans">{profile.residentProfile.flat.floor} Floor</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Occupancy Type</span>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-700 uppercase tracking-wide rounded">
                        {profile.residentProfile.status}
                      </span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {isBills && (
        <div className="max-w-5xl mx-auto space-y-6 text-left">
          
          {/* Card 1: Outstanding Maintenance Invoices */}
          <Card
            title="Outstanding Maintenance Invoices"
            subtitle="Pending Payments"
            className="p-6 border border-slate-200"
          >
            <div className="overflow-x-auto pt-2">
              {loading && bills.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs italic">
                  Fetching outstanding dues...
                </div>
              ) : bills.filter(b => b.status === 'UNPAID').length === 0 ? (
                <div className="text-center p-8 text-emerald-800 text-xs font-semibold bg-emerald-50 border border-emerald-100 rounded-brand-md">
                  All dues settled! You have no outstanding maintenance bills.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Bill Period
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Base Amount
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Late Fee Penalty
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Due Date
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Status
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.filter(b => b.status === 'UNPAID').map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 text-slate-900 font-bold text-sm">
                          {bill.billingPeriod}
                        </td>
                        <td className="p-4 text-slate-900 font-mono text-sm">
                          ₹{bill.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-brand-brick font-mono text-sm">
                          ₹{bill.penalty.toFixed(2)}
                        </td>
                        <td className="p-4 text-slate-500 text-sm">
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <Badge label="UNPAID" status="unpaid" />
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-slate-400 text-xs font-medium italic">
                            Pay Cash at Office
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>

          {/* Card 2: Transaction History & Receipts */}
          <Card
            title="Past Transaction Receipts"
            subtitle="Payment History Ledger"
            className="p-6 border border-slate-200"
          >
            <div className="overflow-x-auto pt-2">
              {loading && bills.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs italic">
                  Fetching paid ledger...
                </div>
              ) : bills.filter(b => b.status === 'PAID').length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-xs italic border border-dashed border-slate-200 bg-white rounded-brand-lg">
                  No payment transactions logged in your ledger yet.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Billing Period
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Amount Paid
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Status State
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bills.filter(b => b.status === 'PAID').map((bill) => (
                      <tr key={bill.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="p-4 text-slate-900 font-bold text-sm">
                          {bill.billingPeriod}
                        </td>
                        <td className="p-4 text-emerald-700 font-mono text-sm font-semibold">
                          ₹{bill.amount.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <Badge label="PAID" status="approved" />
                        </td>
                        <td className="p-4 text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              onClick={() => handleViewReceipt(bill.id)}
                              variant="secondary"
                              className="px-2.5 py-1 text-xs"
                            >
                              View Receipt
                            </Button>
                            <Button
                              onClick={() => handleViewReceipt(bill.id, true)}
                              variant="secondary"
                              className="px-2.5 py-1 text-xs"
                            >
                              Print
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Conditionally render Service Requests section */}
      {isRequests && (
        <div className="max-w-5xl mx-auto space-y-6 text-left">
          <Card
            title="Filed Service Requests"
            subtitle="Tickets Queue"
            className="p-6 border border-slate-200"
            badge={
              !showReqForm && (
                <Button
                  onClick={() => setShowReqForm(true)}
                  variant="primary"
                  className="px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  New Ticket
                </Button>
              )
            }
          >
            {/* Raise Request Form Panel */}
            {showReqForm && (
              <form onSubmit={handleRaiseRequest} className="bg-slate-50 border border-slate-200 p-5 rounded-brand-lg space-y-4 max-w-xl mb-6">
                <h4 className="text-xs font-mono font-bold text-slate-900 uppercase tracking-wider">Raise Maintenance Request</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Request Title</label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Water dripping in bathroom"
                      required
                      className="block w-full px-3 py-2 border border-slate-200 rounded-brand-md text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Category Tag</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-brand-md text-xs bg-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors cursor-pointer text-slate-800"
                    >
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Security">Security</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">Description details</label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Detail the issue..."
                    required
                    rows={2}
                    className="block w-full px-3.5 py-2 border border-slate-200 rounded-brand-md text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    onClick={() => setShowReqForm(false)}
                    variant="secondary"
                    className="px-3.5 py-1.5 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={submittingReq}
                    className="px-3.5 py-1.5 text-xs"
                  >
                    Submit Ticket
                  </Button>
                </div>
              </form>
            )}

            {/* Requests Tracking Queue */}
            <div className="overflow-x-auto pt-2">
              {loading && requests.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-xs italic">
                  Fetching ticket queue...
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-xs italic">
                  No active service requests logged.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50">
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Title
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Category
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Description
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Date Raised
                      </th>
                      <th className="text-slate-500 text-[10px] font-mono font-bold uppercase tracking-wider p-4">
                        Status State
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((req) => {
                      const getStatusBadge = (status) => {
                        switch (status) {
                          case 'COMPLETED': return 'approved';
                          case 'APPROVED': return 'in_progress';
                          case 'REJECTED': return 'rejected';
                          case 'PENDING':
                          default: return 'pending';
                        }
                      };

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                          <td
                            onClick={() => navigate(`/resident/requests/${req.id}`)}
                            className="p-4 text-slate-900 hover:text-brand-gold font-bold text-sm cursor-pointer transition-colors"
                          >
                            {req.title}
                          </td>
                          <td className="p-4 text-slate-600 text-sm">
                            {req.category}
                          </td>
                          <td className="p-4 text-slate-500 text-sm max-w-xs truncate" title={req.description}>
                            {req.description}
                          </td>
                          <td className="p-4 text-slate-500 text-sm">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <Badge label={req.status} status={getStatusBadge(req.status)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Conditionally render Announcements section */}
      {isAnnouncements && (
        <div className="max-w-4xl mx-auto space-y-6 text-left">
          <Card
            title="Announcements Notice Board"
            subtitle="Bulletin Feed"
            className="p-6 border border-slate-200"
          >
            <div className="space-y-4 pt-2">
              {loadingNotices ? (
                <div className="text-slate-400 text-xs italic">Loading bulletins...</div>
              ) : notices.length === 0 ? (
                <div className="text-slate-400 text-xs italic">No bulletins posted at this time.</div>
              ) : (
                notices.map((notice) => (
                  <div key={notice.id} className="space-y-2 bg-slate-50 border border-slate-100 p-4 rounded-brand-md last:border-b-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-slate-900 font-bold text-sm font-serif">{notice.title}</h4>
                      <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed mt-1">
                      {notice.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      <ConfirmModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmLabel={modal.confirmLabel}
        cancelLabel={modal.cancelLabel}
        onConfirm={modal.onConfirm}
        onCancel={closeModal}
        isAlert={modal.isAlert}
        type={modal.type}
      />
    </DashboardLayout>
  );
}
