'use client';

import { useState } from 'react';

export default function EmailUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Email Parser
        </h1>
        <p className="text-gray-600 mb-8">
          Upload an email file (.eml or .txt) to extract structured data
        </p>

        {/* File Upload Area */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Email File
          </label>
          <input
            type="file"
            accept=".eml,.txt,.msg"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              cursor-pointer"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg
            font-semibold hover:bg-blue-700 disabled:bg-gray-400
            disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Parsing...' : 'Parse Email'}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Parsed Email Data
            </h2>
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Sender
                </label>
                <p className="text-gray-900">{result.sender || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Recipients
                </label>
                <p className="text-gray-900">{result.recipients || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Subject
                </label>
                <p className="text-gray-900">{result.subject || 'N/A'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Date
                </label>
                <p className="text-gray-900">
                  {result.date ? new Date(result.date).toLocaleString() : 'N/A'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Message Body
                </label>
                <div className="bg-white p-4 rounded border border-gray-200 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-900">
                    {result.body || 'N/A'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Raw JSON (for debugging) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                View Raw JSON
              </summary>
              <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
}