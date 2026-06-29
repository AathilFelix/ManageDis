import { chatCompletion } from "./cerebras";
import type {
  VisionResult,
  RiskResult,
  ResourceResult,
  RouteResult,
  CommanderResult,
} from "./types";

function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) return braceMatch[0];
  return text;
}

function safeParse<T>(text: string): T {
  return JSON.parse(extractJSON(text)) as T;
}

export async function runVisionAgent(
  imageBase64: string,
  location: string,
  situation: string
): Promise<VisionResult> {
  const systemPrompt = `You are a disaster assessment AI analyzing a disaster scene.
Location: ${location}
Situation report: ${situation}

Analyze the image and situation carefully. Return ONLY valid JSON with this exact structure:
{
  "disasterType": "flood|fire|earthquake|collapse|storm|tornado|landslide|other",
  "severity": "low|medium|high|critical",
  "affectedArea": "description of the affected area based on what you see",
  "hazards": ["list of specific hazards you identify"],
  "estimatedPeopleAtRisk": number,
  "blockedRoutes": ["descriptions of blocked or dangerous routes"],
  "keyObservations": ["specific observations from the image"],
  "confidence": number between 0 and 100 representing your confidence in this assessment
}`;

  if (!imageBase64) {
    const response = await chatCompletion(
      systemPrompt,
      `Analyze this disaster based on the situation report. Location: ${location}. Report: ${situation}. Use your expertise to assess the disaster type, severity, hazards, and risks based on this information.`
    );
    return safeParse<VisionResult>(response);
  }

  try {
    const userContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
      {
        type: "text",
        text: `Analyze this disaster scene. Location: ${location}. Report: ${situation}`,
      },
      {
        type: "image_url",
        image_url: { url: imageBase64 },
      },
    ];
    const response = await chatCompletion(systemPrompt, userContent);
    return safeParse<VisionResult>(response);
  } catch {
    const response = await chatCompletion(
      systemPrompt,
      `Analyze this disaster based on the situation report. Location: ${location}. Report: ${situation}. Use your expertise to assess the disaster type, severity, hazards, and risks based on this information.`
    );
    return safeParse<VisionResult>(response);
  }
}

export async function runRiskAgent(
  visionData: VisionResult,
  location: string,
  situation: string
): Promise<RiskResult> {
  const systemPrompt = `You are a risk assessment AI for disaster response. Given the following disaster assessment, predict immediate dangers and escalation risks.

Disaster Assessment:
- Type: ${visionData.disasterType}
- Severity: ${visionData.severity}
- Area: ${visionData.affectedArea}
- Hazards: ${visionData.hazards.join(", ")}
- People at risk: ${visionData.estimatedPeopleAtRisk}
- Location: ${location}
- Situation: ${situation}

Return ONLY valid JSON:
{
  "immediateThreats": ["list of immediate life-threatening dangers"],
  "escalationRisks": ["what could get worse in the next 1-6 hours"],
  "timeframe": "estimated critical window (e.g., '2-4 hours before conditions worsen')",
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["urgent risk mitigation steps"],
  "confidence": number between 0 and 100 representing your confidence in this risk assessment
}`;

  const response = await chatCompletion(systemPrompt, `Assess risks for this ${visionData.disasterType} disaster at ${location}`);
  return safeParse<RiskResult>(response);
}

