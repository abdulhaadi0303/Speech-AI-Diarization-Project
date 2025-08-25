// src/Components/transcription/TranscriptionPageHeader.jsx - UPDATED: Enhanced downloads with view detection
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertCircle, 
  Download, 
  ChevronDown,
  FileText,
  File
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAppStore from '../../stores/appStore';

const TranscriptionPageHeader = ({ 
  currentSessionId, 
  results, 
  structures, 
  parameters, 
  hasSession,
  editorRef,
  currentView = 'original' // NEW: Track which view is currently active
}) => {
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  // Helper function to format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Helper function to format time with hours
  const formatTimeWithHours = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ✅ NEW: Get current content based on what's actually being viewed
  const getCurrentContent = () => {
    // First check if we're in editor view and can get content from editor
    if (currentView === 'editor' && editorRef?.current?.getCurrentContent) {
      const editorContent = editorRef.current.getCurrentContent();
      const editorMappings = editorRef.current.getCurrentMappings?.() || {};
      const hasEditorContent = editorContent && editorContent.trim() && editorContent !== '<p><br></p>';
      
      if (hasEditorContent) {
        console.log('📝 Getting content from editor (has edits)');
        return {
          content: editorContent,
          isEdited: true,
          mappings: editorMappings
        };
      }
    }

    // Fallback to original results
    console.log('📄 Using original content');
    const segments = results?.results?.segments || [];
    let htmlContent = '';
    const originalMappings = {};

    segments.forEach((segment) => {
      const speaker = segment.speaker;
      const text = segment.text || '';
      const start = segment.start || 0;
      const end = segment.end || 0;

      // Build original mappings
      if (!originalMappings[speaker]) {
        originalMappings[speaker] = speaker;
      }

      const timeStamp = `[${formatTime(start)} - ${formatTime(end)}]`;
      htmlContent += `<p><span style="color: #6b7280; font-size: 0.875rem; font-family: monospace;">${timeStamp}</span> <strong style="color: #059669;">${speaker}:</strong> ${text}</p>`;
    });

    return {
      content: htmlContent,
      isEdited: false,
      mappings: originalMappings
    };
  };

  // Generate speaker statistics
  const generateSpeakerStats = (mappings = {}) => {
    const stats = {};
    const segments = results?.results?.segments || [];
    
    segments.forEach(segment => {
      const speakerName = mappings[segment.speaker] || segment.speaker;
      if (!stats[speakerName]) {
        stats[speakerName] = {
          segments: 0,
          totalDuration: 0,
          wordCount: 0
        };
      }
      stats[speakerName].segments++;
      stats[speakerName].totalDuration += (segment.end - segment.start);
      stats[speakerName].wordCount += (segment.text || '').split(' ').length;
    });
    
    return stats;
  };

  // Professional TXT format
  const downloadProfessionalTxt = () => {
    try {
      const { content: currentContent, isEdited, mappings } = getCurrentContent();
      const segments = results?.results?.segments || [];
      const speakerStats = generateSpeakerStats(mappings);
      const metadata = results?.results?.metadata || {};
      
      // Header
      let content = `TRANSCRIPT
${'='.repeat(60)}

Document Information:
• Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
• Session ID: ${currentSessionId?.slice(0, 8) || 'N/A'}
• Total Duration: ${formatTimeWithHours(metadata.total_duration || 0)}
• Total Speakers: ${Object.keys(speakerStats).length}
• Language: ${metadata.language || 'Auto-detected'}
• Content Type: ${isEdited ? 'Edited Transcript' : 'Original Transcript'}
• View Source: ${currentView === 'editor' ? 'Live Editor' : 'Original View'}

Speaker Summary:
`;

      // Speaker stats
      Object.entries(speakerStats).forEach(([speaker, stats]) => {
        const percentage = metadata.total_duration ? 
          ((stats.totalDuration / metadata.total_duration) * 100).toFixed(1) : '0';
        content += `• ${speaker}: ${stats.segments} segments, ${formatTimeWithHours(stats.totalDuration)} (${percentage}%), ~${stats.wordCount} words\n`;
      });

      content += `\n${'='.repeat(60)}\nTRANSCRIPT CONTENT\n${'='.repeat(60)}\n\n`;

      // Format transcript with proper speaker names
      segments.forEach((segment, index) => {
        const speakerName = mappings[segment.speaker] || segment.speaker;
        const timestamp = `[${formatTimeWithHours(segment.start)} - ${formatTimeWithHours(segment.end)}]`;
        
        content += `${timestamp} ${speakerName}:\n${segment.text}\n\n`;
      });

      content += `${'='.repeat(60)}\nEnd of Transcript\nGenerated by AI Speech Diarization Platform\n`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcript_professional_${currentSessionId?.slice(0, 8) || 'session'}_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${isEdited ? 'edited' : 'original'} professional transcript from ${currentView} view`);
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download transcript');
    }
  };

  // Meeting Minutes format
  const downloadMeetingMinutes = () => {
    try {
      const { mappings, isEdited } = getCurrentContent();
      const segments = results?.results?.segments || [];
      const speakerStats = generateSpeakerStats(mappings);
      const metadata = results?.results?.metadata || {};
      
      let content = `MEETING MINUTES
${'='.repeat(60)}

Meeting Details:
• Date: ${new Date().toLocaleDateString()}
• Duration: ${formatTimeWithHours(metadata.total_duration || 0)}
• Participants: ${Object.keys(speakerStats).length}
• Content: ${isEdited ? 'Edited Version' : 'Original Recording'}
• Source: ${currentView === 'editor' ? 'Live Editor' : 'Original View'}

Attendees:
`;

      Object.keys(speakerStats).forEach(speaker => {
        content += `• ${speaker}\n`;
      });

      content += `\nDiscussion:\n${'='.repeat(40)}\n\n`;

      // Group segments by speaker for cleaner reading
      let currentSpeaker = '';
      let speakerContent = '';
      
      segments.forEach((segment, index) => {
        const speakerName = mappings[segment.speaker] || segment.speaker;
        
        if (speakerName !== currentSpeaker) {
          if (speakerContent) {
            content += `${currentSpeaker}:\n${speakerContent}\n\n`;
          }
          currentSpeaker = speakerName;
          speakerContent = segment.text;
        } else {
          speakerContent += ' ' + segment.text;
        }
      });
      
      // Add final speaker content
      if (speakerContent) {
        content += `${currentSpeaker}:\n${speakerContent}\n\n`;
      }

      content += `${'='.repeat(60)}\nAction Items: [To be filled]\nNext Meeting: [To be scheduled]\n`;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `meeting_minutes_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${isEdited ? 'edited' : 'original'} meeting minutes from ${currentView} view`);
      setShowDownloadMenu(false);
    } catch (error) {
      toast.error('Failed to download meeting minutes');
    }
  };

  // CSV Export
  const downloadCSV = () => {
    try {
      const { mappings, isEdited } = getCurrentContent();
      const segments = results?.results?.segments || [];
      
      let csvContent = 'Start Time,End Time,Duration,Speaker (Original),Speaker (Mapped),Text,Word Count\n';
      
      segments.forEach(segment => {
        const speakerName = mappings[segment.speaker] || segment.speaker;
        const duration = segment.end - segment.start;
        const wordCount = (segment.text || '').split(' ').length;
        
        // Escape CSV fields
        const escapedText = (segment.text || '').replace(/"/g, '""');
        
        csvContent += `${segment.start},${segment.end},${duration.toFixed(2)},"${segment.speaker}","${speakerName}","${escapedText}",${wordCount}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcript_data_${currentSessionId?.slice(0, 8) || 'session'}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${isEdited ? 'edited' : 'original'} CSV data from ${currentView} view`);
      setShowDownloadMenu(false);
    } catch (error) {
      toast.error('Failed to download CSV');
    }
  };

  // Simple transcript download
  const downloadSimpleTranscript = () => {
    try {
      const { content: currentContent, isEdited } = getCurrentContent();
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = currentContent;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      
      const blob = new Blob([plainText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transcript_simple_${currentSessionId?.slice(0, 8) || 'session'}_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${isEdited ? 'edited' : 'original'} simple transcript from ${currentView} view`);
      setShowDownloadMenu(false);
    } catch (error) {
      toast.error('Failed to download transcript');
    }
  };

  // PDF Download using jsPDF
  const downloadPDF = () => {
    try {
      // Dynamically import jsPDF
      import('jspdf').then(({ default: jsPDF }) => {
        const { content: currentContent, isEdited, mappings } = getCurrentContent();
        const segments = results?.results?.segments || [];
        const speakerStats = generateSpeakerStats(mappings);
        const metadata = results?.results?.metadata || {};
        
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        const maxWidth = pageWidth - (margin * 2);
        let yPosition = margin;
        
        // Helper function to add text with word wrapping
        const addText = (text, fontSize = 10, isBold = false) => {
          doc.setFontSize(fontSize);
          if (isBold) {
            doc.setFont('helvetica', 'bold');
          } else {
            doc.setFont('helvetica', 'normal');
          }
          
          const lines = doc.splitTextToSize(text, maxWidth);
          
          // Check if we need a new page
          if (yPosition + (lines.length * fontSize * 0.35) > doc.internal.pageSize.height - margin) {
            doc.addPage();
            yPosition = margin;
          }
          
          doc.text(lines, margin, yPosition);
          yPosition += lines.length * fontSize * 0.35 + 5;
        };
        
        // Header
        addText('TRANSCRIPT DOCUMENT', 16, true);
        yPosition += 5;
        
        // Document information
        addText('Document Information:', 12, true);
        addText(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`);
        addText(`Session ID: ${currentSessionId?.slice(0, 8) || 'N/A'}`);
        addText(`Total Duration: ${formatTimeWithHours(metadata.total_duration || 0)}`);
        addText(`Total Speakers: ${Object.keys(speakerStats).length}`);
        addText(`Language: ${metadata.language || 'Auto-detected'}`);
        addText(`Content Type: ${isEdited ? 'Edited Transcript' : 'Original Transcript'}`);
        addText(`View Source: ${currentView === 'editor' ? 'Live Editor' : 'Original View'}`);
        yPosition += 10;
        
        // Speaker Summary
        addText('Speaker Summary:', 12, true);
        Object.entries(speakerStats).forEach(([speaker, stats]) => {
          const percentage = metadata.total_duration ? 
            ((stats.totalDuration / metadata.total_duration) * 100).toFixed(1) : '0';
          addText(`• ${speaker}: ${stats.segments} segments, ${formatTimeWithHours(stats.totalDuration)} (${percentage}%), ~${stats.wordCount} words`);
        });
        yPosition += 10;
        
        // Transcript Content
        addText('TRANSCRIPT CONTENT', 14, true);
        yPosition += 5;
        
        segments.forEach((segment) => {
          const speakerName = mappings[segment.speaker] || segment.speaker;
          const timestamp = `[${formatTimeWithHours(segment.start)} - ${formatTimeWithHours(segment.end)}]`;
          
          addText(`${timestamp} ${speakerName}:`, 10, true);
          addText(segment.text, 10, false);
          yPosition += 5;
        });
        
        // Save the PDF
        doc.save(`transcript_${currentSessionId?.slice(0, 8) || 'session'}_${new Date().toISOString().slice(0, 10)}.pdf`);
        
        toast.success(`Downloaded ${isEdited ? 'edited' : 'original'} PDF from ${currentView} view`);
        setShowDownloadMenu(false);
      }).catch(error => {
        console.error('Failed to load jsPDF:', error);
        toast.error('PDF library not available. Please try another format.');
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to generate PDF');
    }
  };

  // JSON Download
  const downloadJSON = () => {
    try {
      const content = JSON.stringify(results, null, 2);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `${currentSessionId}_results_${timestamp}.json`;
      
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      toast.success(`Downloaded complete results as JSON from ${currentView} view`);
      setShowDownloadMenu(false);
    } catch (error) {
      console.error('JSON download error:', error);
      toast.error('Failed to download JSON');
    }
  };

  return (
    <div className="mb-6">
      {/* Main Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <Link 
            to="/" 
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Exploration & <span className="text-cyan-400">Interviews</span>
            </h1>
            {currentSessionId ? (
              <p className="text-gray-400">Active Session</p>
            ) : (
              <p className="text-gray-400">No active session - showing demo content</p>
            )}
          </div>
        </div>
        
        {/* Enhanced Download Options - Single Dropdown Only */}
        {results && (
          <div className="flex items-center space-x-3">
            {/* Single Download Dropdown with all options */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              
              {showDownloadMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="text-xs text-gray-500 font-medium mb-2 px-2">
                      Professional Formats • From: {currentView === 'editor' ? 'Live Editor' : 'Original View'}
                    </div>
                    
                    <button
                      onClick={downloadProfessionalTxt}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">Professional Transcript</div>
                        <div className="text-xs text-gray-500">Formatted with metadata & stats</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={downloadMeetingMinutes}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <File className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="font-medium text-sm">Meeting Minutes</div>
                        <div className="text-xs text-gray-500">Business-ready format</div>
                      </div>
                    </button>

                    <button
                      onClick={downloadPDF}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4 text-red-600" />
                      <div>
                        <div className="font-medium text-sm">PDF Document</div>
                        <div className="text-xs text-gray-500">Professional PDF format</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={downloadCSV}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-medium text-sm">Data Export (CSV)</div>
                        <div className="text-xs text-gray-500">For analysis & spreadsheets</div>
                      </div>
                    </button>
                    
                    <div className="border-t border-gray-100 my-2"></div>
                    <div className="text-xs text-gray-500 font-medium mb-2 px-2">Basic Formats</div>
                    
                    <button
                      onClick={downloadSimpleTranscript}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4 text-gray-600" />
                      <div>
                        <div className="font-medium text-sm">Simple Text</div>
                        <div className="text-xs text-gray-500">Plain transcript only</div>
                      </div>
                    </button>

                    <button
                      onClick={downloadJSON}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-medium text-sm">JSON Data</div>
                        <div className="text-xs text-gray-500">Complete results data</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {showDownloadMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDownloadMenu(false)}
        />
      )}

      {/* Demo Mode Notice */}
      {!hasSession && (
        <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
           
            <span className="text-blue-800 font-medium"></span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
             Upload an audio file on the Home page to see real results.
          </p>
        </div>
      )}
    </div>
  );
};

export default TranscriptionPageHeader;