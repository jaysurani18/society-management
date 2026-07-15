import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { MessageSquare, ArrowLeft, Send } from 'lucide-react';
import DashboardLayout from '../../components/design-system/DashboardLayout.jsx';
import Card from '../../components/design-system/Card.jsx';
import Button from '../../components/design-system/Button.jsx';
import Badge from '../../components/design-system/Badge.jsx';

export default function ComplaintDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment input state
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch ticket details & comments
  const fetchComplaintDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/complaints/${id}`);
      const ticket = res.data?.data?.complaint || res.data?.complaint || res.data?.data || res.data || null;
      if (ticket) {
        setComplaint(ticket);
      } else {
        throw new Error('Response did not contain valid complaint data.');
      }
    } catch (err) {
      console.error('Complaint details loading error:', err);
      setError(err.response?.data?.message || 'Failed to retrieve complaint ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  // Handle posting a comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    setError('');

    if (!commentText.trim()) {
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await api.post(`/complaints/${id}/comments`, {
        comment: commentText.trim(),
      });

      if (res.data?.status === 'success' || res.status === 201) {
        setCommentText('');
        await fetchComplaintDetails();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      setError(err.response?.data?.message || 'Failed to add comment to thread.');
    } finally {
      setSubmittingComment(false);
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
      navigate('/resident/complaints');
    }
  };

  const getBackLabel = () => {
    if (!user) return 'Back';
    if (user.role === 'ADMIN') return 'Back to Service Desk';
    if (user.role === 'COMMITTEE') return 'Back to Tickets & Complaints';
    return 'Back to Complaints';
  };

  if (loading && !complaint) {
    return (
      <div className="min-h-screen bg-brand-cream/35 flex items-center justify-center p-6 text-slate-500 text-xs font-semibold font-mono">
        Loading ticket timeline details...
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="min-h-screen bg-brand-cream/35 flex flex-col items-center justify-center p-6 space-y-4 text-slate-800 antialiased">
        <div className="bg-rose-50 border border-rose-100 text-brand-brick text-xs px-4 py-3 rounded-brand-md max-w-md text-left">
          <span className="font-bold font-mono text-[9px] uppercase tracking-wider block mb-0.5">Error Loading Details</span>
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

  const getStatusState = (status) => {
    switch (status) {
      case 'RESOLVED': return 'approved';
      case 'ASSIGNED': return 'in_progress';
      case 'PENDING':
      default: return 'pending';
    }
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    return `${base}/${url.replace(/^\/+/, '')}`;
  };

  const activePath = 
    user.role === 'ADMIN'
      ? '/admin/operations'
      : user.role === 'COMMITTEE'
      ? '/committee/tickets'
      : '/resident/complaints';

  return (
    <DashboardLayout
      activePath={activePath}
      role={user.role}
      currentSectionName="Complaint Discussion Thread"
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
            <Badge label={complaint.status} status={getStatusState(complaint.status)} />
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
          title={complaint.title}
          subtitle={`Category: ${complaint.category} • Raised on ${new Date(complaint.createdAt).toLocaleDateString()}`}
          className="p-6 border border-slate-200 bg-white"
        >
          <div className="space-y-4 pt-2">
            <p className="text-slate-700 text-xs leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>

            {complaint.imageUrl && (
              <div className="border border-slate-200 rounded-brand-md max-w-md bg-slate-50 p-2 text-left">
                <p className="text-[10px] font-bold font-mono uppercase text-slate-400 tracking-wider mb-1.5">Attachment Photo Evidence</p>
                <img
                  src={getImageUrl(complaint.imageUrl)}
                  alt="Complaint attachment"
                  className="w-full h-auto max-h-80 object-contain rounded border border-slate-200 bg-white"
                />
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-slate-400 font-mono">
              <p>
                Filed By: <span className="font-bold text-slate-750">{complaint.raisedBy ? `${complaint.raisedBy.firstName} ${complaint.raisedBy.lastName}` : 'Resident Member'}</span>
              </p>
              {complaint.assignedTo && (
                <p>
                  Assigned Personnel: <span className="font-bold text-slate-750">{complaint.assignedTo.firstName} {complaint.assignedTo.lastName} (Committee)</span>
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* 2. Chronological Message Timeline Stack */}
        <Card
          title={`Discussion Thread Timeline`}
          subtitle={`Dialogue Log (${complaint.comments?.length || 0})`}
          className="p-6 border border-slate-200 bg-white"
        >
          <div className="space-y-4 pt-2 divide-y divide-slate-100">
            {(!complaint.comments || complaint.comments.length === 0) ? (
              <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 border border-dashed border-slate-200">
                No updates or messages posted to this discussion thread yet.
              </div>
            ) : (
              complaint.comments.map((comm, idx) => {
                const authorRole = comm.author?.role === 'COMMITTEE' ? 'Committee' : comm.author?.role === 'ADMIN' ? 'Admin' : 'Resident';
                const roleBadgeStatus = 
                  comm.author?.role === 'COMMITTEE' 
                    ? 'approved' 
                    : comm.author?.role === 'ADMIN'
                    ? 'info'
                    : 'warning';

                return (
                  <div key={comm.id} className={`py-4 space-y-2 first:pt-0 ${idx > 0 ? 'border-t border-slate-100' : ''}`}>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="font-sans font-bold text-slate-900 text-xs">
                          {comm.author ? `${comm.author.firstName} ${comm.author.lastName}` : 'System Member'}
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

        {/* 3. Comment Box */}
        <Card
          title="Submit Update Message"
          subtitle="Post to Discussion Log"
          className="p-6 border border-slate-200 bg-white"
        >
          <form onSubmit={handlePostComment} className="space-y-4 pt-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your message or update details here..."
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
