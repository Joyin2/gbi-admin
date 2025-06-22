'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

interface Career {
  id: string;
  title: string;
  active: boolean;
  createdAt: Timestamp;
  applyLink?: string;
  documents?: { name: string; url: string; type: string }[];
}

interface CareerIntro {
  id: string;
  title: string;
  description: string;
  active: boolean;
  createdAt: Timestamp;
}

interface Intern {
  id: string;
  name: string;
  designation?: string;
  about?: string;
  imageUrl?: string;
  active: boolean;
  createdAt: Timestamp;
}

export default function Careers() {
  const [activeTab, setActiveTab] = useState<'opportunities' | 'intro' | 'interns'>('opportunities');
  const [careers, setCareers] = useState<Career[]>([]);
  const [careerIntros, setCareerIntros] = useState<CareerIntro[]>([]);
  const [interns, setInterns] = useState<Intern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      // Fetch career opportunities
      const careersSnapshot = await getDocs(collection(db, 'careers'));
      const careersList = careersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Career[];
      careersList.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime());
      setCareers(careersList);

      // Fetch career intro sections
      const introsSnapshot = await getDocs(collection(db, 'careerIntros'));
      const introsList = introsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CareerIntro[];
      introsList.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime());
      setCareerIntros(introsList);

      // Fetch interns
      const internsSnapshot = await getDocs(collection(db, 'interns'));
      const internsList = internsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Intern[];
      internsList.sort((a, b) => b.createdAt?.toDate().getTime() - a.createdAt?.toDate().getTime());
      setInterns(internsList);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteCareer(id: string) {
    if (window.confirm('Are you sure you want to delete this career opportunity?')) {
      try {
        await deleteDoc(doc(db, 'careers', id));
        setCareers(careers.filter(career => career.id !== id));
      } catch (error) {
        console.error('Error deleting career:', error);
      }
    }
  }

  async function handleDeleteIntro(id: string) {
    if (window.confirm('Are you sure you want to delete this intro section?')) {
      try {
        await deleteDoc(doc(db, 'careerIntros', id));
        setCareerIntros(careerIntros.filter(intro => intro.id !== id));
      } catch (error) {
        console.error('Error deleting intro:', error);
      }
    }
  }

  async function handleDeleteIntern(id: string) {
    if (window.confirm('Are you sure you want to delete this intern profile?')) {
      try {
        await deleteDoc(doc(db, 'interns', id));
        setInterns(interns.filter(intern => intern.id !== id));
      } catch (error) {
        console.error('Error deleting intern:', error);
      }
    }
  }

  const TabButton = ({ tab, label, icon }: { tab: typeof activeTab, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
        activeTab === tab
          ? 'bg-black text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Career Management</h1>
        <div className="flex space-x-3">
          {activeTab === 'opportunities' && (
            <Link 
              href="/admin/dashboard/career/new" 
              className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Add New Career Opportunity
            </Link>
          )}
          {activeTab === 'intro' && (
            <Link 
              href="/admin/dashboard/career/intro/new" 
              className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Add Intro Section
            </Link>
          )}
          {activeTab === 'interns' && (
            <Link 
              href="/admin/dashboard/career/interns/new" 
              className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              Add New Intern
            </Link>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex space-x-4">
        <TabButton tab="opportunities" label="Career Opportunities" icon="💼" />
        <TabButton tab="intro" label="Intro Sections" icon="📝" />
        <TabButton tab="interns" label="Interns Showcase" icon="👥" />
      </div>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-black"></div>
        </div>
      ) : (
        <>
          {/* Career Opportunities Tab */}
          {activeTab === 'opportunities' && (
            <>
              {careers.length === 0 ? (
                <p className="text-center text-gray-500">No career opportunities found. Create your first career opportunity!</p>
              ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                  <table className="w-full border-collapse table-auto">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-3 text-left font-semibold text-gray-700">Title</th>
                        <th className="border p-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="border p-3 text-left font-semibold text-gray-700">Apply Link</th>
                        <th className="border p-3 text-left font-semibold text-gray-700">Documents</th>
                        <th className="border p-3 text-left font-semibold text-gray-700">Date</th>
                        <th className="border p-3 text-left font-semibold text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {careers.map((career) => (
                        <tr key={career.id} className="hover:bg-gray-50 border-b">
                          <td className="border p-3 text-gray-800 font-medium">{career.title}</td>
                          <td className="border p-3">
                            <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${career.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {career.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="border p-3 text-gray-800">
                            {career.applyLink ? (
                              <a 
                                href={career.applyLink} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {career.applyLink.length > 30 
                                  ? `${career.applyLink.substring(0, 30)}...` 
                                  : career.applyLink}
                              </a>
                            ) : (
                              <span className="text-gray-400">Not set</span>
                            )}
                          </td>
                          <td className="border p-3 text-gray-800">
                            {career.documents && career.documents.length > 0 ? (
                              <div className="space-y-1">
                                {career.documents.slice(0, 2).map((doc, index) => (
                                  <div key={index} className="flex items-center space-x-1">
                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {doc.type.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-600 truncate max-w-20">
                                      {doc.name}
                                    </span>
                                  </div>
                                ))}
                                {career.documents.length > 2 && (
                                  <span className="text-xs text-gray-500">
                                    +{career.documents.length - 2} more
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">No documents</span>
                            )}
                          </td>
                          <td className="border p-3 text-gray-800">
                            {career.createdAt?.toDate().toLocaleDateString()}
                          </td>
                          <td className="border p-3">
                            <div className="flex space-x-3">
                              <Link 
                                href={`/admin/dashboard/career/edit/${career.id}`}
                                className="rounded bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600 font-medium"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteCareer(career.id)}
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
            </>
          )}

          {/* Intro Sections Tab */}
          {activeTab === 'intro' && (
            <>
              {careerIntros.length === 0 ? (
                <p className="text-center text-gray-500">No intro sections found. Create your first intro section!</p>
              ) : (
                <div className="grid gap-6">
                  {careerIntros.map((intro) => (
                    <div key={intro.id} className="bg-white rounded-lg shadow p-6 border">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">{intro.title}</h3>
                          <div className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${intro.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {intro.active ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <Link 
                            href={`/admin/dashboard/career/intro/edit/${intro.id}`}
                            className="rounded bg-blue-500 px-3 py-1.5 text-white hover:bg-blue-600 font-medium"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteIntro(intro.id)}
                            className="rounded bg-red-500 px-3 py-1.5 text-white hover:bg-red-600 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: intro.description.substring(0, 200) + '...' }} />
                      <div className="mt-4 text-sm text-gray-500">
                        Created: {intro.createdAt?.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Interns Showcase Tab */}
          {activeTab === 'interns' && (
            <>
              {interns.length === 0 ? (
                <p className="text-center text-gray-500">No interns found. Add your first intern!</p>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {interns.map((intern) => (
                    <div key={intern.id} className="bg-white rounded-lg shadow p-6 border">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${intern.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {intern.active ? 'Active' : 'Inactive'}
                        </div>
                        <div className="flex space-x-2">
                          <Link 
                            href={`/admin/dashboard/career/interns/edit/${intern.id}`}
                            className="rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600 text-sm"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteIntern(intern.id)}
                            className="rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      
                      {intern.imageUrl && (
                        <div className="mb-4">
                          <Image 
                            src={intern.imageUrl} 
                            alt={intern.name}
                            width={80}
                            height={80}
                            className="w-20 h-20 rounded-full object-cover mx-auto"
                            unoptimized
                          />
                        </div>
                      )}
                      
                      <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{intern.name}</h3>
                      
                      {intern.designation && (
                        <p className="text-blue-600 text-center font-medium mb-2">{intern.designation}</p>
                      )}
                      
                      {intern.about && (
                        <p className="text-gray-700 text-sm text-center mb-4">{intern.about.substring(0, 100)}...</p>
                      )}
                      
                      <div className="text-xs text-gray-500 text-center">
                        Added: {intern.createdAt?.toDate().toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 