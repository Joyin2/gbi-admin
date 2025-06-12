'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, updateDoc } from 'firebase/firestore';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  createdAt: Timestamp;
  read: boolean;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchContacts();
  }, []);

  async function fetchContacts() {
    setLoading(true);
    try {
      const contactsQuery = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
      const contactsSnapshot = await getDocs(contactsQuery);
      const contactsList = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Contact[];
      
      setContacts(contactsList);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching contacts:', error);
        setError(error.message || 'Failed to load contacts. Please check your connection and permissions.');
      } else {
        setError('Failed to load contacts. Please check your connection and permissions.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this contact submission?')) {
      try {
        await deleteDoc(doc(db, 'contacts', id));
        setContacts(contacts.filter(contact => contact.id !== id));
      } catch (error) {
        console.error('Error deleting contact:', error);
      }
    }
  }

  async function toggleReadStatus(id: string, currentStatus: boolean) {
    try {
      await updateDoc(doc(db, 'contacts', id), {
        read: !currentStatus
      });
      
      // Update local state
      setContacts(contacts.map(contact => 
        contact.id === id ? {...contact, read: !currentStatus} : contact
      ));
    } catch (error) {
      console.error('Error updating read status:', error);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Contact Form Submissions</h1>
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
      ) : contacts.length === 0 ? (
        <p className="text-center text-gray-500">No contact submissions found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-3 text-left font-semibold text-gray-700">Status</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Name</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Email</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Date</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className={`hover:bg-gray-50 border-b ${!contact.read ? 'bg-blue-50' : ''}`}>
                  <td className="border p-3">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${contact.read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                      {contact.read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="border p-3 text-gray-800 font-medium">{contact.name}</td>
                  <td className="border p-3 text-gray-800">{contact.email}</td>
                  <td className="border p-3 text-gray-800">
                    {contact.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => toggleReadStatus(contact.id, contact.read)}
                        className={`rounded px-3 py-1.5 text-white font-medium ${contact.read ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'}`}
                      >
                        {contact.read ? 'Mark as Unread' : 'Mark as Read'}
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
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
      
      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Details</h2>
        <p className="text-gray-700 mb-2">
          When visitors submit the contact form on your website, their submissions will appear here.
        </p>
        <p className="text-gray-700">
          You can mark messages as read/unread and delete them when no longer needed.
        </p>
      </div>
    </div>
  );
}