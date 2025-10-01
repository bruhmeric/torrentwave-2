import React, { useState, useEffect } from 'react';
import { testJackettConnection } from '../services/jackettService';
import { SpinnerIcon } from './Icons';

interface SettingsPanelProps {
  initialUrl: string;
  initialApiKey: string;
  onSave: (url: string, apiKey: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ initialUrl, initialApiKey, onSave, onClose, isOpen }) => {
  const [url, setUrl] = useState(initialUrl);
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error' | 'idle'; message: string } | null>(null);


  useEffect(() => {
    setUrl(initialUrl);
    setApiKey(initialApiKey);
    setTestResult(null); // Reset test result when panel is opened/closed or initial values change
  }, [initialUrl, initialApiKey, isOpen]);

  const handleSave = () => {
    onSave(url, apiKey);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      await testJackettConnection(url, apiKey);
      setTestResult({ status: 'success', message: 'Connection successful!' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setTestResult({ status: 'error', message });
    } finally {
      setIsTesting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-40 flex justify-center items-start pt-24 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <div 
        className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-full max-w-lg p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="settings-title" className="text-2xl font-bold text-slate-100 mb-4">Jackett Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="jackett-url" className="block text-sm font-medium text-slate-400 mb-1">
              Jackett Server URL
            </label>
            <input
              id="jackett-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g., http://192.168.1.100:9117"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
             <div className="mt-3 p-3 bg-slate-700/50 border border-slate-600 rounded-md text-sm text-slate-400">
              <p className="font-semibold text-slate-300 mb-2">Connecting from a different device?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Replace <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded">localhost</code> with your server's local network IP address (e.g., <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded">http://192.168.1.50:9117</code>).</li>
                <li>
                  To fix connection errors, add this site's URL to the <strong className="text-slate-300">"CORS Whitelist"</strong> field in your Jackett server's settings.
                </li>
              </ul>
            </div>
          </div>
          <div>
            <label htmlFor="api-key" className="block text-sm font-medium text-slate-400 mb-1">
              API Key
            </label>
            <input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Jackett API key"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
        
        {testResult && (
          <div className={`mt-4 text-sm p-3 rounded-md ${testResult.status === 'success' ? 'bg-green-900/50 text-green-300 border border-green-700/50' : 'bg-red-900/50 text-red-300 border border-red-700/50'}`}>
            <p className="font-semibold">{testResult.status === 'success' ? 'Success' : 'Error'}</p>
            <p>{testResult.message}</p>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
           <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-slate-200 rounded-md font-semibold hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-4 py-2 bg-slate-600 text-slate-200 rounded-md font-semibold hover:bg-slate-500 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
          >
            {isTesting && <SpinnerIcon />}
            Test
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 bg-sky-600 text-white rounded-md font-semibold hover:bg-sky-500 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;