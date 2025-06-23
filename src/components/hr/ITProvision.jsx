import React, { useState, useEffect } from "react";
import { getITProvisions, deleteITProvision, updateITProvision, addITProvision } from "../../api/employeeApi"; // Adjust according to your file structure
import Sidebars from './sidebars';

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
  const [searchTerm, setSearchTerm] = useState(""); // State for search term

  useEffect(() => {
    const fetchProvisions = async () => {
      const response = await getITProvisions();
      setProvisions(response.data);
    };
    fetchProvisions();
  }, []);

  const handleDelete = async (id) => {
    await deleteITProvision(id);
    setProvisions(provisions.filter((provision) => provision.id !== id));
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
    await updateITProvision(editProvision.id, editProvision);
    setProvisions(
      provisions.map((item) =>
        item.id === editProvision.id ? editProvision : item
      )
    );
    setIsModalOpen(false);
    setEditProvision(null);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const response = await addITProvision(newProvision);
    setProvisions([...provisions, response.data]);
    setIsAddModalOpen(false);
    setNewProvision({ employee: "", it_equipment: false, laptop: false });
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

  // Filter provisions based on search term
  const filteredProvisions = provisions.filter((provision) =>
    provision.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const containerStyle = {
    display: "flex",
    height: "100vh",
    fontFamily: "Segoe UI, Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh",
  };

  return (
    <div style={containerStyle}>
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>
      <div className="it-provision-container">
        <h2 className="heading">IT Provision</h2>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by employee name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} // Update search term
          className="search-bar"
        />

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="add-button"
        >
          Add New Provision
        </button>

        <div className="card-container">
          {filteredProvisions.map((provision) => (
            <div key={provision.id} className="card">
              <h3 className="employee-name">{provision.employee}</h3>
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
          ))}
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
                  ID Card:
                  <input
                    type="checkbox"
                    name="it_equipment"
                    checked={editProvision.it_equipment || false}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Laptop Provided:
                  <input
                    type="checkbox"
                    name="laptop"
                    checked={editProvision.laptop || false}
                    onChange={handleInputChange}
                  />
                </label>
                <button type="submit">Save Changes</button>
                <button type="button" onClick={handleModalClose}>
                  Close
                </button>
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
                  />
                </label>
                <label>
                  ID Card:
                  <input
                    type="checkbox"
                    name="it_equipment"
                    checked={newProvision.it_equipment}
                    onChange={handleInputChange}
                  />
                </label>
                <label>
                  Laptop Provided:
                  <input
                    type="checkbox"
                    name="laptop"
                    checked={newProvision.laptop}
                    onChange={handleInputChange}
                  />
                </label>
                <button type="submit">Add Provision</button>
                <button type="button" onClick={handleAddModalClose}>
                  Close
                </button>
              </form>
            </div>
          </div>
        )}

        {/* CSS Styling */}
        <style jsx>{`
        .it-provision-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px;
          background-color: #f4f7fc;
          min-height: 100vh;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
        }

        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          width: 400px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        }

        .modal-content form {
          display: flex;
          flex-direction: column;
        }

        .modal-content form label {
          margin-bottom: 10px;
          font-weight: bold;
        }

        .modal-content form input {
          margin-bottom: 15px;
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

export default ITProvision;
