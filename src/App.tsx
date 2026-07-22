import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { CodeViewer } from './components/CodeViewer';
import { TopologyDiagram } from './components/TopologyDiagram';
import { DeploymentChecklist } from './components/DeploymentChecklist';
import { SandboxSimulator } from './components/SandboxSimulator';
import { AIAdvisorDrawer } from './components/AIAdvisorDrawer';
import { StackConfig, GeneratedFile, ValidationResult, ActiveTab } from './types';
import { initialConfig, generateStackFiles } from './data/defaultConfigs';
import { Server, Layers, CheckCircle2, FileCode, Download, ExternalLink } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<StackConfig>(initialConfig);
  const [files, setFiles] = useState<GeneratedFile[]>(generateStackFiles(initialConfig));
  const [activeTab, setActiveTab] = useState<ActiveTab>('configurator');
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Re-generate file contents when configuration changes
  useEffect(() => {
    const newFiles = generateStackFiles(config);
    setFiles(newFiles);

    // Trigger backend validation check
    fetch('/api/validate-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
      .then((res) => res.json())
      .then((data) => setValidation(data))
      .catch((err) => console.error('Config validation check error:', err));
  }, [config]);

  // Handle manual line editing in CodeViewer
  const handleUpdateFileContent = (id: string, newContent: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, content: newContent, isCustomized: true } : f))
    );
  };

  // Reset to default configuration
  const handleResetDefaults = () => {
    setConfig(initialConfig);
    setFiles(generateStackFiles(initialConfig));
  };

  // Build and trigger ZIP download of the entire stack bundle
  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder(config.appName) || zip;

      files.forEach((file) => {
        rootFolder.file(file.path, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      saveAs(blob, `${config.appName}-fly-stack.zip`);
    } catch (err) {
      console.error('Failed to build ZIP archive:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 flex flex-col">
      
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        appName={config.appName}
        config={config}
        onDownloadZip={handleDownloadZip}
        onResetDefaults={handleResetDefaults}
        isDownloading={isDownloading}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* TAB 1: CONFIGURATOR & CODE VIEWER */}
        {activeTab === 'configurator' && (
          <div className="space-y-6">
            
            {/* Quick Hero Summary Card */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-indigo-400" />
                  OmniRoute + OpenClaw Side-by-Side Machine Bundle
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  Generates a multi-process Docker image running <strong className="text-indigo-300">OmniRoute</strong> (local AI router on port {config.omniroutePort}), <strong className="text-emerald-300">OpenClaw</strong> (assistant gateway on port {config.gatewayPort}), and <strong className="text-amber-300">Redis</strong> (cache on port {config.redisPort}) inside a single Fly Machine.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDownloadZip}
                  disabled={isDownloading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Export .ZIP Bundle
                </button>
              </div>
            </div>

            {/* Split Grid: Config Controls & Live Code Viewer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              <div className="lg:col-span-5">
                <ConfigPanel
                  config={config}
                  onChange={setConfig}
                  validation={validation}
                />
              </div>

              <div className="lg:col-span-7">
                <CodeViewer
                  files={files}
                  onUpdateFileContent={handleUpdateFileContent}
                  onDownloadZip={handleDownloadZip}
                />
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: ARCHITECTURE TOPOLOGY */}
        {activeTab === 'topology' && (
          <TopologyDiagram config={config} />
        )}

        {/* TAB 3: DEPLOYMENT WIZARD */}
        {activeTab === 'wizard' && (
          <DeploymentChecklist config={config} />
        )}

        {/* TAB 4: ROUTING SANDBOX */}
        {activeTab === 'sandbox' && (
          <SandboxSimulator config={config} />
        )}

        {/* TAB 5: GEMINI AI ADVISOR */}
        {activeTab === 'ai-advisor' && (
          <AIAdvisorDrawer config={config} />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-xs text-slate-500 text-center mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            OmniRoute & OpenClaw Combined Fly.io Deployment Architect • Built with React & Tailwind
          </span>
          <span className="font-mono text-[11px] text-slate-400">
            OpenClaw: 0.0.0.0:{config.gatewayPort} • OmniRoute: 127.0.0.1:{config.omniroutePort} • Redis: 127.0.0.1:{config.redisPort}
          </span>
        </div>
      </footer>

    </div>
  );
}
