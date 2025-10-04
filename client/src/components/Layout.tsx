import { Download, Globe2, GlobeLock, Layers, LogOut, Menu, Search, Upload, Workflow, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Node } from '../types';

const logoSrc = new URL('../public/ledgis-logo.png', import.meta.url).href;

interface LayoutProps {
  onLogout: () => void;
  currentNode: Node;
}

export default function Layout({ onLogout, currentNode }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/app/upload', label: 'Upload', icon: Upload, description: 'Add new evidence to the ledger' },
    { to: '/app/check-integrity', label: 'Check Integrity', icon: Search, description: 'Verify evidence integrity' },
    { to: '/app/download', label: 'Download File', icon: Download, description: 'Retrieve reconstructed evidence' },
    // { to: '/app/visualizer', label: 'Visualizer', icon: Layers, description: 'Inspect blockchain flow' },
    { to: '/app/global-map', label: 'Global Map', icon: Globe2, description: 'Track IPFS node distribution worldwide' },
  ];

  return (
    <div className="relative flex min-h-screen bg-neutral-950 text-neutral-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-16 h-72 w-72 rounded-full bg-neutral-900/50 blur-3xl" />
        <div className="absolute right-0 top-24 h-[26rem] w-[26rem] rounded-full bg-neutral-800/30 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px] opacity-60" />
      </div>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 transform border-r border-neutral-800/60 bg-neutral-900/50 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-neutral-800/60 p-6">
            <div className="mb-6 flex items-center justify-between">
              <img src={logoSrc} alt="LEDGIS" className="h-10 w-auto" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-neutral-500 transition hover:text-neutral-200 lg:hidden">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 rounded-2xl border border-neutral-800/60 bg-neutral-950/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800/80 bg-neutral-900/80">
                  {/* <span className="text-sm font-semibold text-neutral-200">{currentNode.nodeId.slice(5, 7)}</span> */}
                  <GlobeLock />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-neutral-200"><span className='text-neutral-500'>{currentNode.name}</span>@node{currentNode.nodeId}</p>
                  {/* <p className="truncate text-xs text-neutral-500">{currentNode.name}@node{currentNode.nodeId}</p>  */}
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group relative block overflow-hidden rounded-xl text-left"
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
                          isActive
                            ? 'bg-neutral-900/80 text-neutral-50 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.9)] border border-neutral-800'
                            : 'border border-transparent text-neutral-400 hover:border-neutral-800 hover:bg-neutral-900/60 hover:text-neutral-100'
                        }`}
                      >
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-colors ${
                            isActive
                              ? 'border-neutral-700 bg-neutral-800/90 text-neutral-100'
                              : 'border-neutral-800 bg-neutral-900/70 text-neutral-400'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-neutral-500">{item.description}</p>
                        </div>
                      </div>
                      {isActive && <div className="absolute inset-y-0 left-0 w-[2px] bg-neutral-100" />}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 bg-neutral-950/80 backdrop-blur-sm lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <div className="relative flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-neutral-800/60 bg-neutral-900/50 px-6 py-4 backdrop-blur-xl lg:px-10">
          <div className="flex items-center justify-between gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="-ml-1 rounded-lg border border-neutral-800/70 bg-neutral-900/70 p-2 text-neutral-400 transition hover:text-neutral-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:flex items-center gap-3 text-xs text-neutral-400">
              {/* <div className="flex items-center gap-2 rounded-lg border border-neutral-800/60 bg-neutral-900/60 px-3 py-2">
                <span className={`h-2 w-2 rounded-full ${(localStorage.getItem("net-health")=="healthy")?"bg-emerald-400":"bg-red-400"} animate-pulse`} />
                legis system {localStorage.getItem("net-health")||"down"}
              </div> */}
              {/* <div className="flex items-center gap-2 rounded-lg border border-neutral-800/60 bg-neutral-900/60 px-3 py-2">
              </div> */}
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-400 lg:hidden">
              <div className="flex items-center gap-2 rounded-lg border border-neutral-800/60 bg-neutral-900/60 px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </div>
            </div>
            <button
              onClick={onLogout}
              className="group inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/60 px-4 py-2 text-sm font-medium text-neutral-300 transition hover:border-neutral-700 hover:bg-neutral-900/80 hover:text-neutral-50"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="relative flex-1 px-6 py-8 lg:px-10">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-neutral-900/20 via-transparent to-transparent" />
          <div className="relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
