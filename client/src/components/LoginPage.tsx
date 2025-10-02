import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { storage } from '../lib/storage';
import { Node } from '../types';

const logoSrc = new URL('../public/ledgis-logo.png', import.meta.url).href;

interface LoginPageProps {
  onLogin: (node: Node) => void;
  onBack: () => void;
}

export default function LoginPage({ onLogin, onBack }: LoginPageProps) {

  const [nodeId, setNodeId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!nodeId || !username || !password) {
      setError('Please provide node ID, username, and password.');
      return;
    }

    setIsLoading(true);
    try {
        const res=await fetch(`${import.meta.env.VITE_APIHOST}/auth/login`,{
          method:"POST",
          headers:{
            "Content-Type":"Application/json"
          },
          body:JSON.stringify({username,nodeid:nodeId,password})
        })
        const data=await res.json()

      if (!data.success) {
        throw new Error('Invalid credentials. This action will be reported.');
      }

      storage.setAuthToken(data.token);

      const node: Node = {
        id: nodeId,
        nodeId,
        name: username,
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      setSuccessMessage(data.message);
      onLogin(node);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Unexpected error when contacting the authentication service.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-neutral-950 text-neutral-50 px-6 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-80 w-80 rounded-full bg-neutral-900/40 blur-3xl" />
        <div className="absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-neutral-800/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:70px_70px] opacity-50" />
      </div>

      <button
        onClick={onBack}
        className="absolute left-8 top-8 inline-flex items-center gap-2 text-sm text-neutral-400 transition hover:text-neutral-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to landing
      </button>

      <div className="relative w-full max-w-lg">
        <div className="mb-8 text-center">
          <img src={logoSrc} alt="LEDGIS" className="mx-auto h-16 w-auto" />
          <h1 className="mt-6 text-3xl font-semibold tracking-tight">Authenticate your node</h1>
          <p className="mt-2 text-neutral-400">Provide your assigned credentials to resume evidence governance.</p>
        </div>

        <div className="relative rounded-2xl border border-neutral-800/60 bg-neutral-950/70 p-8 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.8)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="nodeId" className="text-sm font-medium text-neutral-200">Node identifier</label>
              <input
                id="nodeId"
                type="text"
                value={nodeId}
                onChange={(event) => setNodeId(event.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-neutral-50 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                placeholder="e.g. NODE001"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-neutral-200">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-neutral-50 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                placeholder="Enter assigned username"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-neutral-200">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 pr-12 text-neutral-50 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700"
                  placeholder="Enter password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 transition hover:text-neutral-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <span className="mt-1 block h-2 w-2 rounded-full bg-red-400" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                <span className="mt-1 block h-2 w-2 rounded-full bg-emerald-400" />
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? 'Validating…' : 'Sign in securely'}
            </button>
          </form>

          {/* <div className="mt-8 rounded-xl border border-neutral-800/60 bg-neutral-900/50 px-4 py-3 text-center text-xs text-neutral-500">
            Demo credentials: <span className="font-mono text-neutral-300">NODE001 / demo-agent / demo-password</span>
          </div> */}
        </div>
      </div>
    </div>
  );
}