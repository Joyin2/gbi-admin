'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, deleteField } from 'firebase/firestore';

export default function CleanupDescriptions() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const cleanupDescriptions = async () => {
    setLoading(true);
    setStatus(null);
    setProgress(null);

    try {
      // Get all hero text documents
      const querySnapshot = await getDocs(collection(db, 'heroTexts'));
      const totalDocs = querySnapshot.size;
      
      setProgress({ current: 0, total: totalDocs });
      setStatus({ type: 'info', message: `Found ${totalDocs} hero text documents to clean up...` });

      let processed = 0;
      const batch = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        
        // Check if document has description field
        if (data.description !== undefined) {
          batch.push({
            id: docSnapshot.id,
            hasDescription: true
          });
        } else {
          batch.push({
            id: docSnapshot.id,
            hasDescription: false
          });
        }
      }

      // Process documents that have descriptions
      const docsWithDescriptions = batch.filter(item => item.hasDescription);
      
      if (docsWithDescriptions.length === 0) {
        setStatus({ type: 'success', message: 'All hero text documents are already clean! No descriptions found.' });
        setLoading(false);
        return;
      }

      setStatus({ type: 'info', message: `Removing descriptions from ${docsWithDescriptions.length} documents...` });

      for (const item of docsWithDescriptions) {
        try {
          // Remove the description field from the document
          await updateDoc(doc(db, 'heroTexts', item.id), {
            description: deleteField()
          });
          
          processed++;
          setProgress({ current: processed, total: docsWithDescriptions.length });
          
          // Small delay to avoid overwhelming Firestore
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error(`Error updating document ${item.id}:`, error);
        }
      }

      setStatus({ 
        type: 'success', 
        message: `Successfully removed descriptions from ${processed} hero text documents!` 
      });

    } catch (error) {
      console.error('Error during cleanup:', error);
      setStatus({ 
        type: 'error', 
        message: 'Failed to clean up descriptions. Please try again.' 
      });
    } finally {
      setLoading(false);
      setProgress(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Hero Text Cleanup Utility</h1>
        <p className="text-gray-600 mb-6">
          This utility will remove the description field from all existing hero text documents in Firestore.
          This is a one-time cleanup operation.
        </p>

        {status && (
          <div className={`p-4 rounded-lg mb-6 ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
            status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
            'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {status.type === 'success' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : status.type === 'error' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {status.message}
            </div>
          </div>
        )}

        {progress && (
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={cleanupDescriptions}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              loading 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {loading ? 'Cleaning Up...' : 'Remove All Descriptions'}
          </button>
          
          <a
            href="/admin/dashboard/hero-text"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Hero Text Management
          </a>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-yellow-800 mb-1">Warning</h3>
              <p className="text-sm text-yellow-700">
                This operation will permanently remove the description field from all hero text documents. 
                Make sure you have backed up your data if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
