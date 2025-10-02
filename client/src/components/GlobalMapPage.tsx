import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  AlertTriangle,
  CloudLightning,
  Globe2,
  Layers,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { apiRequest, ApiError } from '../lib/api';

interface MapLocation {
  id: string;
  label: string;
  x: number;
  y: number;
  region: string;
  iso: string;
  latencyRange: [number, number];
  color: string;
}

type NodeStatus = 'active' | 'standby' | 'offline';

interface LocationMetric extends MapLocation {
  shards: number;
  dataVolume: number;
  availability: number;
  latency: number;
  status: NodeStatus;
}

interface HealthStats {
  shardsTotal?: number;
  payloadMb?: number;
  jurisdictionsActive?: number;
  nodesOnline?: number;
  nodesTotal?: number;
}

interface LatencyStats {
  averageMs?: number;
  p95Ms?: number;
  p99Ms?: number;
}

interface HealthNode {
  id: string;
  label?: string;
  region?: string;
  iso?: string;
  locationId?: string;
  coordinates?: {
    x: number;
    y: number;
  };
  shards?: number;
  dataMb?: number;
  availability?: number;
  latencyMs?: number;
  status?: string;
}

interface HealthResponse {
  healthy?: boolean;
  updatedAt?: string;
  stats?: HealthStats;
  latency?: LatencyStats;
  nodes?: HealthNode[];
}

const mapLocations: MapLocation[] = [
  { id: 'nyc', label: 'US-East Authority', x: 33, y: 38, region: 'North America', iso: 'USA', latencyRange: [28, 42], color: 'rgba(96, 165, 250, 0.9)' },
  { id: 'mtl', label: 'Canadian Custody Mesh', x: 30, y: 27, region: 'North America', iso: 'CAN', latencyRange: [34, 48], color: 'rgba(129, 140, 248, 0.9)' },
  { id: 'lon', label: 'UK Sovereign Vault', x: 52, y: 32, region: 'Europe', iso: 'GBR', latencyRange: [22, 36], color: 'rgba(14, 165, 233, 0.9)' }
];

const mapConnections: [string, string][] = [
  ['nyc', 'lon'],
  ['nyc', 'fra'],
  ['lon', 'fra']
];

function tintColor(color: string, intensity: number): string {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) {
    return color;
  }
  const parts = match[1].split(',').map((value) => Number(value.trim()));
  const [r, g, b] = parts;
  const alpha = Math.min(0.95, 0.35 + intensity * 0.55);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function resolveNodeStatus(status?: string): NodeStatus {
  if (!status) return 'standby';
  const normalised = status.toLowerCase();
  if (['active', 'online', 'healthy', 'green'].includes(normalised)) return 'active';
  if (['offline', 'down', 'red'].includes(normalised)) return 'offline';
  return 'standby';
}

function prioritiseStatus(current: NodeStatus, incoming: NodeStatus): NodeStatus {
  if (incoming === 'active') return 'active';
  if (incoming === 'standby' && current === 'offline') return 'standby';
  if (incoming === 'offline' && current !== 'active') return 'offline';
  return current;
}

function resolveBaseLocation(node: HealthNode): MapLocation | null {
  if (node.locationId) {
    const match = mapLocations.find((location) => location.id === node.locationId);
    if (match) {
      return match;
    }
  }

  if (node.iso) {
    const match = mapLocations.find((location) => location.iso.toLowerCase() === node.iso!.toLowerCase());
    if (match) {
      return match;
    }
  }

  if (node.label) {
    const match = mapLocations.find((location) => location.label.toLowerCase() === node.label!.toLowerCase());
    if (match) {
      return match;
    }
  }

  if (node.coordinates) {
    const latencyEstimate = isFiniteNumber(node.latencyMs) ? node.latencyMs : 60;
    return {
      id: node.id,
      label: node.label ?? node.id,
      x: Math.min(Math.max(node.coordinates.x, 0), 100),
      y: Math.min(Math.max(node.coordinates.y, 0), 100),
      region: node.region ?? 'Unspecified region',
      iso: node.iso ?? node.id.toUpperCase(),
      latencyRange: [Math.max(latencyEstimate - 20, 10), latencyEstimate + 20],
      color: 'rgba(125, 211, 252, 0.85)',
    };
  }

  return null;
}

