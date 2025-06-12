'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

interface Document {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: Timestamp;
}

export default function InvestorPage() {
  const [activeTab, setActiveTab] = useState<'documents' | 'catalogues'>('documents');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [catalogues, setCatalogues] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchDocuments();
    fetchCatalogues();
  }, []);

  async function fetchDocuments() {
    try {
      const docsSnapshot = await getDocs(collection(db, 'investorDocuments'));
      const docsList = docsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Document[];
      
      docsList.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime());
      setDocuments(docsList);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching documents:', error);
        setError(error.message || 'Failed to load investor documents.');
      }
    }
  }

  async function fetchCatalogues() {
    try {
      const docsSnapshot = await getDocs(collection(db, 'productCatalogues'));
      const docsList = docsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Document[];
      
      docsList.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime());
      setCatalogues(docsList);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching catalogues:', error);
        setError(error.message || 'Failed to load product catalogues.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, type: 'documents' | 'catalogues') {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const collectionName = type === 'documents' ? 'investorDocuments' : 'productCatalogues';
        await deleteDoc(doc(db, collectionName, id));
        if (type === 'documents') {
          setDocuments(documents.filter(doc => doc.id !== id));
        } else {
          setCatalogues(catalogues.filter(doc => doc.id !== id));
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  }

  const renderTable = (items: Document[], type: 'documents' | 'catalogues') => (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full border-collapse table-auto">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-3 text-left font-semibold text-gray-700">Title</th>
            <th className="border p-3 text-left font-semibold text-gray-700">Date</th>
            <th className="border p-3 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 border-b">
              <td className="border p-3 text-gray-800 font-medium">{item.title}</td>
              <td className="border p-3 text-gray-800">
                {item.createdAt?.toDate().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </td>
              <td className="border p-3">
                <div className="flex space-x-3">
                  <a 
                    href={item.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="rounded bg-green-500 px-3 py-1.5 text-white hover:bg-green-600 font-medium"
                  >
                    View
                  </a>
                  <Link
                    href={`/admin/dashboard/investor/edit/${item.id}?type=${type}`}
                    className="rounded bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600 font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id, type)}
                    className="rounded bg-red-500 px-3 py-1.5 text-white hover:bg-red-600 font-medium"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black mb-4">Investor Management</h1>
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('documents')}
              className={`${
                activeTab === 'documents'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Investor Documents
            </button>
            <button
              onClick={() => setActiveTab('catalogues')}
              className={`${
                activeTab === 'catalogues'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Product Catalogues
            </button>
          </nav>
        </div>

        {/* Add New Button */}
        <div className="mb-6">
          <Link 
            href={`/admin/dashboard/investor/new?type=${activeTab}`}
            className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
          >
            Add New {activeTab === 'documents' ? 'Document' : 'Catalogue'}
          </Link>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      ) : activeTab === 'documents' ? (
        documents.length === 0 ? (
          <p className="text-center text-gray-500">No documents found. Add your first document!</p>
        ) : (
          renderTable(documents, 'documents')
        )
      ) : (
        catalogues.length === 0 ? (
          <p className="text-center text-gray-500">No catalogues found. Add your first catalogue!</p>
        ) : (
          renderTable(catalogues, 'catalogues')
        )
      )}
    </div>
  );
}