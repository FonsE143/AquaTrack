import { useState, useEffect } from 'react';
import axios from 'axios';
import { Droplet } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
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

  // Enhanced form validation
  const isFormValid = formData.username.trim().length >= 3 && 
                     formData.username.trim().length <= 30 &&
                     formData.email.trim() !== '' && 
                     formData.password.trim().length >= 8 &&
                     formData.password === formData.confirmPassword &&
                     formData.first_name?.trim() !== '' &&
                     formData.last_name?.trim() !== '' &&
                     formData.municipality !== '' &&
                     formData.barangay !== '' &&
                     formData.address_details.trim() !== '';

  const validateForm = () => {
    // Validate username
    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    
    if (formData.username.trim().length > 30) {
      setError('Username must be no more than 30 characters long');
      return false;
    }
    
    // Check for valid characters in username (alphanumeric and underscore only)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(formData.username.trim())) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Validate password
    if (formData.password.trim().length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Validate names (assuming first_name and last_name are added to formData)
    if (!formData.first_name || formData.first_name.trim().length === 0) {
      setError('First name is required');
      return false;
    }
    
    if (formData.first_name.trim().length > 50) {
      setError('First name must be no more than 50 characters');
      return false;
    }
    
    if (!formData.last_name || formData.last_name.trim().length === 0) {
      setError('Last name is required');
      return false;
    }
    
    if (formData.last_name.trim().length > 50) {
      setError('Last name must be no more than 50 characters');
      return false;
    }
    
    // Validate phone if provided
    if (formData.phone.trim() !== '') {
      // Validate Philippine mobile number format (must start with 09 and be 11 digits)
      const phoneRegex = /^09\d{9}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        setError('Invalid phone number format. Must start with 09 and be exactly 11 digits');
        return false;
      }
    }
    
    // Validate address fields
    if (formData.municipality === '') {
      setError('Please select a municipality');
      return false;
    }
    
    if (formData.barangay === '') {
      setError('Please select a barangay');
      return false;
    }
    
    if (formData.address_details.trim() === '') {
      setError('House Number / Lot Number / Street is required');
      return false;
    }
    
    if (formData.address_details.trim().length > 200) {
      setError('Address details must be no more than 200 characters');
      return false;
    }
    
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate form before submission
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/account/register/`, {
        username: formData.username.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim(),
        municipality: formData.municipality,
        barangay: formData.barangay,
        address_details: formData.address_details.trim()
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
      <div
        className="bg-white rounded-4 shadow w-100"
        style={{ maxWidth: '500px', maxHeight: '90vh', overflow: 'hidden' }}
      >
        <div 
          className="p-4 p-md-5" 
          style={{ height: '90vh', overflowY: 'auto' }}
        >
          <form onSubmit={submit}>
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

        {/* First Name */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">First Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter your first name"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            required
            autoFocus
          />
        </div>

        {/* Last Name */}
        <div className="mb-3">
          <label className="form-label fw-semibold small">Last Name *</label>
          <input
            type="text"
            className="form-control"
            placeholder="Enter your last name"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            required
          />
        </div>

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
          />
          <div className="form-text small text-muted">
            3-30 characters, letters, numbers, and underscores only
          </div>
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
          <div className="form-text small text-muted">
            At least 8 characters
          </div>
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
            onChange={(e) => {
              // Remove any non-digit characters
              let value = e.target.value.replace(/\D/g, '');
              // Ensure it starts with 09
              if (value.length > 0 && !value.startsWith('09')) {
                if (value.startsWith('9')) {
                  value = '0' + value;
                } else {
                  value = '09' + value.substring(0, 9);
                }
              }
              // Limit to 11 digits
              if (value.length > 11) {
                value = value.substring(0, 11);
              }
              setFormData({...formData, phone: value});
            }}
            maxLength="11"
          />
          <div className="form-text small text-muted">
            Optional. Must start with 09 and be exactly 11 digits
          </div>
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
            <div className="form-text small text-muted">
              Maximum 200 characters
            </div>
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
      </div>
    </div>
  );
}