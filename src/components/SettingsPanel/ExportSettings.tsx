import React, { useState } from 'react';
import { ChatState } from '../../types';
import { exportChat, downloadExport, getMimeType, getFileExtension, ExportOptions } from '../../utils/export';

type ExportFormat = 'json' | 'markdown' | 'text';

interface ExportSettingsProps {
  state: ChatState;
  className?: string;
}

const exportFormats: { value: ExportFormat; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'json', label: 'JSON', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>, description: 'Full data with metadata' },
  { value: 'markdown', label: 'Markdown', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>, description: 'Human-readable format' },
  { value: 'text', label: 'Plain Text', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5z" clipRule="evenodd" /></svg>, description: 'Simple dialogue' },
];

export function ExportSettings({ state, className = '' }: ExportSettingsProps) {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
  const [includeMetadata, setIncludeMetadata] = useState(true);

  const handleExport = () => {
    const options: ExportOptions = {
      format: exportFormat,
      includeMetadata,
    };
    
    const content = exportChat(state, options);
    const filename = `asterism-chat-${new Date().toISOString().split('T')[0]}.${getFileExtension(exportFormat)}`;
    const mimeType = getMimeType(exportFormat);
    
    downloadExport(content, filename, mimeType);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide px-1">
        Export Chat
      </h3>
      
      {/* Format Selector */}
      <div className="grid grid-cols-3 gap-2">
        {exportFormats.map((format) => (
          <button
            key={format.value}
            onClick={() => setExportFormat(format.value)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
              exportFormat === format.value
                ? 'bg-[#0A84FF] text-white'
                : 'bg-[#2C2C2E] text-[#8E8E93] hover:bg-[#3C3C3E]'
            }`}
          >
            <span className="text-xl">{format.icon}</span>
            <span className="text-[12px] font-medium">{format.label}</span>
          </button>
        ))}
      </div>

      {/* Include Metadata Toggle */}
      <label className="flex items-center gap-3 px-3 py-2 bg-[#2C2C2E] rounded-xl cursor-pointer">
        <input
          type="checkbox"
          checked={includeMetadata}
          onChange={(e) => setIncludeMetadata(e.target.checked)}
          className="w-4 h-4 rounded border-[#38383A] text-[#0A84FF] focus:ring-[#0A84FF] bg-[#1C1C1E]"
        />
        <span className="text-[14px] text-[#8E8E93]">Include metadata</span>
      </label>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={state.messages.length === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0A84FF] hover:bg-[#409CFF] rounded-xl text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span className="text-[15px]">
          Export as {exportFormat === 'markdown' ? 'Markdown' : exportFormat === 'text' ? 'Text' : 'JSON'}
        </span>
      </button>
    </div>
  );
}