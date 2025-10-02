import { Node, Block, EvidenceRecord } from '../types';

const STORAGE_KEYS = {
  CURRENT_NODE: 'ledgis_current_node',
  BLOCKS: 'ledgis_blocks',
  EVIDENCE: 'ledgis_evidence',
  AUTH_TOKEN: 'ledgis_auth_token',
} as const;

export const storage = {
  setCurrentNode: (node: Node | null) => {
    if (node) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_NODE, JSON.stringify(node));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_NODE);
    }
  },

  getCurrentNode: (): Node | null => {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_NODE);
    return data ? JSON.parse(data) : null;
  },

  getBlocks: (): Block[] => {
    const data = localStorage.getItem(STORAGE_KEYS.BLOCKS);
    if (!data) {
      const genesisBlock: Block = {
        id: 'genesis',
        blockNumber: 0,
        hash: '0000000000000000000000000000000000000000000000000000000000000000',
        previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
        timestamp: new Date().toISOString(),
        dataHash: 'genesis',
        evidenceCount: 0,
      };
      storage.setBlocks([genesisBlock]);
      return [genesisBlock];
    }
    return JSON.parse(data);
  },

  setBlocks: (blocks: Block[]) => {
    localStorage.setItem(STORAGE_KEYS.BLOCKS, JSON.stringify(blocks));
  },

  addBlock: (block: Block) => {
    const blocks = storage.getBlocks();
    blocks.push(block);
    storage.setBlocks(blocks);
  },

  getEvidence: (): EvidenceRecord[] => {
    const data = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
    return data ? JSON.parse(data) : [];
  },

  setEvidence: (evidence: EvidenceRecord[]) => {
    localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(evidence));
  },

  addEvidence: (record: EvidenceRecord) => {
    const evidence = storage.getEvidence();
    evidence.push(record);
    storage.setEvidence(evidence);
  },

  setAuthToken: (token: string | null) => {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  clearAll: () => {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_NODE);
    localStorage.removeItem(STORAGE_KEYS.BLOCKS);
    localStorage.removeItem(STORAGE_KEYS.EVIDENCE);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};