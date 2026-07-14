import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { MessageSquare, ArrowLeft, Send } from 'lucide-react';

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
      // Defensive parsing to support multiple shapes
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
        await fetchRequestDetails(); // Re-fetch to instantly load into timeline
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
        await fetchRequestDetails(); // Re-fetch to instantly load feedback details
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
      navigate('/admin/dashboard');
    } else if (user.role === 'COMMITTEE') {
      navigate('/committee/dashboard');
    } else {
      navigate('/resident/dashboard');
    }
  };

  if (loading && !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-medium text-sm">
        Loading service ticket timeline...
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4 text-slate-900">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 max-w-md font-medium">
          {error}
        </div>
        <button
          onClick={handleGoBack}
          className="flex items-center gap-1.5 text-xs font-semibold hover:underline text-indigo-600 cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const statusColors = 
    ticket.status === 'COMPLETED'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : ticket.status === 'APPROVED'
      ? 'border-blue-200 text-blue-700 bg-blue-50'
      : ticket.status === 'REJECTED'
      ? 'border-red-200 text-red-700 bg-red-50'
      : 'border-amber-200 text-amber-700 bg-amber-50';

  const commentsList = ticket.comments || [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header Row Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 focus:outline-none cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Ticket status:</span>
          <span className={`border px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColors}`}>
            {ticket.status}
          </span>
        </div>
      </header>

      {/* Main Splits Workspace */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        
        {/* Error notification banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 font-medium">
            {error}
          </div>
        )}

        {/* 1. Ticket Summary Block */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Category: {ticket.category}
              </span>
              <h2 className="text-slate-900 font-semibold text-xl leading-tight mb-2">
                {ticket.title}
              </h2>
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              Raised on {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
          </div>

          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </p>

          <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
            <p>
              Raised By: <span className="font-semibold text-slate-600">{ticket.raisedBy ? `${ticket.raisedBy.firstName} ${ticket.raisedBy.lastName}` : 'Resident'}</span>
            </p>
            {ticket.assignedTo && (
              <p>
                Assigned To: <span className="font-semibold text-slate-600">{ticket.assignedTo.firstName} {ticket.assignedTo.lastName} (Committee)</span>
              </p>
            )}
            {ticket.feedback ? (
              <p className="w-full mt-2 bg-slate-50 border border-slate-100 p-2 text-slate-600">
                <span className="font-bold text-slate-700">Resident Feedback:</span> "{ticket.feedback}"
              </p>
            ) : (
              ticket.status === 'COMPLETED' && user?.role === 'RESIDENT' && (
                <div className="w-full mt-4 border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Submit Your Feedback</h4>
                  <form onSubmit={handlePostFeedback} className="flex gap-2">
                    <input
                      type="text"
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Share your feedback on the resolution..."
                      required
                      disabled={submittingFeedback}
                      className="border border-slate-300 focus:border-indigo-600 focus:outline-none flex-1 px-3 py-1.5 text-sm bg-white text-slate-950 rounded-md"
                    />
                    <button
                      type="submit"
                      disabled={submittingFeedback || !feedbackText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-md disabled:opacity-50 cursor-pointer focus:outline-none"
                    >
                      {submittingFeedback ? 'Submitting...' : 'Submit'}
                    </button>
                  </form>
                </div>
              )
            )}
          </div>
        </section>

        {/* 2. Message Timeline Stack */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800 font-semibold text-sm">
            <MessageSquare size={16} className="text-slate-500" />
            <h3>Timeline Dialogue ({commentsList.length})</h3>
          </div>

          <div className="divide-y divide-slate-200">
            {commentsList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                No conversation logs or updates posted to this service ticket yet.
              </div>
            ) : (
              commentsList.map((comm) => {
                const authorRole = comm.author?.role === 'COMMITTEE' ? 'Committee' : comm.author?.role === 'ADMIN' ? 'Admin' : 'Resident';
                const roleBadgeColor = 
                  comm.author?.role === 'COMMITTEE' 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                    : comm.author?.role === 'ADMIN'
                    ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                    : 'text-blue-700 bg-blue-50 border border-blue-200';

                const authorNameLabel = comm.author?.id === user?.id ? `${comm.author.firstName} ${comm.author.lastName} (You)` : `${comm.author?.firstName} ${comm.author?.lastName || ''}`;

                return (
                  <div key={comm.id} className="py-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {authorNameLabel}
                        </span>
                        <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold tracking-wider ${roleBadgeColor}`}>
                          {authorRole}
                        </span>
                      </div>
                      <span className="text-slate-400 font-mono">
                        {new Date(comm.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-normal">
                      {comm.comment}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 3. Message Box Field */}
        <section className="bg-white border border-slate-200 p-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Submit Update Message</h4>
          
          <form onSubmit={handlePostComment} className="space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type a message to management..."
              required
              rows={3}
              disabled={submittingComment}
              className="border border-slate-300 focus:border-indigo-600 focus:outline-none w-full p-3 rounded-md text-sm text-slate-950 bg-white resize-none"
            />
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                {submittingComment ? 'Sending...' : 'Post Message'}
              </button>
            </div>
          </form>
        </section>

      </main>
    </div>
  );
}
