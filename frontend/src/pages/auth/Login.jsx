import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogIn, Eye, EyeOff, Building, Landmark, Shield, Cloud, Terminal } from 'lucide-react';
import Card from '../../components/design-system/Card.jsx';
import Button from '../../components/design-system/Button.jsx';
import FormInput from '../../components/design-system/FormInput.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email address and password');
      return;
    }

    setSubmitting(true);
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      const role = result.user.role;
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else if (role === 'COMMITTEE') {
        navigate('/committee/dashboard');
      } else {
        navigate('/resident/dashboard');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col lg:flex-row font-sans text-slate-800 antialiased">
      
      {/* Left Panel: Platform Feature Showcase (Warm Cream background) */}
      <div className="hidden lg:flex lg:w-3/5 bg-brand-cream p-16 flex-col justify-between border-r border-slate-200/60">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-brand-navy flex items-center justify-center text-brand-gold shadow-brand-low">
            <Building className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h1 className="text-sm font-serif font-bold tracking-tight text-slate-900 leading-tight">SMS Portal</h1>
            <span className="block text-[9px] text-slate-400 font-mono font-bold tracking-widest uppercase">
              SOCIETY MANAGEMENT SYSTEM
            </span>
          </div>
        </div>

        {/* Feature Showcase Grid */}
        <div className="space-y-8 my-auto max-w-2xl text-left">
          <div className="space-y-3">
            <h2 className="text-3xl font-serif font-bold text-slate-900 tracking-tight leading-tight">
              All-in-one portal for modern residential administration.
            </h2>
            <p className="text-xs text-slate-500 max-w-lg leading-relaxed font-sans">
              A production-ready platform to streamline billing, assign designations, track emergency resident tickets, and manage payments.
            </p>
          </div>

          {/* Reusable Card Components for Features */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Feature 1 */}
            <Card
              title="Asset-Centric Billing"
              subtitle="Billing Infrastructure"
            >
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Maintenance invoices bind to flats instead of user accounts, keeping billing histories intact when tenants transition.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card
              title="Self-Collection Block"
              subtitle="Fraud Prevention"
            >
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Database-level relational constraints prevent committee members from collecting cash payments for their own flat units.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card
              title="Streamed Media Pipeline"
              subtitle="Storage Optimization"
            >
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Resident complaint images are processed via RAM buffers straight to Cloudinary, ensuring zero local file-system leaks.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card
              title="Immutable System Logs"
              subtitle="Security Compliance"
            >
              <p className="text-[11px] text-slate-500 leading-relaxed mt-1">
                Critical updates and access timestamps are saved instantly to a read-only audit log database for operations verification.
              </p>
            </Card>

          </div>

          {/* Quick Metrics Banner */}
          <div className="border-t border-slate-200/70 pt-6">
            <dl className="grid grid-cols-3 gap-4">
              <div>
                <dt className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Billing Rate</dt>
                <dd className="mt-0.5 text-md font-serif font-bold text-slate-900">98.4% On-time</dd>
              </div>
              <div>
                <dt className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">Support SLA</dt>
                <dd className="mt-0.5 text-md font-serif font-bold text-slate-900">&lt; 4 Hours Response</dd>
              </div>
              <div>
                <dt className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">DB Isolation</dt>
                <dd className="mt-0.5 text-md font-serif font-bold text-slate-900">Active PostgreSQL</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Left Panel Footer */}
        <div className="text-[9px] font-mono uppercase tracking-widest text-slate-400 border-t border-slate-200/50 pt-4">
          <span>© 2026 Society Management System</span>
        </div>
      </div>
      {/* Right Panel: Authentication Form (subtly-tinted background wrapper for card contrast) */}
      <div className="w-full lg:w-2/5 bg-slate-100 p-8 lg:p-16 flex flex-col justify-between min-h-screen lg:min-h-0 border-l border-slate-200/50">
        
        {/* Mobile Header (Hidden on large screens) */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded bg-brand-navy flex items-center justify-center text-brand-gold shadow-brand-low">
            <Building className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className="text-sm font-serif font-bold text-slate-900 block leading-tight">SMS Portal</span>
            <span className="text-[9px] text-slate-400 font-mono font-bold tracking-widest uppercase block">
              SOCIETY MANAGEMENT SYSTEM
            </span>
          </div>
        </div>

        {/* Form elevated in a clean white Card with Gold accent top border */}
        <div className="w-full max-w-sm mx-auto my-auto">
          <Card
            title="Portal Access"
            subtitle="Secure Gatekeeper"
            className="p-8 shadow-brand-high border border-slate-200 border-t-4 border-t-brand-gold bg-white"
          >
            <p className="text-xs text-slate-550 mb-6 -mt-2">
              Enter your credentials to continue to your dashboard.
            </p>

            {/* Error notifications */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-brand-brick text-xs px-3.5 py-2.5 rounded-brand-md mb-4 text-left">
                <span className="font-bold font-mono text-[10px] uppercase tracking-wider block mb-0.5">Failed to authenticate</span>
                <span>{error}</span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div>
                <FormInput
                  label="Email Address"
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@society.com"
                  disabled={submitting}
                />
              </div>

              <div>
                <FormInput
                  label="Password"
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={submitting}
                  suffix={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={submitting}
                      className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer p-1"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  }
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                  className="w-full py-2.5"
                >
                  {submitting ? 'Verifying Credentials...' : 'Sign In'}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Mobile / Screen Footer */}
        <div className="mt-8 border-t border-slate-200/50 pt-4 flex justify-between items-center text-[9px] font-mono uppercase tracking-widest text-slate-400">
          <span>AES-256 JWT Security Active</span>
          <span className="lg:hidden">© 2026 Society Management System</span>
        </div>
      </div>
    </div>
  );
}
