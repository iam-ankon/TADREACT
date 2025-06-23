import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Sidebar from "../merchandiser/Sidebar.jsx";

const DetailsInquiry = () => {
  const { id } = useParams();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiry = async () => {
      try {
        const response = await axios.get(`http://119.148.12.1:8000/api/merchandiser/api/inquiry/${id}/`);
        setInquiry(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching inquiry:', error);
        setLoading(false);
      }
    };

    fetchInquiry();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px', color: '#555' }}>Loading inquiry details...</div>;
  }

  if (!inquiry) {
    return <div style={{ padding: '40px', textAlign: 'center', fontSize: '18px', color: '#888' }}>Inquiry not found.</div>;
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div style={{
      
      display: 'flex',
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        padding: '2rem',
        marginLeft: '0',
        overflowY: 'auto',
        maxHeight: '100vh'
      }}>
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}>
          <div>
            <h1 style={{
              color: '#2c3e50',
              fontSize: '28px',
              fontWeight: '600',
              margin: '0 0 10px 0'
            }}>
              Inquiry #{inquiry.inquiry_no}
            </h1>
            <div style={{
              display: 'inline-block',
              padding: '5px 15px',
              borderRadius: '15px',
              backgroundColor: inquiry.current_status === 'pending' ? '#ffc107' :
                inquiry.current_status === 'quoted' ? '#17a2b8' :
                  inquiry.current_status === 'running' ? '#28a745' :
                    '#6c757d',
              color: inquiry.current_status === 'pending' ? '#343a40' : 'white',
              fontSize: '0.9em',
              fontWeight: 'bold',
              textTransform: 'capitalize',
            }}>
              {inquiry.current_status}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link
              to={`/inquiries/${id}/edit`}
              style={{
                backgroundColor: '#28a745',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Edit Inquiry
            </Link>
            <Link
              to="/inquiries"
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '4px',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Back to List
            </Link>
          </div>
        </div>

        {/* Main Content with Images on Right */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          {/* Inquiry Information */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '15px',
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              paddingBottom: '8px',
              borderBottom: '1px solid #eee',
              fontSize: '16px',
              color: '#333',
              fontWeight: '600'
            }}>
              Inquiry Information
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', width: '20%', fontWeight: '600' }}>Buyer</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', width: '30%' }}>{typeof inquiry.buyer === 'object' ? inquiry.buyer?.name : inquiry.buyer?.toString() || '-'}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', width: '20%', fontWeight: '600' }}>Customer</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', width: '30%' }}>{typeof inquiry.customer === 'object' ? inquiry.customer?.name : inquiry.customer?.toString() || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Order Type</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.order_type || '-'}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Garment Type</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.garment || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Gender</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.gender || '-'}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Season</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.season || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Received Date</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{formatDate(inquiry.received_date)}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Shipment Date</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{formatDate(inquiry.shipment_date)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Program</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.program || '-'}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>WGR</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.wgr || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Target Price</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.target_price || '-'}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Confirmed Price</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.confirmed_price || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>With Hanger</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.with_hanger ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Repeat Of</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.repeat_of?.repeat_of || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Same Style</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.same_style?.styles || '-'}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Item</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.item?.item || '-'}</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Order Request</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.order_no || '-'}</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee', fontWeight: '600' }}>Order Quantity</td>
                  <td style={{ padding: '10px 15px', borderBottom: '1px solid #eee' }}>{inquiry.order_quantity || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Images Container - Top Right */}
          <div style={{
            width: '250px',
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '15px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              paddingBottom: '8px',
              borderBottom: '1px solid #eee',
              fontSize: '16px',
              color: '#333',
              fontWeight: '600'
            }}>
              Documents
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {inquiry.image && (
                <a href={inquiry.image} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Image</div>
                    <img
                      src={inquiry.image}
                      alt="Inquiry"
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'contain',
                        border: '1px solid #eee',
                        backgroundColor: '#f9f9f9',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </a>
              )}
              {inquiry.image1 && (
                <a href={inquiry.image1} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Image 1</div>
                    <img
                      src={inquiry.image1}
                      alt="Inquiry"
                      style={{
                        width: '100%',
                        height: '100px',
                        objectFit: 'contain',
                        border: '1px solid #eee',
                        backgroundColor: '#f9f9f9',
                        cursor: 'pointer'
                      }}
                    />
                  </div>
                </a>
              )}
              {inquiry.attachment && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px', color: '#555' }}>Attachment</div>
                  <a
                    href={inquiry.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block',
                      padding: '8px',
                      backgroundColor: '#f0f0f0',
                      borderRadius: '4px',
                      textAlign: 'center',
                      color: '#007bff',
                      textDecoration: 'none',
                      fontSize: '12px'
                    }}
                  >
                    Download Attachment
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two Column Layout for Additional Sections */}
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          {/* Left Column - Fabric Information */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '15px',
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              paddingBottom: '8px',
              borderBottom: '1px solid #eee',
              fontSize: '16px',
              color: '#333',
              fontWeight: '600'
            }}>
              Fabric Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Fabric 1:</strong> {inquiry.fabric1 || '-'}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Fabric 2:</strong> {inquiry.fabric2 || '-'}</p>
              </div>
              <div>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Fabric 3:</strong> {inquiry.fabric3 || '-'}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Fabric 4:</strong> {inquiry.fabric4 || '-'}</p>
              </div>
            </div>
            <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Fabrication:</strong> {inquiry.fabrication?.fabrication || '-'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Proposed Shipment Date:</strong> {inquiry.proposed_shipment_date || '-'}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Confirmed Price Date:</strong> {inquiry.confirmed_price_date || '-'}</p>
              </div>
              <div>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Tech Ref Date:</strong> {inquiry.techrefdate || '-'}</p>
                <p style={{ margin: '8px 0', fontSize: '14px' }}><strong>Year:</strong> {inquiry.year || '-'}</p>
              </div>
            </div>
          </div>

          {/* Right Column - Color & Sizing */}
          <div style={{
            flex: 1,
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            padding: '15px',
          }}>
            <h3 style={{
              margin: '0 0 15px 0',
              paddingBottom: '8px',
              borderBottom: '1px solid #eee',
              fontSize: '16px',
              color: '#333',
              fontWeight: '600'
            }}>
              Color & Sizing
            </h3>
            {inquiry.color_size_groups && inquiry.color_size_groups.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #eee' }}>Color</th>
                      {inquiry.color_size_groups[0].size_quantities.map((size, index) => (
                        <th key={index} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>Size {size.size}</th>
                      ))}
                      <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiry.color_size_groups.map((group, groupIndex) => (
                      <tr key={groupIndex}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>{group.color || '-'}</td>
                        {group.size_quantities.map((size, sizeIndex) => (
                          <td key={sizeIndex} style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                            {size.quantity}
                          </td>
                        ))}
                        <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee', fontWeight: '600' }}>
                          {group.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#888', fontSize: '14px' }}>No color/size information available</p>
            )}
            <div style={{ textAlign: 'right', marginTop: '10px', fontWeight: '600', fontSize: '14px' }}>
              Grand Total: {inquiry.grand_total || 0}
            </div>
          </div>
        </div>

        {/* Remarks Section */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '6px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: '0 0 15px 0',
            paddingBottom: '8px',
            borderBottom: '1px solid #eee',
            fontSize: '16px',
            color: '#333',
            fontWeight: '600'
          }}>
            Remarks
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>General Remarks</h4>
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {inquiry.remarks || 'No general remarks provided.'}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>Local Remarks</h4>
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {inquiry.local_remarks || 'No local remarks provided.'}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>Buyer Remarks</h4>
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {inquiry.buyer_remarks || 'No buyer remarks provided.'}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>Wash Description</h4>
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {inquiry.wash_description || 'No wash description provided.'}
              </div>
            </div>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>Order Remarks</h4>
              <div style={{
                backgroundColor: '#f9f9f9',
                padding: '10px',
                borderRadius: '4px',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {inquiry.order_remarks || 'No order remarks provided.'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsInquiry;