export type AgentName =
  | "OrchestratorAgent"
  | "MaintenanceAgent"
  | "ContractAgent"
  | "CommsAgent"
  | "InvoiceAgent";

export type StatusTone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";

export type WorkflowStatus =
  | "Queued"
  | "Running"
  | "Awaiting approval"
  | "Human review required"
  | "Ready to send"
  | "Completed"
  | "SLA at risk"
  | "Failed";

export type PropertyRecord = {
  id: string;
  address: string;
  units: string[];
  owner: string;
  tenants: string[];
  openMaintenance: number;
  leaseStatus: string;
  pendingInvoices: number;
  recentActivity: string;
};

export type Operation = {
  id: string;
  agent: AgentName;
  workflowType: string;
  property: string;
  person: string;
  timestamp: string;
  status: WorkflowStatus;
  confidence: number;
  proposedAction: string;
  approvalRequired: boolean;
  handoffChain: (AgentName | "Human Approval")[];
  evidence: string[];
  related: string[];
  audit: string[];
};

export type Conversation = {
  id: string;
  contact: string;
  role: "tenant" | "owner" | "vendor";
  channel: "WhatsApp" | "Email" | "Voice";
  property: string;
  latest: string;
  assignedAgent: AgentName;
  status: string;
  humanRequired: boolean;
  messages: { author: string; body: string; time: string; kind: "inbound" | "agent" | "human" }[];
  draftReply: string;
  sourceContext: string[];
  linkedWorkflow: string;
};

export type Approval = {
  id: string;
  action: string;
  agent: AgentName;
  reason: string;
  evidence: string[];
  property: string;
  person: string;
  risk: "Low" | "Medium" | "High";
  deadline: string;
  status: "Pending" | "Approved" | "Rejected" | "Changes requested";
};

export type DocumentSource = {
  id: string;
  category: string;
  fileName: string;
  linkedEntity: string;
  uploadedAt: string;
  extractedStatus: string;
  confidence: number;
  relatedAgent: AgentName;
  reviewStatus: string;
  fields: Record<string, string>;
};

export type AgentRecord = {
  name: AgentName;
  responsibility: string;
  activeTasks: number;
  toolScope: string[];
  approvalRequirements: string[];
  recentHandoffs: string[];
  errorCount: number;
  lastRun: string;
};

export type AuditLogEntry = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  source: string;
  approvalRef: string;
  status: string;
  risk: "Low" | "Medium" | "High";
  agent: AgentName | "Human";
  property: string;
  entityType: string;
};
