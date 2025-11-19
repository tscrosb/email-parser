'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';

interface ParsedMessage {
  sender: string;
  date: string;
  body: string;
  order: number;
}

interface EmailResult {
  sender: string;
  recipients: string;
  subject: string;
  date: string;
  messageCount: number;
  messages: ParsedMessage[];
}

export default function EmailUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

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
    <div className="max-w-6xl mx-auto p-8">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Email Chain Parser
        </h1>
        <p className="text-gray-600 mb-8">
          Upload an email file to extract and split email chains into individual messages
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
          {loading ? 'Parsing Email Chain...' : 'Parse Email'}
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
          <div className="mt-8">
            {/* Email Header Info */}
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">
                Email Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Subject
                  </label>
                  <p className="text-gray-900 font-medium">{result.subject}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Messages in Chain
                  </label>
                  <p className="text-gray-900 font-medium">
                    {result.messageCount} message{result.messageCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Original Sender
                  </label>
                  <p className="text-gray-900">{result.sender}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Recipients
                  </label>
                  <p className="text-gray-900">{result.recipients}</p>
                </div>
              </div>
            </div>

            {/* Individual Messages in Chain */}
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Messages in Thread
            </h2>
            <div className="space-y-4">
              {result.messages.map((message, index) => (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors"
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                          Message {index + 1}
                        </span>
                        {index === 0 && (
                          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        {message.sender}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.date).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Message Body */}
                  <div className="bg-gray-50 rounded p-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-900 font-sans">
                      {message.body}
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            {/* Raw JSON */}
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800 font-medium">
                View Raw JSON Data
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