import React, { useState } from 'react';
import { GeneratedFile } from '../types';
import { Copy, Check, FileCode, Search, Edit3, Download, RefreshCw, Eye, Key, ShieldCheck, Terminal, X, Sparkles, FileText } from 'lucide-react';

interface CodeViewerProps {
  files: GeneratedFile[];
  onUpdateFileContent: (id: string, newContent: string) => void;
  onDownloadZip: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  files,
  onUpdateFileContent,
  onDownloadZip,
}) => {
  const [selectedFileId, setSelectedFileId] = useState<string>(files[0]?.id || 'dockerfile');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showSecretsModal, setShowSecretsModal] = useState<boolean>(false);

  const activeFile = files.find((f) => f.id === selectedFileId) || files[0];
  const envFile = files.find((f) => f.id === 'env-production') || {
    id: 'env-production',
    path: '.env.production',
    filename: '.env.production',
    language: 'properties',
    description: 'Secret configuration snippet formatted specifically for "fly secrets import" command',
    content: `# Fly.io Secret Import File (.env.production)\nOPENCLAW_GATEWAY_TOKEN=openclaw-secret-key`,
  };

  const handleCopyContent = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadSingleFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredFiles = files.filter(
    (f) =>
      f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const flySecretsImportCommand = `fly secrets import < .env.production`;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col h-[700px]">
      
      {/* Top Header Controls */}
      <div className="bg-slate-950 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileCode className="w-5 h-5 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Generated Project Bundle Context</h2>
          <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
            {files.length} Files Configured
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export .env.production Feature Button */}
          <button
            onClick={() => setShowSecretsModal(true)}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Export secret config snippet for 'fly secrets import'"
          >
            <Key className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export .env.production</span>
          </button>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter stack files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-36 sm:w-44"
            />
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            {isEditing ? 'Read Mode' : 'Edit Mode'}
          </button>

          <button
            onClick={() => handleCopyContent(activeFile.content, activeFile.id)}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
          >
            {copiedId === activeFile.id ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy File
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Sidebar: File List */}
        <div className="w-full md:w-64 bg-slate-950/60 border-r border-slate-800/80 p-2 overflow-y-auto shrink-0 space-y-1">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 py-1 flex items-center justify-between">
            <span>Stack Repository Files</span>
            <span className="text-[9px] text-indigo-400 font-normal">Click to View</span>
          </div>
          {filteredFiles.map((file) => {
            const isSelected = file.id === activeFile.id;
            const isEnvFile = file.id === 'env-production';
            return (
              <button
                key={file.id}
                onClick={() => {
                  setSelectedFileId(file.id);
                  setIsEditing(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg transition flex flex-col gap-0.5 group ${
                  isSelected
                    ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                    : isEnvFile
                    ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-900/40'
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-mono font-medium flex items-center gap-1.5 ${isSelected ? 'text-indigo-300' : isEnvFile ? 'text-emerald-300 font-bold' : 'text-slate-300'}`}>
                    {isEnvFile && <Key className="w-3 h-3 text-emerald-400" />}
                    <span>{file.filename}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">{file.language}</span>
                </div>
                <span className="text-[10px] text-slate-500 truncate">{file.description}</span>
              </button>
            );
          })}
        </div>

        {/* Right Pane: Code Display & Editor */}
        <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
          
          {/* Contextual Banner for .env.production */}
          {activeFile.id === 'env-production' && (
            <div className="bg-emerald-950/60 border-b border-emerald-500/30 p-2.5 px-4 text-xs flex flex-wrap items-center justify-between gap-2 text-emerald-200">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Fly Secrets Format:</strong> Run <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-500/30 font-mono text-emerald-300">fly secrets import &lt; .env.production</code> in terminal.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyContent(flySecretsImportCommand, 'fly-import-cmd')}
                className="px-2.5 py-1 bg-emerald-900 hover:bg-emerald-800 border border-emerald-500/40 text-emerald-100 font-mono rounded text-[11px] transition flex items-center gap-1"
              >
                {copiedId === 'fly-import-cmd' ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                <span>{copiedId === 'fly-import-cmd' ? 'Copied CLI Command!' : 'Copy CLI Command'}</span>
              </button>
            </div>
          )}

          {/* File Meta Banner */}
          <div className="bg-slate-900/60 px-4 py-2 border-b border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Path: <strong className="text-indigo-400">{activeFile.path}</strong></span>
            <span>{activeFile.content.split('\n').length} lines</span>
          </div>

          {/* Editor or Highlighting Area */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed">
            {isEditing ? (
              <textarea
                value={activeFile.content}
                onChange={(e) => onUpdateFileContent(activeFile.id, e.target.value)}
                className="w-full h-full bg-slate-950 text-slate-100 font-mono text-xs p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                spellCheck={false}
              />
            ) : (
              <pre className="text-slate-200 selection:bg-indigo-500/30">
                <code>
                  {activeFile.content.split('\n').map((line, idx) => (
                    <div key={idx} className="table-row">
                      <span className="table-cell select-none text-slate-600 text-right pr-4 text-[11px] w-10">
                        {idx + 1}
                      </span>
                      <span className="table-cell whitespace-pre font-mono">
                        {highlightSyntax(line, activeFile.language)}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            )}
          </div>

          {/* Bottom Bar */}
          <div className="bg-slate-900/80 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              {isEditing ? (
                <span className="text-amber-400 font-medium">✏️ Custom modifications active</span>
              ) : (
                <span>Click &quot;Edit Mode&quot; to override line contents directly</span>
              )}
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleDownloadSingleFile(activeFile.filename, activeFile.content)}
                className="text-slate-300 hover:text-white font-medium flex items-center gap-1 text-xs transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" /> Save {activeFile.filename}
              </button>
              <button
                onClick={onDownloadZip}
                className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 text-xs"
              >
                <Download className="w-3.5 h-3.5" /> Download Full Stack Bundle
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Export .env.production Secrets Modal */}
      {showSecretsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl p-6 relative space-y-5 my-8">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Export Secrets (.env.production)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      fly secrets import
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bulk-import API keys and secrets directly into your Fly.io application
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSecretsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  How to Use with Fly CLI
                </span>
                <p className="text-slate-300 leading-relaxed">
                  Save or copy the formatted key-value snippet below into a local <code className="text-emerald-300 font-mono">.env.production</code> file and run the following command in your terminal:
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 flex items-center justify-between">
                  <span>{flySecretsImportCommand}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyContent(flySecretsImportCommand, 'modal-fly-cmd')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[10px] transition flex items-center gap-1"
                  >
                    {copiedId === 'modal-fly-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-indigo-400" />}
                    <span>{copiedId === 'modal-fly-cmd' ? 'Copied Command!' : 'Copy Command'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-300 font-medium">
                  <span>Snippet Content (.env.production):</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {envFile.content.split('\n').length} lines
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 max-h-52 overflow-y-auto leading-relaxed">
                  <pre>{envFile.content}</pre>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => handleDownloadSingleFile('.env.production', envFile.content)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow transition"
              >
                <Download className="w-4 h-4" />
                <span>Download .env.production File</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyContent(envFile.content, 'modal-secrets-content')}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition flex items-center gap-1.5"
                >
                  {copiedId === 'modal-secrets-content' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-indigo-400" />}
                  <span>{copiedId === 'modal-secrets-content' ? 'Copied Snippet!' : 'Copy Snippet'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSecretsModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// Simple visual syntax colorizer for Dockerfile, TOML, INI, Bash, JSON, Properties
function highlightSyntax(line: string, language: string): React.ReactNode {
  if (line.trim().startsWith('#') || line.trim().startsWith('//') || line.trim().startsWith(';')) {
    return <span className="text-slate-500 italic">{line}</span>;
  }

  if (language === 'dockerfile') {
    const parts = line.split(' ');
    const keyword = parts[0];
    const rest = parts.slice(1).join(' ');
    if (['FROM', 'RUN', 'WORKDIR', 'COPY', 'EXPOSE', 'ENTRYPOINT', 'ENV', 'ARG', 'AS'].includes(keyword)) {
      return (
        <span>
          <span className="text-indigo-400 font-bold">{keyword}</span> {rest}
        </span>
      );
    }
  }

  if (language === 'toml' || language === 'ini' || language === 'properties') {
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      return <span className="text-purple-400 font-bold">{line}</span>;
    }
    if (line.includes('=')) {
      const [key, ...val] = line.split('=');
      return (
        <span>
          <span className="text-cyan-400 font-semibold">{key}</span>=<span className="text-emerald-300">{val.join('=')}</span>
        </span>
      );
    }
  }

  if (language === 'bash') {
    if (line.startsWith('echo')) {
      return (
        <span>
          <span className="text-emerald-400 font-semibold">echo</span> {line.substring(5)}
        </span>
      );
    }
  }

  return <span>{line}</span>;
}

