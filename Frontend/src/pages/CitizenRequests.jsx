import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const CitizenRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await api.get('/benefit-requests');
        setRequests(response.data.data);
      } catch (err) {
        setError('Failed to load your requests.');
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  if (loading) return <div className="p-10 text-center">Loading requests...</div>;
  if (error) return <div className="p-10 text-red-600 text-center">{error}</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <FileText className="mr-2 text-blue-700" /> My Applications
        </h2>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500">You have not applied for any schemes yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 flex justify-between items-start sm:items-center flex-col sm:flex-row border-b border-gray-100">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">{req.scheme_name}</h3>
                  <p className="text-sm text-gray-500">Applied on: {new Date(req.requested_at).toLocaleDateString()}</p>
                </div>
                <div className="mt-2 sm:mt-0">
                  {req.status === 'UNDER_REVIEW' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      <Clock className="w-4 h-4 mr-1.5" /> Under Review
                    </span>
                  )}
                  {req.status === 'APPROVED' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-4 h-4 mr-1.5" /> Approved
                    </span>
                  )}
                  {req.status === 'REJECTED' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      <AlertCircle className="w-4 h-4 mr-1.5" /> Rejected
                    </span>
                  )}
                </div>
              </div>
              
              {req.status === 'REJECTED' && req.rejection_reason && (
                <div className="px-5 py-3 bg-red-50 border-t border-red-100">
                  <p className="text-sm text-red-800">
                    <strong>Reason for Rejection:</strong> {req.rejection_reason}
                  </p>
                </div>
              )}
              {req.status === 'APPROVED' && (
                <div className="px-5 py-3 bg-green-50 border-t border-green-100">
                  <p className="text-sm text-green-800">
                    Congratulations! Your application has been approved by the officer. Funds or benefits will be disbursed shortly.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitizenRequests;
