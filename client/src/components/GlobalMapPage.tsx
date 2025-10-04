import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AlertTriangle,
  Database,
  HardDrive,
  Loader2,
  RefreshCw,
  Shield,
  Clock,
  MapPin,
  FileBox,
  Server,
  Globe2,
} from 'lucide-react';

interface HealthResponse {
  healthy?: boolean;
  stats?: {
    numObjects?: string;
    repoSize?: string;
    version?: string;
    storageMax?: string;
    serverLoc?: [string, string][];
  };
  latency?: string;
}

interface ServerLocation {
  id: string;
  lat: number;
  lon: number;
  x: number;
  y: number;
  label: string;
}
function latLonToXY(lat: number, lon: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * 100;
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = 50 - (mercN / (2 * Math.PI)) * 100;
  
  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
}

function parseLatency(latency?: string): number {
  if (!latency) return 0;
  const match = latency.match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatNumber(num: number): string {
  return num.toLocaleString();
}

export default function ForensicEvidenceMap() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = useCallback(async (background = false) => {
    if (background) {
      setIsRefreshing(true);
    } else {
      setStatus('loading');
    }
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_APIHOST}/health`,{
        headers:{
          "Authorization":`Bearer ${localStorage.getItem("ledgis_auth_token")}`
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      if(!data.healthy)throw new Error("IPFS Server Unhealthy");
      setHealth(data);
      setStatus('success');
    } catch (err) {
      const message = 'Unable to retrieve IPFS health metrics';
      setHealth(null);
      setError(message);
      setStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(true), 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const serverLocations = useMemo((): ServerLocation[] => {
    if (!health?.stats?.serverLoc) return [];
    
    return health.stats.serverLoc.map((loc, idx) => {
      const lat = parseFloat(loc[0]);
      const lon = parseFloat(loc[1]);
      const { x, y } = latLonToXY(lat, lon);
      
      return {
        id: `server-${idx}`,
        lat,
        lon,
        x,
        y,
        label: `IPFS Node ${idx + 1}`,
      };
    });
  }, [health?.stats?.serverLoc]);

  const stats = useMemo(() => {
    const numObjects = health?.stats?.numObjects ? parseInt(health.stats.numObjects) : 0;
    const repoSize = health?.stats?.repoSize ? parseInt(health.stats.repoSize) : 0;
    const storageMax = health?.stats?.storageMax ? parseInt(health.stats.storageMax) : 0;
    const latencyMs = parseLatency(health?.latency);
    const storageUsedPercent = storageMax > 0 ? (repoSize / storageMax) * 100 : 0;

    return {
      numObjects,
      repoSize,
      storageMax,
      latencyMs,
      storageUsedPercent,
      version: health?.stats?.version || '—',
    };
  }, [health]);

  const systemStatusLabel = health==null||health?.healthy === false ? 'System Inactive' : 'System Operational';
  const refreshDisabled = status === 'loading' || isRefreshing;

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Globe2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">
                LEDGIS IPFS Global Map
              </h1>
              <p className="text-sm text-slate-400">IPFS statistics</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5">
              <div className={`h-2 w-2 rounded-full ${health?.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-sm font-medium text-slate-200">{systemStatusLabel}</span>
            </div>
            <div className="text-xs text-slate-500">
              {serverLocations.length} active node{serverLocations.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchHealth(status === 'success')}
            disabled={refreshDisabled}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshDisabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {refreshDisabled ? 'Refreshing…' : 'Refresh Data'}
          </button>
          {status === 'error' && error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}
        </div>
        {status === 'loading' && !health && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-zinc-900 bg-zinc-950 p-12 text-sm text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
            <span>Fetching IPFS node telemetry…</span>
          </div>
        )}
        {status !== 'loading' && (
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={<FileBox className="h-5 w-5" />}
              label="Evidence Objects"
              value={formatNumber(stats.numObjects)}
              sublabel="Total stored items"
              color="bg-zinc-900 border-zinc-800"
            />
            <StatCard
              icon={<HardDrive className="h-5 w-5" />}
              label="Repository Size"
              value={formatBytes(stats.repoSize)}
              sublabel={`${stats.storageUsedPercent.toFixed(1)}% of capacity`}
              color="bg-zinc-900 border-zinc-800"
            />
            <StatCard
              icon={<Clock className="h-5 w-5" />}
              label="Network Latency"
              value={stats.latencyMs > 0 ? `${stats.latencyMs.toFixed(0)} ms` : '—'}
              sublabel="Response time"
              color="bg-zinc-900 border-zinc-800"
            />
            <StatCard
              icon={<Database className="h-5 w-5" />}
              label="Storage Capacity"
              value={formatBytes(stats.storageMax)}
              sublabel={`Version: ${stats.version}`}
              color="bg-zinc-900 border-zinc-800"
            />
          </div>
        )}
        <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
          <section className="relative overflow-hidden rounded-2xl border border-zinc-900 bg-black p-6 shadow-2xl">
            <div className="pointer-events-none absolute inset-0 opacity-10">
              <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-zinc-800" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path
                d="M 15 35 Q 20 30 25 35 T 35 35 L 40 40 L 35 45 Z M 45 30 L 55 25 L 65 30 L 70 35 L 65 40 L 55 38 Z M 70 45 L 80 40 L 85 45 L 80 55 L 75 50 Z"
                fill="none"
                stroke="rgba(63, 63, 70, 0.3)"
                strokeWidth="0.3"
              />
            </svg>
            {serverLocations.length > 1 && (
              <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                {serverLocations.slice(0, -1).map((loc, idx) => {
                  const nextLoc = serverLocations[idx + 1];
                  return (
                    <line
                      key={`line-${idx}`}
                      x1={loc.x}
                      y1={loc.y}
                      x2={nextLoc.x}
                      y2={nextLoc.y}
                      stroke="rgba(251, 191, 36, 0.3)"
                      strokeWidth="0.2"
                      strokeDasharray="1,1"
                    />
                  );
                })}
              </svg>
            )}
            {serverLocations.map((location) => (
              <div
                key={location.id}
                className="absolute"
                style={{
                  left: `${location.x}%`,
                  top: `${location.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="absolute inset-0 -m-4 animate-ping rounded-full bg-amber-500/20" />
                
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-amber-400 bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/40">
                  <Server className="h-4 w-4 text-white" />
                </div>
                <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-sm">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-amber-400" />
                    <span>{location.label}</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                  </div>
                </div>
              </div>
            ))}

            {serverLocations.length === 0 && status === 'success' && (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No server locations available
              </div>
            )}
            <div className="pointer-events-none absolute inset-x-6 bottom-6 flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 backdrop-blur-sm">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Active IPFS Node</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1 backdrop-blur-sm">
                <div className="h-0.5 w-4 bg-amber-400/40" />
                <span>Network Connection</span>
              </div>
            </div>
          </section>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-xl">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
                <Server className="h-5 w-5 text-amber-400" /> Active Nodes
              </h2>
              <div className="space-y-3">
                {serverLocations.map((location, idx) => (
                  <div
                    key={location.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:bg-zinc-800"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium text-white">{location.label}</span>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400">
                        {idx + 1}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3 w-3" />
                        <span>
                          Lat: {location.lat.toFixed(4)}°, Lon: {location.lon.toFixed(4)}°
                        </span>
                      </div>
                      {idx >= 0 && (
                        <>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-slate-500">Objects:</span>
                            <span className="font-mono text-slate-300">{formatNumber(stats.numObjects)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">Latency:</span>
                            <span className="font-mono text-slate-300">{stats.latencyMs.toFixed(0)} ms</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {serverLocations.length === 0 && (
                  <p className="text-sm text-slate-500">Waiting for node telemetry data…</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-900 bg-zinc-950 p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-white">Storage Utilization</h2>
              <div className="space-y-3">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-slate-400">Used</span>
                    <span className="font-mono text-white">{formatBytes(stats.repoSize)}</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, stats.storageUsedPercent)}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right text-xs text-slate-500">
                    {stats.storageUsedPercent.toFixed(2)}% of {formatBytes(stats.storageMax)}
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sublabel: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5 shadow-xl transition hover:border-zinc-700">
      <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow-lg`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      </div>
      <p className="mt-2 text-xs text-slate-500">{sublabel}</p>
    </div>
  );
}