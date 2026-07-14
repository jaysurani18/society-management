import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Home, LogOut, CreditCard, Wrench, Plus, Bell } from 'lucide-react';

export default function ResidentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [bills, setBills] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      const billsRes = await api.get('/bills?limit=20');
      const billsList = billsRes.data?.data?.bills || billsRes.data?.bills || billsRes.data || [];
      setBills(Array.isArray(billsList) ? billsList : []);

      // 2. Fetch Service Requests
      const reqsRes = await api.get('/service-requests?limit=20');
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
  const handleViewReceipt = async (billId) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.get(`/bills/${billId}/receipt`);
      const receipt = res.data?.data?.receipt || res.data?.receipt || res.data || null;
      if (receipt) {
        const collectedByName = receipt.collectedBy 
          ? `${receipt.collectedBy.firstName} ${receipt.collectedBy.lastName || ''}`
          : 'Society Admin';

        alert(`--- PAYMENT RECEIPT ---\nReceipt No: ${receipt.receiptNumber}\nAmount Paid: ₹${receipt.amountPaid.toFixed(2)}\nPayee Name: ${receipt.paidByName}\nCollected By: ${collectedByName}\nDate: ${new Date(receipt.createdAt).toLocaleString()}\nStatus: SETTLED IN CASH`);
      } else {
        alert('Receipt details could not be loaded.');
      }
    } catch (err) {
      console.error('Receipt lookup error:', err);
      alert(err.response?.data?.message || 'Failed to fetch receipt details.');
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded">
            <Home size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Resident Portal</span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-medium text-slate-900">Personal Ledger</span>
            </div>
            <p className="text-xs text-slate-500">Flat maintenance ledger & service tracking</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">
              Account: {user?.email || 'resident@society.com'}
            </span>
            <span className="text-xs uppercase px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 font-semibold tracking-wider">
              {user?.role || 'RESIDENT'}
            </span>
          </div>

          <button
            onClick={() => navigate('/resident/complaints')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold focus:outline-none cursor-pointer"
          >
            File/View Complaints
          </button>

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
        </div></header>

      {/* Main Workspace Column */}
      <main className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Error/Success Alerts */}
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

        {/* Active Announcements & Bulletins Section */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Bell size={16} className="text-slate-500 animate-pulse" />
              <h3>Active Announcements & Bulletins</h3>
            </div>
            <span className="text-xs text-slate-400">Notice Board Feed</span>
          </div>

          <div className="space-y-3">
            {loadingNotices ? (
              <div className="text-slate-500 text-xs italic">Loading bulletins...</div>
            ) : notices.length === 0 ? (
              <div className="text-slate-400 text-xs italic">No active bulletins or notices posted at this time.</div>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} className="border-l-4 border-indigo-500 bg-slate-50 p-4 rounded-r-md space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-slate-900 font-semibold text-sm">{notice.title}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(notice.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 1. Maintenance Obligation Ledger Block */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <CreditCard size={16} className="text-slate-500" />
              <h3>Maintenance Obligations</h3>
            </div>
            <span className="text-xs text-slate-400">Past & Present Invoices</span>
          </div>

          <div className="overflow-x-auto">
            {loading && bills.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-sm">
                Fetching obligations...
              </div>
            ) : bills.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-sm">
                No billing statements exist for your flat registry.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Bill Period
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Base Amount
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Penalty Fee
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Due Date
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Payment Status
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bills.map((bill) => {
                    const statusColors = 
                      bill.status === 'PAID'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : 'border-red-200 text-red-700 bg-red-50';

                    return (
                      <tr key={bill.id} className="hover:bg-slate-50/50">
                        <td className="p-4 text-slate-900 font-semibold text-sm">
                          {bill.billingPeriod}
                        </td>
                        <td className="p-4 text-slate-900 font-mono text-sm">
                          ₹{bill.amount.toFixed(2)}
                        </td>
                        <td className="p-4 text-red-600 font-mono text-sm">
                          ₹{bill.penalty.toFixed(2)}
                        </td>
                        <td className="p-4 text-slate-500 text-sm">
                          {new Date(bill.dueDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`border px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColors}`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="p-4">
                          {bill.status === 'UNPAID' ? (
                            <span className="text-slate-500 text-xs font-medium italic">
                              Pay Cash at Society Office
                            </span>
                          ) : (
                            <button
                              onClick={() => handleViewReceipt(bill.id)}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold focus:outline-none cursor-pointer"
                            >
                              View Receipt
                            </button>
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

        {/* 2. Service Requests tracking Block */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
              <Wrench size={16} className="text-slate-500" />
              <h3>Filed Service Requests</h3>
            </div>
            
            <button
              onClick={() => setShowReqForm(!showReqForm)}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1 px-2.5 rounded-md focus:outline-none cursor-pointer"
            >
              <Plus size={14} />
              New Ticket
            </button>
          </div>

          {/* Hidden Onboarding Input Stack */}
          {showReqForm && (
            <form onSubmit={handleRaiseRequest} className="bg-slate-50 border border-slate-200 p-4 space-y-3 max-w-xl">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">File New Service Ticket</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Request Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Broken corridor light bulb"
                    required
                    className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-1.5 w-full text-slate-950 text-sm bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-1.5 w-full text-slate-950 text-sm bg-white cursor-pointer"
                  >
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Carpentry">Carpentry</option>
                    <option value="Security">Security</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Description details</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detail the issue..."
                  required
                  rows={2}
                  className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-1.5 w-full text-slate-950 text-sm bg-white resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowReqForm(false)}
                  className="px-3 py-1 border border-slate-200 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReq}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1 cursor-pointer disabled:opacity-50"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          )}

          {/* Requests Tracking Queue */}
          <div className="overflow-x-auto">
            {loading && requests.length === 0 ? (
              <div className="text-center p-8 text-slate-500 text-sm">
                Fetching ticket queue...
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center p-8 text-slate-400 text-sm">
                No active service requests logged.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Title
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Category
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Description
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Date Raised
                    </th>
                    <th className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                      Status State
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {requests.map((req) => {
                    const statusColors = 
                      req.status === 'COMPLETED'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : req.status === 'APPROVED'
                        ? 'border-blue-200 text-blue-700 bg-blue-50'
                        : req.status === 'REJECTED'
                        ? 'border-red-200 text-red-700 bg-red-50'
                        : 'border-amber-200 text-amber-700 bg-amber-50';

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/50">
                        <td
                          onClick={() => navigate(`/resident/requests/${req.id}`)}
                          className="p-4 text-indigo-600 hover:text-indigo-800 font-semibold text-sm cursor-pointer"
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
                          <span className={`border px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColors}`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
