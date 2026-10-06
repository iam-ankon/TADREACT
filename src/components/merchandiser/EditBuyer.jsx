// Edit Buyer page (route /edit-buyer/:id). The form itself lives in BuyerForm.jsx.
import React from "react";
import { useParams } from "react-router-dom";
import BuyerForm from "./BuyerForm.jsx";

export default function EditBuyer() {
  const { id } = useParams();
  return <BuyerForm key={id} buyerId={id} />;
}
