import { Droplet, LayoutDashboard, PackageCheck, Truck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

const features = [
  {
    icon: <LayoutDashboard className="h-8 w-8 text-success" />,
    title: 'Centralized Dashboard',
    description: 'A unified view of orders, inventory, deliveries, and financial data for a complete overview.',
  },
  {
    icon: <PackageCheck className="h-8 w-8 text-success" />,
    title: 'Order Management',
    description: 'Capture and track orders from multiple channels in real-time, keeping your database updated automatically.',
  },
  {
    icon: <Truck className="h-8 w-8 text-success" />,
    title: 'Inventory Tracking',
    description: 'Automated stock level updates and low-inventory alerts for admins and staff to prevent stockouts.',
  },
  {
    icon: <Users className="h-8 w-8 text-success" />,
    title: 'Customer Portal',
    description: 'Empower customers to place new orders, view their order history, and receive important notifications.',
  },
];

export default function Landing() {
  return (
    <div className="d-flex flex-column min-vh-100 w-100 bg-background text-foreground font-sans" style={{ margin: 0, padding: 0, overflowX: 'hidden' }}>

      {/* Header */}
      <header className="container-fluid py-3 px-4 d-flex justify-content-between align-items-center" style={{ margin: 0, paddingLeft: '1rem', paddingRight: '1rem' }}>
        <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
          <Droplet className="h-7 w-7 text-success" />
          <span className="fs-4 fw-bold text-success">AquaTrack</span>
        </Link>
        <Link to="/login" className="btn btn-success px-4 py-2">
          Login
        </Link>
      </header>

      {/* Hero Section */}
      <section
        className="position-relative d-flex align-items-center justify-content-center"
        style={{ 
          minHeight: '80vh',
          width: '100%',
          margin: 0,
          padding: 0,
          left: 0,
          right: 0
        }}
      >
        {/* Background image + blur overlay */}
        <div 
          className="position-absolute top-0 start-0"
          style={{
            width: '100%',
            height: '100%',
            left: 0,
            right: 0,
            margin: 0,
            padding: 0
          }}
        >
          <img
            src="/splash.jfif"
            alt="Splash background"
            className="position-absolute top-0 start-0"
            style={{ 
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: 0.5,
              left: 0,
              right: 0,
              margin: 0,
              padding: 0
            }}
          />
          <div
            className="position-absolute top-0 start-0"
            style={{
              width: '100%',
              height: '100%',
              backdropFilter: 'blur(3px)',
              left: 0,
              right: 0,
              margin: 0,
              padding: 0
            }}
          ></div>
        </div>

        {/* Hero content */}
        <div className="w-100 text-center position-relative px-4">
          <div className="mx-auto" style={{ maxWidth: '700px' }}>
            <h1 className="display-4 fw-bold text-foreground">
              Streamline Your Water Delivery Business
            </h1>
            <p className="lead text-muted mt-3">
              AquaTrack is the all-in-one solution to manage orders, track inventory, and empower your customers.
            </p>
            <Link to="/login" className="btn btn-success btn-lg mt-4">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-white">
        <div className="container text-center">
          <h2 className="fw-bold fs-2 text-foreground">Everything You Need to Succeed</h2>
          <p className="text-muted fs-5 mt-2">
            AquaTrack provides powerful features to simplify your operations and boost efficiency.
          </p>
          <div className="row mt-5 g-4">
            {features.map((feature, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-3 mb-4">
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body text-center">
                    <div
                      className="d-flex justify-content-center align-items-center bg-success bg-opacity-25 rounded-circle mx-auto mb-3"
                      style={{ width: '64px', height: '64px' }}
                    >
                      {feature.icon}
                    </div>
                    <h5 className="card-title fw-semibold">{feature.title}</h5>
                    <p className="card-text text-muted">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-light py-4 mt-auto w-100">
         <div className="w-100 text-center text-muted small">
          &copy; {new Date().getFullYear()} AquaTrack. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