function buildLocationMetrics(nodes: HealthNode[]): { metrics: LocationMetric[]; unmapped: number } {
  const aggregation = new Map<string, LocationMetric>();
  let unmapped = 0;

  nodes.forEach((node) => {
    const baseLocation = resolveBaseLocation(node);
    if (!baseLocation) {
      unmapped += 1;
      return;
    }

    const existing = aggregation.get(baseLocation.id) ?? {
      ...baseLocation,
      shards: 0,
      dataVolume: 0,
      availability: 0,
      latency: (baseLocation.latencyRange[0] + baseLocation.latencyRange[1]) / 2,
      status: 'standby' as NodeStatus,
    };

    if (node.label) {
      existing.label = node.label;
    }
    if (node.region) {
      existing.region = node.region;
    }
    if (node.iso) {
      existing.iso = node.iso;
    }

    const shards = isFiniteNumber(node.shards) ? node.shards : 0;
    const data = isFiniteNumber(node.dataMb) ? node.dataMb : 0;
    const availability = isFiniteNumber(node.availability) ? node.availability : null;
    const latency = isFiniteNumber(node.latencyMs) ? node.latencyMs : null;
    const status = resolveNodeStatus(node.status);

    existing.shards += shards;
    existing.dataVolume += data;

    if (availability != null) {
      existing.availability = availability;
    } else if (existing.availability <= 0) {
      existing.availability = 99.9;
    }

    if (latency != null) {
      existing.latency = existing.latency > 0 ? (existing.latency * 0.7 + latency * 0.3) : latency;
    }

    existing.status = prioritiseStatus(existing.status, status);

    aggregation.set(baseLocation.id, existing);
  });

  const metrics = Array.from(aggregation.values()).map((metric) => ({
    ...metric,
    availability: metric.availability > 0 ? metric.availability : 99.9,
  }));

  if (metrics.length === 0) {
    return {
      metrics: mapLocations.map((location) => ({
        ...location,
        shards: 0,
        dataVolume: 0,
        availability: 99.9,
        latency: (location.latencyRange[0] + location.latencyRange[1]) / 2,
        status: 'standby',
      })),
      unmapped,
    };
  }

  return { metrics, unmapped };
}

function computeTotals(
  stats: HealthStats | undefined,
  latency: LatencyStats | undefined,
  metrics: LocationMetric[],
): { totalShards: number; totalDataVolume: number; avgLatency: number; nodesOnline?: number; nodesTotal?: number; jurisdictions: number } {
  const inferredShards = metrics.reduce((sum, metric) => sum + metric.shards, 0);
  const inferredData = metrics.reduce((sum, metric) => sum + metric.dataVolume, 0);
  const inferredLatency = metrics.length
    ? metrics.reduce((sum, metric) => sum + metric.latency, 0) / metrics.length
    : 0;

  const jurisdictions = stats?.jurisdictionsActive ?? new Set(metrics.filter((metric) => metric.shards > 0).map((metric) => metric.region)).size;

  return {
    totalShards: stats?.shardsTotal ?? inferredShards,
    totalDataVolume: stats?.payloadMb ?? inferredData,
    avgLatency: latency?.averageMs ?? inferredLatency,
    nodesOnline: stats?.nodesOnline,
    nodesTotal: stats?.nodesTotal,
    jurisdictions,
  };
}

