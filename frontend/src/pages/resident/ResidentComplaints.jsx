import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { ArrowLeft, MessageSquare, Plus, FileText, Camera } from 'lucide-react';

export default function ResidentComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data States
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch complaints
  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/complaints?limit=50');
      // Defensive parser for envelope shapes
      const list = res.data?.data?.complaints || res.data?.complaints || res.data?.data || res.data || [];
      setComplaints(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError(err.response?.data?.message || 'Failed to fetch your complaints timeline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Handle file input selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!title.trim() || !description.trim()) {
      setError('Please fill in both title and description details.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post('/complaints', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });

      if (res.data?.status === 'success' || res.status === 201) {
        setSuccessMsg('Complaint filed successfully!');
        setTitle('');
        setDescription('');
        setCategory('General');
        setImageFile(null);
        // Reset file input element
        const fileInput = document.getElementById('complaint-image-input');
        if (fileInput) fileInput.value = '';
        
        await fetchComplaints();
      }
    } catch (err) {
      console.error('Filing complaint failed:', err);
      setError(err.response?.data?.message || 'Failed to submit complaint ticket.');
    } finally {
      setSubmitting(false);
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
      
      {/* Top Header Navigation Row */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/resident/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 focus:outline-none cursor-pointer"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-200 font-semibold tracking-wider">
            {user?.role || 'RESIDENT'}
          </span>
        </div>
      </header>

      {/* Main Splits Layout Container */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        
        {/* Left Column: Raise Complaint Form (1/3 width) */}
        <section className="p-6 bg-white space-y-6 flex flex-col overflow-y-auto">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
              <Plus size={16} />
              <h3>File New Complaint</h3>
            </div>
            <p className="text-xs text-slate-500">Submit a formal ticket for community or maintenance issues.</p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Complaint Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Elevators door not locking"
                required
                disabled={submitting}
                className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white"
              />
            </div>

            <div className="grid grid-cols-1 gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Category Area</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={submitting}
                className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white cursor-pointer"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Security">Security</option>
                <option value="Sanitation">Sanitation</option>
                <option value="General">General</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Detailed Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe the issue in detail..."
                required
                rows={5}
                disabled={submitting}
                className="border border-slate-300 focus:border-indigo-600 focus:outline-none rounded-md p-2 w-full text-slate-950 text-sm bg-white resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Camera size={12} />
                Attach Photo Evidence (Optional)
              </label>
              <input
                id="complaint-image-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={submitting}
                className="border border-slate-300 rounded-md p-1.5 w-full text-xs text-slate-700 bg-white file:mr-2 file:py-1 file:px-2 file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-md text-sm w-full cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        </section>

        {/* Right Column: Complaints Directory (2/3 width) */}
        <section className="lg:col-span-2 p-6 flex flex-col space-y-4 overflow-y-auto">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
            <FileText size={16} />
            <h3>Your Lodged Complaints Registry</h3>
          </div>

          {loading ? (
            <div className="text-center p-12 text-slate-500 text-sm">
              Loading complaints archive...
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center p-12 text-slate-400 text-sm border border-dashed border-slate-200 bg-white">
              No complaint tickets logged on your account yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaints.map((item) => {
                const statusColors = 
                  item.status === 'RESOLVED'
                    ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                    : item.status === 'ASSIGNED'
                    ? 'border-blue-200 text-blue-700 bg-blue-50'
                    : 'border-amber-200 text-amber-700 bg-amber-50';

                return (
                  <div key={item.id} className="bg-white border border-slate-200 p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <span className="text-[9px] font-mono text-slate-400">ID: {item.id.slice(0, 8)}...</span>
                        <span className={`border px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wide uppercase ${statusColors}`}>
                          {item.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4
                          onClick={() => navigate(`/complaints/${item.id}`)}
                          className="text-slate-900 font-semibold text-sm hover:text-indigo-600 cursor-pointer"
                        >
                          {item.title}
                        </h4>
                        <p className="text-slate-500 text-xs line-clamp-3 leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {/* Image Thumbnail rendering if imageUrl exists */}
                      {item.imageUrl && (
                        <div className="border border-slate-100 rounded overflow-hidden h-28 bg-slate-50 flex items-center justify-center">
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt="Evidence Attachment"
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none'; // Fallback on load failure
                            }}
                          />
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Category: {item.category}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
