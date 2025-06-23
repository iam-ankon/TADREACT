import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  Users,
  Tag,
  Grid,
  Filter,
  User,
  Loader2,
  Trash2,
} from "lucide-react";

export default function BuyerPage() {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "ascending" });
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://119.148.12.1:8000/api/merchandiser/api/buyer/");
        setBuyers(response.data);
      } catch (err) {
        console.error("Error fetching buyers:", err);
        setError("Failed to load buyer data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyers();
  }, []);

  const handleDeleteBuyer = async (buyerId, e) => {
    e.stopPropagation(); // Prevent the row click event from triggering
    if (window.confirm("Are you sure you want to delete this buyer?")) {
      try {
        await axios.delete(`http://119.148.12.1:8000/api/merchandiser/api/buyer/${buyerId}/`);
        setBuyers(buyers.filter(buyer => buyer.id !== buyerId));
      } catch (err) {
        console.error("Error deleting buyer:", err);
        setError("Failed to delete buyer. Please try again.");
      }
    }
  };

  const departments = buyers.length > 0 ? ["All", ...new Set(buyers.map(b => b.department))] : ["All"];

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleEditBuyer = (buyerId) => {
    navigate(`/edit-buyer/${buyerId}`);
  };
  

  const sortedBuyers = [...buyers]
    .filter(buyer => {
      const matchesSearch =
        buyer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        buyer.product_categories?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = selectedDepartment === "All" || buyer.department === selectedDepartment;

      return matchesSearch && matchesDepartment;
    })
    .sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === "ascending" ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span style={{ display: 'inline-block', width: 16, height: 16 }} />;
    return sortConfig.direction === "ascending"
      ? <ChevronUp style={{ width: 16, height: 16, marginLeft: 4 }} />
      : <ChevronDown style={{ width: 16, height: 16, marginLeft: 4 }} />;
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#A7D5E1' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        <div style={{ backgroundColor: '#DCEEF3', borderRadius: 8, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Users style={{ width: 24, height: 24, color: '#2563eb', marginRight: 8 }} />
                <h1 style={{ fontSize: 20, fontWeight: 600, color: '#1f2937' }}>Buyer Management</h1>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: 200 }}>
                  <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <Search style={{ width: 20, height: 20, color: '#9ca3af' }} />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search buyers..."
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 36px',
                      borderRadius: 6,
                      border: '1px solid #d1d5db',
                      fontSize: 14,
                    }}
                  />
                </div>

                {/* Department filter */}
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                  }}
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                {/* Add Buyer Button */}
                <button
                  onClick={() => navigate("/add-buyer")}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: 6,
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  + Add Buyer
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '24px' }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0' }}>
                <Loader2 className="animate-spin" style={{ width: 48, height: 48, color: '#3b82f6', marginBottom: 16 }} />
                <p style={{ color: '#4b5563' }}>Loading buyer data...</p>
              </div>
            ) : error ? (
              <div style={{ backgroundColor: '#fef2f2', padding: 16, borderLeft: '4px solid #f87171' }}>
                <p style={{ color: '#b91c1c' }}>{error}</p>
              </div>
            ) : sortedBuyers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48 }}>
                <User style={{ width: 48, height: 48, color: '#9ca3af', margin: '0 auto' }} />
                <h3 style={{ marginTop: 16, fontSize: 16, color: '#111827' }}>
                  {searchTerm || selectedDepartment !== "All"
                    ? "No buyers match your search criteria"
                    : "No buyers available"}
                </h3>
                <p style={{ marginTop: 8, fontSize: 14, color: '#6b7280' }}>
                  {searchTerm || selectedDepartment !== "All"
                    ? "Try adjusting your search or filter to find what you're looking for."
                    : "There are currently no buyers in the system."}
                </p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDepartment("All");
                  }}
                  style={{
                    marginTop: 16,
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#A7D5E1', position: 'sticky', top: 0 }}>
                      <tr>
                        {["name", "email", "department"].map((key) => (
                          <th
                            key={key}
                            onClick={() => requestSort(key)}
                            style={{
                              padding: '12px 24px',
                              textAlign: 'left',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#6b7280',
                              cursor: 'pointer',
                              backgroundColor: '#A7D5E1',
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {key === "name" && "Buyer"}
                              {key === "email" && "Contact"}
                              {key === "department" && "Department"}
                              <SortIcon column={key} />
                            </div>
                          </th>
                        ))}
                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                          Details
                        </th>
                        <th style={{ padding: '12px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', borderBottom: '1px solid #e5e7eb' }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBuyers.map((buyer, idx) => (
                        <tr
                          key={buyer.id}
                          onClick={() => handleEditBuyer(buyer.id)}
                          style={{
                            backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb',
                            cursor: 'pointer',
                          }}
                        >
                          <td style={{ padding: '12px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User style={{ width: 20, height: 20, color: '#2563eb' }} />
                              </div>
                              <div style={{ marginLeft: 16 }}>
                                <div style={{ fontWeight: 600, color: '#111827' }}>{buyer.name}</div>
                                {buyer.position && <div style={{ fontSize: 14, color: '#6b7280' }}>{buyer.position}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 24px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                                <Mail style={{ width: 16, height: 16, marginRight: 8, color: '#9ca3af' }} />
                                <a href={`mailto:${buyer.email}`} style={{ color: '#2563eb', textDecoration: 'none' }}>
                                  {buyer.email}
                                </a>
                              </div>
                              {buyer.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: '#6b7280' }}>
                                  <Phone style={{ width: 16, height: 16, marginRight: 8, color: '#9ca3af' }} />
                                  {buyer.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 24px' }}>
                            <span style={{ fontSize: 12, backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12 }}>
                              {buyer.department}
                            </span>
                          </td>
                          <td style={{ padding: '12px 24px' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                              {buyer.wgr && (
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: '#6b7280', backgroundColor: '#f9fafb', padding: '4px 8px', borderRadius: 4 }}>
                                  <Tag style={{ width: 16, height: 16, marginRight: 4, color: '#9ca3af' }} />
                                  WGR: {buyer.wgr}
                                </div>
                              )}
                              {buyer.product_categories && (
                                <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: '#6b7280', backgroundColor: '#f9fafb', padding: '4px 8px', borderRadius: 4 }}>
                                  <Grid style={{ width: 16, height: 16, marginRight: 4, color: '#9ca3af' }} />
                                  {buyer.product_categories}
                                </div>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '12px 24px' }}>
                            <button
                              onClick={(e) => handleDeleteBuyer(buyer.id, e)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#fef2f2',
                                color: '#b91c1c',
                                borderRadius: 4,
                                border: '1px solid #fecaca',
                                fontSize: 14,
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Trash2 size={16} />
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}