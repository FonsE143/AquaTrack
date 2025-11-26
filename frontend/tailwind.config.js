import { Droplet, LayoutDashboard, PackageCheck, Truck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import splash from './splash.jfif';

const features = [
  {
    icon: <LayoutDashboard className="h-8 w-8 text-primary" />,
    title: 'Centralized Dashboard',
    description: 'A unified view of orders, inventory, deliveries, and financial data for a complete overview.',
  },
  {
    icon: <PackageCheck className="h-8 w-8 text-primary" />,
    title: 'Order Management',
    description: 'Capture and track orders from multiple channels in real-time, keeping your database updated automatically.',
  },
  {
    icon: <Truck className="h-8 w-8 text-primary" />,
    title: 'Inventory Tracking',
    description: 'Automated stock level updates and low-inventory alerts for admins and staff to prevent stockouts.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Customer Portal',
    description: 'Empower customers to place new orders, view their order history, and receive important notifications.',
  },
];

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center z-10 relative">
        <Link to="/" className="flex items-center gap-2">
          <Droplet className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold tracking-tight">AquaTrack</span>
        </Link>
        <Link to="/login" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-sky-500 transition">
          Login
        </Link>
      </header>

      {/* Hero Section */}
      <section className="relative flex-grow flex items-center justify-center min-h-screen">
        <div className="absolute inset-0 w-full h-full">
            <img src={splash} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-background/70 backdrop-blur-[12px]"></div>
        </div>
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Streamline Your Water Delivery Business
            </h1>
            <p className="mt-6 text-lg text-foreground/80 leading-relaxed">
              AquaTrack is the all-in-one solution to manage orders, track inventory, and empower your customers.
            </p>
            <div className="mt-10">
              <Link
                to="/login"
                className="inline-block bg-primary text-white px-6 py-3 rounded-md text-lg hover:scale-105 transition-transform"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 bg-card">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12">
          <div className="max-w-2xl mx-auto lg:max-w-none text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything You Need to Succeed
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              AquaTrack provides powerful features to simplify your operations and boost efficiency.
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="flex justify-center items-center h-16 w-16 bg-accent rounded-lg mx-auto mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted py-8 mt-auto">
        <div className="container mx-auto px-6 sm:px-8 lg:px-12 text-center text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} AquaTrack. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
