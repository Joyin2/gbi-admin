'use client';

import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, query, orderBy, Timestamp, updateDoc, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

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

interface ContactSettings {
  id?: string;
  email: string;
  phone: string;
  address: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  updatedAt?: any;
}

export default function Contacts() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'settings'>('submissions');
  
  // Contact Submissions State
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  // Contact Settings State
  const [settings, setSettings] = useState<ContactSettings>({
    email: '',
    phone: '',
    address: '',
    socialLinks: {
      facebook: '',
      twitter: '',
      linkedin: '',
      instagram: ''
    }
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchContacts();
        fetchContactSettings();
      }
    });

    return () => unsubscribe();
  }, []);

  // Contact Submissions Functions
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

    if (!contact.read) {
      toggleReadStatus(contact.id, contact.read);
    }
  }

  function closeModal() {
    setShowModal(false);
    setSelectedContact(null);
  }

  // Contact Settings Functions
  async function fetchContactSettings() {
    setSettingsLoading(true);
    try {
      const settingsQuery = query(collection(db, 'contactSettings'), limit(1));
      const settingsSnapshot = await getDocs(settingsQuery);
      
      if (!settingsSnapshot.empty) {
        const settingsDoc = settingsSnapshot.docs[0];
        setSettings({
          id: settingsDoc.id,
          ...settingsDoc.data() as ContactSettings
        });
      } else {
        setSettings({
          email: 'info@gbillp.com',
          phone: '+91 99571 16126',
          address: 'Paikan, Gumra, Assam 788815',
          socialLinks: {
            facebook: '',
            twitter: '',
            linkedin: '',
            instagram: ''
          }
        });
      }
    } catch (error: any) {
      console.error('Error fetching contact settings:', error);
      setSettingsError('Failed to load contact settings. Please try again.');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function handleSettingsSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSettingsError(null);
    setSuccess(null);

    try {
      const settingsData = {
        ...settings,
        updatedAt: serverTimestamp()
      };

      if (settings.id) {
        await updateDoc(doc(db, 'contactSettings', settings.id), settingsData);
        setSuccess('Contact settings updated successfully!');
      } else {
        const docRef = await addDoc(collection(db, 'contactSettings'), settingsData);
        setSettings({ ...settings, id: docRef.id });
        setSuccess('Contact settings saved successfully!');
      }
    } catch (error: any) {
      console.error('Error saving contact settings:', error);
      setSettingsError('Failed to save contact settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleInputChange(field: string, value: string) {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  }

  function handleSocialLinkChange(platform: string, value: string) {
    setSettings(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value
      }
    }));
  }

  const renderContactSubmissions = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Contact Form Submissions</h2>
          <p className="text-gray-600 mt-1">Manage messages received through your website contact form</p>
        </div>
        <div className="text-sm text-gray-600">
          <p><strong>Total:</strong> {contacts.length}</p>
          <p><strong>Unread:</strong> {contacts.filter(c => !c.read).length}</p>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500">No contact submissions found.</p>
          <p className="text-sm text-gray-400 mt-1">Messages from your website contact form will appear here.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
          <table className="w-full border-collapse table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="border-b p-3 text-left font-semibold text-gray-700">Status</th>
                <th className="border-b p-3 text-left font-semibold text-gray-700">Name</th>
                <th className="border-b p-3 text-left font-semibold text-gray-700">Email</th>
                <th className="border-b p-3 text-left font-semibold text-gray-700">Subject</th>
                <th className="border-b p-3 text-left font-semibold text-gray-700">Date</th>
                <th className="border-b p-3 text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className={`hover:bg-gray-50 border-b ${!contact.read ? 'bg-blue-50' : ''}`}>
                  <td className="p-3">
                    <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${contact.read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                      {contact.read ? 'Read' : 'Unread'}
                    </span>
                  </td>
                  <td className="p-3 text-gray-800 font-medium">{contact.name}</td>
                  <td className="p-3 text-gray-800">{contact.email}</td>
                  <td className="p-3 text-gray-800">{contact.subject || 'No subject'}</td>
                  <td className="p-3 text-gray-800">
                    {contact.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="p-3">
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
                        {contact.read ? 'Mark Unread' : 'Mark Read'}
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
    </div>
  );

  const renderContactSettings = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Contact Settings</h2>
        <p className="text-gray-600 mt-1">Manage the contact information that appears on your website</p>
      </div>

      {settingsError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {settingsError}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
          {success}
        </div>
      )}

      {settingsLoading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      ) : (
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  value={settings.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="info@gbillp.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+91 99571 16126"
                  required
                />
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                id="address"
                value={settings.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paikan, Gumra, Assam 788815"
                required
              />
            </div>
          </div>

          {/* Social Media Links */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Social Media Links</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add your social media profile URLs (optional)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <input
                  type="url"
                  id="facebook"
                  value={settings.socialLinks?.facebook || ''}
                  onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://facebook.com/yourpage"
                />
              </div>

              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  id="twitter"
                  value={settings.socialLinks?.twitter || ''}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://twitter.com/yourhandle"
                />
              </div>

              <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  id="linkedin"
                  value={settings.socialLinks?.linkedin || ''}
                  onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://linkedin.com/company/yourcompany"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram
                </label>
                <input
                  type="url"
                  id="instagram"
                  value={settings.socialLinks?.instagram || ''}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://instagram.com/yourhandle"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? 'Saving...' : 'Save Contact Settings'}
            </button>
          </div>
        </form>
      )}

      {/* Preview */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Website Contact Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Email</h4>
            <p className="text-gray-600">{settings.email}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Phone</h4>
            <p className="text-gray-600">{settings.phone}</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Address</h4>
            <p className="text-gray-600">{settings.address}</p>
          </div>
        </div>
        
        {(settings.socialLinks?.facebook || settings.socialLinks?.twitter || settings.socialLinks?.linkedin || settings.socialLinks?.instagram) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="font-medium text-gray-700 mb-2">Social Media</h4>
            <div className="flex flex-wrap gap-3">
              {settings.socialLinks?.facebook && (
                <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                  Facebook
                </a>
              )}
              {settings.socialLinks?.twitter && (
                <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                  Twitter
                </a>
              )}
              {settings.socialLinks?.linkedin && (
                <a href={settings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                  LinkedIn
                </a>
              )}
              {settings.socialLinks?.instagram && (
                <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm">
                  Instagram
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black">Contact Management</h1>
        <p className="text-gray-600 mt-1">
          Manage contact form submissions and website contact information
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('submissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submissions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contact Submissions
            {contacts.filter(c => !c.read).length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                {contacts.filter(c => !c.read).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Contact Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'submissions' ? renderContactSubmissions() : renderContactSettings()}

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

              {selectedContact.subject && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-gray-900 bg-gray-50 p-2 rounded">{selectedContact.subject}</p>
                </div>
              )}

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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
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
    </div>
  );
}