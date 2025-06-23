import React, { useEffect, useState } from 'react';
import { getAttendance, addAttendance, updateAttendance, deleteAttendance, getEmployees } from '../../api/employeeApi';
import Sidebars from './sidebars';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employee: '',
    check_in: '',
    check_out: '',
    office_start_time: '09:30',
    id: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const attendancePerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attendanceRes, employeesRes] = await Promise.all([
          getAttendance(),
          getEmployees()
        ]);
        setAttendance(attendanceRes.data);
        setFilteredAttendance(attendanceRes.data);
        setEmployees(employeesRes.data);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = attendance.filter(item => {
      const matchesName = item.employee_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = dateFilter ? item.date.includes(dateFilter) : true;
      return matchesName && matchesDate;
    });
    setFilteredAttendance(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, dateFilter, attendance]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const formatTimeTo12Hour = (timeString) => {
    if (!timeString) return null;

    let timePart = '';
    if (timeString.includes('T')) {
      timePart = timeString.slice(11, 16);
    } else if (timeString.includes(':')) {
      timePart = timeString.length > 5 ? timeString.slice(0, 5) : timeString;
    } else {
      return timeString;
    }

    const [hours, minutes] = timePart.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const calculateTimeDifference = (checkIn, officeStart) => {
    if (!checkIn || !officeStart) return { inTime: null, delayTime: null, status: '-' };

    try {
      const get24HourTime = (timeStr) => {
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        return { hours, minutes };
      };

      const checkIn24 = get24HourTime(checkIn);
      const officeStart24 = get24HourTime(officeStart);

      const checkInTotal = checkIn24.hours * 60 + checkIn24.minutes;
      const officeTotal = officeStart24.hours * 60 + officeStart24.minutes;

      if (checkInTotal <= officeTotal) {
        const diffMinutes = officeTotal - checkInTotal;
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return {
          inTime: `${hours}:${minutes.toString().padStart(2, '0')}`,
          delayTime: null,
          status: 'On Time'
        };
      } else {
        const diffMinutes = checkInTotal - officeTotal;
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return {
          inTime: null,
          delayTime: `${hours}:${minutes.toString().padStart(2, '0')}`,
          status: 'Late'
        };
      }
    } catch (error) {
      console.error('Error calculating time difference:', error);
      return { inTime: null, delayTime: null, status: 'Error' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        employee: parseInt(formData.employee, 10),
        check_in: `${formData.check_in}:00`,
        check_out: formData.check_out ? `${formData.check_out}:00` : null,
        office_start_time: `${formData.office_start_time}:00`,
      };

      if (formData.id) {
        await updateAttendance(formData.id, payload);
      } else {
        await addAttendance(payload);
      }

      const response = await getAttendance();
      setAttendance(response.data);
      setShowForm(false);
      setFormData({ employee: '', check_in: '', check_out: '', office_start_time: '09:30', id: null });
    } catch (error) {
      console.error("Error saving attendance:", error);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      id: record.id,
      employee: record.employee.id,
      check_in: record.check_in.slice(11, 16),
      check_out: record.check_out ? record.check_out.slice(11, 16) : '',
      office_start_time: record.office_start_time.slice(11, 16),
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this attendance record?")) {
      try {
        await deleteAttendance(id);
        const response = await getAttendance();
        setAttendance(response.data);
      } catch (error) {
        console.error("Error deleting attendance:", error);
      }
    }
  };

  const indexOfLastAttendance = currentPage * attendancePerPage;
  const indexOfFirstAttendance = indexOfLastAttendance - attendancePerPage;
  const currentAttendance = filteredAttendance.slice(indexOfFirstAttendance, indexOfLastAttendance);

  const totalPages = Math.ceil(filteredAttendance.length / attendancePerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };


  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#A7D5E1',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Sidebar */}
      <div style={{ display: 'flex' }}>
        <Sidebars />
        <div style={{ flex: 1, overflow: 'auto' }}>
          {/* Your page content here */}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        padding: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          color: '#333'
        }}>Attendance Management</h2>

        {/* Filters and Add Button */}
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Search by Name:</label>
            <input
              type="text"
              placeholder="Employee name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Filter by Date:</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '0.25rem',
                border: 'none',
                backgroundColor: '#2563eb',
                color: 'white',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              + Add Attendance
            </button>
          </div>
        </div>

        {/* Attendance Form */}
        {showForm && (
          <div style={{
            backgroundColor: '#DCEEF3',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              marginBottom: '1rem'
            }}>{formData.id ? 'Edit Attendance' : 'Add Attendance'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Employee:</label>
                  <select
                    name="employee"
                    value={formData.employee}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem'
                    }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Office Start Time:</label>
                  <input
                    type="time"
                    name="office_start_time"
                    value={formData.office_start_time}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Check In:</label>
                  <input
                    type="time"
                    name="check_in"
                    value={formData.check_in}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem'
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem' }}>Check Out:</label>
                  <input
                    type="time"
                    name="check_out"
                    value={formData.check_out}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '0.25rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="submit"
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  {formData.id ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '0.25rem',
                    border: 'none',
                    backgroundColor: '#6b7280',
                    color: 'white',
                    fontWeight: '500',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Attendance Table */}
        <div style={{
          backgroundColor: '#DCEEF3',
          border: '1px solid #e5e7eb',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          overflowX: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>Employee</th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>Date</th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>Check In</th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>Check Out</th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>Office Start</th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>In Time</th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>Delay Time</th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>Status</th>
                <th style={{
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  backgroundColor: '#f3f4f6',
                  borderBottom: '1px solid #e5e7eb',
                  fontWeight: '500'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentAttendance.map((record) => {
                const checkIn = formatTimeTo12Hour(record.check_in);
                const checkOut = formatTimeTo12Hour(record.check_out);
                const officeStart = formatTimeTo12Hour(record.office_start_time) || '09:30 AM';
                const { inTime, delayTime, status } = calculateTimeDifference(
                  checkIn || '00:00 AM',
                  officeStart
                );

                return (
                  <tr key={record.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>{record.employee_name}</td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>{record.date}</td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>{checkIn || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>{checkOut || '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>{officeStart}</td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>{inTime ? `${inTime}` : '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>{delayTime ? `${delayTime}` : '-'}</td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>{status}</td>
                    <td style={{ padding: '0.75rem 1rem', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleEdit(record)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '0.25rem',
                            border: 'none',
                            backgroundColor: '#dc2626',
                            color: 'white',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '1.5rem'
        }}>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => handlePageChange(pageNumber)}
              style={{
                padding: '0.5rem 1rem',
                margin: '0 0.5rem',
                borderRadius: '0.25rem',
                border: '1px solid #d1d5db',
                backgroundColor: currentPage === pageNumber ? '#2563eb' : 'white',
                color: currentPage === pageNumber ? 'white' : 'black',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {pageNumber}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Attendance;