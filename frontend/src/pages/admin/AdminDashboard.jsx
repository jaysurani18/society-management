import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Shield, LogOut, UserPlus, Users, Home, FileText, CheckCircle2, Award, DollarSign, Activity, Lock, AlertCircle, Check } from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Tab State
  const [currentTab, setCurrentTab] = useState('overview'); // options: 'overview', 'directory', 'finance', 'operations'

  // Data States
  const [residents, setResidents] = useState([]);
  const [flats, setFlats] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [committeeMembers, setCommitteeMembers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [unpaidBills, setUnpaidBills] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  
  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [loadingCommittee, setLoadingCommittee] = useState(true);
  const [loadingAudits, setLoadingAudits] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingBills, setLoadingBills] = useState(true);

  // Metrics State
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    activeRequests: 0,
    pendingComplaints: 0
  });

  // Resident Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('Resident@123'); // Default secure password
  const [flatId, setFlatId] = useState('');
  const [status, setStatus] = useState('OWNER');

  // Resident Status/Error States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Announcement Form States
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [publishingNotice, setPublishingNotice] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState('');
  const [noticeError, setNoticeError] = useState('');

  // Promotion Inline Selection States (mapped by User ID)
  const [promotionDesignations, setPromotionDesignations] = useState({});
  const [promotingUserIds, setPromotingUserIds] = useState({});

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

  // Flat Form States
  const [flatWing, setFlatWing] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [registeringFlat, setRegisteringFlat] = useState(false);

  // Fetch initial directory list and flats
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const flatsRes = await api.get('/flats');
      const flatsList = flatsRes.data?.data?.flats || flatsRes.data?.flats || flatsRes.data?.data || flatsRes.data || [];
      const validFlats = Array.isArray(flatsList) ? flatsList : [];
      setFlats(validFlats);
      if (validFlats.length > 0) {
        setFlatId(validFlats[0].id);
      }

      const residentsRes = await api.get('/residents?limit=50');
      const residentsList = residentsRes.data?.residents || residentsRes.data?.data?.residents || residentsRes.data?.data || residentsRes.data || [];
      const validResidents = Array.isArray(residentsList) ? residentsList : [];
      setResidents(validResidents);
      setTotalCount(residentsRes.data?.total || residentsRes.data?.data?.total || validResidents.length);
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err.response?.data?.message || 'Failed to load directory details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch global complaints
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

  // Fetch active committee profiles
  const fetchCommitteeMembers = async () => {
    setLoadingCommittee(true);
    try {
      const res = await api.get('/committee');
      const list = res.data?.data?.committee || res.data?.committee || [];
      setCommitteeMembers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch committee list:', err);
    } finally {
      setLoadingCommittee(false);
    }
  };

  // Fetch system audit logs
  const fetchAuditLogs = async () => {
    setLoadingAudits(true);
    try {
      const res = await api.get('/audit-logs?limit=50');
      const logs = res.data?.data?.logs || res.data?.logs || res.data?.data || res.data || [];
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      console.error('Failed to load system audit logs:', err);
    } finally {
      setLoadingAudits(false);
    }
  };

  // Fetch all global service requests
  const fetchServiceRequests = async () => {
    setLoadingRequests(true);
    try {
      const res = await api.get('/service-requests?limit=50');
      const list = res.data?.data?.requests || res.data?.data?.serviceRequests || res.data?.requests || res.data?.data || [];
      setServiceRequests(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load service requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch unpaid obligations/bills
  const fetchUnpaidBills = async () => {
    setLoadingBills(true);
    try {
      const res = await api.get('/bills?status=UNPAID&limit=50');
      const list = res.data?.data?.bills || res.data?.bills || res.data || [];
      setUnpaidBills(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load unpaid bills:', err);
    } finally {
      setLoadingBills(false);
    }
  };

  // Fetch dashboard summary and metrics
  const fetchMetrics = async () => {
    try {
      const summaryRes = await api.get('/dashboard/summary');
      const summaryData = summaryRes.data?.data || {};

      const requestsRes = await api.get('/service-requests?limit=100');
      const requestsList = requestsRes.data?.data?.requests || requestsRes.data?.data?.serviceRequests || requestsRes.data?.requests || requestsRes.data?.data || [];
      
      const activeCount = Array.isArray(requestsList)
        ? requestsList.filter(r => r.status !== 'COMPLETED' && r.status !== 'REJECTED').length
        : 0;

      setMetrics({
        totalRevenue: summaryData.totalRevenueCollected || 0,
        activeRequests: activeCount,
        pendingComplaints: summaryData.pendingComplaints || 0
      });
    } catch (err) {
      console.error('Failed to fetch stats metrics:', err);
    }
  };

  // Trigger metrics and queries on mount
  useEffect(() => {
    fetchData();
    fetchComplaints();
    fetchCommitteeMembers();
    fetchAuditLogs();
    fetchMetrics();
    fetchServiceRequests();
    fetchUnpaidBills();
  }, []);

  // Onboard Resident Submit handler
  const handleOnboard = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !flatId || !password.trim()) {
      setError('Please fill in all the required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/residents', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password: password.trim(),
        flatId,
        status,
      });

      if (response.data?.status === 'success') {
        setSuccessMsg('Resident onboarded successfully!');
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('');
        setPassword('Resident@123');
        await fetchData();
        await fetchAuditLogs();
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Onboarding failed:', err);
      setError(err.response?.data?.message || 'Failed to onboard resident.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resident Deactivate (soft-delete)
  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this resident profile?')) {
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      const response = await api.delete(`/residents/${id}`);
      if (response.status === 200 || response.data?.status === 'success') {
        setSuccessMsg('Resident profile deactivated successfully.');
        await fetchData();
        await fetchAuditLogs();
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Deactivation error:', err);
      setError(err.response?.data?.message || 'Failed to deactivate resident.');
    }
  };

  // Notice Bulletin publisher
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
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to publish notice:', err);
      setNoticeError(err.response?.data?.message || 'Failed to publish society notice.');
    } finally {
      setPublishingNotice(false);
    }
  };

  // Resolve Complaint
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
        await fetchAuditLogs();
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Resolve complaint failed:', err);
      setError(err.response?.data?.message || 'Failed to update complaint status.');
    }
  };

  // Promoting User to Committee
  const handlePromote = async (userId, responsibility) => {
    if (!responsibility) {
      alert('Please select a designation.');
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post('/committee', {
        userId,
        responsibility,
      });
      if (res.data?.status === 'success' || res.status === 201) {
        setSuccessMsg('User successfully promoted to Committee role.');
        setPromotionDesignations(prev => ({ ...prev, [userId]: '' }));
        setPromotingUserIds(prev => ({ ...prev, [userId]: false }));
        await fetchData();
        await fetchCommitteeMembers();
        await fetchAuditLogs();
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Promotion failed:', err);
      setError(err.response?.data?.message || 'Failed to promote resident to committee.');
    }
  };

  // Demoting Committee Member
  const handleDemote = async (committeeProfileId) => {
    if (!window.confirm('Are you sure you want to demote this committee member back to standard resident?')) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/committee/${committeeProfileId}`);
      if (res.status === 200 || res.data?.status === 'success') {
        setSuccessMsg('Committee member demoted back to standard resident.');
        await fetchData();
        await fetchCommitteeMembers();
        await fetchAuditLogs();
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Demotion failed:', err);
      setError(err.response?.data?.message || 'Failed to demote committee member.');
    }
  };

  // Review (Approve/Reject) Service Request
  const handleReviewServiceRequest = async (id, status) => {
    if (!window.confirm(`Mark this service request as ${status}?`)) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.patch(`/service-requests/${id}/review`, { status });
      if (res.data?.status === 'success') {
        setSuccessMsg(`Service request successfully updated to ${status}.`);
        await fetchServiceRequests();
        await fetchMetrics();
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Review action failed:', err);
      setError(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  // Assign Complaint to Committee Member
  const handleAssignComplaint = async (complaintId, selectedId) => {
    if (!selectedId) return;
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.patch(`/complaints/${complaintId}/assign`, {
        assignedToId: selectedId,
        assignedCommitteeId: selectedId,
        status: "ASSIGNED"
      });
      if (res.data?.status === 'success' || res.status === 200) {
        setSuccessMsg('Complaint successfully assigned to committee member.');
        await fetchComplaints();
        await fetchAuditLogs();
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Assign complaint failed:', err);
      setError(err.response?.data?.message || 'Failed to assign complaint.');
    }
  };

  // Batch Billing Invoice generator
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
        await fetchUnpaidBills(); 
        await fetchMetrics();
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Billing generation error:', err);
      setError(err.response?.data?.message || 'Failed to run batch billing. Statements may already exist.');
    } finally {
      setSubmittingBilling(false);
    }
  };

  // Reconcile Cash Settlement against unpaid bill
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
        await fetchUnpaidBills(); 
        await fetchMetrics();
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Reconciliation settlement failed:', err);
      setError(err.response?.data?.message || 'Failed to process cash settlement.');
    }
  };

  // Flat Unit Registration Handler
  const handleRegisterFlat = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!flatWing.trim() || !flatNumber.trim()) {
      setError('Please provide both Wing Label and Flat Number.');
      return;
    }

    setRegisteringFlat(true);
    try {
      const res = await api.post('/flats', {
        wing: flatWing.trim(),
        number: flatNumber.trim(),
      });

      if (res.data?.status === 'success' || res.status === 201) {
        setSuccessMsg(`Flat Unit ${flatWing.trim()} - ${flatNumber.trim()} registered successfully!`);
        setFlatWing('');
        setFlatNumber('');
        
        await fetchData(); 
        await fetchAuditLogs();
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Failed to register flat:', err);
      setError(err.response?.data?.message || 'Failed to register new flat unit.');
    } finally {
      setRegisteringFlat(false);
    }
  };

  // Flat Unit Deletion Handler
  const handleDeleteFlat = async (id) => {
    if (!window.confirm('Are you sure you want to delete this flat unit?')) {
      return;
    }
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.delete(`/flats/${id}`);
      if (res.status === 200 || res.data?.status === 'success') {
        setSuccessMsg(res.data?.message || 'Flat unit deleted successfully.');
        await fetchData(); 
        await fetchAuditLogs();
        await fetchMetrics();
      }
    } catch (err) {
      console.error('Failed to delete flat:', err);
      setError(err.response?.data?.message || 'Failed to delete flat unit.');
    }
  };

  // Helper to build local or external image source URL
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `http://localhost:5000${path}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded">
            <Shield size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Admin Workspace</span>
              <span className="text-slate-300">/</span>
              <span className="text-sm font-medium text-slate-900">Resident Directory</span>
            </div>
            <p className="text-xs text-slate-500">System database flat records & profiles</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase px-2 py-0.5 bg-slate-100 text-slate-800 border border-slate-200">
              Total Records: {totalCount}
            </span>
            <span className="text-sm font-medium">
              {user ? `${user.firstName} ${user.lastName}` : 'Administrator'}
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
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        
        {/* Error / Success Notifications */}
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

        {/* Analytical Reporting Metrics Strip (Horizontal Grid) */}
        <section className="bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Financial Overview */}
            <div className="bg-white border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Revenue Collected</span>
                <DollarSign size={14} className="text-slate-400" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900">
                ₹{metrics.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Card 2: Operations */}
            <div className="bg-white border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Service Requests</span>
                <Activity size={14} className="text-slate-400" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900">{metrics.activeRequests}</p>
            </div>

            {/* Card 3: Safety */}
            <div className="bg-white border border-slate-200 p-4 space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-wider">Pending Community Complaints</span>
                <Shield size={14} className="text-slate-400" />
              </div>
              <p className="text-xl font-bold font-mono text-slate-900">{metrics.pendingComplaints}</p>
            </div>

          </div>
        </section>

        {/* Flat Tab Selector Strip */}
        <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
          <button
            onClick={() => setCurrentTab('overview')}
            className={currentTab === 'overview' 
              ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold px-4 py-2 text-sm focus:outline-none cursor-pointer' 
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-900 px-4 py-2 text-sm focus:outline-none cursor-pointer'}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab('directory')}
            className={currentTab === 'directory' 
              ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold px-4 py-2 text-sm focus:outline-none cursor-pointer' 
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-900 px-4 py-2 text-sm focus:outline-none cursor-pointer'}
          >
            Resident Directory & Committee
          </button>
          <button
            onClick={() => setCurrentTab('finance')}
            className={currentTab === 'finance' 
              ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold px-4 py-2 text-sm focus:outline-none cursor-pointer' 
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-900 px-4 py-2 text-sm focus:outline-none cursor-pointer'}
          >
            Financial Automations
          </button>
          <button
            onClick={() => setCurrentTab('operations')}
            className={currentTab === 'operations' 
              ? 'border-b-2 border-indigo-600 text-indigo-600 font-semibold px-4 py-2 text-sm focus:outline-none cursor-pointer' 
              : 'border-b-2 border-transparent text-slate-500 hover:text-slate-900 px-4 py-2 text-sm focus:outline-none cursor-pointer'}
          >
            Service Requests & Complaints
          </button>
        </div>

        {/* Tab Contents */}
        {currentTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Publish notice (1/3 Width) */}
            <div className="lg:col-span-1 bg-white border border-slate-200 p-6 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <FileText size={16} />
                  <h3>Publish Society Notice</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">Broadcast bulletins to all residents.</p>
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

            {/* Right Column: Audit Logs (2/3 Width) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Lock size={16} className="text-slate-500" />
                <h3>System Audit & Activity Logs</h3>
              </div>

              {/* Scrollable container with stationary header */}
              <div className="max-h-[500px] overflow-y-auto border border-slate-200 rounded-md">
                {loadingAudits ? (
                  <div className="text-center p-8 text-slate-500 text-sm">
                    Fetching audit trails...
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-sm">
                    No system audit records found.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 sticky top-0 border-b border-slate-200">
                        <th className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Timestamp
                        </th>
                        <th className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          System Event / Action
                        </th>
                        <th className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Operator Role
                        </th>
                        <th className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Status State
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="p-4 text-slate-500 text-xs font-mono">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="p-4 space-y-0.5">
                            <p className="text-slate-900 font-semibold text-xs">{log.action}</p>
                            <p className="text-slate-400 text-[10px] truncate max-w-xs" title={log.details}>
                              {log.details}
                            </p>
                          </td>
                          <td className="p-4">
                            <span className="text-xs text-slate-700 font-medium">
                              {log.user ? log.user.role : 'SYSTEM'}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className="bg-green-50 border border-green-200 text-green-700 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase">
                              Success
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'directory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Onboarding & Flats (1/3 Width) */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Onboard New Resident Card */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <UserPlus size={16} />
                    <h3>Onboard New Resident</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Add flat registry details to grant portal access.</p>
                </div>

                <form onSubmit={handleOnboard} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required
                        disabled={submitting}
                        className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                        disabled={submitting}
                        className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john.doe@gmail.com"
                      required
                      disabled={submitting}
                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      required
                      disabled={submitting}
                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Default Access Password</label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      required
                      disabled={submitting}
                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Flat Property</label>
                      <select
                        value={flatId}
                        onChange={(e) => setFlatId(e.target.value)}
                        required
                        disabled={submitting || flats.length === 0}
                        className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white cursor-pointer"
                      >
                        {flats.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.block} - {f.number}
                          </option>
                        ))}
                        {flats.length === 0 && <option value="">No flats available</option>}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Resident Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                        disabled={submitting}
                        className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white cursor-pointer"
                      >
                        <option value="OWNER">Owner</option>
                        <option value="TENANT">Tenant</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-md text-sm w-full cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Register Profile'}
                  </button>
                </form>
              </div>

              {/* Register New Flat Unit Card */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                    <Home size={16} />
                    <h3>Register New Flat Unit</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Add physical flat assets to the database.</p>
                </div>

                <form onSubmit={handleRegisterFlat} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Wing Label Label</label>
                    <input
                      type="text"
                      value={flatWing}
                      onChange={(e) => setFlatWing(e.target.value)}
                      placeholder="e.g. Wing C"
                      required
                      disabled={registeringFlat}
                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Flat Number</label>
                    <input
                      type="text"
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      placeholder="e.g. 301"
                      required
                      disabled={registeringFlat}
                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={registeringFlat}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium py-2 px-4 rounded-md w-full cursor-pointer disabled:opacity-50"
                  >
                    {registeringFlat ? 'Registering...' : 'Register Flat Unit'}
                  </button>
                </form>
              </div>

            </div>

            {/* Right Column: Stacked Directory & Roles Tables (2/3 Width) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Active Occupancy Directory */}
              <section className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <Users size={16} />
                  <h3>Active Occupancy Directory</h3>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center p-8 text-slate-500 text-sm">
                      Fetching directory records...
                    </div>
                  ) : flats.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 text-sm">
                      No flats registered.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Full Name
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Email & Phone
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Property
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Role / Status
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            System Access
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {flats.map((flat) => {
                          const resident = residents.find(r => r.flatId === flat.id);
                          const hasResident = !!resident;
                          const isLeft = hasResident && resident.status === 'LEFT';
                          const isActive = hasResident && !isLeft;

                          const statusText = hasResident ? resident.status : 'VACANT';

                          const statusColors = 
                            statusText === 'OWNER'
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                              : statusText === 'TENANT'
                              ? 'border-blue-200 text-blue-700 bg-blue-50'
                              : statusText === 'LEFT'
                              ? 'border-red-200 text-red-700 bg-red-50'
                              : 'border-slate-200 text-slate-500 bg-slate-50';

                          return (
                            <tr key={flat.id} className="hover:bg-slate-50/50">
                              <td className="p-4 text-slate-900 font-semibold text-sm">
                                {hasResident ? `${resident.user.firstName} ${resident.user.lastName}` : 'Vacant'}
                              </td>
                              <td className="p-4 space-y-0.5">
                                {hasResident ? (
                                  <>
                                    <p className="text-slate-900 text-sm">{resident.user.email}</p>
                                    <p className="text-slate-400 text-xs font-mono">{resident.user.phone || 'No phone'}</p>
                                  </>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5 text-slate-700 text-sm">
                                  <Home size={14} className="text-slate-400" />
                                  <span>
                                    {flat.block} - {flat.number}
                                  </span>
                                  {(!hasResident || isLeft) && (
                                    <button
                                      onClick={() => handleDeleteFlat(flat.id)}
                                      className="text-red-600 hover:text-red-800 text-xs font-medium cursor-pointer ml-2 hover:underline focus:outline-none"
                                    >
                                      Delete Unit
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`border px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColors}`}>
                                  {statusText}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-xs font-semibold ${hasResident && resident.user.isActive ? 'text-green-600' : 'text-red-500'}`}>
                                  {hasResident && resident.user.isActive ? 'Active' : hasResident ? 'Locked (LEFT)' : 'No Access'}
                                </span>
                              </td>
                              <td className="p-4">
                                {isActive && resident.user.isActive ? (
                                  <button
                                    onClick={() => handleDeactivate(resident.id)}
                                    className="text-red-600 hover:text-red-800 text-xs font-semibold cursor-pointer focus:outline-none"
                                  >
                                    Deactivate
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
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

              {/* Committee Allocation & Designations Management Grid */}
              <section className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                  <Award size={16} className="text-slate-500" />
                  <h3>Committee Allocation & Designations</h3>
                </div>

                <div className="overflow-x-auto">
                  {loading || loadingCommittee ? (
                    <div className="text-center p-8 text-slate-500 text-sm">
                      Fetching roles directories...
                    </div>
                  ) : residents.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 text-sm">
                      No records to allocate.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Full Name
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Email Address
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Current Role
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Designation
                          </th>
                          <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                            Action Controls
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {residents.map((item) => {
                          if (!item.user || item.status === 'LEFT') return null;

                          const committeeProfile = committeeMembers.find(
                            (c) => c.userId === item.user.id || c.user?.id === item.user.id
                          );
                          const isCommittee = item.user.role === 'COMMITTEE' || !!committeeProfile;
                          const roleLabel = item.user.role;
                          const designationText = committeeProfile ? committeeProfile.designation : '-';
                          const committeeProfileId = committeeProfile ? committeeProfile.id : null;

                          const isPromoting = promotingUserIds[item.user.id] || false;
                          const selectedDesignation = promotionDesignations[item.user.id] || '';

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="p-4 text-slate-900 font-semibold text-sm">
                                {item.user.firstName} {item.user.lastName}
                              </td>
                              <td className="p-4 text-slate-600 text-sm">
                                {item.user.email}
                              </td>
                              <td className="p-4">
                                <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 border rounded ${
                                  roleLabel === 'ADMIN' 
                                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                                    : roleLabel === 'COMMITTEE'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}>
                                  {roleLabel}
                                </span>
                              </td>
                              <td className="p-4">
                                {isCommittee ? (
                                  <span className="inline-block border border-slate-200 bg-slate-50 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                                    {designationText}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">-</span>
                                )}
                              </td>
                              <td className="p-4">
                                {roleLabel === 'ADMIN' ? (
                                  <span className="text-slate-400 text-xs italic">System Admin Lock</span>
                                ) : isCommittee ? (
                                  <button
                                    onClick={() => handleDemote(committeeProfileId)}
                                    className="text-red-600 hover:text-red-800 text-xs font-semibold cursor-pointer focus:outline-none"
                                  >
                                    Demote to Resident
                                  </button>
                                ) : isPromoting ? (
                                  <div className="flex items-center gap-2">
                                    <select
                                      value={selectedDesignation}
                                      onChange={(e) => setPromotionDesignations(prev => ({
                                        ...prev,
                                        [item.user.id]: e.target.value
                                      }))}
                                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded py-0.5 px-1.5 text-slate-950 text-xs bg-white cursor-pointer"
                                    >
                                      <option value="">-- Choose Designation --</option>
                                      <option value="President">President</option>
                                      <option value="Treasurer">Treasurer</option>
                                      <option value="Secretary">Secretary</option>
                                      <option value="Secretary General">Secretary General</option>
                                      <option value="Management">Management</option>
                                      <option value="Finance">Finance</option>
                                      <option value="Operations">Operations</option>
                                    </select>
                                    <button
                                      onClick={() => handlePromote(item.user.id, selectedDesignation)}
                                      className="text-indigo-600 hover:text-indigo-800 text-xs font-bold cursor-pointer hover:underline"
                                    >
                                      Confirm Promotion
                                    </button>
                                    <button
                                      onClick={() => setPromotingUserIds(prev => ({
                                        ...prev,
                                        [item.user.id]: false
                                      }))}
                                      className="text-slate-400 hover:text-slate-600 text-xs font-medium cursor-pointer hover:underline"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setPromotingUserIds(prev => ({
                                      ...prev,
                                      [item.user.id]: true
                                    }))}
                                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1 px-3 rounded-md cursor-pointer focus:outline-none"
                                  >
                                    Promote to Committee
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

            </div>

          </div>
        )}

        {currentTab === 'finance' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Financial Automations (1/3 Width) */}
            <div className="lg:col-span-1 bg-white border border-slate-200 p-6 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <FileText size={16} />
                  <h3>Financial Automations</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium">Trigger community-wide maintenance statements.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-4 space-y-4">
                <div className="flex gap-2 text-slate-600 text-xs font-medium">
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

            {/* Right Column: Outstanding Dues Registry (2/3 Width) */}
            <div className="lg:col-span-2 bg-white border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                <Check size={16} className="text-slate-500" />
                <h3>Outstanding Dues Ledger</h3>
              </div>

              <div className="overflow-x-auto border border-slate-200">
                {loadingBills ? (
                  <div className="text-center p-8 text-slate-500 text-sm">
                    Loading unpaid obligations...
                  </div>
                ) : unpaidBills.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-sm">
                    No outstanding maintenance dues found.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Resident / Flat
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Bill Period
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Base Amount
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Late Fee Penalty
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Outstanding Total
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Status State
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
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
            </div>

          </div>
        )}

        {currentTab === 'operations' && (
          <div className="space-y-6">
            
            {/* Filed Service Requests */}
            <section className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <Activity size={16} className="text-slate-500" />
                <h3>Filed Service Requests Management</h3>
              </div>

              <div className="overflow-x-auto border border-slate-200">
                {loadingRequests ? (
                  <div className="text-center p-8 text-slate-500 text-sm">
                    Fetching service requests...
                  </div>
                ) : serviceRequests.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-sm">
                    No active service requests raised.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Resident Name
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Category
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Description
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Date Raised
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Status State
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {serviceRequests.map((item) => {
                        const statusColors = 
                          item.status === 'COMPLETED'
                            ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                            : item.status === 'APPROVED'
                            ? 'border-blue-200 text-blue-700 bg-blue-50'
                            : item.status === 'REJECTED'
                            ? 'border-red-200 text-red-700 bg-red-50'
                            : 'border-amber-200 text-amber-700 bg-amber-50';

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-4 text-slate-900 font-semibold text-sm">
                              {item.raisedBy ? `${item.raisedBy.firstName} ${item.raisedBy.lastName}` : 'Resident'}
                            </td>
                            <td className="p-4 text-slate-500 text-sm">
                              {item.category}
                            </td>
                            <td className="p-4 space-y-0.5">
                              <p className="text-slate-900 font-semibold text-sm">{item.title}</p>
                              <p className="text-slate-500 text-xs truncate max-w-xs">{item.description}</p>
                            </td>
                            <td className="p-4 text-slate-500 text-sm">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              <span className={`border px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColors}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                {item.status === 'PENDING' && (
                                  <>
                                    <button
                                      onClick={() => handleReviewServiceRequest(item.id, 'APPROVED')}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold py-1 px-3 rounded-md cursor-pointer focus:outline-none"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReviewServiceRequest(item.id, 'REJECTED')}
                                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold py-1 px-3 rounded-md cursor-pointer focus:outline-none"
                                    >
                                      Reject
                                    </button>
                                  </>
                                )}
                                {item.status !== 'PENDING' && (
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

            {/* Global Community Complaints */}
            <section className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                <CheckCircle2 size={16} className="text-slate-500" />
                <h3>Global Community Complaints</h3>
              </div>

              <div className="overflow-x-auto border border-slate-200">
                {loadingComplaints ? (
                  <div className="text-center p-8 text-slate-500 text-sm">
                    Fetching complaints...
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-sm">
                    No active community complaints filed.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Title / Details
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Attachment
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Filed By
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Assigned To
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
                          Status Badge
                        </th>
                        <th className="text-slate-500 text-[10px] font-bold uppercase tracking-wider p-4">
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
                            <td className="p-4">
                              <select
                                value={item.assignedToId || ''}
                                onChange={(e) => handleAssignComplaint(item.id, e.target.value)}
                                className="border border-slate-300 rounded p-1 text-xs bg-white cursor-pointer"
                              >
                                <option value="">-- Select Staff --</option>
                                {committeeMembers.map(member => {
                                  const targetUserId = member.user?.id || member.userId;
                                  const name = member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Staff';
                                  return (
                                    <option key={member.id} value={targetUserId}>
                                      {name} ({member.designation})
                                    </option>
                                  );
                                })}
                              </select>
                            </td>
                            <td className="p-4">
                              <span className={`border px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide uppercase ${statusColors}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="p-4">
                              {item.status !== 'RESOLVED' ? (
                                <button
                                  onClick={() => handleResolveComplaint(item.id)}
                                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1 px-2.5 rounded-md cursor-pointer focus:outline-none"
                                >
                                  Resolve
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
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
        )}

      </main>
    </div>
  );
}
