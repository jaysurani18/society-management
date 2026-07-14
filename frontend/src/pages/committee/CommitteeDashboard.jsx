import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Users, LogOut, Wrench, FileText, Check, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function CommitteeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [requests, setRequests] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingBills, setLoadingBills] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Billing Form States
  const [billingAmount, setBillingAmount] = useState(2000);
  const [billingMonth, setBillingMonth] = useState(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    return `${today.getFullYear()}-${mm}`;
  });
  const [dueDate, setDueDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(5); // Due on 5th of next month
    return nextMonth.toISOString().split('T')[0];
  });
  const [submittingBilling, setSubmittingBilling] = useState(false);

  // Announcement Form States
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [publishingNotice, setPublishingNotice] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState('');
  const [noticeError, setNoticeError] = useState('');

  // Fetch initial service requests
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/service-requests?limit=50');
      const allRequests = res.data?.data?.requests || res.data?.data?.serviceRequests || res.data?.requests || res.data?.data || [];
      setRequests(Array.isArray(allRequests) ? allRequests : []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError(err.response?.data?.message || 'Failed to retrieve community service tickets.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all outstanding/unpaid bills across society
  const fetchUnpaidBills = async () => {
    setLoadingBills(true);
    try {
      const res = await api.get('/bills?status=UNPAID&limit=50');
      const allUnpaidBills = res.data?.data?.bills || res.data?.bills || res.data || [];
      setUnpaidBills(Array.isArray(allUnpaidBills) ? allUnpaidBills : []);
    } catch (err) {
      console.error('Failed to load unpaid bills:', err);
    } finally {
      setLoadingBills(false);
    }
  };

  // Fetch all global community complaints
  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await api.get('/complaints?limit=50');
      const list = res.data?.data?.complaints || res.data?.complaints || res.data?.data || res.data || [];
      setComplaints(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Complaints loading error:', err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchUnpaidBills();
    fetchComplaints();
  }, []);

  // Handle Review (APPROVE / REJECT)
  const handleReviewTicket = async (id, status) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.patch(`/service-requests/${id}/review`, { status });
      if (res.data?.status === 'success') {
        setSuccessMsg(`Service request successfully updated to ${status}.`);
        await fetchRequests();
      }
    } catch (err) {
      console.error('Review action failed:', err);
      setError(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  // Handle Resolve (COMPLETED)
  const handleResolveTicket = async (id) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.patch(`/service-requests/${id}/resolve`);
      if (res.data?.status === 'success') {
        setSuccessMsg('Service request marked as completed successfully.');
        await fetchRequests();
      }
    } catch (err) {
      console.error('Resolve action failed:', err);
      setError(err.response?.data?.message || 'Failed to mark ticket as resolved.');
    }
  };

  // Handle Batch Billing Generation
  const handleGenerateBilling = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!billingMonth.trim() || !dueDate || billingAmount <= 0) {
      setError('Please provide valid invoice configurations.');
      return;
    }

    setSubmittingBilling(true);
    try {
      const res = await api.post('/bills/batch-generate', {
        amount: Number(billingAmount),
        billingMonth,
        dueDate: new Date(dueDate).toISOString(),
      });

      if (res.data?.status === 'success' || res.status === 201) {
        setSuccessMsg(`Batch billing generation complete. Invoiced ${res.data?.data?.count || 'all'} active flat units.`);
        await fetchUnpaidBills(); // Refresh unpaid dues
      }
    } catch (err) {
      console.error('Billing generation error:', err);
      setError(err.response?.data?.message || 'Failed to run batch billing. Unit statements may already exist for this period.');
    } finally {
      setSubmittingBilling(false);
    }
  };

  // Handle Real Cash Settlement (Record Cash Settlement)
  const handleRecordCashSettlement = async (bill) => {
    if (!window.confirm(`Record manual cash settlement of ₹${(bill.amount + bill.penalty - bill.discount).toFixed(2)} for flat unit ${bill.flat?.block} - ${bill.flat?.number}?`)) {
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      const totalAmount = bill.amount + bill.penalty - bill.discount;
      const payeeName = bill.flat 
        ? `Resident (Flat ${bill.flat.block} - ${bill.flat.number})`
        : 'Resident Flat';

      const res = await api.post(`/bills/${bill.id}/record-cash`, {
        amountPaid: totalAmount,
        paidByName: payeeName,
        discount: 0,
      });

      if (res.data?.status === 'success' || res.status === 201) {
        setSuccessMsg(`Cash payment reconciled. Receipt generated for flat unit ${bill.flat?.block} - ${bill.flat?.number}.`);
        await fetchUnpaidBills(); // Re-fetch unpaid dues to clear paid rows
      }
    } catch (err) {
      console.error('Reconciliation settlement failed:', err);
      setError(err.response?.data?.message || 'Failed to process cash settlement.');
    }
  };

  // Handle publishing notice
  const handlePublishNotice = async (e) => {
    e.preventDefault();
    setNoticeError('');
    setNoticeSuccess('');

    if (!noticeTitle.trim() || !noticeContent.trim()) {
      setNoticeError('Title and content are required.');
      return;
    }

    setPublishingNotice(true);
    try {
      const res = await api.post('/announcements', {
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
      });

      if (res.data?.status === 'success' || res.status === 201) {
        setNoticeSuccess('Society notice published successfully!');
        setNoticeTitle('');
        setNoticeContent('');
      }
    } catch (err) {
      console.error('Failed to publish notice:', err);
      setNoticeError(err.response?.data?.message || 'Failed to publish society notice.');
    } finally {
      setPublishingNotice(false);
    }
  };

  // Handle resolving a complaint
  const handleResolveComplaint = async (id) => {
    if (!window.confirm('Mark this community complaint as RESOLVED?')) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.patch(`/complaints/${id}/status`);
      if (res.data?.status === 'success' || res.status === 200) {
        setSuccessMsg('Complaint successfully marked as resolved.');
        await fetchComplaints();
      }
    } catch (err) {
      console.error('Resolve complaint failed:', err);
      setError(err.response?.data?.message || 'Failed to resolve complaint.');
    }
  };

  // Helper to build local or external image source URL
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('https://')) return path;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${base}/${path.replace(/^\/+/, '')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded">
            <Users size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Committee Operations</span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-medium text-slate-900">Management Hub</span>
            </div>
            <p className="text-xs text-slate-500">Community service ticket reviews & financial automation</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">
              {user ? `${user.firstName} ${user.lastName}` : 'Committee Member'}
            </span>
            <span className="text-xs uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold tracking-wider">
              {user?.role || 'COMMITTEE'}
            </span>
          </div>

          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold hover:bg-slate-100 focus:outline-none cursor-pointer text-slate-700"
          >
            Settings
          </button>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-xs font-semibold hover:bg-slate-100 focus:outline-none cursor-pointer text-slate-700"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col divide-y divide-slate-200">
        
        {/* Top Grid Area (A & B Panels) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Panel A: Community Service Tickets Table (2/3 width) */}
          <section className="lg:col-span-2 p-6 flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Wrench size={16} className="text-slate-500" />
              <h3>Community Service Tickets</h3>
            </div>

            {/* General notifications */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 font-medium">
                {successMsg}
              </div>
            )}

            <div className="bg-white border border-slate-200 overflow-x-auto">
              {loading ? (
                <div className="text-center p-12 text-slate-500 text-sm">
                  Fetching service tickets...
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center p-12 text-slate-400 text-sm">
                  No active service requests submitted by residents.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                        Resident Name
                      </th>
                      <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                        Issue Description
                      </th>
                      <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                        Category
                      </th>
                      <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                        Raised On
                      </th>
                      <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                        Status State
                      </th>
                      <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                        Controls
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {requests.map((ticket) => {
                      const statusColors = 
                        ticket.status === 'COMPLETED'
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                          : ticket.status === 'APPROVED'
                          ? 'border-blue-200 text-blue-700 bg-blue-50'
                          : ticket.status === 'REJECTED'
                          ? 'border-red-200 text-red-700 bg-red-50'
                          : 'border-amber-200 text-amber-700 bg-amber-50';

                      return (
                        <tr key={ticket.id} className="hover:bg-slate-50/50">
                          <td className="p-4 text-slate-900 font-semibold text-sm">
                            {ticket.raisedBy ? `${ticket.raisedBy.firstName} ${ticket.raisedBy.lastName}` : 'Resident'}
                          </td>
                          <td className="p-4 space-y-0.5">
                            <p
                              onClick={() => navigate(`/committee/requests/${ticket.id}`)}
                              className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm cursor-pointer"
                            >
                              {ticket.title}
                            </p>
                            <p className="text-slate-500 text-xs truncate max-w-xs">{ticket.description}</p>
                          </td>
                          <td className="p-4 text-slate-500 text-sm">
                            {ticket.category}
                          </td>
                          <td className="p-4 text-slate-500 text-sm">
                            {new Date(ticket.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <span className={`border px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColors}`}>
                              {ticket.status}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              {ticket.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleReviewTicket(ticket.id, 'APPROVED')}
                                    className="border border-slate-300 text-slate-700 text-xs font-semibold py-1 px-2 rounded-md hover:bg-slate-50 cursor-pointer focus:outline-none"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleReviewTicket(ticket.id, 'REJECTED')}
                                    className="border border-red-200 text-red-600 text-xs font-semibold py-1 px-2 rounded-md hover:bg-red-50 cursor-pointer focus:outline-none"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {ticket.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleResolveTicket(ticket.id)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1 px-2 rounded-md cursor-pointer focus:outline-none"
                                >
                                  Resolve
                                </button>
                              )}
                              {ticket.status === 'COMPLETED' && (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* Panel B: Financial Ledger Controls & Notices (1/3 width) */}
          <section className="p-6 bg-white space-y-6 flex flex-col overflow-y-auto">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <FileText size={16} />
                  <h3>Financial Automations</h3>
                </div>
                <p className="text-xs text-slate-500">Trigger community-wide monthly maintenance statements.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 space-y-4">
                <div className="flex gap-2 text-slate-600 text-xs">
                  <AlertCircle size={16} className="shrink-0 text-indigo-600" />
                  <p>Generates baseline maintenance invoices for all currently active flats in the registry database.</p>
                </div>

                <form onSubmit={handleGenerateBilling} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Base Statement Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-slate-400 text-sm">₹</span>
                      <input
                        type="number"
                        value={billingAmount}
                        onChange={(e) => setBillingAmount(e.target.value)}
                        placeholder="2000"
                        min="1"
                        required
                        disabled={submittingBilling}
                        className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md py-2 pl-7 pr-3 w-full text-slate-950 text-sm bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Billing Period (YYYY-MM)</label>
                    <input
                      type="text"
                      value={billingMonth}
                      onChange={(e) => setBillingMonth(e.target.value)}
                      placeholder="e.g. 2026-07"
                      required
                      disabled={submittingBilling}
                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Payment Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      disabled={submittingBilling}
                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white cursor-pointer"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBilling}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-md text-sm w-full cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submittingBilling ? 'Running batch billing...' : 'Generate Batch Invoices'}
                  </button>
                </form>
              </div>
            </div>

            {/* Divider line */}
            <div className="border-t border-slate-200 pt-6"></div>

            {/* Publish Society Notice Widget */}
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <FileText size={16} />
                  <h3>Publish Society Notice</h3>
                </div>
                <p className="text-xs text-slate-500">Broadcast important bulletins to all residents.</p>
              </div>

              {noticeError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 font-medium">
                  {noticeError}
                </div>
              )}
              {noticeSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 text-xs p-3 font-medium">
                  {noticeSuccess}
                </div>
              )}

              <form onSubmit={handlePublishNotice} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notice Title</label>
                  <input
                    type="text"
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g. Scheduled Water Shutdown"
                    required
                    disabled={publishingNotice}
                    className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notice Content</label>
                  <textarea
                    value={noticeContent}
                    onChange={(e) => setNoticeContent(e.target.value)}
                    placeholder="Type the notice details..."
                    required
                    rows={4}
                    disabled={publishingNotice}
                    className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={publishingNotice}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-2 px-4 rounded-md w-full cursor-pointer disabled:opacity-50"
                >
                  {publishingNotice ? 'Publishing...' : 'Publish Notice'}
                </button>
              </form>
            </div>
          </section>

        </div>

        {/* Panel C: Outstanding Dues Ledger (Full Width) */}
        <section className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <Check size={16} className="text-slate-500" />
            <h3>Outstanding Dues Ledger</h3>
          </div>

          <div className="bg-white border border-slate-200 overflow-x-auto">
            {loadingBills ? (
              <div className="text-center p-8 text-slate-500 text-sm">
                Loading unpaid obligations...
              </div>
            ) : unpaidBills.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-sm">
                No outstanding maintenance dues found across the community registry.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Resident / Flat
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Bill Period
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Base Amount
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Late Fee Penalty
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Outstanding Total
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Status State
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {unpaidBills.map((b) => {
                    const flatLabel = b.flat ? `${b.flat.block} - ${b.flat.number}` : 'Flat Unit';
                    const total = b.amount + b.penalty - b.discount;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-900 font-semibold text-sm">
                          {flatLabel}
                        </td>
                        <td className="p-4 text-slate-900 font-semibold text-sm">
                          {b.billingPeriod}
                        </td>
                        <td className="p-4 text-slate-900 font-mono text-sm">
                          ₹{b.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-red-600 font-mono text-sm">
                          ₹{b.penalty.toFixed(2)}
                        </td>
                        <td className="p-4 text-slate-900 font-mono font-semibold text-sm">
                          ₹{total.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className="border border-red-200 text-red-700 bg-red-50 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={() => handleRecordCashSettlement(b)}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1 px-3 rounded-md focus:outline-none cursor-pointer"
                          >
                            Record Cash Settlement
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Panel D: Global Community Complaints (Full Width) */}
        <section className="p-6 bg-white space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <CheckCircle2 size={16} className="text-slate-500" />
            <h3>Assigned Community Complaints</h3>
          </div>

          <div className="bg-white border border-slate-200 overflow-x-auto">
            {loadingComplaints ? (
              <div className="text-center p-8 text-slate-500 text-sm">
                Loading community complaints...
              </div>
            ) : complaints.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-sm">
                No active complaints filed across the community.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Title / Details
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Evidence
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Filed By
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Assigned To
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Status Badge
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {complaints.map((item) => {
                    const statusColors = 
                      item.status === 'RESOLVED'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : item.status === 'ASSIGNED'
                        ? 'border-blue-200 text-blue-700 bg-blue-50'
                        : 'border-amber-200 text-amber-700 bg-amber-50';

                    // Verify if this ticket is resolved or belongs to committee member
                    const isAssignedToMe = item.assignedToId === user?.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="p-4 space-y-1">
                          <p
                            onClick={() => navigate(`/complaints/${item.id}`)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm cursor-pointer"
                          >
                            {item.title}
                          </p>
                          <p className="text-slate-500 text-xs max-w-xs">{item.description}</p>
                        </td>
                        <td className="p-4">
                          {item.imageUrl ? (
                            <a
                              href={getImageUrl(item.imageUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block border border-slate-200 rounded p-0.5 hover:border-indigo-400"
                            >
                              <img
                                src={getImageUrl(item.imageUrl)}
                                alt="evidence"
                                className="h-10 w-10 object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No Photo</span>
                          )}
                        </td>
                        <td className="p-4 space-y-0.5">
                          <p className="text-slate-900 text-xs font-semibold">
                            {item.raisedBy ? `${item.raisedBy.firstName} ${item.raisedBy.lastName}` : 'Resident'}
                          </p>
                          <p className="text-slate-400 text-[10px]">{item.raisedBy?.email}</p>
                        </td>
                        <td className="p-4 text-slate-700 text-xs font-medium">
                          {item.assignedTo ? (
                            <span>
                              {item.assignedTo.firstName} {item.assignedTo.lastName} {isAssignedToMe && '(You)'}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`border px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide uppercase ${statusColors}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {item.status !== 'RESOLVED' && (user.role === 'ADMIN' || isAssignedToMe) ? (
                            <button
                              onClick={() => handleResolveComplaint(item.id)}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1 px-3 rounded-md focus:outline-none cursor-pointer"
                            >
                              Resolve
                            </button>
                          ) : item.status === 'RESOLVED' ? (
                            <span className="text-slate-400 text-xs">-</span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}
