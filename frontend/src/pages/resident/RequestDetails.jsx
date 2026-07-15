import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { MessageSquare, ArrowLeft, Send, Wrench, ShieldCheck } from 'lucide-react';
import DashboardLayout from '../../components/design-system/DashboardLayout.jsx';
import Card from '../../components/design-system/Card.jsx';
import Button from '../../components/design-system/Button.jsx';
import Badge from '../../components/design-system/Badge.jsx';

export default function RequestDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment Form States
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Feedback Form States
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Fetch single service request detail
  const fetchRequestDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/service-requests/${id}`);
      const ticketInfo = res.data?.data?.serviceRequest || res.data?.serviceRequest || res.data?.data || res.data || {};
      setTicket(ticketInfo);
    } catch (err) {
      console.error('Service request loading error:', err);
      setError(err.response?.data?.message || 'Failed to retrieve service request details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  // Submit comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    setError('');

    if (!commentText.trim()) {
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await api.post(`/service-requests/${id}/comments`, {
        content: commentText.trim(),
      });

      if (res.data?.status === 'success' || res.status === 201) {
        setCommentText('');
        await fetchRequestDetails();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError(err.response?.data?.message || 'Failed to submit comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Submit feedback
  const handlePostFeedback = async (e) => {
    e.preventDefault();
    setError('');

    if (!feedbackText.trim()) {
      return;
    }

    setSubmittingFeedback(true);
    try {
      const res = await api.patch(`/service-requests/${id}/feedback`, {
        feedback: feedbackText.trim(),
      });

      if (res.data?.status === 'success' || res.status === 200) {
        setFeedbackText('');
        await fetchRequestDetails();
      }
    } catch (err) {
      console.error('Failed to post feedback:', err);
      setError(err.response?.data?.message || 'Failed to submit feedback.');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Back redirect based on user role
  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role === 'ADMIN') {
      navigate('/admin/operations');
    } else if (user.role === 'COMMITTEE') {
      navigate('/committee/tickets');
    } else {
      navigate('/resident/requests');
    }
  };

  const getBackLabel = () => {
    if (!user) return 'Back';
    if (user.role === 'ADMIN') return 'Back to Service Desk';
    if (user.role === 'COMMITTEE') return 'Back to Tickets & Complaints';
    return 'Back to Service Requests';
  };

  if (loading && !ticket) {
    return (
      <div className="min-h-screen bg-brand-cream/35 flex items-center justify-center p-6 text-slate-500 text-xs font-semibold font-mono">
        Loading service ticket timeline...
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-brand-cream/35 flex flex-col items-center justify-center p-6 space-y-4 text-slate-800 antialiased">
        <div className="bg-rose-50 border border-rose-100 text-brand-brick text-xs px-4 py-3 rounded-brand-md max-w-md text-left">
          <span className="font-bold font-mono text-[9px] uppercase tracking-wider block mb-0.5">Error Loading Timeline</span>
          <span>{error}</span>
        </div>
        <Button
          onClick={handleGoBack}
          variant="secondary"
          className="flex items-center gap-1.5"
        >
          <ArrowLeft size={14} /> {getBackLabel()}
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED': return 'approved';
      case 'APPROVED': return 'info';
      case 'REJECTED': return 'danger';
      case 'PENDING':
      default: return 'pending';
    }
  };

  const commentsList = ticket.comments || [];
  const activePath = user.role === 'COMMITTEE' ? '/committee/tickets' : '/resident/requests';

  return (
    <DashboardLayout
      activePath={activePath}
      role={user.role}
      currentSectionName="Service Ticket Timeline"
    >
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* Back Link & Meta Header */}
        <div className="bg-white border border-slate-200 p-4 rounded-brand-lg flex items-center justify-between shadow-brand-low">
          <Button
            onClick={handleGoBack}
            variant="secondary"
            className="flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            {getBackLabel()}
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium font-sans">Status State:</span>
            <Badge label={ticket.status} status={getStatusBadge(ticket.status)} />
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-brand-brick text-xs px-4 py-3 rounded-brand-md">
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider block mb-0.5">Operation Failed</span>
            <span>{error}</span>
          </div>
        )}

        {/* 1. Ticket Summary Card */}
        <Card
          title={ticket.title}
          subtitle={`Category: ${ticket.category} • Raised on ${new Date(ticket.createdAt).toLocaleDateString()}`}
          className="p-6 border border-slate-200 bg-white"
        >
          <div className="space-y-4 pt-2">
            <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>

            <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-400 font-mono">
              <p>
                Filed By: <span className="font-bold text-slate-750">{ticket.raisedBy ? `${ticket.raisedBy.firstName} ${ticket.raisedBy.lastName}` : 'Resident Member'}</span>
              </p>
              {ticket.assignedTo && (
                <p>
                  Assigned Operator: <span className="font-bold text-slate-750">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName} (Committee)</span>
                </p>
              )}
            </div>

            {ticket.feedback ? (
              <div className="mt-2 bg-emerald-50 border border-emerald-100 p-3.5 rounded-brand-md text-emerald-800 text-xs">
                <span className="font-bold font-mono text-[9px] uppercase tracking-wider block mb-0.5">Resident Feedback Submitted</span>
                <span>"{ticket.feedback}"</span>
              </div>
            ) : (
              ticket.status === 'COMPLETED' && user?.role === 'RESIDENT' && (
                <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Submit Your Service Feedback</h4>
                  <form onSubmit={handlePostFeedback} className="flex gap-2">
                    <input
                      type="text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your experience on this service job..."
                      required
                      disabled={submittingFeedback}
                      className="block w-full px-3.5 py-2 border border-slate-200 rounded-brand-md text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 text-slate-800"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submittingFeedback || !feedbackText.trim()}
                      className="px-4 py-2 font-bold focus:outline-none"
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit'}
                    </Button>
                  </form>
                </div>
              )
            )}
          </div>
        </Card>

        {/* 2. Message Timeline Dialogue */}
        <Card
          title="Timeline Dialogue"
          subtitle={`Ticket History Log (${commentsList.length})`}
          className="p-6 border border-slate-200 bg-white"
        >
          <div className="space-y-4 pt-2 divide-y divide-slate-100">
            {commentsList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 border border-dashed border-slate-200">
                No conversation logs or updates posted to this service ticket yet.
              </div>
            ) : (
              commentsList.map((comm, idx) => {
                const authorRole = comm.author?.role === 'COMMITTEE' ? 'Committee' : comm.author?.role === 'ADMIN' ? 'Admin' : 'Resident';
                const roleBadgeStatus = 
                  comm.author?.role === 'COMMITTEE' 
                    ? 'approved' 
                    : comm.author?.role === 'ADMIN'
                    ? 'info'
                    : 'warning';

                const authorNameLabel = comm.author?.id === user?.id ? `${comm.author.firstName} ${comm.author.lastName} (You)` : `${comm.author?.firstName} ${comm.author?.lastName || ''}`;

                return (
                  <div key={comm.id} className={`py-4 space-y-2 first:pt-0 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-slate-900 text-xs">
                          {authorNameLabel}
                        </span>
                        <Badge label={authorRole} status={roleBadgeStatus} />
                      </div>
                      <span>
                        {new Date(comm.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                      {comm.comment}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* 3. Send Message Form */}
        <Card
          title="Post Timeline Update"
          subtitle="Send Message to Thread"
          className="p-6 border border-slate-200 bg-white"
        >
          <form onSubmit={handlePostComment} className="space-y-4 pt-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your feedback details or service update here..."
              required
              rows={4}
              disabled={submittingComment}
              className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 text-slate-800 resize-none"
            />
            
            <div className="flex justify-end">
              <Button
                type="submit"
                variant="primary"
                disabled={submittingComment || !commentText.trim()}
                className="flex items-center gap-1.5"
                icon={<Send size={12} />}
              >
                {submittingComment ? 'Sending...' : 'Post Message'}
              </Button>
            </div>
          </form>
        </Card>

      </div>
    </DashboardLayout>
  );
}
