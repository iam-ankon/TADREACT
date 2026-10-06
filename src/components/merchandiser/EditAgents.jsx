// Edit Agent page (route /edit-agent/:id). The form itself lives in AgentForm.jsx.
import React from "react";
import { useParams } from "react-router-dom";
import AgentForm from "./AgentForm.jsx";

export default function EditAgents() {
  const { id } = useParams();
  return <AgentForm key={id} agentId={id} />;
}
