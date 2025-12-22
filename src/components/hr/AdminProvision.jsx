import React, { useState, useEffect } from "react";
import { 
  getAdminProvisions, 
  addAdminProvision, 
  updateAdminProvision, 
  deleteAdminProvision 
} from "../../api/employeeApi";
import Sidebars from './sidebars';

const AdminProvision = () => {
  const [provisions, setProvisions] = useState([]);
  const [filteredProvisions, setFilteredProvisions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProvision, setEditProvision] = useState(null);
  const [newProvision, setNewProvision] = useState({
    employee: "",
    bank_account_paper: false,
    sim_card: false,
    visiting_card: false,
    placement: false,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProvisions = async () => {
      try {
        setLoading(true);
        const response = await getAdminProvisions();
        setProvisions(response.data);
        setFilteredProvisions(response.data);
      } catch (error) {
        console.error("Error fetching provisions:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProvisions();
  }, []);

  useEffect(() => {
    const filterProvisions = provisions.filter((provision) =>
      provision.employee.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProvisions(filterProvisions);
  }, [searchQuery, provisions]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this provision?")) {
      try {
        await deleteAdminProvision(id);
        setProvisions(provisions.filter((provision) => provision.id !== id));
        setFilteredProvisions(filteredProvisions.filter((provision) => provision.id !== id));
      } catch (error) {
        console.error("Error deleting provision:", error);
        alert("Failed to delete provision. Please try again.");
      }
    }
  };

  const handleEdit = (provision) => {
    setEditProvision(provision);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditProvision(null);
  };

  const handleAddModalClose = () => {
    setIsAddModalOpen(false);
    setNewProvision({ employee: "", bank_account_paper: false, sim_card: false, visiting_card: false, placement: false });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateAdminProvision(editProvision.id, editProvision);
      setProvisions(
        provisions.map((item) =>
          item.id === editProvision.id ? editProvision : item
        )
      );
      setFilteredProvisions(
        filteredProvisions.map((item) =>
          item.id === editProvision.id ? editProvision : item
        )
      );
      setIsModalOpen(false);
      setEditProvision(null);
      alert("Provision updated successfully!");
    } catch (error) {
      console.error("Error updating provision:", error);
      alert("Failed to update provision. Please try again.");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await addAdminProvision(newProvision);
      setProvisions([...provisions, response.data]);
      setFilteredProvisions([...filteredProvisions, response.data]);
      setIsAddModalOpen(false);
      setNewProvision({ employee: "", bank_account_paper: false, sim_card: false, visiting_card: false, placement: false });
      alert("Provision added successfully!");
    } catch (error) {
      console.error("Error adding provision:", error);
      alert("Failed to add provision. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (editProvision) {
      setEditProvision({
        ...editProvision,
        [name]: type === "checkbox" ? checked : value,
      });
    } else if (newProvision) {
      setNewProvision({
        ...newProvision,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  const containerStyle = {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f4f6f9",
  };

  return (
    <div style={containerStyle}>
      <Sidebars />
      <div className="main-content">
        <h2 className="heading">Admin Provision</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by employee name"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="add-button"
          disabled={loading}
        >
          Add New Provision
        </button>
        
        {loading ? (
          <div className="loading">Loading provisions...</div>
        ) : (
          <div className="card-container">
            {filteredProvisions.map((provision) => (
              <div key={provision.id} className="card">
                <h3>{provision.employee}</h3>
                <p>Bank Account Paper: {provision.bank_account_paper ? "Yes" : "No"}</p>
                <p>SIM Card: {provision.sim_card ? "Yes" : "No"}</p>
                <p>Visiting Card: {provision.visiting_card ? "Yes" : "No"}</p>
                <p>Placement: {provision.placement ? "Yes" : "No"}</p>
                <div className="button-container">
                  <button onClick={() => handleEdit(provision)} className="edit-button">Edit</button>
                  <button onClick={() => handleDelete(provision.id)} className="delete-button">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {isModalOpen && editProvision && (
          <div className="modal">
            <div className="modal-content">
              <h3>Edit Admin Provision</h3>
              <form onSubmit={handleEditSubmit}>
                <label>
                  Employee Name:
                  <input
                    type="text"
                    name="employee"
                    value={editProvision.employee || ""}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Bank Account Paper:
                  <input
                    type="checkbox"
                    name="bank_account_paper"
                    checked={editProvision.bank_account_paper || false}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  SIM Card:
                  <input
                    type="checkbox"
                    name="sim_card"
                    checked={editProvision.sim_card || false}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Visiting Card:
                  <input
                    type="checkbox"
                    name="visiting_card"
                    checked={editProvision.visiting_card || false}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Placement:
                  <input
                    type="checkbox"
                    name="placement"
                    checked={editProvision.placement || false}
                    onChange={handleInputChange}
                  />
                </label>
                <button type="submit">Save Changes</button>
                <button type="button" onClick={handleModalClose}>Close</button>
              </form>
            </div>
          </div>
        )}

        {/* Add New Admin Provision Modal */}
        {isAddModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>Add New Admin Provision</h3>
              <form onSubmit={handleAddSubmit}>
                <label>
                  Employee Name:
                  <input
                    type="text"
                    name="employee"
                    value={newProvision.employee}
                    onChange={handleInputChange}
                    required
                  />
                </label>
                <label>
                  Bank Account Paper:
                  <input
                    type="checkbox"
                    name="bank_account_paper"
                    checked={newProvision.bank_account_paper}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  SIM Card:
                  <input
                    type="checkbox"
                    name="sim_card"
                    checked={newProvision.sim_card}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Visiting Card:
                  <input
                    type="checkbox"
                    name="visiting_card"
                    checked={newProvision.visiting_card}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Placement:
                  <input
                    type="checkbox"
                    name="placement"
                    checked={newProvision.placement}
                    onChange={handleInputChange}
                  />
                </label>
                <button type="submit">Add Provision</button>
                <button type="button" onClick={handleAddModalClose}>Close</button>
              </form>
            </div>
          </div>
        )}

        {/* CSS Styling */}
        <style>{`
          .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            padding: 30px;
            background-color: #f4f7fc;
            align-items: center;
            overflow-y: auto;
          }
          .heading {
            font-size: 2.5rem;
            margin-bottom: 30px;
            font-weight: bold;
            color: #0078d4;
            text-align: center;
          }  
          .loading {
            text-align: center;
            padding: 20px;
            font-size: 1.2rem;
            color: #666;
          }
          .search-bar {
            margin-bottom: 20px;
            width: 100%;
            max-width: 500px;
          }
          .search-bar input {
            width: 100%;
            padding: 10px;
            font-size: 1rem;
            border-radius: 4px;
            border: 1px solid #ccc;
          }
          .card-container {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            width: 100%;
            max-width: 1200px;
            margin-top: 30px;
          }
          .card {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
          }
          .card:hover {
            transform: translateY(-10px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
          }
          .add-button {
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            font-size: 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 20px;
          }
          .add-button:hover:not(:disabled) {
            background-color: #218838;
          }
          .add-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .button-container {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
            align-items: center;
          }
          .edit-button {
            background-color: #fbc02d;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
          }
          .edit-button:hover {
            background-color: #f9a825;
          }
          .delete-button {
            background-color: #e57373;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            border: none;
            cursor: pointer;
          }
          .delete-button:hover {
            background-color: #d32f2f;
          }
          .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            overflow-y: auto;
          }
          .modal-content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            width: 400px;
            max-height: 80%;
            overflow-y: auto;
          }
          .modal-content form {
            display: flex;
            flex-direction: column;
          }
          .modal-content form label {
            margin-bottom: 10px;
          }
          .modal-content form input {
            margin-bottom: 10px;
            padding: 8px;
            font-size: 1rem;
            border-radius: 4px;
            border: 1px solid #ccc;
          }
          .modal-content form button {
            padding: 10px;
            font-size: 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
          }
          .modal-content form button[type="submit"] {
            background-color: #0078d4;
            color: white;
          }
          .modal-content form button[type="button"] {
            background-color: #d9534f;
            color: white;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminProvision;