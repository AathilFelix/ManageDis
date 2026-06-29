export interface VisionResult {
  disasterType: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedArea: string;
  hazards: string[];
  estimatedPeopleAtRisk: number;
  blockedRoutes: string[];
  keyObservations: string[];
  confidence: number;
}

export interface RiskResult {
  immediateThreats: string[];
  escalationRisks: string[];
  timeframe: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  recommendations: string[];
  confidence: number;
}

export interface ResourceResult {
  personnel: { type: string; needed: number; available: number; gap: number }[];
  vehicles: { type: string; needed: number; available: number; gap: number }[];
  supplies: { type: string; quantity: string }[];
  equipment: string[];
  estimatedCost: string;
  gapRecommendations: string[];
  confidence: number;
}

export interface RouteResult {
  evacuationRoutes: { name: string; description: string; safetyLevel: string }[];
  blockedAreas: { name: string; reason: string }[];
  safeZones: { name: string; capacity: number; coordinates: { lat: number; lng: number } }[];
  stagingAreas: { name: string; purpose: string; coordinates: { lat: number; lng: number } }[];
  routeCoordinates: { lat: number; lng: number }[][];
  confidence: number;
}

export interface CommanderResult {
  missionName: string;
  priorityActions: { priority: number; action: string; assignee: string; deadline: string }[];
  timeline: { time: string; action: string }[];
  communicationPlan: string;
  summary: string;
  reasoning: string[];
  confidence: number;
}

export interface AnalysisResult {
  vision: VisionResult;
  risk: RiskResult;
  resources: ResourceResult;
  routes: RouteResult;
  commander: CommanderResult;
}

export interface AgentEvent {
  type: "agent-start" | "agent-complete" | "agent-error" | "analysis-complete";
  agent: string;
  data?: unknown;
  elapsed?: number;
  timestamp: number;
}

export type AgentStatus = "waiting" | "running" | "complete" | "error";

export interface AgentState {
  name: string;
  icon: string;
  status: AgentStatus;
  elapsed: number;
  confidence?: number;
}

export interface DecisionLogEntry {
  time: string;
  event: string;
  agent?: string;
}
