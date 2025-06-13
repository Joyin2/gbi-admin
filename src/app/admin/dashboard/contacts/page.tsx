'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, updateDoc } from 'firebase/firestore';

interface Contact {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  status?: string;
  createdAt: Timestamp;
  read: boolean;
}

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  
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

  function viewContactDetails(contact: Contact) {
    setSelectedContact(contact);
    setShowModal(true);

    // Mark as read when viewing details
    if (!contact.read) {
      toggleReadStatus(contact.id, contact.read);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSelectedContact(null);
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
                <th className="border p-3 text-left font-semibold text-gray-700">Read Status</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Status</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Name</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Email</th>
                <th className="border p-3 text-left font-semibold text-gray-700">Subject</th>
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
                  <td className="border p-3">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      contact.status === 'new' ? 'bg-green-100 text-green-800' :
                      contact.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      contact.status === 'resolved' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {contact.status || 'new'}
                    </span>
                  </td>
                  <td className="border p-3 text-gray-800 font-medium">{contact.name}</td>
                  <td className="border p-3 text-gray-800">{contact.email}</td>
                  <td className="border p-3 text-gray-800">{contact.subject || 'No subject'}</td>
                  <td className="border p-3 text-gray-800">
                    {contact.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="border p-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewContactDetails(contact)}
                        className="rounded bg-green-500 px-3 py-1.5 text-white hover:bg-green-600 font-medium text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => toggleReadStatus(contact.id, contact.read)}
                        className={`rounded px-3 py-1.5 text-white font-medium text-sm ${contact.read ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                      >
                        {contact.read ? 'Unread' : 'Read'}
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="rounded bg-red-500 px-3 py-1.5 text-white hover:bg-red-600 font-medium text-sm"
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
      
      {/* Contact Details Modal */}
      {showModal && selectedContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedContact.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedContact.subject || 'No subject'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                    selectedContact.status === 'new' ? 'bg-green-100 text-green-800' :
                    selectedContact.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedContact.status === 'resolved' ? 'bg-gray-100 text-gray-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedContact.status || 'new'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <div className="text-gray-900 bg-gray-50 p-4 rounded min-h-[100px] whitespace-pre-wrap">
                  {selectedContact.message}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Submitted</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedContact.createdAt?.toDate().toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Read Status</label>
                  <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${selectedContact.read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                    {selectedContact.read ? 'Read' : 'Unread'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  toggleReadStatus(selectedContact.id, selectedContact.read);
                  setSelectedContact({...selectedContact, read: !selectedContact.read});
                }}
                className={`rounded px-4 py-2 text-white font-medium ${selectedContact.read ? 'bg-gray-500 hover:bg-gray-600' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                Mark as {selectedContact.read ? 'Unread' : 'Read'}
              </button>
              <button
                onClick={() => {
                  handleDelete(selectedContact.id);
                  closeModal();
                }}
                className="rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600 font-medium"
              >
                Delete
              </button>
              <button
                onClick={closeModal}
                className="rounded bg-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-400 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Management</h2>
        <p className="text-gray-700 mb-2">
          When visitors submit the contact form on your website, their submissions will appear here.
        </p>
        <p className="text-gray-700 mb-2">
          You can view full details, mark messages as read/unread, and delete them when no longer needed.
        </p>
        <div className="mt-4 text-sm text-gray-600">
          <p><strong>Total contacts:</strong> {contacts.length}</p>
          <p><strong>Unread:</strong> {contacts.filter(c => !c.read).length}</p>
        </div>
      </div>
    </div>
  );
}