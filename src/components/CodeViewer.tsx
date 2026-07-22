import React, { useState } from 'react';
import { GeneratedFile } from '../types';
import { Copy, Check, FileCode, Search, Edit3, Download, RefreshCw, Eye } from 'lucide-react';

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

  const activeFile = files.find((f) => f.id === selectedFileId) || files[0];

  const handleCopyContent = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFiles = files.filter(
    (f) =>
      f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Filter stack files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44"
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
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider px-2 py-1">
            Stack Repository Files
          </div>
          {filteredFiles.map((file) => {
            const isSelected = file.id === activeFile.id;
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
                    : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-mono font-medium ${isSelected ? 'text-indigo-300' : 'text-slate-300'}`}>
                    {file.filename}
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
  );
};

// Simple visual syntax colorizer for Dockerfile, TOML, INI, Bash, JSON
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

  if (language === 'toml' || language === 'ini') {
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      return <span className="text-purple-400 font-bold">{line}</span>;
    }
    if (line.includes('=')) {
      const [key, ...val] = line.split('=');
      return (
        <span>
          <span className="text-cyan-400">{key}</span>=<span className="text-emerald-300">{val.join('=')}</span>
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
