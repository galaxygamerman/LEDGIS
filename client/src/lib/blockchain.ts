import { Block, EvidenceRecord } from '../types';

export function generateHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64);
}

export function createBlock(
  blockNumber: number,
  previousHash: string,
  evidenceIds: string[],
  createdBy: string
): Block {
  const timestamp = new Date().toISOString();
  const dataHash = generateHash(evidenceIds.join(',') + timestamp);
  const hash = generateHash(blockNumber + previousHash + dataHash + timestamp);

  return {
    id: `block-${blockNumber}`,
    blockNumber,
    hash,
    previousHash,
    timestamp,
    dataHash,
    createdBy,
    evidenceCount: evidenceIds.length,
  };
}

export function validateBlockchain(blocks: Block[]): boolean {
  if (blocks.length === 0) return false;

  for (let i = 1; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    const previousBlock = blocks[i - 1];

    if (currentBlock.previousHash !== previousBlock.hash) {
      return false;
    }

    if (currentBlock.blockNumber !== previousBlock.blockNumber + 1) {
      return false;
    }
  }

  return true;
}

export function getBlockStats(blocks: Block[], evidence: EvidenceRecord[]) {
  const totalBlocks = blocks.length;
  const totalEvidence = evidence.length;
  const latestBlock = blocks[blocks.length - 1];

  return {
    totalBlocks,
    totalEvidence,
    latestBlock,
    isValid: validateBlockchain(blocks),
  };
}