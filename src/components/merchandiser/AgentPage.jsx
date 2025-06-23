import { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { useNavigate } from "react-router-dom";
import { FiMail, FiPhone, FiMapPin, FiSearch, FiTrash2, FiPlus, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { FaEdit, FaTrash, FaFilePdf, FaBarcode, FaSearch } from 'react-icons/fa';

export default function AgentPage() {
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [agentsPerPage] = useState(6); // 6 agents per page
  const navigate = useNavigate();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("http://119.148.12.1:8000/api/merchandiser/api/agent/");
      setAgents(response.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load agents. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAgentClick = () => {
    navigate("/add-agent");
  };

  const handleEditAgent = (agentId) => {
    navigate(`/edit-agent/${agentId}`);
  };

  const handleDeleteAgent = async (agentId) => {
    if (window.confirm("Are you sure you want to delete this agent?")) {
      try {
        await axios.delete(`http://119.148.12.1:8000/api/merchandiser/api/agent/${agentId}/`);
        setAgents(agents.filter(agent => agent.id !== agentId));
      } catch (err) {
        console.error(err);
        setError("Failed to delete agent. Please try again.");
      }
    }
  };

  // Filter agents based on search term
  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.phone.includes(searchTerm)
  );

  // Pagination logic
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const currentAgents = filteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);
  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "#f8fafc",
    }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div style={{
        flex: 1,
        padding: "2rem",
        overflowY: "auto",
        background: "linear-gradient(to bottom right, #f0f9ff, #e0f2fe)"
      }}>
        <div style={{
          maxWidth: "1200px",
          margin: "0 auto"
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            flexWrap: "wrap",
            gap: "1rem"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <h2 style={{
                fontSize: "1.75rem",
                fontWeight: "700",
                color: "#0f172a",
                margin: 0
              }}>
                Agent Management
              </h2>
              <button
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#3b82f6",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  width: "fit-content",
                  transition: "background 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
                onClick={handleAddAgentClick}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2563eb"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#3b82f6"}
              >
                <FiPlus size={16} /> Create New Agent
              </button>
            </div>

            <div style={{
              position: "relative",
              width: "100%",
              maxWidth: "300px"
            }}>
              <FiSearch style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8"
              }} />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.5rem",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#fff",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                  transition: "all 0.2s",
                  outline: "none",
                  fontSize: "0.9rem"
                }}
              />
            </div>
          </div>

          {isLoading ? (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "300px"
            }}>
              <div style={{
                width: "50px",
                height: "50px",
                border: "4px solid #e2e8f0",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                animation: "spin 1s linear infinite"
              }}></div>
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: "#fee2e2",
              color: "#b91c1c",
              padding: "1rem",
              borderRadius: "8px",
              textAlign: "center"
            }}>
              {error}
            </div>
          ) : filteredAgents.length === 0 ? (
            <div style={{
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
            }}>
              {searchTerm ? "No agents match your search." : "No agents available."}
            </div>
          ) : (
            <>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "1.5rem"
              }}>
                {currentAgents.map((agent) => (
                  <div
                    key={agent.id}
                    style={{
                      backgroundColor: "#fff",
                      padding: "1.5rem",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                      transition: "all 0.2s ease",
                      borderTop: "4px solid #3b82f6",
                      position: "relative",
                      cursor: "pointer"
                    }}
                    onClick={() => handleEditAgent(agent.id)}
                  >
                    {/* Action buttons */}
                    <div style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      display: "flex",
                      gap: "0.5rem"
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAgent(agent.id);
                        }}
                        style={{
                          marginRight: "5px",
                          padding: "8px 10px",
                          cursor: "pointer",
                          border: "none",
                          borderRadius: "50px",
                          marginBottom: "5px",
                          backgroundColor: "#d9534f",
                          color: "white",
                        }}
                        title="Delete agent"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>

                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "1rem",
                      paddingRight: "2rem"
                    }}>
                      <div style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "#dbeafe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "1rem",
                        color: "#1d4ed8",
                        fontSize: "1.25rem",
                        fontWeight: "600"
                      }}>
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{
                          fontSize: "1.125rem",
                          fontWeight: "600",
                          color: "#1e293b",
                          margin: 0,
                        }}>
                          {agent.name}
                        </h3>
                        <span style={{
                          fontSize: "0.875rem",
                          color: "#64748b"
                        }}>
                          Agent ID: {agent.id}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      borderTop: "1px solid #f1f5f9",
                      paddingTop: "1rem"
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        <FiMail style={{
                          color: "#64748b",
                          marginRight: "0.5rem",
                          flexShrink: 0
                        }} />
                        <span style={{ color: "#475569" }}>{agent.email}</span>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                        fontSize: "0.9rem"
                      }}>
                        <FiPhone style={{
                          color: "#64748b",
                          marginRight: "0.5rem",
                          flexShrink: 0
                        }} />
                        <span style={{ color: "#475569" }}>{agent.phone}</span>
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "flex-start",
                        fontSize: "0.9rem"
                      }}>
                        <FiMapPin style={{
                          color: "#64748b",
                          marginRight: "0.5rem",
                          marginTop: "2px",
                          flexShrink: 0
                        }} />
                        <span style={{ color: "#475569" }}>{agent.address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {filteredAgents.length > agentsPerPage && (
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: "2rem",
                  gap: "0.5rem"
                }}>
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 1}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: currentPage === 1 ? "#e2e8f0" : "#3b82f6",
                      color: currentPage === 1 ? "#64748b" : "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: currentPage === 1 ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    <FiChevronLeft /> Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      style={{
                        padding: "0.5rem 1rem",
                        backgroundColor: currentPage === number ? "#3b82f6" : "#e2e8f0",
                        color: currentPage === number ? "white" : "#334155",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontWeight: currentPage === number ? "600" : "normal"
                      }}
                    >
                      {number}
                    </button>
                  ))}

                  <button
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: currentPage === totalPages ? "#e2e8f0" : "#3b82f6",
                      color: currentPage === totalPages ? "#64748b" : "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem"
                    }}
                  >
                    Next <FiChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}