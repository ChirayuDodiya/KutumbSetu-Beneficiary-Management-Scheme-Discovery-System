import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, CheckCircle, AlertCircle, XCircle, Clock, ShieldCheck, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const OfficerRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('UNDER_REVIEW');

  // Modal State
  const [selectedReq, setSelectedReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/officer/benefit-requests');
      setRequests(response.data.data);
    } catch (err) {
      setError('Failed to load benefit requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async () => {
    if (!window.confirm('Are you sure you want to approve this benefit application?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/officer/benefit-requests/${selectedReq.id}/approve`);
      setSelectedReq(null);
      fetchRequests();
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
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    
    setActionLoading(true);
    try {
      await api.patch(`/officer/benefit-requests/${selectedReq.id}/reject`, { rejection_reason: rejectionReason });
      setSelectedReq(null);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(r => filter === 'ALL' || r.status === filter);

  if (loading) return <div className="p-10 text-center">Loading Benefit Requests...</div>;
  if (error) return <div className="p-10 text-red-600 text-center">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <div className="flex items-center space-x-3">
          <Link to="/officer/dashboard" className="text-gray-500 hover:text-blue-800 transition p-1">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FileText className="mr-2 text-blue-800" /> Benefit Applications
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Applications in Jurisdiction</h3>
          <select 
            className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="UNDER_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="ALL">All Applications</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3">Family Code</th>
                <th className="px-5 py-3">Scheme</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date Applied</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map(req => (
                <tr key={req.id} className="border-b hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{req.family_code}</td>
                  <td className="px-5 py-3">{req.scheme_name}</td>
                  <td className="px-5 py-3">
                    {req.status === 'UNDER_REVIEW' && <span className="text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded text-xs font-medium">Under Review</span>}
                    {req.status === 'APPROVED' && <span className="text-green-700 bg-green-100 px-2 py-0.5 rounded text-xs font-medium">Approved</span>}
                    {req.status === 'REJECTED' && <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded text-xs font-medium">Rejected</span>}
                  </td>
                  <td className="px-5 py-3">{new Date(req.requested_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <button 
                      onClick={() => {
                        setSelectedReq(req);
                        setRejectionReason('');
                      }}
                      className="text-blue-600 hover:text-blue-900 font-medium bg-blue-50 px-3 py-1 rounded"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-gray-500">No applications found matching filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedReq && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            
            <div className="px-6 py-4 border-b flex justify-between items-center bg-blue-900 text-white rounded-t-lg">
              <div>
                <h3 className="text-lg font-bold flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2" /> Application Review
                </h3>
                <p className="text-xs text-blue-200 mt-1">Family: {selectedReq.family_code}</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-blue-200 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-4 overflow-y-auto flex-1 bg-gray-50 space-y-6">
              
              <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                <h4 className="font-bold text-gray-800 text-lg">{selectedReq.scheme_name}</h4>
                <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                  <div><span className="text-gray-500 block">Declared Family Income</span><strong className="text-gray-800">₹{selectedReq.annual_income}</strong></div>
                  <div><span className="text-gray-500 block">Caste Category</span><strong className="text-gray-800">{selectedReq.caste}</strong></div>
                </div>
              </div>

              <div className="bg-white p-4 rounded border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-3 border-b pb-2">Automated Eligibility Report</h4>
                
                {selectedReq.evaluation?.passedChecks?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-green-700 flex items-center mb-1">
                      <CheckCircle className="w-4 h-4 mr-1" /> System Confirmed Conditions
                    </p>
                    <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                      {selectedReq.evaluation.passedChecks.map((check, i) => <li key={i}>{check}</li>)}
                    </ul>
                  </div>
                )}

                {selectedReq.evaluation?.failedChecks?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-red-600 flex items-center mb-1">
                      <AlertCircle className="w-4 h-4 mr-1" /> System Failed Conditions
                    </p>
                    <ul className="list-disc pl-6 text-sm text-gray-600 space-y-1">
                      {selectedReq.evaluation.failedChecks.map((check, i) => <li key={i}>{check}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2" /> Citizen Uploaded Documents
                </h4>
                <p className="text-sm text-blue-700 mb-2">Please verify the proof provided by the citizen:</p>
                {selectedReq.attached_documents && selectedReq.attached_documents.length > 0 ? (
                  <ul className="list-disc pl-6 text-sm text-blue-800 space-y-2 mt-3">
                    {selectedReq.attached_documents.map((doc, i) => (
                      <li key={i}>
                        <span className="font-semibold">{doc.name}:</span>{' '}
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          View File
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-red-600 mt-2">No documents attached.</p>
                )}
              </div>

              {selectedReq.status === 'UNDER_REVIEW' && (
                <div className="bg-white p-4 rounded shadow-sm border border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (Required for rejection only)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Income certificate is expired"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}

              {selectedReq.status === 'REJECTED' && (
                <div className="bg-red-50 p-4 border border-red-200 rounded text-sm text-red-800">
                  <strong>Rejected:</strong> {selectedReq.rejection_reason}
                </div>
              )}

            </div>

            <div className="px-6 py-4 border-t bg-white flex justify-end space-x-3 rounded-b-lg">
              <button onClick={() => setSelectedReq(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium transition">
                Close
              </button>
              {selectedReq.status === 'UNDER_REVIEW' && (
                <>
                  <button 
                    onClick={handleReject} disabled={actionLoading}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded font-medium transition disabled:opacity-50"
                  >
                    Reject Application
                  </button>
                  <button 
                    onClick={handleApprove} disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition disabled:opacity-50 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Approve Application
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

export default OfficerRequests;
