import { FormEvent, useCallback, useMemo, useState } from 'react';
import {
  Clipboard,
  ClipboardCheck,
  ClipboardX,
  FileSearch,
  Loader2,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { apiRequest, ApiError } from '../lib/api';

type PageStatus = 'idle' | 'loading' | 'success' | 'error';

interface ChunkInfo {
  index: number;
  cid: string;
  size: number;
}

interface EncryptionInfo {
  key: string;
  iv: string;
}

interface IntegrityMetadata {
  originalName: string;
  hash: string;
  chunksStored: number;
  chunkList: ChunkInfo[];
  encryption?: EncryptionInfo | null;
  timestamp: string;
}

interface IntegrityResponse {
  file_decrypted: boolean;
  hash_verified: boolean;
  metadata: IntegrityMetadata | null;
  tempkey: string;
}

type CopyState = 'idle' | 'copied' | 'failed';

export default function FileValidityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<PageStatus>('idle');
  const [result, setResult] = useState<IntegrityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');

  const metadata = result?.metadata ?? null;
  const chunkList = metadata?.chunkList ?? [];
  const chunkCount = metadata?.chunksStored ?? chunkList.length;

  const totalBytes = useMemo(() => {
    if (!metadata) return 0;
    return metadata.chunkList.reduce((sum, chunk) => sum + (Number(chunk.size) || 0), 0);
  }, [metadata]);

  const formattedTotalSize = useMemo(() => formatBytes(totalBytes), [totalBytes]);

  const integritySummary = useMemo(
    () => ({
      decrypted: result?.file_decrypted ?? false,
      hashVerified: result?.hash_verified ?? false,
    }),
    [result]
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setError('Please enter a file ID to verify.');
      setStatus('error');
      setResult(null);
      return;
    }

    setStatus('loading');
    setError(null);
    setCopyState('idle');

    try {
      const response = await apiRequest<IntegrityResponse>(
        `${import.meta.env.VITE_APIHOST}/getfile?fileID=${encodeURIComponent(trimmedQuery)}`
      );
      setResult(response);
      setStatus('success');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to verify file integrity.';
      setError(message);
      setResult(null);
      setStatus('error');
    }
  };

  const handleCopyTempkey = useCallback(async () => {
    if (!result?.tempkey) {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 2000);
      return;
    }

    try {
      await navigator.clipboard.writeText(result.tempkey);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      setCopyState('failed');
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [result?.tempkey]);

  const badgeLabel = integritySummary.decrypted && integritySummary.hashVerified
    ? 'Integrity verified'
    : 'Manual review recommended';

  const badgeTone = integritySummary.decrypted && integritySummary.hashVerified ? 'success' : 'warn';

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">File Integrity</h1>
        <p className="text-sm text-neutral-500">
          Search the ledger for notarised files, inspect shard distribution, and confirm end-to-end integrity.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <FileSearch className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Enter the file ID generated at upload"
                autoComplete="off"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-4 pl-14 pr-4 text-base text-neutral-50 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-emerald-950 transition disabled:cursor-not-allowed disabled:opacity-60 hover:bg-emerald-400"
            >
              {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {status === 'loading' ? 'Verifying…' : 'Verify integrity'}
            </button>
          </div>
        </form>
      </div>

      {status === 'idle' && !result && !error && (
        <div className="rounded-2xl border border-dashed border-neutral-800/60 bg-neutral-950/40 p-10 text-center text-sm text-neutral-500">
          Provide a file ID to begin.
        </div>
      )}

      {status === 'error' && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/30 p-5 text-sm text-rose-100">
          <XCircle className="mt-0.5 h-5 w-5 text-rose-300" />
          <div>
            <p className="font-semibold text-rose-100">Verification failed</p>
            <p className="mt-1 text-rose-200/80">{error}</p>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6 text-sm text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
          Verifying integrity details. This may take a moment if the file spans multiple shards.
        </div>
      )}

      {status === 'success' && result && metadata && (
        <div className="space-y-8">
          <div className="space-y-6 rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-neutral-100">Verification summary</h2>
                <p className="text-sm text-neutral-400">
                  {metadata.originalName} · {chunkCount} shard{chunkCount === 1 ? '' : 's'} · {formattedTotalSize}
                </p>
              </div>
              <div
                className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-medium ${
                  badgeTone === 'success'
                    ? 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                    : 'border border-amber-500/40 bg-amber-500/10 text-amber-200'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                {badgeLabel}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Detail label="Original filename" value={metadata.originalName} />
              <Detail label="Hash" value={metadata.hash} mono />
              <Detail label="Chunks stored" value={chunkCount.toString()} />
              <Detail label="Ledger timestamp" value={formatTimestamp(metadata.timestamp)} />
              <Detail label="Aggregate size" value={formattedTotalSize} />
              <Detail
                label="Hash verification"
                value={integritySummary.hashVerified ? 'Verified against ledger' : 'Mismatch detected'}
                tone={integritySummary.hashVerified ? 'success' : 'warn'}
              />
            </div>

            {metadata.encryption && (
              <div className="grid gap-4 rounded-xl border border-neutral-800/60 bg-neutral-900/50 p-4 sm:grid-cols-2">
                <Detail label="Encryption key" value={metadata.encryption.key} mono />
                <Detail label="Initialization vector" value={metadata.encryption.iv} mono />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">Temporary download key</h3>
                <p className="mt-1 text-sm text-neutral-400">
                  Use this key to download the reconstructed artefact. Keys expire shortly after issuance.
                </p>
                <p className="mt-4 break-all font-mono text-sm text-neutral-200">
                  {result.tempkey || 'No download key returned.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyTempkey}
                disabled={!result.tempkey}
                className="inline-flex items-center gap-2 self-start rounded-lg border border-neutral-700 bg-neutral-900/60 px-4 py-2 text-xs font-semibold text-neutral-200 transition hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {copyState === 'copied' ? (
                  <ClipboardCheck className="h-4 w-4" />
                ) : copyState === 'failed' ? (
                  <ClipboardX className="h-4 w-4" />
                ) : (
                  <Clipboard className="h-4 w-4" />
                )}
                {copyState === 'copied'
                  ? 'Copied'
                  : copyState === 'failed'
                  ? 'Copy failed'
                  : 'Copy tempkey'}
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">Shard breakdown</h3>
                <p className="text-sm text-neutral-400">Detailed view of every stored chunk and its CID.</p>
              </div>
              <span className="text-xs text-neutral-500">
                {chunkList.length} shard{chunkList.length === 1 ? '' : 's'} indexed · {formattedTotalSize}
              </span>
            </div>

            {chunkList.length === 0 ? (
              <p className="rounded-xl border border-neutral-800/60 bg-neutral-900/50 p-4 text-sm text-neutral-400">
                No shard metadata was returned for this file.
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {chunkList.map((chunk) => (
                  <div key={`${chunk.index}-${chunk.cid}`} className="space-y-3 rounded-xl border border-neutral-800/70 bg-neutral-900/60 p-4">
                    <div className="flex items-center justify-between text-sm text-neutral-200">
                      <span className="font-semibold">Chunk {chunk.index + 1}</span>
                      <span className="rounded-full border border-neutral-700 bg-neutral-900/70 px-2 py-0.5 text-[10px] text-neutral-400">
                        CID
                      </span>
                    </div>
                    <div className="space-y-2 text-xs text-neutral-400">
                      <div className="flex items-center justify-between">
                        <span>Size</span>
                        <span className="font-mono text-neutral-200">{formatBytes(Number(chunk.size) || 0)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-400">Content identifier</span>
                        <p className="mt-1 break-all font-mono text-[11px] text-neutral-500">{chunk.cid}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {status === 'success' && result && !metadata && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 text-sm text-amber-100">
          The ledger responded successfully but no metadata was included for this file. Check the backend service logs.
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  const precision = value >= 10 || exponent === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[exponent]}`;
}

function formatTimestamp(isoString: string): string {
  if (!isoString) return 'Unknown';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
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

interface DetailProps {
  label: string;
  value: string | number;
  mono?: boolean;
  tone?: 'default' | 'success' | 'warn';
}

function Detail({ label, value, mono, tone = 'default' }: DetailProps) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-300'
      : tone === 'warn'
      ? 'text-amber-300'
      : 'text-neutral-200';

  return (
    <div className="space-y-1 rounded-xl border border-neutral-800/60 bg-neutral-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      <p className={`text-sm font-semibold ${toneClass} ${mono ? 'break-all font-mono text-xs' : ''}`}>
        {value}
      </p>
    </div>
  );
}
