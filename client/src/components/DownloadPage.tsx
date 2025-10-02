import { FormEvent, useCallback, useMemo, useState } from 'react';
import { Check, Download, KeyRound, Layers, Loader2, XCircle } from 'lucide-react';
import { apiDownload, ApiError } from '../lib/api';
import { triggerBrowserDownload } from '../lib/download';

type PageStatus = 'idle' | 'loading' | 'success' | 'error';

interface DownloadDetails {
  fileName: string;
  size: number;
  contentType?: string | null;
  completedAt: string;
}

export default function DownloadPage() {
  const [tempkey, setTempkey] = useState('');
  const [status, setStatus] = useState<PageStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [details, setDetails] = useState<DownloadDetails | null>(null);

  const appendHistory = useCallback((message: string) => {
    setHistory((previous) => [message, ...previous].slice(0, 5));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = tempkey.trim();

    if (!trimmed) {
      setStatus('error');
      setError('Please provide the temporary key issued from the integrity check.');
      setDetails(null);
      return;
    }

    setStatus('loading');
    setError(null);
    setDetails(null);
    appendHistory(`🔑 Requesting download for tempkey ${trimmed.slice(0, 6)}…`);

    try {
      const { blob, fileName, contentType } = await apiDownload(
        `${import.meta.env.VITE_APIHOST}/download?tempkey=${encodeURIComponent(trimmed)}`,
        {
          method: 'GET',
        }
      );

      const suggestedName = fileName ?? `ledger-download-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      triggerBrowserDownload(blob, suggestedName);

      appendHistory(`✅ Download started (${suggestedName})`);
      setDetails({
        fileName: suggestedName,
        size: blob.size,
        contentType,
        completedAt: new Date().toISOString(),
      });
      setStatus('success');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Unable to retrieve the file. Please try again.';
      setError(message);
      appendHistory(`⛔️ Download failed: ${message}`);
      setStatus('error');
    }
  };

  const formattedSize = useMemo(() => {
    if (!details) return null;
    return formatBytes(details.size);
  }, [details]);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Download File</h1>
        <p className="text-sm text-neutral-500">
          Provide a valid temporary key to retrieve and reconstruct the notarised artefact from the ledger.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-xs uppercase tracking-[0.3em] text-neutral-500">Temporary key</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <KeyRound className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
              <input
                value={tempkey}
                onChange={(event) => setTempkey(event.target.value)}
                placeholder="Paste the tempkey from the integrity check"
                autoComplete="off"
                className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 py-4 pl-14 pr-4 text-base text-neutral-50 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {status === 'loading' ? 'Retrieving…' : 'Download file'}
            </button>
          </div>
          <p className="text-xs text-neutral-500">
            Keys expire after first use or a short time window. Run a fresh integrity check if the download no longer works.
          </p>
        </form>
      </div>

      {status === 'loading' && (
        <div className="flex items-center gap-3 rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6 text-sm text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-200" />
          Preparing your file. We’re reconstructing shards and streaming the payload securely.
        </div>
      )}

      {status === 'error' && error && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm text-rose-100">
          <XCircle className="mt-0.5 h-5 w-5 text-rose-300" />
          <div>
            <p className="font-semibold">Download failed</p>
            <p className="mt-1 text-rose-200/80">{error}</p>
          </div>
        </div>
      )}

      {status === 'success' && details && (
        <div className="space-y-4 rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-100">Download initiated</h2>
              <p className="text-sm text-neutral-400">Check your browser’s downloads tray if the save prompt didn’t appear automatically.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
              <Check className="h-4 w-4" /> Secure transfer
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Detail label="File name" value={details.fileName} mono />
            <Detail label="Size" value={formattedSize ?? 'Unknown'} />
            <Detail label="Content type" value={details.contentType ?? 'Not specified'} />
            <Detail label="Completed at" value={formatTimestamp(details.completedAt)} />
            <Detail label="Tempkey used" value={tempkey.trim()} mono />
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-200">
            <Layers className="h-4 w-4 text-neutral-400" /> Retrieval log
          </div>
          <ul className="space-y-2 text-xs text-neutral-500">
            {history.map((entry, index) => (
              <li key={`${entry}-${index}`} className="rounded-lg border border-neutral-800/70 bg-neutral-900/60 px-3 py-2">
                {entry}
              </li>
            ))}
          </ul>
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
}

function Detail({ label, value, mono }: DetailProps) {
  return (
    <div className="space-y-1 rounded-xl border border-neutral-800/60 bg-neutral-900/50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      <p className={`text-sm font-semibold text-neutral-200 ${mono ? 'break-all font-mono text-xs' : ''}`}>{value}</p>
    </div>
  );
}
