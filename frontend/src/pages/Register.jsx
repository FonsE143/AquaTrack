import { useState } from 'react';
import axios from 'axios';
import { Droplet } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isFormValid = formData.username.trim() !== '' && 
                     formData.email.trim() !== '' && 
                     formData.password.trim() !== '' &&
                     formData.password === formData.confirmPassword;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/account/register/`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: formData.address
      });
      
      // Redirect to login after successful registration
      navigate('/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.username?.[0] ||
                          err.response?.data?.email?.[0] ||
                          'Registration failed. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-5">
      <form
        onSubmit={submit}
        className="bg-white rounded-4 shadow p-5 w-100"
        style={{ maxWidth: '500px' }}
      >
        {/* Logo + Brand */}
        <div className="text-center mb-4">
          <Droplet className="text-success mb-1" size={30} />
          <h5 className="fw-bold text-success mb-1">AquaTrack</h5>
        </div>

        {/* Title + Subtext */}
        <h4 className="fw-semibold text-center mb-1">Create Account</h4>
        <p className="text-muted text-center small mb-4">
          Sign up to start ordering water delivery.
        </p>

        {/* Error */}
        {error && (
          <div className="alert alert-danger py-2 text-center small">{error}</div>
        )}

        {/* Username */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Username *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Choose a username"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
            autoFocus
          />
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Email *</label>
          <input
            type="email"
            className="form-control"
            placeholder="name@example.com"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Password *</label>
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
            minLength={8}
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Confirm Password *</label>
          <input
            type="password"
            className="form-control"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
            required
          />
        </div>

        {/* Phone */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Phone</label>
          <input
            type="tel"
            className="form-control"
            placeholder="0917-000-0000"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="form-label fw-semibold small">Address</label>
          <textarea
            className="form-control"
            placeholder="Enter your delivery address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            rows="2"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-success w-100"
          disabled={!isFormValid || loading}
        >
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>

        {/* Login Link */}
        <div className="text-center mt-3">
          <small className="text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-success text-decoration-none">
              Login
            </Link>
          </small>
        </div>
      </form>
    </div>
  );
}







