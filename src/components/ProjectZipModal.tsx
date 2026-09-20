import React, { useState } from 'react';
import {
  X,
  Download,
  FolderArchive,
  FileCode,
  FileText,
  Check,
  Copy,
  Eye,
  Play,
  Sparkles,
  Layers,
  ArrowDownToLine,
  CheckCircle2,
} from 'lucide-react';
import { ProjectFile, downloadProjectAsZip } from '../utils/zipGenerator';
import { useAppTheme } from '../context/ThemeContext';

interface ProjectZipModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  files: ProjectFile[];
  language?: 'roman-urdu' | 'urdu' | 'english';
}

export const ProjectZipModal: React.FC<ProjectZipModalProps> = ({
  isOpen,
  onClose,
  projectName,
  files,
  language = 'roman-urdu',
}) => {
  const { themeConfig } = useAppTheme();
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [copiedFileIndex, setCopiedFileIndex] = useState<number | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!isOpen) return null;

  const currentFile = files[selectedFileIndex] || files[0];

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      await downloadProjectAsZip(files, projectName);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate ZIP:', err);
      alert('Could not package ZIP file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyCode = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedFileIndex(index);
    setTimeout(() => setCopiedFileIndex(null), 2000);
  };

  // Build live preview HTML if index.html is present
  const htmlFile = files.find((f) => f.name.endsWith('.html'));
  const cssFile = files.find((f) => f.name.endsWith('.css'));
  const jsFile = files.find((f) => f.name.endsWith('.js'));

  let combinedPreviewDoc = '';
  if (htmlFile) {
    let raw = htmlFile.content;
    if (cssFile && !raw.includes(cssFile.content)) {
      raw = raw.replace('</head>', `<style>${cssFile.content}</style></head>`);
    }
    if (jsFile && !raw.includes(jsFile.content)) {
      raw = raw.replace('</body>', `<script>${jsFile.content}</script></body>`);
    }
    combinedPreviewDoc = raw;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md">
      <div className="relative flex max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-4 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <FolderArchive className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {language === 'roman-urdu'
                    ? 'Complete Project ZIP Package (Pura Kam Ready)'
                    : 'Complete Project ZIP Package (100% Done)'}
                </h2>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-mono font-medium text-emerald-400">
                  {files.length} Files Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {language === 'roman-urdu'
                  ? 'Koi manual coding prompt ya copy-paste ki zaroorat nahi — 1-click mein ready ZIP file download karein.'
                  : 'No manual code copying or prompt assembly required — direct downloadable project bundle.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct 1-Click ZIP Download Button */}
            <button
              id="modal-direct-zip-download-btn"
              onClick={handleDownloadZip}
              disabled={isDownloading}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white'
                  : `bg-gradient-to-r ${themeConfig.buttonGradient}`
              }`}
            >
              {isDownloading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Packaging ZIP...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>ZIP Downloaded!</span>
                </>
              ) : (
                <>
                  <ArrowDownToLine className="h-4 w-4" />
                  <span>
                    {language === 'roman-urdu' ? 'Download Project (.ZIP)' : 'Download Ready ZIP'}
                  </span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Live Preview Toggle (if Web Project) */}
        {combinedPreviewDoc && (
          <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-5 py-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {language === 'roman-urdu'
                  ? 'Web App detected — aap live run karke bhi dekh sakte hain!'
                  : 'Runnable Web App detected — test it live in the preview sandbox!'}
              </span>
            </div>
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
            >
              {isPreviewOpen ? <FileCode className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span>{isPreviewOpen ? 'Show Source Code' : 'Live Browser Preview'}</span>
            </button>
          </div>
        )}

        {/* Content Area: Split File Tree & File Viewer or Live Preview */}
        <div className="flex flex-1 overflow-hidden min-h-[420px]">
          {isPreviewOpen && combinedPreviewDoc ? (
            /* Live Web App Sandbox Preview */
            <div className="flex-1 bg-white">
              <iframe
                title="Live Project Preview"
                srcDoc={combinedPreviewDoc}
                sandbox="allow-scripts"
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            <>
              {/* Left Column: File Explorer List */}
              <div className="w-56 sm:w-64 border-r border-slate-800/80 bg-slate-950/60 flex flex-col shrink-0">
                <div className="p-3 border-b border-slate-800/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Project Files</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">{files.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
                  {files.map((file, idx) => (
                    <button
                      key={file.name + idx}
                      onClick={() => setSelectedFileIndex(idx)}
                      className={`w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition-all ${
                        selectedFileIndex === idx
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium'
                          : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {file.name.endsWith('.md') ? (
                          <FileText className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <FileCode className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="truncate font-mono text-[11px]">{file.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 ml-1 shrink-0">
                        {file.size}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Quick ZIP Status footer in left col */}
                <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
                  <button
                    onClick={handleDownloadZip}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 py-2 text-[11px] font-semibold text-emerald-300 transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download All in .ZIP</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Code / Content Viewer */}
              <div className="flex-1 flex flex-col bg-slate-900/40 min-w-0">
                {/* File Header Bar */}
                <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-2.5 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode className="h-4 w-4 text-indigo-400 shrink-0" />
                    <span className="font-mono font-semibold text-white truncate">
                      {currentFile?.name}
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-400">
                      {currentFile?.language || 'text'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyCode(currentFile.content, selectedFileIndex)}
                      className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-700 transition-colors"
                    >
                      {copiedFileIndex === selectedFileIndex ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 text-slate-400" />
                          <span>Copy File</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* File Content Body */}
                <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200 select-text">
                  <pre className="!bg-transparent !p-0 !m-0">
                    <code>{currentFile?.content}</code>
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-800/80 bg-slate-950 px-5 py-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {language === 'roman-urdu'
                ? 'Files bilkul ready hain — unzipping ke baad bina kisi dependency ke directly run ho sakti hain.'
                : 'All files packed and ready to run directly after unzipping.'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-500">
              Format: Standard .ZIP Archive
            </span>
            <button
              onClick={handleDownloadZip}
              className="font-semibold text-emerald-400 hover:text-emerald-300 underline text-xs"
            >
              {language === 'roman-urdu' ? 'ZIP File Download Karein' : 'Download ZIP File'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
