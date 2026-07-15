import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../services/api.js';
import { MessageSquare, Plus, FileText, Camera, ShieldAlert } from 'lucide-react';
import DashboardLayout from '../../components/design-system/DashboardLayout.jsx';
import Card from '../../components/design-system/Card.jsx';
import Button from '../../components/design-system/Button.jsx';
import FormInput from '../../components/design-system/FormInput.jsx';
import Badge from '../../components/design-system/Badge.jsx';

export default function ResidentComplaints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
  
  // Drag & Drop State
  const [dragActive, setDragActive] = useState(false);

  // Lightbox State
  const [activeLightboxImage, setActiveLightboxImage] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints?limit=50');
      const allComplaints = res.data?.data?.complaints || res.data?.complaints || res.data?.data || [];
      setComplaints(Array.isArray(allComplaints) ? allComplaints : []);
    } catch (err) {
      console.error('Failed to load complaints:', err);
      setError(err.response?.data?.message || 'Failed to retrieve your complaints log.');
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

  // Handle Drag Events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle Drop Event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImageFile(e.dataTransfer.files[0]);
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
    <DashboardLayout
      activePath="/resident/complaints"
      role="RESIDENT"
      currentSectionName="My Complaints"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start text-left">
        
        {/* Left Column: Raise Complaint Form (1/3 width) */}
        <section className="lg:col-span-1">
          <Card
            title="File New Complaint"
            subtitle="Raise Grievance"
            className="p-6 border border-slate-200"
          >
            {/* Form Error / Success Alerts */}
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-brand-brick text-xs px-3.5 py-2.5 rounded-brand-md mb-4 text-left">
                <span className="font-bold font-mono text-[9px] uppercase tracking-wider block mb-0.5">Error</span>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs px-3.5 py-2.5 rounded-brand-md mb-4 text-left">
                <span className="font-bold text-emerald-955 block mb-0.5">Success</span>
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormInput
                label="Complaint Title"
                id="complaint-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Garbage overflow in corridor"
                disabled={submitting}
              />

              <div className="flex flex-col w-full text-left">
                <label htmlFor="complaint-category" className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Category Classification
                </label>
                <select
                  id="complaint-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={submitting}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white text-slate-800 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 cursor-pointer"
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Security">Security</option>
                  <option value="Sanitation">Sanitation</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div className="flex flex-col w-full text-left">
                <label htmlFor="complaint-description" className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Detailed Description
                </label>
                <textarea
                  id="complaint-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  required
                  rows={4}
                  disabled={submitting}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-brand-md text-xs bg-white placeholder-slate-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors duration-250 text-slate-800 resize-none"
                />
              </div>

              {/* Drag and Drop File Upload Area */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                  <Camera size={12} className="text-slate-400" />
                  Attach Photo Evidence (Optional)
                </label>
                
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-brand-md p-4 text-center cursor-pointer transition-all duration-200 ${
                    dragActive ? 'border-brand-gold bg-brand-cream/50' : 'border-slate-200 hover:border-brand-gold'
                  }`}
                  onClick={() => document.getElementById('complaint-image-input').click()}
                >
                  <input
                    id="complaint-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={submitting}
                    className="hidden"
                  />
                  {imageFile ? (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Selected File</span>
                      <span className="text-xs text-slate-900 font-semibold block truncate max-w-xs mx-auto">{imageFile.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImageFile(null);
                        }}
                        className="text-[9px] font-mono text-brand-brick uppercase font-bold tracking-wider hover:underline"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 py-1.5">
                      <span className="text-xs text-slate-500 block">
                        Drag & Drop image here, or <span className="text-brand-gold font-semibold underline">Browse</span>
                      </span>
                      <span className="text-[9px] text-slate-400 block font-mono">PNG, JPG, or WEBP up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="w-full py-2.5 flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </Button>
              </div>
            </form>
          </Card>
        </section>

        {/* Right Column: Complaints Directory (2/3 width) */}
        <section className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <FileText size={16} className="text-brand-gold" />
            <h3 className="font-serif">Your Lodged Complaints Registry</h3>
          </div>

          {loading ? (
            <div className="text-center p-12 text-slate-400 text-xs italic bg-white border border-slate-200 rounded-brand-lg">
              Loading complaints archive...
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center p-12 text-slate-400 text-xs italic border border-dashed border-slate-200 bg-white rounded-brand-lg">
              No complaint tickets logged on your account yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complaints.map((item) => {
                const getStatusState = (status) => {
                  switch (status) {
                    case 'RESOLVED': return 'approved';
                    case 'ASSIGNED': return 'in_progress';
                    case 'PENDING':
                    default: return 'pending';
                  }
                };

                return (
                  <Card
                    key={item.id}
                    title={
                      <span 
                        onClick={() => navigate(`/complaints/${item.id}`)}
                        className="!text-indigo-600 hover:!text-indigo-800 hover:underline cursor-pointer font-bold font-serif text-sm"
                      >
                        {item.title}
                      </span>
                    }
                    subtitle={`Category: ${item.category}`}
                    badge={<Badge label={item.status} status={getStatusState(item.status)} />}
                    className="p-5 flex flex-col justify-between space-y-4 hover:border-brand-gold transition-colors duration-250 bg-white border border-slate-200/80"
                  >
                    <div className="space-y-3">
                      <div className="text-left -mt-2">
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Complaint ID: {item.id.slice(0, 8)}</span>
                      </div>

                      <div className="text-left">
                        <p className="text-slate-550 text-xs leading-relaxed">{item.description}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {item.imageUrl && (
                        <div 
                          onClick={() => setActiveLightboxImage(getImageUrl(item.imageUrl))}
                          className="border border-slate-200/80 rounded-brand-md overflow-hidden h-28 bg-slate-50 flex items-center justify-center cursor-zoom-in relative group"
                        >
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt="Evidence Attachment"
                            className="h-full w-full object-cover group-hover:scale-105 transition-all duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-mono uppercase tracking-wider transition-opacity duration-200">
                            Click to View Image
                          </div>
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Filing Date: {new Date(item.createdAt).toLocaleDateString()}</span>
                        <Button 
                          onClick={() => navigate(`/complaints/${item.id}`)}
                          variant="secondary"
                          className="px-2 py-0.5 text-[9px] font-semibold"
                        >
                          View Thread
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Lightbox Overlay Modal */}
      {activeLightboxImage && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[999] cursor-zoom-out"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] bg-white border border-slate-200/50 shadow-brand-high p-2 rounded-brand-lg">
            <img 
              src={activeLightboxImage} 
              alt="Attachment Lightbox" 
              className="max-w-full max-h-[80vh] rounded-brand-md object-contain"
            />
            <button
              onClick={() => setActiveLightboxImage(null)}
              className="absolute -top-3 -right-3 w-7 h-7 bg-brand-navy border border-slate-200/50 hover:bg-slate-800 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-brand-low cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
