'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

interface Internship {
  id: string;
  title: string;
  active: boolean;
  createdAt: Timestamp;
  applyLink?: string; // Add apply link field
}

export default function Internships() {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInternships();
  }, []);

  async function fetchInternships() {
    setLoading(true);
    try {
      const internshipsSnapshot = await getDocs(collection(db, 'internships'));
      const internshipsList = internshipsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Internship[];
      
      // Sort by creation date (newest first)
      internshipsList.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime());
      
      setInternships(internshipsList);
    } catch (error) {
      console.error('Error fetching internships:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this internship?')) {
      try {
        await deleteDoc(doc(db, 'internships', id));
        setInternships(internships.filter(internship => internship.id !== id));
      } catch (error) {
        console.error('Error deleting internship:', error);
      }
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Internships</h1>
        <Link 
          href="/admin/dashboard/internship/new" 
          className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
        >
          Add New Internship
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      ) : internships.length === 0 ? (
        <p className="text-center text-gray-500">No internships found. Create your first internship!</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left font-semibold text-gray-700">Title</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Status</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Apply Link</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Date</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {internships.map((internship) => (
                <tr key={internship.id} className="hover:bg-gray-50 border-b">
                  <td className="border p-3 text-gray-800 font-medium">{internship.title}</td>
                  <td className="border p-3">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${internship.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {internship.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="border p-3 text-gray-800">
                    {internship.applyLink ? (
                      <a 
                        href={internship.applyLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {internship.applyLink.length > 30 
                          ? `${internship.applyLink.substring(0, 30)}...` 
                          : internship.applyLink}
                      </a>
                    ) : (
                      <span className="text-gray-400">Not set</span>
                    )}
                  </td>
                  <td className="border p-3 text-gray-800">
                    {internship.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <div className="flex space-x-3">
                      <Link 
                        href={`/admin/dashboard/internship/edit/${internship.id}`}
                        className="rounded bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600 font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(internship.id)}
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
      )}
    </div>
  );
}