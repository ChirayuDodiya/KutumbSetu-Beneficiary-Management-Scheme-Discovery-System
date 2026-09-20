import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, FileText, CheckCircle, AlertCircle, XCircle, Clock, Eye, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const OfficerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Modal State
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [familyDetails, setFamilyDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, famRes] = await Promise.all([
        api.get('/officer/stats'),
        api.get('/officer/families')
      ]);
      setStats(statsRes.data.data);
      setFamilies(famRes.data.data);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openFamilyModal = async (fam) => {
    setSelectedFamily(fam);
    setLoadingDetails(true);
    setRejectionReason('');
    try {
      const res = await api.get(`/officer/families/${fam.id}`);
      setFamilyDetails(res.data.data);
    } catch (err) {
      alert('Failed to load family details');
      setSelectedFamily(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to verify this family?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/officer/families/${selectedFamily.id}/approve`);
      setSelectedFamily(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    if (!window.confirm('Are you sure you want to reject this family?')) return;
    
    setActionLoading(true);
    try {
      await api.patch(`/officer/families/${selectedFamily.id}/reject`, { rejection_reason: rejectionReason });
      setSelectedFamily(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredFamilies = families.filter(f => filter === 'ALL' || f.status === filter);

  if (loading) return <div className="p-10 text-center">Loading Officer Dashboard...</div>;
  if (error) return <div className="p-10 text-red-600 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <ShieldCheck className="mr-2 text-blue-800" /> Jurisdiction Overview
        </h2>
        <Link to="/officer/requests" className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded text-sm font-medium transition">
          Review Benefit Requests
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-yellow-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Families Pending</p>
          <p className="text-2xl font-bold text-gray-800">{stats?.pending_families}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Families Verified</p>
          <p className="text-2xl font-bold text-gray-800">{stats?.verified_families}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-orange-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Requests Pending</p>
          <p className="text-2xl font-bold text-gray-800">{stats?.pending_requests}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 uppercase font-semibold">Total Requests</p>
          <p className="text-2xl font-bold text-gray-800">{stats?.total_requests}</p>
        </div>
      </div>

      {/* Family Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Family Profiles in Jurisdiction</h3>
          <select 
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_VERIFICATION">Pending Verification</option>
            <option value="VERIFIED">Verified</option>
            <option value="REJECTED">Rejected</option>
            <option value="DRAFT">Drafts (Incomplete)</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3">Family ID</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Income</th>
                <th className="px-5 py-3">Caste</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredFamilies.map(fam => (
                <tr key={fam.id} className="border-b hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{fam.family_id}</td>
                  <td className="px-5 py-3">
                    {fam.status === 'PENDING_VERIFICATION' && <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded text-xs font-medium">Pending</span>}
                    {fam.status === 'VERIFIED' && <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs font-medium">Verified</span>}
                    {fam.status === 'REJECTED' && <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs font-medium">Rejected</span>}
                    {fam.status === 'DRAFT' && <span className="text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">Draft</span>}
                  </td>
                  <td className="px-5 py-3">₹{fam.annual_income}</td>
                  <td className="px-5 py-3">{fam.caste}</td>
                  <td className="px-5 py-3 text-right">
                    <button 
                      onClick={() => openFamilyModal(fam)}
                      className="text-blue-600 hover:text-blue-900 font-medium flex items-center justify-end w-full"
                    >
                      <Eye className="w-4 h-4 mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredFamilies.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-gray-500">No families found matching filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedFamily && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 border-b flex justify-between items-center bg-blue-900 text-white rounded-t-lg">
              <h3 className="text-lg font-bold flex items-center">
                <Users className="w-5 h-5 mr-2" /> Review Family: {selectedFamily.family_id}
              </h3>
              <button onClick={() => setSelectedFamily(null)} className="text-blue-200 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1 bg-gray-50">
              {loadingDetails ? (
                <div className="text-center py-10">Loading family data...</div>
              ) : familyDetails ? (
                <div className="space-y-6">
                  {/* Info Card */}
                  <div className="bg-white p-4 rounded shadow-sm border border-gray-200 grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-gray-500 block">Annual Income</span><strong className="text-gray-800">₹{familyDetails.annual_income}</strong></div>
                    <div><span className="text-gray-500 block">Caste</span><strong className="text-gray-800">{familyDetails.caste}</strong></div>
                    <div className="col-span-2"><span className="text-gray-500 block">Address</span><strong className="text-gray-800">{familyDetails.address}, {familyDetails.village}, {familyDetails.taluka}, {familyDetails.district}</strong></div>
                  </div>
                  
                  {/* Members Table */}
                  <div className="bg-white rounded shadow-sm border border-gray-200">
                    <div className="px-4 py-2 border-b bg-gray-100 font-semibold text-gray-700 text-sm">Declared Members</div>
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
                        <tr>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Age/Sex</th>
                          <th className="px-4 py-2">Relation</th>
                          <th className="px-4 py-2">Student</th>
                        </tr>
                      </thead>
                      <tbody>
                        {familyDetails.members?.map(m => (
                          <tr key={m.id} className="border-b">
                            <td className="px-4 py-2">{m.name} {familyDetails.head_member_id === m.id && <span className="text-[10px] bg-blue-100 text-blue-800 px-1 rounded ml-1">HEAD</span>}</td>
                            <td className="px-4 py-2">{m.age} / {m.gender[0]}</td>
                            <td className="px-4 py-2">{m.relationship}</td>
                            <td className="px-4 py-2">{m.is_student ? 'Yes' : 'No'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Rejection Input */}
                  {familyDetails.status === 'PENDING_VERIFICATION' && (
                    <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (Required for rejection only)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Income certificate does not match declared income"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                      />
                    </div>
                  )}

                  {/* Historical Action */}
                  {familyDetails.status === 'REJECTED' && (
                    <div className="bg-red-50 p-4 border border-red-200 rounded text-sm text-red-800">
                      <strong>Rejected:</strong> {familyDetails.rejection_reason}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 text-red-500">Failed to load details.</div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="px-6 py-4 border-t bg-white flex justify-end space-x-3 rounded-b-lg">
              <button onClick={() => setSelectedFamily(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition">
                Close
              </button>
              {familyDetails?.status === 'PENDING_VERIFICATION' && (
                <>
                  <button 
                    onClick={handleReject} disabled={actionLoading}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-medium transition disabled:opacity-50"
                  >
                    Reject Family
                  </button>
                  <button 
                    onClick={handleApprove} disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition disabled:opacity-50 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Verify & Approve
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default OfficerDashboard;
