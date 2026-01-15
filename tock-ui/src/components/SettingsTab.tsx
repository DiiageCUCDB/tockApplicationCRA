import React, { useState, useEffect } from 'react';
import { tockCommands } from '../api';
import { Download, Calendar, CalendarRange, FolderOpen } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { ApiRouteManager } from './ApiRouteManager';
import { ReportApiSender } from './ReportApiSender';
import { UpdateChecker } from './UpdateChecker';

interface SettingsTabProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ showMessage }) => {
  const [reportType, setReportType] = useState<'today' | 'yesterday' | 'date' | 'range'>('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>('');

  // Load saved folder path on mount
  useEffect(() => {
    loadSavedFolderPath();
  }, []);

  const loadSavedFolderPath = async () => {
    try {
      const result = await tockCommands.getUserPreference('report_folder_path');
      if (result.success && result.output) {
        setSelectedFolder(result.output);
      }
    } catch (error) {
      console.error('Failed to load saved folder path:', error);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const folder = await open({
        directory: true,
        multiple: false,
        title: 'Select folder for reports',
      });
      
      if (folder && typeof folder === 'string') {
        setSelectedFolder(folder);
        // Save the folder path for next time
        await tockCommands.setUserPreference('report_folder_path', folder);
        showMessage('success', `Folder selected: ${folder}`);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      showMessage('error', `Failed to select folder: ${error}`);
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);

    let result;
    const customPath = selectedFolder || undefined;
    
    if (reportType === 'date') {
      if (!selectedDate) {
        showMessage('error', 'Please select a date');
        setLoading(false);
        return;
      }
      result = await tockCommands.saveReportToFile('date', selectedDate, undefined, undefined, customPath);
    } else if (reportType === 'range') {
      if (!startDate || !endDate) {
        showMessage('error', 'Please select both start and end dates');
        setLoading(false);
        return;
      }
      result = await tockCommands.saveReportToFile('range', undefined, startDate, endDate, customPath);
    } else {
      result = await tockCommands.saveReportToFile(reportType, undefined, undefined, undefined, customPath);
    }

    setLoading(false);

    if (result.success) {
      showMessage('success', result.output);
    } else {
      showMessage('error', result.error || 'Failed to generate report');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Report Generation</h2>

        <div className="space-y-6">
          {/* Report Type Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Select Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setReportType('today')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === 'today'
                    ? 'border-slate-700 bg-slate-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Calendar className="w-5 h-5 mb-2 mx-auto text-slate-600" />
                <div className="text-sm font-medium text-slate-800">Today</div>
              </button>

              <button
                onClick={() => setReportType('yesterday')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === 'yesterday'
                    ? 'border-slate-700 bg-slate-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Calendar className="w-5 h-5 mb-2 mx-auto text-slate-600" />
                <div className="text-sm font-medium text-slate-800">Yesterday</div>
              </button>

              <button
                onClick={() => setReportType('date')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === 'date'
                    ? 'border-slate-700 bg-slate-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Calendar className="w-5 h-5 mb-2 mx-auto text-slate-600" />
                <div className="text-sm font-medium text-slate-800">Specific Date</div>
              </button>

              <button
                onClick={() => setReportType('range')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  reportType === 'range'
                    ? 'border-slate-700 bg-slate-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <CalendarRange className="w-5 h-5 mb-2 mx-auto text-slate-600" />
                <div className="text-sm font-medium text-slate-800">Date Range</div>
              </button>
            </div>
          </div>

          {/* Date Selection for Specific Date */}
          {reportType === 'date' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Date Range Selection */}
          {reportType === 'range' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Folder Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Save Location (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedFolder || 'Home directory (default)'}
                readOnly
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
              />
              <button
                onClick={handleSelectFolder}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
              >
                <FolderOpen size={18} />
                Browse
              </button>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {loading ? (
              'Generating...'
            ) : (
              <>
                <Download size={20} />
                Generate Report
              </>
            )}
          </button>

          {/* Info Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Reports will be saved as .txt files in your home directory.
              The filename will include the date or period (e.g., "2024-01-01_tock.txt" or "2024-01-01_2024-01-31_tock.txt").
            </p>
          </div>
        </div>
      </div>

      {/* Application Updates */}
      <UpdateChecker showMessage={showMessage} />

      {/* Monthly Report API Sender */}
      <ReportApiSender showMessage={showMessage} />

      {/* API Route Manager */}
      <ApiRouteManager showMessage={showMessage} />
    </div>
  );
};
