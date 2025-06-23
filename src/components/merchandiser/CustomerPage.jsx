


import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../merchandiser/Sidebar.jsx";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const API_URL = "http://119.148.12.1:8000/api/merchandiser/api/customer/";
  const BUYER_URL = "http://119.148.12.1:8000/api/merchandiser/api/buyer/";

  useEffect(() => {
    fetchCustomers();
    fetchBuyers();
  }, []);

  const fetchCustomers = () => {
    setIsLoading(true);
    axios.get(API_URL)
      .then((res) => {
        setCustomers(res.data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch customers");
        setIsLoading(false);
      });
  };

  const fetchBuyers = () => {
    axios.get(BUYER_URL)
      .then((res) => setBuyers(res.data))
      .catch((err) => {
        console.error(err);
        setError("Failed to fetch buyers");
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      setIsLoading(true);
      axios.delete(`${API_URL}${id}/`)
        .then(() => {
          setSuccess("Customer deleted successfully!");
          fetchCustomers();
        })
        .catch((err) => {
          console.error(err);
          setError("Failed to delete customer");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-container">
      <Sidebar />
      
      <div className="content-container">
        <div className="page-header">
          <h2 className="page-title">Customer Management</h2>
          <button
            onClick={() => navigate("/add-customer")}
            className="btn btn-primary"
          >
            <i className="icon-plus"></i> Add New Customer
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="alert alert-error">
            <i className="icon-error"></i>
            <span>{error}</span>
            <button onClick={() => setError(null)} className="alert-close">
              &times;
            </button>
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <i className="icon-success"></i>
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className="alert-close">
              &times;
            </button>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="search-container">
          <div className="search-box">
            <i className="icon-search"></i>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="results-count">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>

        {/* Customers List */}
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="empty-state">
            <i className="icon-empty"></i>
            <p>No customers found</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="btn btn-secondary"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="customer-grid">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="customer-card">
                <div className="card-header">
                  <div className="customer-avatar">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="customer-info">
                    <h3 className="customer-name">{customer.name}</h3>
                    <p className="customer-email">
                      {customer.email || 'No email provided'}
                    </p>
                  </div>
                </div>
                
                <div className="card-body">
                  <div className="info-item">
                    <i className="icon-phone"></i>
                    <span>{customer.phone || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <i className="icon-location"></i>
                    <span>{customer.address || 'No address provided'}</span>
                  </div>
                  <div className="info-item">
                    <i className="icon-remark"></i>
                    <span>{customer.remarks || 'No remarks'}</span>
                  </div>
                  <div className="info-item">
                    <i className="icon-buyer"></i>
                    <span>
                      {customer.buyer?.length > 0
                        ? customer.buyer.map(id => buyers.find(b => b.id === id)?.name)
                            .filter(Boolean).join(", ")
                        : "No buyers assigned"}
                    </span>
                  </div>
                </div>
                
                <div className="card-footer">
                  <button
                    onClick={() => navigate(`/edit-customer/${customer.id}`)}
                    className="btn btn-edit"
                  >
                    <i className="icon-edit"></i> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(customer.id)}
                    className="btn btn-delete"
                  >
                    <i className="icon-delete"></i> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        /* Base Styles */
        .page-container {
          display: flex;
          min-height: 100vh;
          background-color: #A7D5E1;
          
        }
        
        .content-container {
          flex: 1;
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }
        
        /* Header Styles */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .page-title {
          font-size: 1.75rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        /* Alert Styles */
        .alert {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          font-size: 0.875rem;
          position: relative;
        }
        
        .alert-error {
          background-color: #fef2f2;
          color: #b91c1c;
          border-left: 4px solid #dc2626;
        }
        
        .alert-success {
          background-color: #f0fdf4;
          color: #166534;
          border-left: 4px solid #16a34a;
        }
        
        .alert-close {
          margin-left: auto;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          font-size: 1.25rem;
          padding: 0 0.5rem;
        }
        
        .icon-error, .icon-success {
          margin-right: 0.5rem;
          font-size: 1.25rem;
        }
        
        /* Search Styles */
        .search-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .search-box {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 0.5rem;
          padding: 0.5rem 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          width: 300px;
        }
        
        .search-box input {
          border: none;
          outline: none;
          padding: 0.5rem;
          width: 100%;
          font-size: 0.875rem;
        }
        
        .icon-search {
          color: #64748b;
          margin-right: 0.5rem;
        }
        
        .results-count {
          font-size: 0.875rem;
          color: #64748b;
        }
        
        /* Button Styles */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        
        .btn-primary {
          background-color: #3b82f6;
          color: white;
        }
        
        .btn-primary:hover {
          background-color: #2563eb;
        }
        
        .btn-secondary {
          background-color: #e2e8f0;
          color: #334155;
        }
        
        .btn-secondary:hover {
          background-color: #cbd5e1;
        }
        
        .btn-edit {
          background-color: #f59e0b;
          color: white;
        }
        
        .btn-edit:hover {
          background-color: #d97706;
        }
        
        .btn-delete {
          background-color: #ef4444;
          color: white;
        }
        
        .btn-delete:hover {
          background-color: #dc2626;
        }
        
        /* Customer Grid */
        .customer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        
        /* Customer Card */
        .customer-card {
          background: #DCEEF3;
          border-radius: 0.75rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          flex-direction: column;
        }
        
        .customer-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          padding: 1.25rem;
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .customer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #3b82f6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin-right: 1rem;
        }
        
        .customer-info {
          flex: 1;
        }
        
        .customer-name {
          font-size: 1rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
          color: #1e293b;
        }
        
        .customer-email {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0;
        }
        
        .card-body {
          padding: 1.25rem;
          flex: 1;
        }
        
        .info-item {
          display: flex;
          align-items: flex-start;
          margin-bottom: 0.75rem;
          font-size: 0.875rem;
          color: #334155;
        }
        
        .info-item i {
          margin-right: 0.75rem;
          color: #64748b;
          min-width: 16px;
        }
        
        .card-footer {
          display: flex;
          padding: 0.75rem 1.25rem;
          border-top: 1px solid #e2e8f0;
          gap: 0.75rem;
        }
        
        /* Loading State */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          color: #64748b;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Empty State */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
          color: #64748b;
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .icon-empty {
          font-size: 2.5rem;
          margin-bottom: 1rem;
          color: #cbd5e1;
        }
        
        /* Icons (you would replace with actual icon components) */
        .icon-plus:before { content: "+"; }
        .icon-search:before { content: "🔍"; }
        .icon-error:before { content: "⚠️"; }
        .icon-success:before { content: "✓"; }
        .icon-phone:before { content: "📞"; }
        .icon-location:before { content: "📍"; }
        .icon-remark:before { content: "📝"; }
        .icon-buyer:before { content: "👥"; }
        .icon-edit:before { content: "✏️"; }
        .icon-delete:before { content: "🗑️"; }
      `}</style>
    </div>
  );
}