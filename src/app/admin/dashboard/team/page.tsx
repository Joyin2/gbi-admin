'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, Timestamp, orderBy, query } from 'firebase/firestore';
import Link from 'next/link';
import Image from 'next/image';

interface TeamMember {
  id: string;
  name: string;
  designation: string;
  photoUrl: string;
  createdAt: Timestamp;
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const q = query(collection(db, 'team'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const members: TeamMember[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        members.push({
          id: doc.id,
          name: data.name,
          designation: data.designation,
          photoUrl: data.photoUrl,
          createdAt: data.createdAt,
        });
      });
      
      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError('Failed to load team members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name} from the team?`)) {
      try {
        await deleteDoc(doc(db, 'team', id));
        setTeamMembers(teamMembers.filter(member => member.id !== id));
      } catch (error) {
        console.error('Error deleting team member:', error);
        setError('Failed to delete team member. Please try again.');
      }
    }
  };

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600 mt-1">Manage your team members and their information</p>
          </div>
          <Link
            href="/admin/dashboard/team/new"
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Member
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {teamMembers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-6">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No team members yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">Get started by adding your first team member to showcase your amazing team.</p>
          <Link
            href="/admin/dashboard/team/new"
            className="btn-primary"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add First Member
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="aspect-square relative">
                <Image
                  src={member.photoUrl}
                  alt={member.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-lg mb-1 truncate" title={member.name}>
                  {member.name}
                </h3>
                <p className="text-gray-600 text-sm mb-2 truncate" title={member.designation}>
                  {member.designation}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Added: {formatDate(member.createdAt)}
                </p>
                
                <div className="flex gap-2">
                  <Link
                    href={`/admin/dashboard/team/edit/${member.id}`}
                    className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm transition-colors"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(member.id, member.name)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {teamMembers.length > 0 && (
        <div className="mt-8 text-center text-gray-600">
          <p>Total team members: {teamMembers.length}</p>
        </div>
      )}
    </div>
  );
}
