import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { MessageSquare, ArrowLeft, Send } from 'lucide-react';

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
      const ticket = res.data?.data?.complaint || res.data?.complaint || res.data || null;
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
        // Re-fetch to pull the latest comment list
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
      navigate('/admin/dashboard');
    } else if (user.role === 'COMMITTEE') {
      navigate('/committee/dashboard');
    } else {
      navigate('/resident/dashboard');
    }
  };

  if (loading && !complaint) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-medium text-sm">
        Loading ticket timeline details...
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 space-y-4 text-slate-900">
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-4 max-w-md font-medium">
          {error}
        </div>
        <button
          onClick={handleGoBack}
          className="flex items-center gap-1.5 text-xs font-semibold hover:underline text-indigo-600"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>
      </div>
    );
  }

  const statusColors = 
    complaint.status === 'COMPLETED' || complaint.status === 'RESOLVED'
      ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
      : complaint.status === 'APPROVED'
      ? 'border-blue-200 text-blue-700 bg-blue-50'
      : complaint.status === 'REJECTED'
      ? 'border-red-200 text-red-700 bg-red-50'
      : 'border-amber-200 text-amber-700 bg-amber-50';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Header Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 focus:outline-none cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Ticket Status:</span>
          <span className={`border px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${statusColors}`}>
            {complaint.status}
          </span>
        </div>
      </header>

      {/* Main Splits Workspace */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 space-y-6">
        
        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 font-medium">
            {error}
          </div>
        )}

        {/* 1. Ticket Summary Card */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Category: {complaint.category}
              </span>
              <h2 className="text-slate-900 font-semibold text-lg leading-tight">
                {complaint.title}
              </h2>
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              Raised on {new Date(complaint.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {complaint.description}
            </p>

            {(() => {
              if (!complaint.imageUrl) return null;
              const backendBase = 'http://localhost:5000';
              const fullImageUrl = complaint.imageUrl.startsWith('http')
                ? complaint.imageUrl
                : `${backendBase}/${complaint.imageUrl.replace(/^\/+/, '')}`;
              return (
                <div className="border border-slate-200 max-w-md bg-slate-50 p-2">
                  <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Attachment Image</p>
                  <img
                    src={fullImageUrl}
                    alt="Complaint attachment"
                    className="w-full h-auto max-h-80 object-contain border border-slate-200"
                  />
                </div>
              );
            })()}
          </div>

          <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
            <p>
              Raised By: <span className="font-semibold text-slate-600">{complaint.raisedBy ? `${complaint.raisedBy.firstName} ${complaint.raisedBy.lastName}` : 'Resident'}</span>
            </p>
            {complaint.assignedTo && (
              <p>
                Assigned To: <span className="font-semibold text-slate-600">{complaint.assignedTo.firstName} {complaint.assignedTo.lastName} (Committee)</span>
              </p>
            )}
          </div>
        </section>

        {/* 2. Chronological Discussion Stack */}
        <section className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-800 font-semibold text-sm">
            <MessageSquare size={16} className="text-slate-500" />
            <h3>Discussion Timeline ({complaint.comments?.length || 0})</h3>
          </div>

          <div className="divide-y divide-slate-200">
            {(!complaint.comments || complaint.comments.length === 0) ? (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                No updates or messages posted to this discussion thread yet.
              </div>
            ) : (
              complaint.comments.map((comm) => {
                const authorRole = comm.author?.role === 'COMMITTEE' ? 'Committee' : comm.author?.role === 'ADMIN' ? 'Admin' : 'Resident';
                const roleBadgeColor = 
                  comm.author?.role === 'COMMITTEE' 
                    ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' 
                    : comm.author?.role === 'ADMIN'
                    ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                    : 'text-blue-700 bg-blue-50 border border-blue-200';

                return (
                  <div key={comm.id} className="py-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">
                          {comm.author ? `${comm.author.firstName} ${comm.author.lastName}` : 'System User'}
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

        {/* 3. Comment Form Box */}
        <section className="bg-white border border-slate-200 p-6 space-y-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Post Message to Thread</h4>
          
          <form onSubmit={handlePostComment} className="space-y-3">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Type your update message or feedback detail here..."
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
