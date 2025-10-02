import { useRef, useState,useEffect } from 'react';
import { CheckCircle2, Loader2, Upload } from 'lucide-react';
import { apiRequest, ApiError } from '../lib/api';
import { Node } from '../types';
import { useNavigate } from 'react-router-dom';
interface UploadPageProps {
  currentNode: Node;
}

interface UploadResponse {
  message: string;
  res?: {
    success: boolean;
    hash?: string;
  };
}

interface UploadResult {
  message: string;
  success: boolean;
  hash?: string;
}

export default function UploadPage({ currentNode }: UploadPageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const navigate=useNavigate();
  const [pageload,setpageLoad]=useState(true);
  useEffect(()=>{
    const checkReg=async()=>{
      const res=await fetch(`${import.meta.env.VITE_APIHOST}/auth/check_reg`,{
        headers:{
         'Authorization':`Bearer ${localStorage.getItem("ledgis_auth_token")}`
        }
      })
      const data=await res.json();
      if(data.success){
        setpageLoad(false)
      }
      else {
        console.log(data.success)
        navigate("/login");
      }
    }
    checkReg()
  },[])
  const handleFileSelection = (file: File | null) => {
    setUploadError(null);
    setUploadResult(null);
    setSelectedFile(file);
    setFileName(file?.name ?? '');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploadError(null);

    if (!selectedFile) {
      setUploadError('Please select an evidence file to upload.');
      return;
    }

    if (!fileName.trim()) {
      setUploadError('Please provide the original file name.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('evidence', selectedFile);
      formData.append('file_name', fileName.trim());

      const response = await apiRequest<UploadResponse>(`${import.meta.env.VITE_APIHOST}/upload`, {
        method: 'POST',
        body: formData,
      });

      setUploadResult({
        message: response.message,
        success: response.res?.success ?? false,
        hash: response.res?.hash,
      });

      setSelectedFile(null);
      setFileName('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.log(error)
      if (error instanceof ApiError) {
        setUploadError(error.message);
      } else {
        setUploadError('Unexpected error while uploading evidence.');
      }
    } finally {
      setIsUploading(false);
    }
  };
  if(pageload)return <></>
  else return (
    <div className="relative space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Evidence Upload</h1>
        <p className="text-sm text-neutral-500">
          Submit artefacts directly to the ledger service. Files are transmitted securely and chunked server-side.
        </p>
        <p className="text-xs text-neutral-600">
          Signed in as <span className="font-mono text-neutral-300">{currentNode.name}</span> · Node{' '}
          <span className="font-mono text-neutral-300">{currentNode.nodeId}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-8 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.8)]">
        <div className="space-y-2">
          <label htmlFor="file-name" className="text-sm font-medium text-neutral-200">
            File name
          </label>
          <input
            id="file-name"
            name="file_name"
            type="text"
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            placeholder="Enter the file name"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-4 py-3 text-neutral-50 placeholder-neutral-500 focus:border-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-700"
            disabled={isUploading}
          />
          <p className="text-xs text-neutral-500">This name will be stored alongside the notarised evidence.</p>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const file = event.dataTransfer.files[0];
            if (file) {
              handleFileSelection(file);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border border-dashed px-5 py-10 text-center transition ${
            selectedFile
              ? 'border-emerald-400/40 bg-neutral-900/60'
              : isDragging
              ? 'border-neutral-100/60 bg-neutral-900/60'
              : 'border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/50'
          }`}
        >
          <input title="file"
            ref={fileInputRef}
            type="file"
            onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
            className="hidden"
          />
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-neutral-700/70 bg-neutral-900/70">
            <Upload className="h-8 w-8 text-neutral-200" />
          </div>
          <div className="mt-5 space-y-2">
            <p className="text-lg font-medium text-neutral-100">Drop evidence or browse your workstation</p>
            <p className="text-sm text-neutral-500">Supports videos, archives, disk images, PDFs, and structured exports.</p>
          </div>
          {selectedFile && (
            <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/70 px-4 py-3 text-sm text-neutral-300">
              <p className="font-medium text-neutral-100">{selectedFile.name}</p>
              <p className="text-neutral-500">{(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'unknown type'}</p>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <span className="mt-1 block h-2 w-2 rounded-full bg-red-400" />
            {uploadError}
          </div>
        )}

        {uploadResult && (
          <div className="rounded-xl border border-neutral-800/60 bg-neutral-900/50 p-5 text-sm text-neutral-200">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                {uploadResult.success ? 'Upload processed successfully' : 'Upload completed'}
              </span>
              {uploadResult.hash && <span className="font-mono text-xs text-neutral-400">{uploadResult.hash}</span>}
            </div>
            <p className="mt-3 text-neutral-400">{uploadResult.message}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedFile || isUploading}
          className="btn-primary inline-flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? 'Uploading evidence…' : 'Commit evidence to ledger'}
        </button>
      </form>
    </div>
  );
}
