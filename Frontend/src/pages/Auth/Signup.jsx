import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { AuthContext } from '../../context/AuthContext';
import { ShieldCheck, UserPlus } from 'lucide-react';

const Signup = () => {
  const [role, setRole] = useState('CITIZEN'); // 'CITIZEN' or 'OFFICER'
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    password: '',
    employee_id: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = role === 'CITIZEN' ? '/auth/signup/citizen' : '/auth/signup/officer';

    try {
      const response = await api.post(endpoint, formData);
      const { token, user } = response.data.data;
      login(token, user);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md border border-gray-200">
        <div className="text-center mb-6">
          <ShieldCheck className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <h2 className="text-2xl font-bold text-gray-800">New Registration</h2>
          <p className="text-sm text-gray-500">Create your Kutumbsetu account</p>
        </div>

        {/* Role Toggle */}
        <div className="flex p-1 bg-gray-100 rounded-md mb-6">
          <button
            type="button"
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${role === 'CITIZEN' ? 'bg-white shadow text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setRole('CITIZEN')}
          >
            Citizen Registration
          </button>
          <button
            type="button"
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${role === 'OFFICER' ? 'bg-white shadow text-blue-800' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setRole('OFFICER')}
          >
            Officer Registration
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          {role === 'CITIZEN' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="Ramesh Patel"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
          )}

          {role === 'OFFICER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <input
                type="text"
                name="employee_id"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
                placeholder="GJ-REV-101"
                value={formData.employee_id}
                onChange={handleChange}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
            <input
              type="text"
              name="mobile"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="9999999999"
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              name="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md flex justify-center items-center transition disabled:opacity-70"
          >
            {loading ? 'Registering...' : (
              <>
                <UserPlus className="h-5 w-5 mr-2" />
                <span>Create Account</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Login here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
