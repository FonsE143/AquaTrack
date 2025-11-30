import { useState } from 'react';
import axios from 'axios';
import { Droplet } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isFormValid = username.trim() !== '' && password.trim() !== '';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL.replace('/api', '')}/api/auth/token/`, {
        username: username,
        password,
      });
      localStorage.setItem('token', data.access);
      if (data.refresh) {
        localStorage.setItem('refreshToken', data.refresh);
      }

      // Use the api client which has the interceptor to get user info
      const { api } = await import('../api/client');
      const me = await api.get('/me/');
      
      const role = me.data.role;
      const map = {
        admin: '/admin/dashboard',
        staff: '/staff/dashboard',
        driver: '/driver/dashboard',
        customer: '/customer/dashboard',
      };
      navigate(map[role] || '/');
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.non_field_errors?.[0] || 
                          err.message || 
                          'Invalid credentials';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 px-md-5">
      <form
        onSubmit={submit}
        className="bg-white rounded-4 shadow p-4 p-md-5 w-100"
        style={{ maxWidth: '500px' }}
      >
        {/* Logo + Brand */}
        <div className="text-center mb-4">
          <Droplet className="text-success mb-1" size={30} />
          <h5 className="fw-bold text-success mb-1">AquaTrack</h5>
        </div>

        {/* Title + Subtext */}
        <h4 className="fw-semibold text-center mb-1">Login</h4>
        <p className="text-muted text-center small mb-4">
          Enter your credentials to access your dashboard.
        </p>

        {/* Error */}
        {error && (
          <div className="alert alert-danger py-2 text-center small">{error}</div>
        )}

        {/* Username */}
        <div className="mb-4">
          <label className="form-label fw-semibold small">Username</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="form-label fw-semibold small">Password</label>
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={!isFormValid || loading}
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>

        {/* Register Link */}
        <div className="text-center mt-3">
          <small className="text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-success text-decoration-none">
              Sign up
            </Link>
          </small>
        </div>
      </form>
    </div>
  );
}