export async function runResourceAgent(
  visionData: VisionResult,
  location: string,
  situation: string
): Promise<ResourceResult> {
  const systemPrompt = `You are a resource allocation AI for disaster response. Given the disaster assessment, recommend required resources. For each personnel and vehicle type, estimate what is typically available in the region AND what is needed — highlight the gap.

Disaster Assessment:
- Type: ${visionData.disasterType}
- Severity: ${visionData.severity}
- People at risk: ${visionData.estimatedPeopleAtRisk}
- Hazards: ${visionData.hazards.join(", ")}
- Location: ${location}
- Situation: ${situation}

Return ONLY valid JSON:
{
  "personnel": [{"type": "role name", "needed": number, "available": number, "gap": number}],
  "vehicles": [{"type": "vehicle type", "needed": number, "available": number, "gap": number}],
  "supplies": [{"type": "supply name", "quantity": "amount with units"}],
  "equipment": ["specialized equipment needed"],
  "estimatedCost": "rough cost estimate",
  "gapRecommendations": ["specific recommendations to fill resource gaps, e.g. 'Request 3 additional boats from neighboring District X'"],
  "confidence": number between 0 and 100
}`;

  const response = await chatCompletion(systemPrompt, `Allocate resources for this ${visionData.disasterType} disaster affecting ~${visionData.estimatedPeopleAtRisk} people at ${location}`);
  return safeParse<ResourceResult>(response);
}

export async function runRouteAgent(
  visionData: VisionResult,
  location: string,
  situation: string
): Promise<RouteResult> {
  const systemPrompt = `You are a route planning AI for disaster response. Plan evacuation routes and safe zones.

Disaster Assessment:
- Type: ${visionData.disasterType}
- Severity: ${visionData.severity}
- Blocked routes: ${visionData.blockedRoutes.join(", ")}
- Hazards: ${visionData.hazards.join(", ")}
- Location: ${location}
- Situation: ${situation}

IMPORTANT: Generate realistic GPS coordinates near the disaster location. Use your knowledge of the location to pick real nearby landmarks, schools, or open areas as safe zones and staging areas.

Return ONLY valid JSON:
{
  "evacuationRoutes": [{"name": "route name", "description": "route details", "safetyLevel": "safe|caution|risky"}],
  "blockedAreas": [{"name": "area name", "reason": "why blocked"}],
  "safeZones": [{"name": "place name", "capacity": number, "coordinates": {"lat": number, "lng": number}}],
  "stagingAreas": [{"name": "area name", "purpose": "staging purpose", "coordinates": {"lat": number, "lng": number}}],
  "routeCoordinates": [[{"lat": number, "lng": number}]],
  "confidence": number between 0 and 100
}`;

  const response = await chatCompletion(systemPrompt, `Plan routes for ${location} during this ${visionData.disasterType}. Generate coordinates near the actual location.`);
  return safeParse<RouteResult>(response);
}

export async function runCommanderAgent(
  visionData: VisionResult,
  riskData: RiskResult,
  resourceData: ResourceResult,
  routeData: RouteResult,
  location: string,
  situation: string
): Promise<CommanderResult> {
  const systemPrompt = `You are the Emergency Commander AI. Synthesize all agent reports into a unified action plan.

VISION REPORT:
${JSON.stringify(visionData, null, 2)}

RISK REPORT:
${JSON.stringify(riskData, null, 2)}

RESOURCE REPORT:
${JSON.stringify(resourceData, null, 2)}

ROUTE REPORT:
${JSON.stringify(routeData, null, 2)}

Location: ${location}
Situation: ${situation}

Create a decisive, actionable emergency plan. Include your reasoning — explain WHY you chose each priority and what factors drove your decisions. Return ONLY valid JSON:
{
  "missionName": "Operation [codename]",
  "priorityActions": [{"priority": 1, "action": "what to do", "assignee": "who does it", "deadline": "when"}],
  "timeline": [{"time": "T+0", "action": "first action"}, {"time": "T+15min", "action": "next action"}],
  "communicationPlan": "brief comms strategy",
  "summary": "2-3 sentence executive summary of the situation and plan",
  "reasoning": ["Each string is one key reasoning point explaining WHY a decision was made, e.g. 'Flood likely to worsen due to continued rainfall — prioritizing evacuation over rescue', 'Hospital remains reachable via Route B — routing ambulances there first'"],
  "confidence": number between 0 and 100
}`;

  const response = await chatCompletion(systemPrompt, "Generate the emergency action plan now.");
  return safeParse<CommanderResult>(response);
}
