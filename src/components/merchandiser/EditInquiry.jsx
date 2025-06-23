import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import Sidebar from "../merchandiser/Sidebar.jsx";

const EditInquiry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Initial form state
  const [formData, setFormData] = useState({
    inquiry_no: '',
    season: '',
    year: '',
    repeat_of: '',
    same_style: '',
    buyer: '',
    shipment_date: '',
    wgr: '',
    with_hanger: '',
    program: '',
    order_type: '',
    garment: '',
    gender: '',
    item: '',
    fabric1: '',
    fabric2: '',
    fabric3: '',
    fabric4: '',
    fabrication: '',
    received_date: '',
    image: null,
    image1: null,
    proposed_shipment_date: '',
    remarks: '',
    customer: '',
    local_remarks: '',
    buyer_remarks: '',
    wash_description: '',
    techrefdate: '',
    target_price: '',
    confirmed_price: '',
    confirmed_price_date: '',
    attachment: null,
    current_status: 'pending',
    order_remarks: '',
    color_size_groups: [],
    grand_total: 0
  });

  const [originalData, setOriginalData] = useState(null);
  const [buyers, setBuyers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [repeatOfs, setRepeatOfs] = useState([]);
  const [styles, setStyles] = useState([]);
  const [items, setItems] = useState([]);
  const [fabrications, setFabrications] = useState([]);
  const [sizeRange, setSizeRange] = useState('');
  const [availableSizes, setAvailableSizes] = useState([]);
  const [colorSizeGroups, setColorSizeGroups] = useState([]);
  const [deletedGroupIds, setDeletedGroupIds] = useState([]);




  const [showDropdown, setShowDropdown] = useState({
    repeat_of: false,
    same_style: false,
    item: false,
    fabrication: false
  });

  const [inputValues, setInputValues] = useState({
    repeat_of: '',
    same_style: '',
    item: '',
    fabrication: ''
  });

  // Fetch inquiry data and dropdown options
  useEffect(() => {
    const fetchData = async () => {
      try {
        // First, fetch the basic inquiry data and dropdown options
        const [
          inquiryRes,
          buyersRes,
          customersRes,
          repeatOfsRes,
          stylesRes,
          itemsRes,
          fabricationsRes
        ] = await Promise.all([
          axios.get(`http://119.148.12.1:8000/api/merchandiser/api/inquiry/${id}/`),
          axios.get('http://119.148.12.1:8000/api/merchandiser/api/buyer/'),
          axios.get('http://119.148.12.1:8000/api/merchandiser/api/customer/'),
          axios.get('http://119.148.12.1:8000/api/merchandiser/api/repeat_of/'),
          axios.get('http://119.148.12.1:8000/api/merchandiser/api/style/'),
          axios.get('http://119.148.12.1:8000/api/merchandiser/api/item/'),
          axios.get('http://119.148.12.1:8000/api/merchandiser/api/fabrication/')
        ]);

        // Set dropdown options
        setBuyers(buyersRes.data);
        setCustomers(customersRes.data);
        setRepeatOfs(repeatOfsRes.data);
        setStyles(stylesRes.data);
        setItems(itemsRes.data);
        setFabrications(fabricationsRes.data);

        // Set inquiry data
        const inquiryData = inquiryRes.data;
        setOriginalData(inquiryData);

        // Parse and set form data
        const parsedData = {
          ...inquiryData,
          // Convert string dates to proper format for date inputs
          received_date: inquiryData.received_date ? inquiryData.received_date.split('T')[0] : '',
          shipment_date: inquiryData.shipment_date ? inquiryData.shipment_date.split('T')[0] : '',
          proposed_shipment_date: inquiryData.proposed_shipment_date ? inquiryData.proposed_shipment_date.split('T')[0] : '',
          techrefdate: inquiryData.techrefdate ? inquiryData.techrefdate.split('T')[0] : '',
          confirmed_price_date: inquiryData.confirmed_price_date ? inquiryData.confirmed_price_date.split('T')[0] : '',
          // Handle dropdown fields
          buyer: inquiryData.buyer || '',
          customer: inquiryData.customer || '',
          repeat_of: inquiryData.repeat_of?.id || '',
          same_style: inquiryData.same_style?.id || '',
          item: inquiryData.item?.id || '',
          fabrication: inquiryData.fabrication?.id || '',
          // Handle image fields (they remain as URLs until new files are selected)
          image: inquiryData.image,
          image1: inquiryData.image1,
          attachment: inquiryData.attachment
        };
        setFormData(parsedData);
        // setFormData({
        //   ...inquiryData,
        //   repeat_of_id: inquiryData.repeat_of?.id?.toString() || '',
        //   same_style_id: inquiryData.same_style?.id?.toString() || '',
        //   item_id: inquiryData.item?.id?.toString() || '',
        //   fabrication_id: inquiryData.fabrication?.id?.toString() || '',

        // });
        // Set input values for comboboxes based on existing data
        setInputValues({
          repeat_of: inquiryData.repeat_of?.repeat_of || '',
          same_style: inquiryData.same_style?.styles || '',
          item: inquiryData.item?.item || '',
          fabrication: inquiryData.fabrication?.fabrication || ''
        });
        // Handle color size groups from the main inquiry data
        if (inquiryData.color_size_groups && inquiryData.color_size_groups.length > 0) {
          const processedGroups = inquiryData.color_size_groups.map(group => ({
            id: group.id || Date.now() + Math.random(),
            color: group.color || '',
            sizes: availableSizes.length > 0
              ? availableSizes.map(availSize => {
                // Find matching size from the group's sizes
                const existingSize = group.size_quantities?.find(sq =>
                  sq.size.toString() === availSize.size.toString()
                );
                return {
                  size: availSize.size.toString(),
                  quantity: existingSize ? existingSize.quantity : 0
                };
              })
              : group.size_quantities?.map(sq => ({
                size: sq.size.toString(),
                quantity: sq.quantity
              })) || [],
            total: group.total || 0
          }));

          setColorSizeGroups(processedGroups);

          // Determine size range from the first color group if availableSizes is empty
          if (availableSizes.length === 0 && processedGroups[0]?.sizes?.length > 0) {
            const sizes = processedGroups[0].sizes.map(s => parseInt(s.size));
            const minSize = Math.min(...sizes);
            const maxSize = Math.max(...sizes);
            setSizeRange(`${minSize}-${maxSize}`);
            setAvailableSizes(processedGroups[0].sizes.map(s => ({
              size: s.size.toString(),
              quantity: 0 // Reset quantity for template
            })));
          }
        } else {
          // Initialize with one empty group if none exist
          setColorSizeGroups([{
            id: Date.now(),
            color: [],
            sizes: [],
            total: 0
          }]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error loading inquiry data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const renderField = (label, name, type = 'text', disabled = false) => (
    <div style={inputGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        style={inputStyle}
        disabled={disabled}
      />
    </div>
  );

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else if (name === 'buyer' || name === 'customer') {
      setFormData(prev => ({
        ...prev,
        [name]: value // KEEP as string now
      }));
    }
    else if (name === 'wgr' || name === 'order_no' || name === 'inquiry_no') {
      const numValue = value === '' ? null : parseInt(value);
      setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? null : numValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSizeRangeChange = (e) => {
    const value = e.target.value;
    setSizeRange(value);

    if (value.includes('-')) {
      const [start, end] = value.split('-').map(Number);
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        const sizes = [];
        for (let i = start; i <= end; i++) {
          if (i % 2 === 0) {
            sizes.push({ size: i.toString(), quantity: 0 });
          }
        }

        setAvailableSizes(sizes);

        // Update all existing color groups to match new even sizes while preserving quantities
        setColorSizeGroups(prev =>
          prev.map(group => {
            const newSizes = sizes.map(size => {
              // Find matching size from previous group
              const existingSize = group.sizes.find(s =>
                s.size === size.size
              );
              return {
                size: size.size,
                quantity: existingSize ? existingSize.quantity : 0
              };
            });

            return {
              ...group,
              sizes: newSizes,
              total: newSizes.reduce((sum, size) => sum + size.quantity, 0)
            };
          })
        );
      }
    } else {
      setAvailableSizes([]);
      setColorSizeGroups(prev => prev.map(group => ({ ...group, sizes: [], total: 0 })));
    }
  };

  const addColorGroup = () => {
    setColorSizeGroups(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        color: [],
        sizes: availableSizes.map(size => ({ ...size, quantity: 0 })),
        total: 0
      }
    ]);
  };

  const removeColorGroup = (groupId) => {
    const groupToDelete = colorSizeGroups.find(group => group.id === groupId);
    if (groupToDelete && groupToDelete.id && typeof groupToDelete.id === 'number') {
      setDeletedGroupIds(prev => [...prev, groupToDelete.id]);
    }
    setColorSizeGroups(prev => prev.filter(group => group.id !== groupId));
  };


  const handleColorChange = (groupId, value) => {
    setColorSizeGroups(prev => prev.map(group =>
      group.id === groupId ? { ...group, color: value } : group
    ));
  };

  const handleQuantityChange = (groupId, size, value) => {
    setColorSizeGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        const newSizes = group.sizes.map(s =>
          s.size === size ? { ...s, quantity: parseInt(value) || 0 } : s
        );

        const newTotal = newSizes.reduce((sum, s) => sum + s.quantity, 0);

        return {
          ...group,
          sizes: newSizes,
          total: newTotal
        };
      }
      return group;
    }));
  };

  const calculateGrandTotal = () => {
    return colorSizeGroups.reduce((sum, group) => sum + group.total, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {

      const cleanedData = {
        ...formData,
        repeat_of_id: formData.repeat_of || null,
        same_style_id: formData.same_style || null,
        item: formData.item || null,
        fabrication_id: formData.fabrication || null,

      };
      const payload = {
        ...cleanedData,
        deleted_color_size_group_ids: deletedGroupIds,
        color_size_groups: colorSizeGroups
          .filter(group => group.color && group.sizes.length > 0)
          .map(group => ({
            color: group.color,
            total: group.total,
            size_quantities: group.sizes.map(size => ({
              size: parseInt(size.size),
              quantity: parseInt(size.quantity) || 0
            }))
          })),

        grand_total: calculateGrandTotal()
      };

      console.log('Payload to send:', payload);

      // Create FormData
      const formDataToSend = new FormData();
      const { image, image1, attachment, ...jsonPayload } = payload;

      // Only append files if they've been changed (not the original URLs)
      const isNewImage = image instanceof File;
      const isNewImage1 = image1 instanceof File;
      const isNewAttachment = attachment instanceof File;

      formDataToSend.append('data', JSON.stringify(jsonPayload));
      if (isNewImage) formDataToSend.append('image', image);
      if (isNewImage1) formDataToSend.append('image1', image1);
      if (isNewAttachment) formDataToSend.append('attachment', attachment);

      console.log('FormData contents:', [...formDataToSend.entries()]);

      const response = await axios.put(
        `http://119.148.12.1:8000/api/merchandiser/api/inquiry/${id}/`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      console.log('Response:', response);

      if (response.status === 200) {
        // Update the form state with the response data
        const updatedData = response.data;
        setFormData(prev => ({
          ...prev,
          ...updatedData,
          // Convert string dates to proper format for date inputs
          received_date: updatedData.received_date ? updatedData.received_date.split('T')[0] : '',
          shipment_date: updatedData.shipment_date ? updatedData.shipment_date.split('T')[0] : '',
          proposed_shipment_date: updatedData.proposed_shipment_date ? updatedData.proposed_shipment_date.split('T')[0] : '',
          techrefdate: updatedData.techrefdate ? updatedData.techrefdate.split('T')[0] : '',
          confirmed_price_date: updatedData.confirmed_price_date ? updatedData.confirmed_price_date.split('T')[0] : '',
          buyer: updatedData.buyer?.id || '',
          customer: updatedData.customer?.id || ''
        }));

        alert('Inquiry updated successfully!');
        navigate('/inquiries');
      }
    } catch (error) {
      console.error('Error updating inquiry:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to update inquiry: ${error.response?.data?.detail || error.message}`);


      let errorMessage = 'Failed to update inquiry. ';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage += error.response.data;
        } else if (error.response.data.detail) {
          errorMessage += error.response.data.detail;
        } else {
          errorMessage += JSON.stringify(error.response.data);
        }
      } else {
        errorMessage += 'Please check your network connection and try again.';
      }

      alert(errorMessage);
    }
  };

  const toggleDropdown = (field) => {
    setShowDropdown(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleComboboxChange = (field, value) => {
    setInputValues(prev => ({
      ...prev,
      [field]: value
    }));
    setShowDropdown(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleSelect = (field, id, value) => {
    setFormData(prev => ({
      ...prev,
      [`${field}_id`]: id  // ✅ use repeat_of_id, same_style_id, etc.
    }));
    setInputValues(prev => ({
      ...prev,
      [field]: value
    }));
    setShowDropdown(prev => ({
      ...prev,
      [field]: false
    }));
  };


  const handleCreateNew = async (field, value) => {
    try {
      let endpoint = '';
      let data = {};
      let responseField = '';

      switch (field) {
        case 'repeat_of':
          endpoint = 'http://119.148.12.1:8000/api/merchandiser/api/repeat_of/';
          data = { repeat_of: value };
          responseField = 'repeat_of';
          break;
        case 'same_style':
          endpoint = 'http://119.148.12.1:8000/api/merchandiser/api/style/';
          data = { styles: value };
          responseField = 'styles';
          break;
        case 'item':
          endpoint = 'http://119.148.12.1:8000/api/merchandiser/api/item/';
          data = { item: value };
          responseField = 'item';
          break;
        case 'fabrication':
          endpoint = 'http://119.148.12.1:8000/api/merchandiser/api/fabrication/';
          data = { fabrication: value };
          responseField = 'fabrication';
          break;
        default:
          return;
      }

      const response = await axios.post(endpoint, data);

      switch (field) {
        case 'repeat_of':
          setRepeatOfs(prev => [...prev, response.data]);
          break;
        case 'same_style':
          setStyles(prev => [...prev, response.data]);
          break;
        case 'item':
          setItems(prev => [...prev, response.data]);
          break;
        case 'fabrication':
          setFabrications(prev => [...prev, response.data]);
          break;
      }

      setFormData(prev => ({
        ...prev,
        [field]: response.data.id
      }));
      setInputValues(prev => ({
        ...prev,
        [field]: response.data[responseField]
      }));
      setShowDropdown(prev => ({
        ...prev,
        [field]: false
      }));

    } catch (error) {
      console.error('Error creating new entry:', error);
      alert('Failed to create new entry. Please try again.');
    }
  };

  // Styles
  const containerStyle = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc'
  };

  const formWrapperStyle = {
    flex: 1,
    padding: '2rem',
    marginLeft: '0',
    overflowY: 'auto',
    maxHeight: '100vh'
  };

  const formHeaderStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '1.5rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #e2e8f0'
  };

  const sectionContainerStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    padding: '1.25rem',
    marginBottom: '1rem',
    borderLeft: '4px solid #3b82f6'
  };

  const sectionRowStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '2rem',
    marginBottom: '2rem'
  };

  const sectionColumnStyle = {
    flex: '1 1 48%',
    display: 'flex',
    flexDirection: 'column'
  };

  const sectionTitleStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center'
  };

  const sectionIconStyle = {
    marginRight: '0.5rem',
    fontSize: '1.25rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem'
  };

  const inputGroupStyle = {
    marginBottom: '0.75rem'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '0.375rem',
    fontWeight: '500',
    color: '#475569',
    fontSize: '0.875rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    transition: 'all 0.2s',
    backgroundColor: '#fff'
  };

  const selectStyle = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,<svg width=\'20\' height=\'20\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M5 8l5 5 5-5z\' fill=\'%23475569\'/></svg>")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.5rem center',
    backgroundSize: '1rem'
  };

  const textareaStyle = {
    ...inputStyle,
    minHeight: '5rem',
    resize: 'vertical'
  };

  const buttonGroupStyle = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1.5rem'
  };

  const buttonStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
    border: 'none',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem'
  };

  const cancelButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ef4444',
    color: 'white'
  };

  const submitButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#10b981',
    color: 'white'
  };

  const comboboxDropdownStyle = {
    position: 'absolute',
    zIndex: 1000,
    width: '100%',
    maxHeight: '12rem',
    overflowY: 'auto',
    backgroundColor: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginTop: '0.25rem'
  };

  const comboboxItemStyle = {
    padding: '0.5rem 0.75rem',
    cursor: 'pointer',
    fontSize: '0.875rem'
  };

  const comboboxCreateStyle = {
    ...comboboxItemStyle,
    backgroundColor: '#f8fafc',
    color: '#3b82f6'
  };

  const addButtonStyle = {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '2rem',
    height: '2rem',
    fontSize: '1.2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0.5rem 0'
  };

  const removeButtonStyle = {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    cursor: 'pointer'
  };

  const tableCellStyle = {
    padding: '0.5rem',
    border: '1px solid #e2e8f0',
    textAlign: 'center'
  };

  const renderSelect = (label, name, options) => (
    <div style={inputGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <select
        name={name}
        value={formData[name] || ''}
        onChange={handleChange}
        style={selectStyle}
      >
        <option value="">Select {label}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  const renderFileInput = (label, name) => (
    <div style={inputGroupStyle}>
      <label style={labelStyle}>{label}</label>
      <input
        type="file"
        name={name}
        onChange={handleChange}
        style={inputStyle}
      />
      {formData[name] && typeof formData[name] === 'string' && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
          Current file: {formData[name].split('/').pop()}
        </div>
      )}
    </div>
  );

  const renderColorSizeSection = () => (
    <div style={sectionContainerStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={sectionTitleStyle}>
          <span style={sectionIconStyle}>🎨</span>
          Color & Sizing
        </h3>
        <button
          onClick={addColorGroup}
          style={addButtonStyle}
          type="button"
        >
          +
        </button>
      </div>

      <div style={inputGroupStyle}>
        <label style={labelStyle}>Size Range</label>
        <input
          type="text"
          value={sizeRange}
          onChange={handleSizeRangeChange}
          placeholder="e.g. 2-10"
          style={inputStyle}
        />
      </div>

      {availableSizes.length > 0 && (
        <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...tableCellStyle, textAlign: 'left' }}>Color</th>
                {availableSizes.map(size => (
                  <th key={`size-${size.size}`} style={tableCellStyle}>Size {size.size}</th>
                ))}
                <th style={tableCellStyle}>Total</th>
                <th style={tableCellStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {colorSizeGroups.map((group, index) => (
                <tr key={`group-${group.id || index}`}>
                  <td style={{ ...tableCellStyle, textAlign: 'left' }}>
                    <input
                      type="text"
                      value={group.color || ''}
                      onChange={(e) => handleColorChange(group.id, e.target.value)}
                      style={{ ...inputStyle, width: '100%' }}
                      placeholder="Color name"
                    />
                  </td>
                  {group.sizes.map(size => (
                    <td key={`${group.id}-${size.size}`} style={tableCellStyle}>
                      <input
                        type="number"
                        min="0"
                        value={size.quantity || 0}
                        onChange={(e) => handleQuantityChange(group.id, size.size, e.target.value)}
                        style={{ ...inputStyle, width: '60px', textAlign: 'center' }}
                      />
                    </td>
                  ))}
                  <td style={tableCellStyle}>
                    <input
                      type="number"
                      value={group.total || 0}
                      readOnly
                      style={{ ...inputStyle, width: '80px', textAlign: 'center', backgroundColor: '#f3f4f6' }}
                    />
                  </td>
                  <td style={tableCellStyle}>
                    {colorSizeGroups.length > 1 && (
                      <button
                        onClick={() => removeColorGroup(group.id)}
                        style={removeButtonStyle}
                        type="button"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '1rem', textAlign: 'right' }}>
        <strong>Grand Total: </strong>
        <input
          type="number"
          value={calculateGrandTotal() || 0}
          readOnly
          style={{ ...inputStyle, width: '100px', display: 'inline-block', marginLeft: '10px', backgroundColor: '#f3f4f6' }}
        />
      </div>
    </div>
  );

  const renderCombobox = (label, field, options, displayField) => {
    // Find the current option
    const currentOption = options.find(opt => opt.id.toString() === formData[field]?.toString());



    // Set the input value based on whether we have a selected option
    const inputValue = inputValues[field] || (currentOption ? currentOption[displayField] : '');



    return (
      <div style={inputGroupStyle}>
        <label style={labelStyle}>{label}</label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={inputValue || ''}
            onChange={(e) => handleComboboxChange(field, e.target.value)}
            onFocus={() => setShowDropdown(prev => ({ ...prev, [field]: true }))}
            onBlur={() => setTimeout(() => setShowDropdown(prev => ({ ...prev, [field]: false })), 200)}
            style={inputStyle}
            placeholder={`Select or type to create ${label}`}
          />

          {showDropdown[field] && (
            <div style={comboboxDropdownStyle}>
              {options
                .filter(opt =>
                  opt[displayField].toLowerCase().includes((inputValues[field] || '').toLowerCase())
                )
                .map(option => (
                  <div
                    key={option.id}
                    style={comboboxItemStyle}
                    onClick={() => handleSelect(field, option.id, option[displayField])}
                  >
                    {option[displayField]}
                  </div>
                ))}

              {inputValues[field] && !options.some(opt =>
                opt[displayField].toLowerCase() === inputValues[field].toLowerCase()) && (
                  <div
                    style={comboboxCreateStyle}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreateNew(field, inputValues[field]);
                    }}
                  >
                    Create new: "{inputValues[field]}"
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Option lists for dropdowns
  const orderTypeOptions = [
    { value: 'advertisement', label: 'Advertisement' },
    { value: 'programmer', label: 'Programmer' }
  ];

  const genderOptions = [
    { value: 'all', label: 'All' },
    { value: 'blanks', label: 'Blanks' },
    { value: 'ladies', label: 'Ladies' },
    { value: 'bag', label: 'Bag' },
    { value: 'boy', label: 'Boy' },
    { value: 'girls', label: 'Girls' },
    { value: 'mama', label: 'Mama' }
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'running', label: 'Running' },
    { value: 'Suppliersinformed', label: 'Suppliers Informed' },
    { value: 'all', label: 'All' }
  ];

  const garmentOptions = [
    { value: 'all', label: 'All' },
    { value: 'knit', label: 'Knit' },
    { value: 'woven', label: 'Woven' },
    { value: 'sweater', label: 'Sweater' }
  ];

  const seasonOptions = [
    { value: 'spring', label: 'Spring' },
    { value: 'summer', label: 'Summer' },
    { value: 'autumn', label: 'Autumn' },
    { value: 'winter', label: 'Winter' }
  ];

  const withHangerOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' }
  ];

  if (loading) {
    return (
      <div style={containerStyle}>
        <Sidebar />
        <div style={formWrapperStyle}>
          <h2 style={formHeaderStyle}>Edit Inquiry</h2>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            Loading inquiry data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={formWrapperStyle}>

        <h2 style={formHeaderStyle}>Edit Inquiry</h2>

        {/* Basic Information Section */}
        <div style={sectionRowStyle}>
          <div style={{ ...sectionContainerStyle, ...sectionColumnStyle }}>
            <h3 style={sectionTitleStyle}>
              <span style={sectionIconStyle}>📋</span>
              Basic Information
            </h3>
            <div style={gridStyle}>
              {renderField("Inquiry Number", "inquiry_no", "number")}
              {renderSelect("Order Type", "order_type", orderTypeOptions)}
              {renderSelect("Garment Type", "garment", garmentOptions)}
              {renderSelect("Gender", "gender", genderOptions)}
              {renderSelect("Season", "season", seasonOptions)}
              {renderField("Program", "program")}
              {renderField("WGR", "wgr", "number")}
              {renderSelect("With Hanger", "with_hanger", withHangerOptions)}
              {renderField("Year", "year", 'date')}
              {renderCombobox("Repeat Of", "repeat_of", repeatOfs, "repeat_of")}
              {renderCombobox("Same Style", "same_style", styles, "styles")}
              {renderCombobox("Item", "item", items, "item")}
              {renderCombobox("Fabrication", "fabrication", fabrications, "fabrication")}

            </div>
          </div>

          <div style={sectionContainerStyle}>
            <h3 style={sectionTitleStyle}>
              <span style={sectionIconStyle}>📅</span>
              Dates
            </h3>
            <div style={gridStyle}>
              {renderField("Received Date", "received_date", "date")}
              {renderField("Shipment Date", "shipment_date", "date")}
              {renderField("Proposed Shipment Date", "proposed_shipment_date", "date")}
              {renderField("Tech Ref Date", "techrefdate", "date")}
              {renderField("Confirmed Price Date", "confirmed_price_date", "date")}
            </div>
          </div>
        </div>
        <div style={{ ...sectionContainerStyle, ...sectionColumnStyle }}>
          <h3 style={sectionTitleStyle}>
            <span style={sectionIconStyle}>📋</span>
            Order Information
          </h3>
          <div style={gridStyle}>
            {renderField("Order Request", "order_no", "number")}
            {renderField("Order Quantity", "order_quantity", "number")}
          </div>
        </div>

        {/* Color & Sizing Section */}
        <div style={sectionColumnStyle}>
          {renderColorSizeSection()}
        </div>

        <div style={sectionRowStyle}>
          {/* Files Section */}
          <div style={{ ...sectionContainerStyle, ...sectionColumnStyle }}>
            <h3 style={sectionTitleStyle}>
              <span style={sectionIconStyle}>📎</span>
              Files
            </h3>
            <div style={gridStyle}>
              {renderFileInput("Image", "image")}
              {renderFileInput("Image 1", "image1")}
              {renderFileInput("Attachment", "attachment")}
            </div>
          </div>

          <div style={{ ...sectionContainerStyle, ...sectionColumnStyle }}>
            <h3 style={sectionTitleStyle}>
              <span style={sectionIconStyle}>👥</span>
              Buyer & Customer
            </h3>
            <div style={gridStyle}>
              {/* Buyer Dropdown */}
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Buyer</label>
                <select
                  name="buyer"
                  value={formData.buyer?.toString() || ''}
                  onChange={handleChange}
                  style={selectStyle}
                >
                  <option value="">Select Buyer</option>
                  {buyers.map(buyer => (
                    <option key={buyer.id} value={buyer.id.toString()}>
                      {buyer.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Dropdown */}
              <div style={inputGroupStyle}>
                <label style={labelStyle}>Customer</label>
                <select
                  name="customer"
                  value={formData.customer?.toString() || ''}
                  onChange={handleChange}
                  style={selectStyle}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </option>
                  ))}
                </select>

              </div>
            </div>
          </div>
        </div>

        <div style={sectionRowStyle}>
          {/* Status & Remarks Section */}
          <div style={{ ...sectionContainerStyle, ...sectionColumnStyle }}>
            <h3 style={sectionTitleStyle}>
              <span style={sectionIconStyle}>📝</span>
              Status & Remarks
            </h3>
            <div style={gridStyle}>
              {renderSelect("Status", "current_status", statusOptions)}
              {renderField("Order Remarks", "order_remarks")}
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks || ''}
                onChange={handleChange}
                style={textareaStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Local Remarks</label>
              <textarea
                name="local_remarks"
                value={formData.local_remarks || ''}
                onChange={handleChange}
                style={textareaStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Buyer Remarks</label>
              <textarea
                name="buyer_remarks"
                value={formData.buyer_remarks || ''}
                onChange={handleChange}
                style={textareaStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Wash Description</label>
              <textarea
                name="wash_description"
                value={formData.wash_description || ''}
                onChange={handleChange}
                style={textareaStyle}
              />
            </div>
          </div>

          {/* Pricing & Fabric Section */}
          <div style={sectionContainerStyle}>
            <h3 style={sectionTitleStyle}>
              <span style={sectionIconStyle}>💰</span>
              Pricing & Fabric
            </h3>
            <div style={gridStyle}>
              {renderField("Fabric 1", "fabric1")}
              {renderField("Fabric 2", "fabric2")}
              {renderField("Fabric 3", "fabric3")}
              {renderField("Fabric 4", "fabric4")}
              {renderField("Target Price", "target_price")}
              {renderField("Confirmed Price", "confirmed_price")}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={buttonGroupStyle}>
          <button
            type="button"
            onClick={() => navigate('/inquiries')}
            style={cancelButtonStyle}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            style={submitButtonStyle}
          >
            Update Inquiry
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditInquiry;