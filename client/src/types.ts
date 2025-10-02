export interface Node {
  id: string;
  nodeId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Block {
  id: string;
  blockNumber: number;
  hash: string;
  previousHash: string;
  timestamp: string;
  dataHash: string;
  createdBy?: string;
  evidenceCount?: number;
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  description: string;
  uploadedBy: string;
  blockId: string;
  createdAt: string;
  uploaderName?: string;
  fileContent?: string;
}

export interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
}