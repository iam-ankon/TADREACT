// import { useState, useEffect } from "react";
// import axios from "axios";
// import { useNavigate, useLocation } from "react-router-dom";
// import Sidebar from "../merchandiser/Sidebar.jsx";
// import { User, Mail, Phone, Briefcase, Tag, Grid, ChevronLeft, Save } from "lucide-react";

// export default function EditBuyer() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { buyer } = location.state || {};
  
//   const [form, setForm] = useState({
//     name: buyer?.name || "",
//     email: buyer?.email || "",
//     phone: buyer?.phone || "",
//     department: buyer?.department || "",
//     wgr: buyer?.wgr || "",
//     product_categories: buyer?.product_categories || "",
//     remarks: buyer?.remarks || ""
//   });
  
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     if (!buyer) {
//       navigate("/buyers");
//     }
//   }, [buyer, navigate]);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsSubmitting(true);
//     setError(null);

//     try {
//       await axios.put(`http://119.148.12.1:8000/api/merchandiser/api/buyer/${buyer.id}/`, form);
//       navigate("/buyers");
//     } catch (err) {
//       console.error("Error updating buyer:", err);
//       setError("Failed to update buyer. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#A7D5E1', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
//       <Sidebar />
//       <div style={{ flex: 1, padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
//         <div style={{ backgroundColor: '#DCEEF3', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '32px', maxWidth: '640px', width: '100%', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
//           {/* Title + Back Button */}
//           <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
//             <button
//               onClick={() => navigate("/buyers")}
//               style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 padding: '6px',
//                 borderRadius: '6px',
//                 border: '1px solid #d1d5db',
//                 backgroundColor: 'white',
//                 cursor: 'pointer',
//                 color: '#374151',
//               }}
//               title="Go back"
//             >
//               <ChevronLeft size={20} />
//             </button>
//             <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
//               Edit Buyer
//             </h2>
//           </div>

//           {/* Error Message */}
//           {error && (
//             <div style={{
//               padding: '12px 16px',
//               marginBottom: '24px',
//               backgroundColor: '#fee2e2',
//               borderLeft: '4px solid #dc2626',
//               color: '#b91c1c',
//               borderRadius: '4px',
//               display: 'flex',
//               alignItems: 'center',
//               gap: '8px',
//             }}>
//               <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//               <span>{error}</span>
//             </div>
//           )}

//           {/* Form */}
//           <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
//             <div style={{ display: 'grid', gap: '16px' }}>
//               {[
//                 { field: 'name', icon: <User size={18} />, placeholder: 'Full Name' },
//                 { field: 'email', icon: <Mail size={18} />, placeholder: 'Email Address' },
//                 { field: 'phone', icon: <Phone size={18} />, placeholder: 'Phone Number' },
//                 { field: 'department', icon: <Briefcase size={18} />, placeholder: 'Department' },
//                 { field: 'wgr', icon: <Tag size={18} />, placeholder: 'WGR Number' },
//                 { field: 'product_categories', icon: <Grid size={18} />, placeholder: 'Product Categories' },
//                 { field: 'remarks', icon: <Tag size={18} />, placeholder: 'Remarks' },
//               ].map(({ field, icon, placeholder }) => (
//                 <div key={field} style={{ position: 'relative' }}>
//                   <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
//                     {icon}
//                   </div>
//                   <input
//                     name={field}
//                     placeholder={placeholder}
//                     value={form[field]}
//                     onChange={handleChange}
//                     required={field === "name" || field === "email"}
//                     style={{
//                       padding: '12px 16px 12px 40px',
//                       border: '1px solid #d1d5db',
//                       borderRadius: '6px',
//                       fontSize: '14px',
//                       width: '100%',
//                       backgroundColor: field === "wgr" || field === "product_categories" ? '#f9fafb' : 'white',
//                       color: '#111827',
//                     }}
//                   />
//                 </div>
//               ))}
//             </div>

//             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
//               <button
//                 type="button"
//                 onClick={() => navigate("/buyers")}
//                 style={{
//                   padding: '10px 16px',
//                   backgroundColor: 'white',
//                   color: '#4b5563',
//                   fontSize: '14px',
//                   fontWeight: '500',
//                   borderRadius: '6px',
//                   border: '1px solid #d1d5db',
//                   cursor: 'pointer',
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: '8px',
//                 }}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 disabled={isSubmitting}
//                 style={{
//                   padding: '10px 16px',
//                   backgroundColor: '#2563eb',
//                   color: 'white',
//                   fontSize: '14px',
//                   fontWeight: '500',
//                   borderRadius: '6px',
//                   border: 'none',
//                   cursor: 'pointer',
//                   display: 'flex',
//                   alignItems: 'center',
//                   gap: '8px',
//                   opacity: isSubmitting ? 0.7 : 1,
//                 }}
//               >
//                 {isSubmitting ? (
//                   <svg
//                     style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}
//                     fill="none"
//                     viewBox="0 0 24 24"
//                   >
//                     <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                     <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                   </svg>
//                 ) : (
//                   <Save size={16} />
//                 )}
//                 {isSubmitting ? "Saving..." : "Save Changes"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Sidebar from "../merchandiser/Sidebar.jsx";
import { User, Mail, Phone, Briefcase, Tag, Grid, ChevronLeft, Save } from "lucide-react";

export default function EditBuyer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    wgr: "",
    product_categories: "",
    remarks: ""
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://119.148.12.1:8000/api/merchandiser/api/buyer/${id}/`);
        setForm(response.data);
      } catch (err) {
        console.error("Error fetching buyer:", err);
        setError("Failed to load buyer data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuyer();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await axios.put(`http://119.148.12.1:8000/api/merchandiser/api/buyer/${id}/`, form);
      navigate("/buyers");
    } catch (err) {
      console.error("Error updating buyer:", err);
      setError("Failed to update buyer. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#A7D5E1' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div>Loading buyer data...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#A7D5E1', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ backgroundColor: '#DCEEF3', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '32px', maxWidth: '640px', width: '100%', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)' }}>
          {/* Title + Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', gap: '12px' }}>
            <button
              onClick={() => navigate("/buyers")}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: 'white',
                cursor: 'pointer',
                color: '#374151',
              }}
              title="Go back"
            >
              <ChevronLeft size={20} />
            </button>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
              Edit Buyer
            </h2>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '12px 16px',
              marginBottom: '24px',
              backgroundColor: '#fee2e2',
              borderLeft: '4px solid #dc2626',
              color: '#b91c1c',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { field: 'name', icon: <User size={18} />, placeholder: 'Full Name' },
                { field: 'email', icon: <Mail size={18} />, placeholder: 'Email Address' },
                { field: 'phone', icon: <Phone size={18} />, placeholder: 'Phone Number' },
                { field: 'department', icon: <Briefcase size={18} />, placeholder: 'Department' },
                { field: 'wgr', icon: <Tag size={18} />, placeholder: 'WGR Number' },
                { field: 'product_categories', icon: <Grid size={18} />, placeholder: 'Product Categories' },
                { field: 'remarks', icon: <Tag size={18} />, placeholder: 'Remarks' },
              ].map(({ field, icon, placeholder }) => (
                <div key={field} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                    {icon}
                  </div>
                  <input
                    name={field}
                    placeholder={placeholder}
                    value={form[field] || ''}
                    onChange={handleChange}
                    required={field === "name" || field === "email"}
                    style={{
                      padding: '12px 16px 12px 40px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px',
                      width: '100%',
                      backgroundColor: field === "wgr" || field === "product_categories" ? '#f9fafb' : 'white',
                      color: '#111827',
                    }}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button
                type="button"
                onClick={() => navigate("/buyers")}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'white',
                  color: '#4b5563',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isSubmitting ? 0.7 : 1,
                }}
              >
                {isSubmitting ? (
                  <svg
                    style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }}
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Save size={16} />
                )}
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}