// Edit Customer page (route /edit-customer/:id). The form itself lives in CustomerForm.jsx.
import React from "react";
import { useParams } from "react-router-dom";
import CustomerForm from "./CustomerForm.jsx";

export default function EditCustomer() {
  const { id } = useParams();
  return <CustomerForm key={id} customerId={id} />;
}
