import React, { useState, useEffect } from "react";
import {
  getITProvisions,
  deleteITProvision,
  updateITProvision,
  addITProvision,
} from "../../api/employeeApi";
import Sidebars from "./sidebars";

const ITProvision = () => {
  const [provisions, setProvisions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editProvision, setEditProvision] = useState(null);
  const [newProvision, setNewProvision] = useState({
    employee: "",
    it_equipment: false,
    laptop: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProvisions = async () => {
      setLoading(true);
      try {
        const response = await getITProvisions();
        setProvisions(response.data);
      } catch (error) {
        console.error("Error fetching IT provisions:", error);
        alert("Failed to load IT provisions. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchProvisions();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this provision?")) {
      try {
        await deleteITProvision(id);
        setProvisions(provisions.filter((provision) => provision.id !== id));
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
    setNewProvision({ employee: "", it_equipment: false, laptop: false });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateITProvision(editProvision.id, editProvision);
      setProvisions(
        provisions.map((item) =>
          item.id === editProvision.id ? editProvision : item
        )
      );
      setIsModalOpen(false);
      setEditProvision(null);
    } catch (error) {
      console.error("Error updating provision:", error);
      alert("Failed to update provision. Please try again.");
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await addITProvision(newProvision);
      setProvisions([...provisions, response.data]);
      setIsAddModalOpen(false);
      setNewProvision({ employee: "", it_equipment: false, laptop: false });
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
    } else {
      setNewProvision({
        ...newProvision,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };

  // Filter provisions based on search term
  const filteredProvisions = provisions.filter((provision) =>
    provision.employee?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const containerStyle = {
    display: "flex",
    height: "100vh",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex" }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: "auto" }}></div>
      </div>
      <div className="it-provision-container">
        <h2 className="heading">IT Provision</h2>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by employee name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-bar"
        />

        <button onClick={() => setIsAddModalOpen(true)} className="add-button">
          Add New Provision
        </button>

        {loading && <div className="loading">Loading provisions...</div>}

        <div className="card-container">
          {filteredProvisions.length > 0
            ? filteredProvisions.map((provision) => (
                <div key={provision.id} className="card">
                  <h3 className="employee-name">
                    {provision.employee || "Unknown Employee"}
                  </h3>
                  <p className="provision-details">
                    ID Card: {provision.it_equipment ? "Yes" : "No"}
                  </p>
                  <p className="provision-details">
                    Laptop Provided: {provision.laptop ? "Yes" : "No"}
                  </p>
                  <button
                    onClick={() => handleEdit(provision)}
                    className="edit-button"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(provision.id)}
                    className="delete-button"
                  >
                    Delete
                  </button>
                </div>
              ))
            : !loading && <div className="no-data">No IT provisions found</div>}
        </div>

        {/* Edit Modal */}
        {isModalOpen && editProvision && (
          <div className="modal">
            <div className="modal-content">
              <h3>Edit IT Provision</h3>
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
                  <input
                    type="checkbox"
                    name="it_equipment"
                    checked={editProvision.it_equipment || false}
                    onChange={handleInputChange}
                  />
                  ID Card
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="laptop"
                    checked={editProvision.laptop || false}
                    onChange={handleInputChange}
                  />
                  Laptop Provided
                </label>
                <div className="modal-buttons">
                  <button type="submit">Save Changes</button>
                  <button type="button" onClick={handleModalClose}>
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New IT Provision Modal */}
        {isAddModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <h3>Add New IT Provision</h3>
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
                  <input
                    type="checkbox"
                    name="it_equipment"
                    checked={newProvision.it_equipment}
                    onChange={handleInputChange}
                  />
                  ID Card
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="laptop"
                    checked={newProvision.laptop}
                    onChange={handleInputChange}
                  />
                  Laptop Provided
                </label>
                <div className="modal-buttons">
                  <button type="submit">Add Provision</button>
                  <button type="button" onClick={handleAddModalClose}>
                    Close
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CSS Styling */}
        <style>{`
          .it-provision-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 40px;
            background-color: #f4f7fc;
            min-height: 100vh;
            flex: 1;
          }

          .heading {
            font-size: 2.5rem;
            margin-bottom: 30px;
            font-weight: bold;
            color: #0078d4;
            text-align: center;
          }

          .add-button {
            background-color: #28a745;
            color: white;
            padding: 10px 20px;
            font-size: 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-bottom: 30px;
            transition: background-color 0.3s ease;
          }

          .add-button:hover {
            background-color: #218838;
          }

          .search-bar {
            padding: 10px;
            margin-bottom: 20px;
            width: 100%;
            max-width: 500px;
            border-radius: 4px;
            border: 1px solid #ccc;
            font-size: 1rem;
          }

          .loading, .no-data {
            padding: 20px;
            font-size: 1.1rem;
            color: #666;
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
            transform: translateY(-5px);
            box-shadow: 0 6px 15px rgba(0, 0, 0, 0.2);
          }

          .employee-name {
            font-size: 1.2rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }

          .provision-details {
            font-size: 1rem;
            color: #555;
            margin: 5px 0;
          }

          .edit-button,
          .delete-button {
            margin-top: 10px;
            padding: 8px 16px;
            font-size: 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            width: 80px;
          }

          .edit-button {
            background-color: #f0ad4e;
            color: white;
          }

          .edit-button:hover {
            background-color: #ec971f;
          }

          .delete-button {
            background-color: #d9534f;
            color: white;
          }

          .delete-button:hover {
            background-color: #c9302c;
          }

          /* Modal Styling */
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
            z-index: 1000;
          }

          .modal-content {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            width: 400px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          }

          .modal-content h3 {
            margin-bottom: 20px;
            color: #333;
            text-align: center;
          }

          .modal-content form {
            display: flex;
            flex-direction: column;
          }

          .modal-content form label {
            margin-bottom: 15px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .modal-content form input[type="text"] {
            margin-bottom: 15px;
            padding: 10px;
            font-size: 1rem;
            border-radius: 4px;
            border: 1px solid #ccc;
            width: 100%;
          }

          .modal-content form input[type="checkbox"] {
            margin: 0;
          }

          .modal-buttons {
            display: flex;
            gap: 10px;
            margin-top: 20px;
          }

          .modal-content form button {
            padding: 10px 15px;
            font-size: 1rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            flex: 1;
          }

          .modal-content form button[type="submit"] {
            background-color: #0078d4;
            color: white;
          }

          .modal-content form button[type="submit"]:hover {
            background-color: #005a9e;
          }

          .modal-content form button[type="button"] {
            background-color: #6c757d;
            color: white;
          }

          .modal-content form button[type="button"]:hover {
            background-color: #545b62;
          }
        `}</style>
      </div>
    </div>
  );
};

export default ITProvision;
