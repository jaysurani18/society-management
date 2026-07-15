import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { Shield, LogOut, UserPlus, Users, Home, FileText, CheckCircle2, Award, DollarSign, Activity, Lock, AlertCircle, Check, X, Camera, ArrowDown, Wrench } from 'lucide-react';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import DashboardLayout from '../../components/design-system/DashboardLayout.jsx';
import Card from '../../components/design-system/Card.jsx';
import Button from '../../components/design-system/Button.jsx';
import Badge from '../../components/design-system/Badge.jsx';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const triggerConfirm = (title, message, onConfirm, type = 'default', confirmLabel = 'Confirm') => {
    setModal({
      isOpen: true,
      title,
      message,
      confirmLabel,
      cancelLabel: 'Cancel',
      onConfirm: () => {
        onConfirm();
        closeModal();
      },
      isAlert: false,
      type
    });
  };

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
  
  // Tab State mapped to URL pathing
  const location = useLocation();
  let currentTab = 'overview';
  if (location.pathname.includes('/admin/directory')) currentTab = 'directory';
  else if (location.pathname.includes('/admin/finance')) currentTab = 'finance';
  else if (location.pathname.includes('/admin/operations')) currentTab = 'operations';
  else if (location.pathname.includes('/admin/analytics')) currentTab = 'analytics';
  else if (location.pathname.includes('/admin/notices')) currentTab = 'notices';
  else if (location.pathname.includes('/admin/logs')) currentTab = 'logs';

  // Lightbox active state
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  // Helper to format event descriptions nicely (not raw JSON)
  const formatEventDetails = (log) => {
    if (!log.details) return 'No details provided.';
    try {
      const data = JSON.parse(log.details);
      if (data.message) {
        if (data.email) return `${data.message} (${data.email})`;
        return data.message;
      }
      const keys = Object.keys(data);
      if (keys.length > 0) {
        return keys.map(k => `${k}: ${JSON.stringify(data[k])}`).join(', ');
      }
      return log.details;
    } catch (e) {
      return log.details;
    }
  };

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
  const [notices, setNotices] = useState([]);
  const [loadingNotices, setLoadingNotices] = useState(false);

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

  // Resident Directory Search, Filter, Pagination
  const [dirPage, setDirPage] = useState(1);
  const [dirSearch, setDirSearch] = useState('');
  const [dirStatus, setDirStatus] = useState('');
  const [dirTotalPages, setDirTotalPages] = useState(1);

  // Audit Logs Pagination
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotalPages, setAuditTotalPages] = useState(1);

  // Editing Resident Profile
  const [editingResident, setEditingResident] = useState(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFlatId, setEditFlatId] = useState('');
  const [editStatus, setEditStatus] = useState('OWNER');
  const [updatingResident, setUpdatingResident] = useState(false);

  // Editing Committee Profile
  const [editingCommittee, setEditingCommittee] = useState(null);
  const [editDesignation, setEditDesignation] = useState('');
  const [updatingCommittee, setUpdatingCommittee] = useState(false);

  // Reports & Analytics States
  const [financeReport, setFinanceReport] = useState([]);
  const [operationsReport, setOperationsReport] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);

  // Temporary password reset alert state
  const [tempPasswordMsg, setTempPasswordMsg] = useState('');

  // Fetch residents list dynamically (Search, Filter, Paginate)
  const fetchResidents = async () => {
    setLoading(true);
    try {
      const residentsRes = await api.get(`/residents?page=${dirPage}&limit=5&search=${dirSearch}&status=${dirStatus}`);
      const data = residentsRes.data?.data || residentsRes.data || {};
      const residentsList = data.residents || [];
      setResidents(residentsList);
      setTotalCount(data.total || residentsList.length);
      setDirTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to load residents:', err);
      setError(err.response?.data?.message || 'Failed to load residents.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch registered flat units (for selections and listing)
  const fetchFlats = async () => {
    try {
      const flatsRes = await api.get('/flats');
      const flatsList = flatsRes.data?.data?.flats || flatsRes.data?.flats || flatsRes.data?.data || flatsRes.data || [];
      const validFlats = Array.isArray(flatsList) ? flatsList : [];
      setFlats(validFlats);
      if (validFlats.length > 0 && !flatId) {
        setFlatId(validFlats[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch flats list:', err);
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

  // Fetch system audit logs paginated
  const fetchAuditLogs = async () => {
    setLoadingAudits(true);
    try {
      const res = await api.get(`/audit-logs?page=${auditPage}&limit=10`);
      const data = res.data?.data || res.data || {};
      const logs = data.logs || [];
      setAuditLogs(logs);
      setAuditTotalPages(data.totalPages || 1);
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

  // Fetch analytical reports data
  const fetchReportsData = async () => {
    setLoadingReports(true);
    try {
      const [financeRes, opsRes] = await Promise.all([
        api.get('/reports/finance'),
        api.get('/reports/operations'),
      ]);
      const finData = financeRes.data?.data?.report || financeRes.data?.report || financeRes.data?.data || [];
      const opsData = opsRes.data?.data?.report || opsRes.data?.report || opsRes.data?.data || null;
      setFinanceReport(Array.isArray(finData) ? finData : []);
      setOperationsReport(opsData);
    } catch (err) {
      console.error('Failed to load analytical reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Trigger metrics and queries on mount
  useEffect(() => {
    fetchFlats();
    fetchComplaints();
    fetchCommitteeMembers();
    fetchMetrics();
    fetchServiceRequests();
    fetchUnpaidBills();
    fetchNotices();
  }, []);

  // Fetch residents when page/search/status filters update
  useEffect(() => {
    fetchResidents();
  }, [dirPage, dirSearch, dirStatus]);

  // Fetch audit logs when page updates
  useEffect(() => {
    fetchAuditLogs();
  }, [auditPage]);

  // Fetch reports when switching to analytics tab
  useEffect(() => {
    if (currentTab === 'analytics') {
      fetchReportsData();
    }
  }, [currentTab]);

  // Modal Editing Setters
  const handleEditResident = (resProfile) => {
    setEditingResident(resProfile);
    setEditFirstName(resProfile.user.firstName || '');
    setEditLastName(resProfile.user.lastName || '');
    setEditPhone(resProfile.user.phone || '');
    setEditFlatId(resProfile.flatId || '');
    setEditStatus(resProfile.status || 'OWNER');
  };

  const handleUpdateResident = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setUpdatingResident(true);
    try {
      const res = await api.put(`/residents/${editingResident.id}`, {
        firstName: editFirstName.trim(),
        lastName: editLastName.trim(),
        phone: editPhone.trim(),
        flatId: editFlatId,
        status: editStatus,
      });

      if (res.data?.status === 'success' || res.status === 200) {
        setSuccessMsg('Resident details updated successfully!');
        setEditingResident(null);
        await fetchResidents();
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to update resident details:', err);
      setError(err.response?.data?.message || 'Failed to update resident.');
    } finally {
      setUpdatingResident(false);
    }
  };

  const handleEditCommittee = (commProfile) => {
    setEditingCommittee(commProfile);
    setEditDesignation(commProfile.designation || '');
  };

  const handleUpdateCommittee = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setUpdatingCommittee(true);
    try {
      const res = await api.patch(`/committee/${editingCommittee.id}`, {
        responsibility: editDesignation.trim(),
      });

      if (res.data?.status === 'success' || res.status === 200) {
        setSuccessMsg('Committee member responsibility updated successfully!');
        setEditingCommittee(null);
        await fetchCommitteeMembers();
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to update committee member details:', err);
      setError(err.response?.data?.message || 'Failed to update designation.');
    } finally {
      setUpdatingCommittee(false);
    }
  };

  const handleAddLateFee = async (billId) => {
    const penaltyAmount = window.prompt('Enter late penalty fee amount to append (₹):');
    if (penaltyAmount === null) return;
    const penalty = parseFloat(penaltyAmount);
    if (isNaN(penalty) || penalty <= 0) {
      triggerAlert('Invalid Amount', 'Please enter a valid positive penalty fee amount.', 'warning');
      return;
    }

    setError('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/bills/${billId}/penalty`, {
        penaltyAmount: penalty,
      });
      if (res.data?.status === 'success' || res.status === 200) {
        setSuccessMsg(`Late fee penalty of ₹${penalty.toFixed(2)} added successfully.`);
        await fetchUnpaidBills();
        await fetchMetrics();
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to assign penalty fee:', err);
      setError(err.response?.data?.message || 'Failed to assign penalty fee.');
    }
  };

  const handleAdminResetPassword = (resident) => {
    const tempPass = `TempReset@${Math.floor(1000 + Math.random() * 9000)}`;
    triggerConfirm(
      'Reset Resident Password',
      `Reset password for resident ${resident.user.firstName} ${resident.user.lastName}? A temporary password will be generated.`,
      async () => {
        setError('');
        setSuccessMsg('');
        setTempPasswordMsg('');
        try {
          const res = await api.post(`/users/${resident.user.id}/reset-password`, {
            newPassword: tempPass,
          });

          if (res.data?.status === 'success' || res.status === 200) {
            setTempPasswordMsg(`Password reset successful!\n\nTemporary Password: ${tempPass}\n\nPlease copy and share this password with the resident.`);
            await fetchAuditLogs();
          }
        } catch (err) {
          console.error('Failed to reset resident password:', err);
          setError(err.response?.data?.message || 'Failed to reset password.');
        }
      },
      'warning',
      'Reset Password'
    );
  };

  // Dummy placeholder function to fit code layout

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
        await fetchResidents();
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
  const handleDeactivate = (id) => {
    triggerConfirm(
      'Deactivate Resident Profile',
      'Are you sure you want to deactivate this resident profile? They will no longer have access to their personal ledger dashboard.',
      async () => {
        setError('');
        setSuccessMsg('');
        try {
          const response = await api.delete(`/residents/${id}`);
          if (response.status === 200 || response.data?.status === 'success') {
            setSuccessMsg('Resident profile deactivated successfully.');
            await fetchResidents();
            await fetchAuditLogs();
            await fetchMetrics();
          }
        } catch (err) {
          console.error('Deactivation error:', err);
          setError(err.response?.data?.message || 'Failed to deactivate resident.');
        }
      },
      'danger',
      'Deactivate'
    );
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
        await fetchNotices();
        await fetchAuditLogs();
      }
    } catch (err) {
      console.error('Failed to publish notice:', err);
      setNoticeError(err.response?.data?.message || 'Failed to publish society notice.');
    } finally {
      setPublishingNotice(false);
    }
  };

  const fetchNotices = async () => {
    setLoadingNotices(true);
    try {
      const res = await api.get('/announcements');
      const list = res.data?.data?.announcements || res.data?.data || [];
      setNotices(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoadingNotices(false);
    }
  };

  const handleDeleteNotice = (id) => {
    triggerConfirm(
      'Delete Notice',
      'Are you sure you want to delete this notice/announcement? This action is permanent.',
      async () => {
        try {
          const res = await api.delete(`/announcements/${id}`);
          if (res.status === 200 || res.data?.status === 'success') {
            triggerAlert('Notice Deleted', 'The announcement notice was deleted successfully.', 'success');
            await fetchNotices();
            await fetchAuditLogs();
          }
        } catch (err) {
          console.error('Failed to delete notice:', err);
          triggerAlert('Delete Failed', err.response?.data?.message || 'Failed to delete notice.', 'danger');
        }
      },
      'danger',
      'Delete Notice'
    );
  };

  // Resolve Complaint
  const handleResolveComplaint = (id) => {
    triggerConfirm(
      'Resolve Complaint',
      'Mark this community complaint as RESOLVED?',
      async () => {
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
      },
      'success',
      'Mark Resolved'
    );
  };

  // Promoting User to Committee
  const handlePromote = (userId, responsibility) => {
    if (!responsibility) {
      triggerAlert('Designation Required', 'Please select a designation responsibility.', 'warning');
      return;
    }
    triggerConfirm(
      'Promote to Committee',
      `Promote this resident to the Committee with responsibility: "${responsibility}"?`,
      async () => {
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
            await fetchResidents();
            await fetchCommitteeMembers();
            await fetchAuditLogs();
            await fetchMetrics();
          }
        } catch (err) {
          console.error('Promotion failed:', err);
          setError(err.response?.data?.message || 'Failed to promote resident to committee.');
        }
      },
      'default',
      'Promote Resident'
    );
  };

  // Demoting Committee Member
  const handleDemote = (committeeProfileId) => {
    triggerConfirm(
      'Demote Committee Member',
      'Are you sure you want to demote this committee member back to standard resident?',
      async () => {
        setError('');
        setSuccessMsg('');
        try {
          const res = await api.delete(`/committee/${committeeProfileId}`);
          if (res.status === 200 || res.data?.status === 'success') {
            setSuccessMsg('Committee member demoted back to standard resident.');
            await fetchResidents();
            await fetchCommitteeMembers();
            await fetchAuditLogs();
            await fetchMetrics();
          }
        } catch (err) {
          console.error('Demotion failed:', err);
          setError(err.response?.data?.message || 'Failed to demote committee member.');
        }
      },
      'danger',
      'Demote Member'
    );
  };

  // Review (Approve/Reject) Service Request
  const handleReviewServiceRequest = (id, status) => {
    triggerConfirm(
      'Review Service Request',
      `Mark this service request as ${status}?`,
      async () => {
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
      },
      status === 'REJECTED' ? 'danger' : 'success',
      status === 'REJECTED' ? 'Reject' : 'Approve'
    );
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

      if (res.data?.success || res.data?.status === 'success' || res.status === 200 || res.status === 201) {
        setSuccessMsg(res.data?.message || `Batch billing generation complete. Invoiced active flat units.`);
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
  const handleRecordCashSettlement = (bill) => {
    const totalAmount = bill.amount + bill.penalty - bill.discount;
    triggerConfirm(
      'Confirm Cash Settlement',
      `Record manual cash settlement of ₹${totalAmount.toFixed(2)} for flat unit ${bill.flat?.block} - ${bill.flat?.number}?`,
      async () => {
        setError('');
        setSuccessMsg('');
        try {
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
            await fetchUnpaidBills(); 
            await fetchMetrics();
            await fetchAuditLogs();
          }
        } catch (err) {
          console.error('Reconciliation settlement failed:', err);
          setError(err.response?.data?.message || 'Failed to process cash settlement.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      },
      'warning',
      'Record Cash'
    );
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
        
        await fetchFlats();
        await fetchResidents(); 
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
  const handleDeleteFlat = (id) => {
    triggerConfirm(
      'Delete Flat Unit',
      'Are you sure you want to delete this flat unit? All associated historical billing statements and residency relations will be unlinked.',
      async () => {
        setError('');
        setSuccessMsg('');
        try {
          const res = await api.delete(`/flats/${id}`);
          if (res.status === 200 || res.data?.status === 'success') {
            setSuccessMsg(res.data?.message || 'Flat unit deleted successfully.');
            await fetchFlats();
            await fetchResidents(); 
            await fetchAuditLogs();
            await fetchMetrics();
          }
        } catch (err) {
          console.error('Failed to delete flat:', err);
          setError(err.response?.data?.message || 'Failed to delete flat unit.');
        }
      },
      'danger',
      'Delete Flat'
    );
  };

  // Helper to build local or external image source URL
  const getImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('https://')) return path;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${base}/${path.replace(/^\/+/, '')}`;
  };

  const getSectionTitle = () => {
    switch (currentTab) {
      case 'directory': return 'Resident Directory & Committee';
      case 'finance': return 'Financial Automations';
      case 'operations': return 'Service Requests & Complaints';
      case 'analytics': return 'Reports & Analytics';
      case 'notices': return 'Society Notices';
      case 'logs': return 'System Audit Logs';
      default: return 'Overview';
    }
  };

  return (
    <DashboardLayout
      activePath={location.pathname === '/admin/overview' ? '/admin/dashboard' : location.pathname}
      role="ADMIN"
      currentSectionName={getSectionTitle()}
    >
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

      {/* Tab Contents */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          {/* Premium Welcome & Society Quick Launch Guide Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-lg p-6 shadow-sm border border-slate-800 space-y-4">
            <div className="space-y-1 text-left">
              <h2 className="text-lg font-bold tracking-tight">Cooperative Society Management Workspace</h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Welcome to your central administration hub. Below is your command center to access and control the physical, financial, operational, and announcement notice boards of the residential community.
              </p>
            </div>
          </div>

          {/* Quick Action Command Center Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
            
            {/* Card 1: Resident Registry */}
            <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <Users size={16} />
                  <h3>Resident Directory & Committee</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Onboard new residents, allocate flats, manage ownership profiles, assign committee designation roles, reset passwords, or deactivate logins.
                </p>
              </div>
              <Button onClick={() => navigate('/admin/directory')} variant="primary" className="w-full">
                Open Resident Registry
              </Button>
            </div>

            {/* Card 2: Financial Automations */}
            <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <DollarSign size={16} />
                  <h3>Financial Automations & Invoicing</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Generate community-wide monthly maintenance statement invoices, add late fee penalties, reconcile outstanding dues, and print ledger receipts.
                </p>
              </div>
              <Button onClick={() => navigate('/admin/finance')} variant="primary" className="w-full">
                Open Billing Center
              </Button>
            </div>

            {/* Card 3: Operations & Tickets */}
            <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <Wrench size={16} />
                  <h3>Service Requests & Complaints</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Oversee filed facility maintenance tickets, approve or reject plumbing/electrical requests, resolve resident complaints, and assign personnel.
                </p>
              </div>
              <Button onClick={() => navigate('/admin/operations')} variant="primary" className="w-full">
                Open Service Desk
              </Button>
            </div>

            {/* Card 4: Notices Board */}
            <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <FileText size={16} />
                  <h3>Society Notices & Bulletins</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Publish official announcements and notice circulars, view active bulletin timelines, and delete expired notices broadcasted to residents.
                </p>
              </div>
              <Button onClick={() => navigate('/admin/notices')} variant="primary" className="w-full">
                Open Notice Board
              </Button>
            </div>

            {/* Card 5: System Audit Logs */}
            <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <Lock size={16} />
                  <h3>System Audit Timeline</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Inspect the append-only audit trail logs capturing operator actions, logins, database changes, and system-wide administrative event histories.
                </p>
              </div>
              <Button onClick={() => navigate('/admin/logs')} variant="primary" className="w-full">
                Open Audit Registry
              </Button>
            </div>

            {/* Card 6: Performance Reports */}
            <div className="bg-white border border-slate-200 p-6 rounded-brand-lg flex flex-col justify-between space-y-4 shadow-brand-low">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                  <Activity size={16} />
                  <h3>Reports & Performance Analytics</h3>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-sans">
                  Review aggregate society performance analytics, monthly invoicing collections vs. outstanding arrears, and average complaint resolution speeds.
                </p>
              </div>
              <Button onClick={() => navigate('/admin/analytics')} variant="primary" className="w-full">
                Open Analytics Reports
              </Button>
            </div>

          </div>
        </div>
      )}

      {currentTab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start text-left">
          {/* Left Column: Publish Notice Form */}
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
                  rows={6}
                  disabled={publishingNotice}
                  className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={publishingNotice}
                className="bg-brand-navy hover:bg-brand-navy-hover active:bg-brand-navy-active text-white text-xs font-semibold py-2 px-4 rounded-md w-full cursor-pointer disabled:opacity-50"
              >
                {publishingNotice ? 'Publishing...' : 'Publish Notice'}
              </button>
            </form>
          </div>

          {/* Right Column: Active bulletins registry */}
          <div className="lg:col-span-2 bg-white border border-slate-200 p-6 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                <FileText size={16} />
                <h3>Active Notice Bulletin Registry</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium">Manage and delete posted notice letters.</p>
            </div>

            {loadingNotices ? (
              <p className="text-xs text-slate-500 italic">Syncing notice board...</p>
            ) : notices.length === 0 ? (
              <p className="text-xs text-slate-400 italic p-8 border border-dashed border-slate-200 text-center bg-slate-50">
                No notice letters currently broadcasted.
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {notices.map((n) => (
                  <div key={n.id} className="p-4 border border-slate-200 bg-slate-50/50 flex flex-col justify-between space-y-2 rounded-brand-md">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNotice(n.id)}
                        className="text-red-500 hover:text-red-700 text-[10px] font-bold border border-red-200 hover:bg-red-50 px-2 py-1 rounded cursor-pointer"
                      >
                        Delete Notice
                      </button>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">{n.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === 'logs' && (
        <div className="bg-white border border-slate-200 p-6 space-y-4 text-left">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <Lock size={16} className="text-slate-500" />
            <h3>System Audit & Activity Logs</h3>
          </div>

          {/* Scrollable container with stationary header */}
          <div className="border border-slate-200 rounded-md overflow-hidden">
            {loadingAudits ? (
              <div className="text-center p-12 text-slate-500 text-sm">
                Fetching audit trails...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center p-12 text-slate-400 text-sm">
                No system audit records found.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
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
                        <p className="text-slate-400 text-[10px]" title={log.details}>
                          {formatEventDetails(log)}
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
          {auditTotalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>Page {auditPage} of {auditTotalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                  disabled={auditPage === 1}
                  className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer focus:outline-none"
                >
                  Previous
                </button>
                <button
                  onClick={() => setAuditPage(prev => Math.min(prev + 1, auditTotalPages))}
                  disabled={auditPage === auditTotalPages}
                  className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer focus:outline-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

        {currentTab === 'directory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column Workspace: Control Forms & Asset Status (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              
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

              {/* Flat Units Registry Listing */}
              <div className="bg-white border border-slate-200 p-6 space-y-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <Home size={16} className="text-slate-500" />
                    <h3>Flat Properties Asset List</h3>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Delete vacant flats that are no longer occupied.</p>
                </div>

                <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
                  {flats.map((flat) => {
                    const resident = residents.find(r => r.flatId === flat.id);
                    const isOccupied = !!resident && resident.status !== 'LEFT';
                    return (
                      <div key={flat.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <span className="font-semibold text-slate-800">{flat.block} - {flat.number}</span>
                        <div className="flex gap-2 items-center">
                          <span className={isOccupied ? 'text-green-600 font-semibold text-[10px]' : 'text-slate-400 italic text-[10px]'}>
                            {isOccupied ? 'Occupied' : 'Vacant'}
                          </span>
                          {!isOccupied && (
                            <button
                              onClick={() => handleDeleteFlat(flat.id)}
                              className="text-red-600 hover:text-red-800 font-semibold cursor-pointer focus:outline-none hover:underline ml-1 text-[10px]"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {flats.length === 0 && (
                    <p className="p-4 text-center text-slate-400 italic text-xs">No registered properties.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column Workspace: Master System Registries (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-6">

            {/* Active Directory & Committee Tables (Full Width) */}
              
              {/* Active Occupancy Directory */}
              <section className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <Users size={16} />
                    <h3>Active Occupancy Directory</h3>
                  </div>
                  
                  {/* Search and Filters */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dirSearch}
                      onChange={(e) => { setDirSearch(e.target.value); setDirPage(1); }}
                      placeholder="Search name/flat..."
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs focus:outline-none focus:border-indigo-600 bg-white text-slate-950 max-w-[150px]"
                    />
                    <select
                      value={dirStatus}
                      onChange={(e) => { setDirStatus(e.target.value); setDirPage(1); }}
                      className="border border-slate-300 rounded px-2 py-1 text-xs bg-white text-slate-950 cursor-pointer"
                    >
                      <option value="">All Statuses</option>
                      <option value="OWNER">Owner</option>
                      <option value="TENANT">Tenant</option>
                      <option value="LEFT">Left</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center p-8 text-slate-500 text-sm">
                      Fetching directory records...
                    </div>
                  ) : residents.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 text-sm">
                      No matching resident records found.
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
                        {residents.map((resident) => {
                          const flatLabel = resident.flat ? `${resident.flat.block} - ${resident.flat.number}` : 'No flat';
                          const isLeft = resident.status === 'LEFT';
                          const isActive = !isLeft && resident.user?.isActive;
                          const statusColors = 
                            resident.status === 'OWNER'
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                              : resident.status === 'TENANT'
                              ? 'border-blue-200 text-blue-700 bg-blue-50'
                              : 'border-red-200 text-red-700 bg-red-50';

                          return (
                            <tr key={resident.id} className="hover:bg-slate-50/50">
                              <td className="p-4 text-slate-900 font-semibold text-sm">
                                {resident.user ? `${resident.user.firstName} ${resident.user.lastName}` : 'Profile Error'}
                              </td>
                              <td className="p-4 space-y-0.5 text-xs">
                                <p className="text-slate-900">{resident.user?.email}</p>
                                <p className="text-slate-400 font-mono">{resident.user?.phone || 'No phone'}</p>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1 text-slate-700 text-sm">
                                  <Home size={13} className="text-slate-400" />
                                  <span>{flatLabel}</span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`border px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColors}`}>
                                  {resident.status}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`text-xs font-semibold ${isActive ? 'text-green-600' : 'text-red-500'}`}>
                                  {isActive ? 'Active' : 'Locked'}
                                </span>
                              </td>
                              <td className="p-4 text-xs font-semibold">
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleEditResident(resident)}
                                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer focus:outline-none"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleAdminResetPassword(resident)}
                                    className="text-amber-600 hover:text-amber-800 cursor-pointer focus:outline-none"
                                  >
                                    Reset Pass
                                  </button>
                                  {isActive && (
                                    <button
                                      onClick={() => handleDeactivate(resident.id)}
                                      className="text-red-600 hover:text-red-800 cursor-pointer focus:outline-none"
                                    >
                                      Deactivate
                                    </button>
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

                {/* Directory Pagination Controls */}
                {dirTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <span>Page {dirPage} of {dirTotalPages}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDirPage(prev => Math.max(prev - 1, 1))}
                        disabled={dirPage === 1}
                        className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer focus:outline-none"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setDirPage(prev => Math.min(prev + 1, dirTotalPages))}
                        disabled={dirPage === dirTotalPages}
                        className="px-2.5 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer focus:outline-none"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* Committee Allocation & Designations Management Grid */}
              <section className="bg-white border border-slate-200 p-6 flex flex-col space-y-4">
                <div className="flex flex-wrap gap-4 items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <Award size={16} className="text-slate-500" />
                    <h3>Committee Allocation & Designations</h3>
                  </div>

                  {/* Promote Resident Inline Selector */}
                  <div className="flex gap-2 items-center">
                    <select
                      id="promote-user-select"
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-950 cursor-pointer focus:outline-none"
                    >
                      <option value="">-- Promote Resident --</option>
                      {residents.filter(r => r.user && r.user.role !== 'ADMIN' && r.user.role !== 'COMMITTEE' && r.status !== 'LEFT').map(r => (
                        <option key={r.id} value={r.user.id}>
                          {r.user.firstName} {r.user.lastName} ({r.flat ? `${r.flat.block}-${r.flat.number}` : 'No Flat'})
                        </option>
                      ))}
                    </select>
                    <select
                      id="promote-role-select"
                      className="border border-slate-300 rounded px-2.5 py-1 text-xs bg-white text-slate-950 cursor-pointer focus:outline-none"
                    >
                      <option value="President">President</option>
                      <option value="Treasurer">Treasurer</option>
                      <option value="Secretary">Secretary</option>
                      <option value="Secretary General">Secretary General</option>
                      <option value="Management">Management</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                    </select>
                    <button
                      onClick={() => {
                        const userSel = document.getElementById('promote-user-select')?.value;
                        const roleSel = document.getElementById('promote-role-select')?.value;
                        if (!userSel) {
                          triggerAlert('Selection Required', 'Please select a resident to promote to the committee first.', 'warning');
                          return;
                        }
                        handlePromote(userSel, roleSel);
                        if (document.getElementById('promote-user-select')) {
                          document.getElementById('promote-user-select').value = '';
                        }
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-1 rounded cursor-pointer"
                    >
                      Promote
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  {loadingCommittee ? (
                    <div className="text-center p-8 text-slate-500 text-sm">
                      Fetching roles directories...
                    </div>
                  ) : committeeMembers.length === 0 ? (
                    <div className="text-center p-8 text-slate-400 text-sm">
                      No active committee members designated.
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
                        {committeeMembers.map((member) => {
                          const userObj = member.user || {};
                          return (
                            <tr key={member.id} className="hover:bg-slate-50/50">
                              <td className="p-4 text-slate-900 font-semibold text-sm">
                                {userObj.firstName} {userObj.lastName}
                              </td>
                              <td className="p-4 text-slate-600 text-sm">
                                {userObj.email}
                              </td>
                              <td className="p-4">
                                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 border rounded bg-emerald-50 border-emerald-200 text-emerald-700">
                                  {userObj.role || 'COMMITTEE'}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="inline-block border border-slate-200 bg-slate-50 text-slate-700 text-xs px-2 py-0.5 rounded font-medium">
                                  {member.designation}
                                </span>
                              </td>
                              <td className="p-4 text-xs font-semibold">
                                <div className="flex gap-3">
                                  <button
                                    onClick={() => handleEditCommittee(member)}
                                    className="text-indigo-600 hover:text-indigo-800 cursor-pointer focus:outline-none"
                                  >
                                    Edit Designation
                                  </button>
                                  <button
                                    onClick={() => handleDemote(member.id)}
                                    className="text-red-600 hover:text-red-800 cursor-pointer focus:outline-none"
                                  >
                                    Demote to Resident
                                  </button>
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
            </div>
          </div>
        )}

        {currentTab === 'finance' && (
          <div className="space-y-8">
            
            {/* Financial Automations */}
            <div className="bg-white border border-slate-200 p-6 space-y-4">
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
 
             {/* Outstanding Dues Ledger (Full Width) */}
             <div className="bg-white border border-slate-200 p-6 space-y-4">
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
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleRecordCashSettlement(b)}
                                  className="bg-brand-navy hover:bg-brand-navy-hover active:bg-brand-navy-active text-white text-xs font-semibold py-1 px-3 rounded-md focus:outline-none cursor-pointer"
                                >
                                  Record Cash Settlement
                                </button>
                                <button
                                  onClick={() => handleAddLateFee(b.id)}
                                  className="border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold py-1 px-3 rounded-md focus:outline-none cursor-pointer"
                                >
                                  Add Late Fee
                                </button>
                              </div>
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
                                  className="bg-brand-navy hover:bg-brand-navy-hover active:bg-brand-navy-active text-white text-xs font-semibold py-1 px-2.5 rounded-md cursor-pointer focus:outline-none"
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

        {currentTab === 'analytics' && (
          <div className="bg-white border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800 font-semibold text-sm">
              <Activity size={16} className="text-indigo-600" />
              <h3>Society Performance Analytics & Operational Speeds</h3>
            </div>

            {loadingReports ? (
              <div className="text-center p-12 text-slate-500 text-sm">
                Fetching analytical performance reports...
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Financial Ledger Arrears Performance */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Financial Invoicing & Arrears Performance</h4>
                  <div className="border border-slate-200 rounded-md overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-3 font-semibold text-slate-500">Period</th>
                          <th className="p-3 font-semibold text-slate-500">Invoiced</th>
                          <th className="p-3 font-semibold text-slate-500">Collected</th>
                          <th className="p-3 font-semibold text-slate-500">Penalties</th>
                          <th className="p-3 font-semibold text-slate-500">Arrears</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {financeReport.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-slate-400 italic">No financial report records.</td>
                          </tr>
                        ) : (
                          financeReport.map((f, i) => (
                            <tr key={i} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold">{f.billingMonth}</td>
                              <td className="p-3 font-mono">₹{f.totalInvoiced.toFixed(2)}</td>
                              <td className="p-3 font-mono text-emerald-700 font-semibold">₹{f.totalCollected.toFixed(2)}</td>
                              <td className="p-3 font-mono text-red-600">₹{f.totalPenalties.toFixed(2)}</td>
                              <td className="p-3 font-mono text-amber-600">₹{f.outstandingArrears.toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operations Resolution Throughput */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Operations Resolution & Speeds</h4>
                  {operationsReport ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="border border-slate-200 p-3 text-center rounded-md">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Raised</p>
                          <p className="text-lg font-bold text-slate-900">{operationsReport.totalComplaintsRaised}</p>
                        </div>
                        <div className="border border-slate-200 p-3 text-center rounded-md">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Total Resolved</p>
                          <p className="text-lg font-bold text-emerald-700">{operationsReport.totalResolved}</p>
                        </div>
                        <div className="border border-slate-200 p-3 text-center rounded-md">
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Speed (Hours)</p>
                          <p className="text-lg font-bold text-indigo-600 font-mono">{operationsReport.averageResolutionSpeedHours || 0}h</p>
                        </div>
                      </div>

                      {/* Category break down */}
                      <div className="border border-slate-200 rounded-md p-4 space-y-3">
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Open Complaints Breakdown by Category</h5>
                        <div className="space-y-2">
                          {Object.keys(operationsReport.openComplaintsBreakdown || {}).length === 0 ? (
                            <p className="text-slate-400 text-xs italic">No open complaints.</p>
                          ) : (
                            Object.keys(operationsReport.openComplaintsBreakdown).map((cat, i) => {
                              const count = operationsReport.openComplaintsBreakdown[cat];
                              return (
                                <div key={i} className="flex justify-between items-center text-xs">
                                  <span className="font-medium text-slate-700">{cat}</span>
                                  <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-full">{count}</span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs italic">No operational report data.</p>
                  )}
                </div>

              </div>
            )}
          </div>
        )}

      {/* Resident Profile Editor Modal */}
      {editingResident && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-slate-900 font-bold text-sm">Edit Resident Profile Details</h3>
              <button
                type="button"
                onClick={() => setEditingResident(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateResident} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">First Name</label>
                  <input
                    type="text"
                    value={editFirstName}
                    onChange={(e) => setEditFirstName(e.target.value)}
                    required
                    className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Last Name</label>
                  <input
                    type="text"
                    value={editLastName}
                    onChange={(e) => setEditLastName(e.target.value)}
                    required
                    className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Phone Number</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  required
                  className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Property Flat</label>
                  <select
                    value={editFlatId}
                    onChange={(e) => setEditFlatId(e.target.value)}
                    required
                    className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white cursor-pointer"
                  >
                    {flats.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.block} - {f.number}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-slate-500">Resident Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    required
                    className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white cursor-pointer"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="TENANT">Tenant</option>
                    <option value="LEFT">Left</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingResident(null)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold hover:bg-slate-50 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingResident}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50 cursor-pointer"
                >
                  {updatingResident ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Committee Designation Editor Modal */}
      {editingCommittee && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-slate-900 font-bold text-sm">Edit Committee Responsibility</h3>
              <button
                type="button"
                onClick={() => setEditingCommittee(null)}
                className="text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateCommittee} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500">Designation Responsibility</label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  required
                  placeholder="e.g. Secretary, Treasurer"
                  className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
                />
              </div>

              <div className="flex gap-2 justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingCommittee(null)}
                  className="px-4 py-2 border border-slate-200 text-xs font-semibold hover:bg-slate-50 rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingCommittee}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50 cursor-pointer"
                >
                  {updatingCommittee ? 'Saving...' : 'Save Responsibility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Temporary Password Alert Modal */}
      {tempPasswordMsg && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-emerald-700 font-bold text-sm flex items-center gap-1.5">
                <Check size={16} />
                Temporary Password Generated
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Copy and share the following temporary credentials with the resident. They should immediately login and update their password under Account Settings.
            </p>
            <p className="text-xs text-slate-900 font-mono font-bold bg-slate-50 border border-slate-200 p-4 rounded text-center select-all">
              {tempPasswordMsg}
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setTempPasswordMsg('')}
                className="bg-brand-navy hover:bg-brand-navy-hover active:bg-brand-navy-active text-white text-xs font-semibold px-4 py-2 rounded-md cursor-pointer focus:outline-none"
              >
                Close & Done
              </button>
            </div>
          </div>
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
