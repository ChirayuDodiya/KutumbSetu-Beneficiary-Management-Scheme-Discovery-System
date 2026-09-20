import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Users, UserPlus, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const CitizenDashboard = () => {
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Forms State
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [newFamilyData, setNewFamilyData] = useState({
    annual_income: '', caste: 'General', address: '', village: '', taluka: '', district: ''
  });
  const [newMemberData, setNewMemberData] = useState({
    name: '', age: '', gender: 'Male', relationship: 'Self', occupation: '', is_student: false, is_parent_alive: true
  });
  const [headMemberId, setHeadMemberId] = useState('');

  const fetchFamily = async () => {
    try {
      const response = await api.get('/families/my');
      setFamily(response.data.data); // will be null if no family
    } catch (err) {
      setError('Failed to fetch family data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFamily();
  }, []);

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    try {
      await api.post('/families', newFamilyData);
      fetchFamily();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create family');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/families/${family.id}/members`, newMemberData);
      setShowMemberForm(false);
      setNewMemberData({ name: '', age: '', gender: 'Male', relationship: 'Self', occupation: '', is_student: false, is_parent_alive: true });
      fetchFamily();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleSubmitFamily = async () => {
    if (!headMemberId) {
      setError('Please select a Head of Family before submitting.');
      return;
    }
    try {
      await api.post(`/families/${family.id}/submit`, { head_member_id: headMemberId });
      fetchFamily();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit family');
    }
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Users className="mr-2 text-blue-700" /> My Family Profile
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 flex items-center">
          <AlertCircle className="text-red-500 mr-2 h-5 w-5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Scenario 1: No Family Yet */}
      {!family && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Step 1: Create Family Profile</h3>
          <p className="text-sm text-gray-600 mb-6">You need to register your family details before adding members or applying for benefits.</p>
          
          <form onSubmit={handleCreateFamily} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (₹)</label>
                <input type="number" required className="w-full px-3 py-2 border rounded-md" 
                  value={newFamilyData.annual_income} onChange={(e) => setNewFamilyData({...newFamilyData, annual_income: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caste Category</label>
                <select className="w-full px-3 py-2 border rounded-md" value={newFamilyData.caste} onChange={(e) => setNewFamilyData({...newFamilyData, caste: e.target.value})}>
                  <option>General</option><option>SC</option><option>ST</option><option>SEBC</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input type="text" required className="w-full px-3 py-2 border rounded-md" 
                value={newFamilyData.address} onChange={(e) => setNewFamilyData({...newFamilyData, address: e.target.value})} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Village/Ward</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-md" 
                  value={newFamilyData.village} onChange={(e) => setNewFamilyData({...newFamilyData, village: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taluka</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-md" 
                  value={newFamilyData.taluka} onChange={(e) => setNewFamilyData({...newFamilyData, taluka: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input type="text" required className="w-full px-3 py-2 border rounded-md" 
                  value={newFamilyData.district} onChange={(e) => setNewFamilyData({...newFamilyData, district: e.target.value})} />
              </div>
            </div>

            <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-800 transition">
              Create Family Profile
            </button>
          </form>
        </div>
      )}

      {/* Scenario 2: Family Exists */}
      {family && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Left Column: Family Overview Card */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
              <h3 className="font-bold text-gray-800 mb-2 border-b pb-2">Family ID: {family.family_id}</h3>
              
              <div className="mb-4">
                <span className="text-xs text-gray-500 block uppercase tracking-wide">Status</span>
                {family.status === 'DRAFT' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1"/> Draft</span>}
                {family.status === 'PENDING_VERIFICATION' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1"/> Under Review</span>}
                {family.status === 'VERIFIED' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1"/> Verified</span>}
                {family.status === 'REJECTED' && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1"/> Rejected</span>}
              </div>

              {family.status === 'REJECTED' && family.rejection_reason && (
                <div className="bg-red-50 p-3 text-sm text-red-800 rounded mb-4">
                  <strong>Reason:</strong> {family.rejection_reason}
                </div>
              )}

              <div className="text-sm space-y-2 text-gray-600">
                <p><strong>Income:</strong> ₹{family.annual_income}</p>
                <p><strong>Caste:</strong> {family.caste}</p>
                <p><strong>Location:</strong> {family.village}, {family.taluka}, {family.district}</p>
                <p><strong>Total Members:</strong> {family.members ? family.members.length : 0}</p>
              </div>

              {family.status === 'VERIFIED' && (
                <div className="mt-6">
                  <Link to="/citizen/benefits" className="block text-center w-full bg-green-600 text-white py-2 rounded font-medium hover:bg-green-700">
                    Explore Schemes & Benefits
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Members List & Actions */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Family Members</h3>
                {family.status === 'DRAFT' && !showMemberForm && (
                  <button onClick={() => setShowMemberForm(true)} className="flex items-center text-sm bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 text-blue-700 font-medium">
                    <UserPlus className="w-4 h-4 mr-1" /> Add Member
                  </button>
                )}
              </div>

              {/* Members Table */}
              {family.members && family.members.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Age/Gender</th>
                        <th className="px-4 py-3">Relation</th>
                        <th className="px-4 py-3">Student?</th>
                      </tr>
                    </thead>
                    <tbody>
                      {family.members.map(m => (
                        <tr key={m.id} className="border-b">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {m.name} {family.head_member_id === m.id && <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded ml-2">HEAD</span>}
                          </td>
                          <td className="px-4 py-3">{m.age} / {m.gender}</td>
                          <td className="px-4 py-3">{m.relationship}</td>
                          <td className="px-4 py-3">{m.is_student ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm">No members added yet.</div>
              )}
            </div>

            {/* Add Member Form (DRAFT mode only) */}
            {family.status === 'DRAFT' && showMemberForm && (
              <div className="bg-white p-5 rounded-lg shadow border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-4">Add New Member</h3>
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input type="text" required className="w-full px-3 py-2 border rounded-md" value={newMemberData.name} onChange={e => setNewMemberData({...newMemberData, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                      <input type="number" required className="w-full px-3 py-2 border rounded-md" value={newMemberData.age} onChange={e => setNewMemberData({...newMemberData, age: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select className="w-full px-3 py-2 border rounded-md" value={newMemberData.gender} onChange={e => setNewMemberData({...newMemberData, gender: e.target.value})}>
                        <option>Male</option><option>Female</option><option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Relationship to Head</label>
                      <select className="w-full px-3 py-2 border rounded-md" value={newMemberData.relationship} onChange={e => setNewMemberData({...newMemberData, relationship: e.target.value})}>
                        <option>Self</option><option>Spouse</option><option>Son</option><option>Daughter</option><option>Parent</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 pt-2">
                    <label className="flex items-center text-sm text-gray-700">
                      <input type="checkbox" className="mr-2 rounded text-blue-600 focus:ring-blue-500" checked={newMemberData.is_student} onChange={e => setNewMemberData({...newMemberData, is_student: e.target.checked})} />
                      Is Student?
                    </label>
                    <label className="flex items-center text-sm text-gray-700">
                      <input type="checkbox" className="mr-2 rounded text-blue-600 focus:ring-blue-500" checked={newMemberData.is_parent_alive} onChange={e => setNewMemberData({...newMemberData, is_parent_alive: e.target.checked})} />
                      Parents Alive?
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={() => setShowMemberForm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700">Save Member</button>
                  </div>
                </form>
              </div>
            )}

            {/* Submit Family Section (DRAFT mode only) */}
            {family.status === 'DRAFT' && family.members && family.members.length > 0 && !showMemberForm && (
              <div className="bg-yellow-50 p-5 rounded-lg border border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-2">Submit for Officer Verification</h3>
                <p className="text-sm text-yellow-700 mb-4">Please select the Head of Family and submit your profile. You will not be able to edit members after submission.</p>
                <div className="flex items-end space-x-4">
                  <div className="flex-1 max-w-xs">
                    <label className="block text-sm font-medium text-yellow-800 mb-1">Select Head of Family</label>
                    <select className="w-full px-3 py-2 border border-yellow-300 rounded-md bg-white" value={headMemberId} onChange={e => setHeadMemberId(e.target.value)}>
                      <option value="">-- Select Member --</option>
                      {family.members.map(m => (
                        <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
                      ))}
                    </select>
                  </div>
                  <button onClick={handleSubmitFamily} className="flex items-center bg-yellow-600 text-white px-4 py-2 rounded font-medium hover:bg-yellow-700">
                    <Send className="w-4 h-4 mr-2" /> Submit Profile
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