export default function GlobalMapPage() {
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
      const response = await apiRequest<HealthResponse>(`${import.meta.env.VITE_APIHOST}/health`);
      setHealth(response);
      setStatus('success');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to retrieve network health metrics.';
      setError(message);
      setStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(true), 60000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const { metrics, unmapped } = useMemo(() => buildLocationMetrics(health?.nodes ?? []), [health?.nodes]);

  const totals = useMemo(
    () => computeTotals(health?.stats, health?.latency, metrics),
    [health?.latency, health?.stats, metrics],
  );

  const topLocations = useMemo(() => {
    return [...metrics]
      .filter((metric) => metric.shards > 0)
      .sort((a, b) => b.shards - a.shards)
      .slice(0, 4);
  }, [metrics]);

  const mapStatusLabel = health?.healthy === false ? 'Degraded mesh' : 'Mesh operational';
  const lastUpdatedLabel = health?.updatedAt ? formatTimestamp(health.updatedAt) : 'Awaiting first sync';
  const refreshDisabled = status === 'loading' || isRefreshing;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Global chunk map</h1>
        <p className="text-sm text-neutral-500">{mapStatusLabel} · Last updated {lastUpdatedLabel}</p>
        {unmapped > 0 && (
          <p className="text-xs text-amber-400/80">{unmapped} node{unmapped === 1 ? '' : 's'} missing coordinates were excluded from the map.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fetchHealth(status === 'success')}
          disabled={refreshDisabled}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshDisabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {refreshDisabled ? 'Refreshing…' : 'Refresh data'}
        </button>
        {status === 'error' && error && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}
      </div>

      {status === 'loading' && !health && (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6 text-sm text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-200" />
          Fetching live replication telemetry…
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<Layers className="h-5 w-5" />}
          label="Shards in circulation"
          value={formatStat(totals.totalShards, { precision: 0 })}
          sublabel="Total encrypted partitions"
        />
        <StatCard
          icon={<Globe2 className="h-5 w-5" />}
          label="Active jurisdictions"
          value={totals.jurisdictions > 0 ? totals.jurisdictions.toString() : '—'}
          sublabel="Distinct zones"
        />
        <StatCard
          icon={<Zap className="h-5 w-5" />}
          label="Mesh latency"
          value={totals.avgLatency > 0 ? `${Math.round(totals.avgLatency)} ms` : '—'}
          sublabel="Weighted mean replication time"
        />
        <StatCard
          icon={<CloudLightning className="h-5 w-5" />}
          label="Distributed payload"
          value={totals.totalDataVolume > 0 ? `${totals.totalDataVolume.toFixed(1)} MB` : '—'}
          sublabel="Aggregate encrypted storage"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.7fr_1fr]">
        <section className="map-surface relative h-[420px] overflow-hidden border border-neutral-800/60 bg-neutral-950/90 p-6">
          <div className="map-gridline" />
          <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {mapConnections.map(([sourceId, targetId]) => {
              const source = metrics.find((metric) => metric.id === sourceId);
              const target = metrics.find((metric) => metric.id === targetId);
              if (!source || !target) {
                return null;
              }
              const midX = (source.x + target.x) / 2;
              const midY = Math.min(source.y, target.y) - 12;
              const strokeOpacity = Math.min(0.65, 0.2 + Math.max(source.shards, target.shards) / 18);
              return (
                <path
                  key={`${sourceId}-${targetId}`}
                  d={`M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`}
                  fill="none"
                  stroke={`rgba(125, 211, 252, ${strokeOpacity})`}
                  strokeWidth={0.8}
                  className="map-paths"
                />
              );
            })}
          </svg>

          {metrics.map((metric) => {
            const intensity = Math.min(1, metric.shards / 12);
            const nodeSize = 0.9 + intensity * 1.1;
            const color = tintColor(metric.color, Math.max(intensity, 0.35));
            return (
              <div
                key={metric.id}
                className="map-node"
                style={{
                  left: `${metric.x}%`,
                  top: `${metric.y}%`,
                  '--node-size': `${nodeSize}rem`,
                  '--node-color': color,
                } as CSSProperties}
              >
                <div className="map-node-label">
                  <span>
                    {metric.label}
                    {metric.shards > 0 ? ` · ${Math.round(metric.shards)} shards` : ''}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="pointer-events-none absolute inset-x-6 bottom-6 flex items-center gap-4 text-xs text-neutral-300/80">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              Active replication ring
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-sky-300" />
              Latency-weighted path
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-neutral-200/70" />
              Dormant standby site
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-100">
              <ShieldCheck className="h-5 w-5 text-emerald-300" /> Highest assurance enclaves
            </h2>
            <div className="space-y-4">
              {topLocations.map((metric) => (
                <div key={metric.id} className="space-y-2 rounded-xl border border-neutral-800/70 bg-neutral-900/60 p-4">
                  <div className="flex items-center justify-between text-sm text-neutral-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-neutral-500" />
                      <span className="font-medium text-neutral-100">{metric.label}</span>
                    </div>
                    <span className="text-xs text-neutral-500">{metric.region}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>{Math.round(metric.shards)} shards</span>
                    <span>{metric.availability.toFixed(2)}% availability</span>
                    <span>{Math.round(metric.latency)} ms</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800/80">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
                      style={{ width: `${totals.totalShards > 0 ? Math.min(100, (metric.shards / totals.totalShards) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {topLocations.length === 0 && (
                <p className="text-sm text-neutral-500">Waiting for ledger nodes to report shard telemetry.</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel }: { icon: React.ReactNode; label: string; value: string; sublabel: string }) {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800/70 bg-neutral-900/70 text-neutral-200">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-semibold text-neutral-100">{value}</p>
        <p className="text-xs uppercase tracking-[0.35em] text-neutral-500">{label}</p>
      </div>
      <p className="text-xs text-neutral-500">{sublabel}</p>
    </div>
  );
}

function formatStat(value: number, options?: { precision?: number }): string {
  if (!isFiniteNumber(value) || value <= 0) return '—';
  const precision = options?.precision ?? 0;
  if (precision === 0) {
    return Math.round(value).toLocaleString();
  }
  return value.toFixed(precision);
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toISOString();
  }
}
