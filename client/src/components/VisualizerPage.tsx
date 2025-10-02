import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Layers, Lock, Shield } from 'lucide-react';
import { getBlockStats } from '../lib/blockchain';
import { storage } from '../lib/storage';
import type { Block, EvidenceRecord } from '../types';

export default function VisualizerPage() {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  useEffect(() => {
    setBlocks(storage.getBlocks());
    setEvidence(storage.getEvidence());
  }, []);

  const stats = getBlockStats(blocks, evidence);
  const blockEvidence = (blockId: string) => evidence.filter((e) => e.blockId === blockId);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Ledger visualiser</h1>
        <p className="text-neutral-400">Explore block topology and validate chain integrity at a glance.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard icon={<Layers className="h-5 w-5" />} label="Total blocks" value={String(stats.totalBlocks)} />
        <StatCard icon={<Shield className="h-5 w-5" />} label="Evidence records" value={String(stats.totalEvidence)} />
        <IntegrityCard isValid={stats.isValid} />
        <StatCard icon={<Clock className="h-5 w-5" />} label="Latest block" value={`#${stats.latestBlock?.blockNumber ?? 0}`} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="card lg:col-span-2 overflow-x-auto p-8">
          <h2 className="mb-6 flex items-center text-xl font-semibold text-neutral-100">
            <Layers className="mr-2 h-5 w-5 text-neutral-300" /> Blockchain structure
          </h2>

          <div className="space-y-4">
            {blocks.map((block, index) => {
              const items = blockEvidence(block.id);
              const isHovered = hoveredBlock === block.id;
              const isSelected = selectedBlock?.id === block.id;

              return (
                <div key={block.id} className="flex items-center">
                  {index > 0 && (
                    <div className="mr-4 flex flex-col items-center">
                      <div className="h-8 w-px bg-neutral-700/40" />
                      <div className="text-xs text-neutral-400">↓</div>
                    </div>
                  )}

                  <div
                    className={`flex-1 cursor-pointer rounded-xl transition-all ${
                      isSelected ? 'ring-2 ring-neutral-200/70' : isHovered ? 'ring-1 ring-neutral-400/40' : ''
                    }`}
                    onMouseEnter={() => setHoveredBlock(block.id)}
                    onMouseLeave={() => setHoveredBlock(null)}
                    onClick={() => setSelectedBlock(block)}
                  >
                    <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 p-6 transition hover:border-neutral-700">
                      {block.blockNumber === 0 && (
                        <div className="absolute -top-3 left-4 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-900">
                          GENESIS
                        </div>
                      )}

                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/70">
                            <Lock className="h-6 w-6 text-neutral-200" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-100">Block #{block.blockNumber}</h3>
                            <p className="text-sm text-neutral-500">{new Date(block.timestamp).toLocaleString()}</p>
                          </div>
                        </div>

                        {items.length > 0 && (
                          <div className="rounded-full border border-neutral-700 bg-neutral-900/70 px-3 py-1">
                            <span className="text-xs font-semibold text-neutral-200">{items.length} Evidence</span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <p className="mb-1 text-neutral-500">Block hash</p>
                          <p className="break-all font-mono text-xs text-neutral-200">{block.hash.slice(0, 16)}...</p>
                        </div>
                        <div>
                          <p className="mb-1 text-neutral-500">Previous hash</p>
                          <p className="break-all font-mono text-xs text-neutral-400">{block.previousHash.slice(0, 16)}...</p>
                        </div>
                      </div>

                      {(isHovered || isSelected) && items.length > 0 && (
                        <div className="mt-4 border-t border-neutral-800 pt-4">
                          <p className="mb-2 text-xs text-neutral-500">Evidence in this block</p>
                          <div className="space-y-1">
                            {items.map((e) => (
                              <div key={e.id} className="text-xs text-neutral-500">
                                • {e.caseId}: {e.fileName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card sticky top-8 p-6">
            <h2 className="mb-4 flex items-center text-xl font-semibold text-neutral-100">
              <Shield className="mr-2 h-5 w-5 text-neutral-300" /> Block details
            </h2>

            {selectedBlock ? (
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-sm text-neutral-500">Block number</p>
                  <p className="text-2xl font-semibold text-neutral-100">#{selectedBlock.blockNumber}</p>
                </div>

                <div className="border-t border-neutral-800 pt-4">
                  <p className="mb-2 text-sm text-neutral-500">Full hash</p>
                  <p className="break-all rounded border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-200">
                    {selectedBlock.hash}
                  </p>
                </div>

                <div className="border-t border-neutral-800 pt-4">
                  <p className="mb-2 text-sm text-neutral-500">Previous hash</p>
                  <p className="break-all rounded border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-400">
                    {selectedBlock.previousHash}
                  </p>
                </div>

                <div className="border-t border-neutral-800 pt-4">
                  <p className="mb-2 text-sm text-neutral-500">Data hash</p>
                  <p className="break-all rounded border border-neutral-800 bg-neutral-950 p-3 font-mono text-xs text-neutral-400">
                    {selectedBlock.dataHash}
                  </p>
                </div>

                <div className="border-t border-neutral-800 pt-4">
                  <p className="mb-1 text-sm text-neutral-500">Timestamp</p>
                  <p className="text-neutral-100">{new Date(selectedBlock.timestamp).toLocaleDateString()}</p>
                  <p className="text-sm text-neutral-500">{new Date(selectedBlock.timestamp).toLocaleTimeString()}</p>
                </div>

                {blockEvidence(selectedBlock.id).length > 0 && (
                  <div className="border-t border-neutral-800 pt-4">
                    <p className="mb-2 text-sm text-neutral-500">Evidence records</p>
                    <div className="space-y-2">
                      {blockEvidence(selectedBlock.id).map((e) => (
                        <div key={e.id} className="rounded border border-neutral-800 bg-neutral-950 p-3">
                          <p className="text-sm font-medium text-neutral-100">{e.caseId}</p>
                          <p className="mt-1 text-xs text-neutral-500">{e.fileName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Lock className="mx-auto mb-3 h-12 w-12 text-neutral-500" />
                <p className="text-neutral-500">Select a block to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card flex items-start justify-between">
      <span className="rounded-lg border border-neutral-800 bg-neutral-900/70 p-2 text-neutral-200">{icon}</span>
      <div className="text-right">
        <div className="text-2xl font-bold text-neutral-100">{value}</div>
        <div className="text-sm text-neutral-500">{label}</div>
      </div>
    </div>
  );
}

function IntegrityCard({ isValid }: { isValid: boolean }) {
  return (
    <div className="card flex items-center justify-between">
      {isValid ? (
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-emerald-300">
          <CheckCircle2 className="h-4 w-4" /> Valid
        </span>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-red-300">
          <AlertCircle className="h-4 w-4" /> Invalid
        </span>
      )}
      <div className="text-right">
        <div className={`text-2xl font-bold ${isValid ? 'text-emerald-300' : 'text-red-300'}`}>{isValid ? 'VALID' : 'INVALID'}</div>
        <div className="text-sm text-neutral-500">Chain integrity</div>
      </div>
    </div>
  );
}