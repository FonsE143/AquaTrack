import { useState, useEffect } from 'react';
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
    municipality: '',
    barangay: '',
    address_details: ''
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [municipalities, setMunicipalities] = useState([]);
  const [barangays, setBarangays] = useState([]);
  const navigate = useNavigate();

  // Fetch municipalities on component mount
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/municipalities/`);
        const data = Array.isArray(response.data) ? response.data : 
                    (response.data.results && Array.isArray(response.data.results) ? response.data.results : []);
        setMunicipalities(data);
      } catch (err) {
        console.error('Failed to fetch municipalities:', err);
        setMunicipalities([]);
      }
    };
    
    fetchMunicipalities();
  }, []);

  // Fetch barangays when municipality changes
  useEffect(() => {
    if (formData.municipality) {
      const fetchBarangays = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/barangays/?municipality=${formData.municipality}`);
          const data = Array.isArray(response.data) ? response.data : 
                      (response.data.results && Array.isArray(response.data.results) ? response.data.results : []);
          setBarangays(data);
        } catch (err) {
          console.error('Failed to fetch barangays:', err);
          setBarangays([]);
        }
      };
      
      fetchBarangays();
    } else {
      setBarangays([]);
    }
  }, [formData.municipality]);

  const isFormValid = formData.username.trim() !== '' && 
                     formData.email.trim() !== '' && 
                     formData.password.trim() !== '' &&
                     formData.password === formData.confirmPassword;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
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
      await axios.post(`${API_BASE_URL}/account/register/`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        municipality: formData.municipality,
        barangay: formData.barangay,
        address_details: formData.address_details
      });
      
      setSuccess('Registration successful! Please login.');
      // Clear form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        municipality: '',
        barangay: '',
        address_details: ''
      });
      // Redirect to login after successful registration
      setTimeout(() => {
        navigate('/login');
      }, 2000);
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3 px-md-5">
      <form
        onSubmit={submit}
        className="bg-white rounded-4 shadow p-4 p-md-5 w-100"
        style={{ maxWidth: '500px' }}
      >
        {/* Logo + Brand */}
        <div className="text-center mb-4">
          <Droplet className="text-success mb-1" size={30} />
          <h5 className="fw-bold text-success mb-1">AquaFlow</h5>
        </div>

        {/* Title + Subtext */}
        <h4 className="fw-semibold text-center mb-1">Create Account</h4>
        <p className="text-muted text-center small mb-4">
          Sign up to start ordering water delivery.
        </p>

        {/* Success Message */}
        {success && (
          <div className="alert alert-success py-2 text-center small">{success}</div>
        )}

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

        {/* Address Section */}
        <div className="mb-4">
          <h6 className="fw-semibold mb-3">Delivery Address</h6>
          
          {/* Municipality */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Municipality *</label>
            <select
              className="form-select"
              value={formData.municipality}
              onChange={(e) => setFormData({...formData, municipality: e.target.value, barangay: ''})}
              required
            >
              <option value="">Select Municipality</option>
              {municipalities.map(municipality => (
                <option key={municipality.id} value={municipality.id}>
                  {municipality.name}
                </option>
              ))}
            </select>
          </div>

          {/* Barangay */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">Barangay *</label>
            <select
              className="form-select"
              value={formData.barangay}
              onChange={(e) => setFormData({...formData, barangay: e.target.value})}
              disabled={!formData.municipality}
              required
            >
              <option value="">Select Barangay</option>
              {barangays.map(barangay => (
                <option key={barangay.id} value={barangay.id}>
                  {barangay.name}
                </option>
              ))}
            </select>
          </div>

          {/* Address Details */}
          <div className="mb-3">
            <label className="form-label fw-semibold small">House Number / Lot Number / Street *</label>
            <textarea
              className="form-control"
              placeholder="Enter your complete address"
              value={formData.address_details}
              onChange={(e) => setFormData({...formData, address_details: e.target.value})}
              rows="2"
              required
            />
          </div>
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