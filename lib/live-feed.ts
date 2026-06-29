import type { FeedItem } from "./feed-types";

let idCounter = 0;
function makeId(): string {
  return `feed-${++idCounter}-${Date.now()}`;
}

const FLOOD_FEED: Omit<FeedItem, "id" | "timestamp">[] = [
  { source: "ndma", text: "RED ALERT issued for the affected area. All disaster response agencies activated. Citizens advised to move to higher ground immediately.", severity: "critical", author: "Emergency Management" },
  { source: "twitter", text: "Water level rising rapidly near station road. Cars submerged. We're stuck on the second floor. Please send help! #FloodAlert #Rescue", severity: "critical", author: "@citizen_reporter" },
  { source: "news", text: "BREAKING: Over 500 people stranded as main bridge submerges. Military columns on standby. Weather service predicts continued heavy rainfall for next 12 hours.", severity: "critical", author: "Breaking News" },
  { source: "whatsapp", text: "School ground completely flooded. Children evacuated to upper floors of nearby apartment. Need food and water supplies urgently.", severity: "warning", author: "Local Resident" },
  { source: "twitter", text: "Rescue boat needed URGENTLY in residential zone! Elderly people and children stuck on rooftops. Water still rising. #FloodRelief", severity: "critical", author: "@rescue_volunteer" },
  { source: "whatsapp", text: "River bank has broken. Water entering from all sides. At least 40 families trapped.", severity: "critical", author: "Local Resident", language: "Hindi", originalText: "नदी का किनारा टूट गया है। चारों तरफ से पानी आ रहा है। कम से कम 40 परिवार फंसे हुए हैं।" },
  { source: "news", text: "Military deploys 3 rescue columns with inflatable boats. National disaster response teams airlifted from neighboring region.", severity: "info", author: "Reuters" },
  { source: "ndma", text: "Evacuation order expanded to include Zones B and C. Relief camps set up at Community Center and Public School.", severity: "critical", author: "Emergency Ops Center" },
  { source: "whatsapp", text: "Power supply cut off in entire neighborhood. Mobile network very weak. We managed to reach upper floors. At least 30 families here.", severity: "warning", author: "Community Group" },
  { source: "twitter", text: "Hospital basement flooded. Critical patients being shifted to upper floors. Need ambulances on standby. #MedicalEmergency", severity: "critical", author: "@hospital_admin" },
  { source: "news", text: "Dam upstream releasing excess water. Downstream areas warned of 2-3 feet additional rise in water level within 2 hours.", severity: "critical", author: "AP News" },
  { source: "ndma", text: "Helicopter rescue operations commenced. Priority: rooftop evacuations in worst-hit zones. Emergency hotline activated.", severity: "info", author: "Emergency Management" },
  { source: "twitter", text: "Food packets and drinking water being distributed at relief camp near transit station. Volunteers needed! #FloodRelief", severity: "info", author: "@ngo_volunteer" },
  { source: "whatsapp", text: "The electric lines fell into the water. Very dangerous. Do not leave the house. Stay on the upper floors.", severity: "critical", author: "Community Group", language: "Tamil", originalText: "மின்சார கம்பிகள் தண்ணீரில் விழுந்துவிட்டன. மிகவும் ஆபத்து. வீட்டை விட்டு வெளியே வராதீர்கள். மேல் தளங்களில் இருங்கள்." },
];

const WILDFIRE_FEED: Omit<FeedItem, "id" | "timestamp">[] = [
  { source: "ndma", text: "EXTREME FIRE WARNING: Wind speeds exceeding 50 km/h. All residents within 5km radius advised to evacuate immediately.", severity: "critical", author: "Fire Department" },
  { source: "twitter", text: "Massive wall of fire approaching from the east. Visibility near zero from smoke. We're evacuating now. Sky is completely orange. #Wildfire", severity: "critical", author: "@local_resident" },
  { source: "news", text: "Reuters: Wildfire has consumed over 2,000 hectares. Multiple structures confirmed destroyed. Firefighting aircraft deployed.", severity: "critical", author: "Reuters" },
  { source: "whatsapp", text: "Forest department says fire jumped the firebreak near the highway. Alternate route via old mill road still clear.", severity: "warning", author: "Community Alert" },
  { source: "twitter", text: "Air quality index over 500. People with respiratory issues must leave the area. Local hospital overwhelmed. #AirQuality #Wildfire", severity: "critical", author: "@health_officer" },
  { source: "whatsapp", text: "Fire has reached the village outskirts. All families must evacuate now. Go towards the highway.", severity: "critical", author: "Village Head", language: "Spanish", originalText: "El fuego ha llegado a las afueras del pueblo. Todas las familias deben evacuar ahora. Vayan hacia la autopista." },
  { source: "news", text: "BBC: Satellite imagery shows fire advancing at 3 km/hour. Wind shift expected in 4 hours could change direction toward town center.", severity: "critical", author: "BBC" },
  { source: "ndma", text: "3 additional fire stations mobilized. Army engineering corps creating emergency firebreaks. Aerial water bombing in progress.", severity: "info", author: "State Emergency Ops" },
  { source: "whatsapp", text: "Farm animals stranded near the south valley. Volunteers with trucks needed to help evacuate livestock before fire reaches.", severity: "warning", author: "Farmer's Group" },
  { source: "twitter", text: "Power lines down on Highway 7. Electrical fires reported. Stay away from fallen wires! #SafetyFirst", severity: "critical", author: "@utility_company" },
  { source: "news", text: "AP: Governor declares state of emergency. National Guard activated. Red Cross shelters opening at 4 locations.", severity: "info", author: "AP News" },
];

const EARTHQUAKE_FEED: Omit<FeedItem, "id" | "timestamp">[] = [
  { source: "usgs", text: "USGS: Magnitude 7.2 earthquake detected. Depth: 10 km. Tsunami advisory issued for coastal regions.", severity: "critical", author: "USGS" },
  { source: "ndma", text: "NATIONAL EMERGENCY: All search and rescue teams deployed. Citizens advised to stay in open areas away from damaged buildings.", severity: "critical", author: "NDMA" },
  { source: "twitter", text: "Building collapsed on main street. We can hear people screaming under the rubble. Need heavy machinery NOW! #Earthquake #Rescue", severity: "critical", author: "@eyewitness" },
  { source: "news", text: "Al Jazeera: Hospital partially collapsed. Patients being treated in parking lot. International aid agencies mobilizing.", severity: "critical", author: "Al Jazeera" },
  { source: "whatsapp", text: "Gas leak detected in our building. Entire block evacuated. Can smell gas strongly. Fire department not responding to calls.", severity: "critical", author: "Building Resident" },
  { source: "twitter", text: "Building has completely collapsed. People are screaming under the rubble. Heavy machinery needed immediately. Please help!", severity: "critical", author: "@citizen", language: "Turkish", originalText: "Bina tamamen çöktü. İnsanlar enkazın altında bağırıyor. Acil ağır makine lazım. Lütfen yardım edin!" },
  { source: "usgs", text: "USGS: Aftershock detected — Magnitude 5.1. Residents warned: weakened structures at risk of further collapse.", severity: "warning", author: "USGS" },
  { source: "twitter", text: "Road cracked open near the bridge. Giant fissure blocking all traffic. Emergency vehicles can't get through! #RoadDamage", severity: "critical", author: "@traffic_alert" },
  { source: "news", text: "CNN: Death toll feared in hundreds. Multiple building collapses confirmed. UN dispatching emergency response team.", severity: "critical", author: "CNN" },
  { source: "ndma", text: "Temporary morgue set up at stadium. Blood donation camps activated at 6 locations. Volunteer registration at district HQ.", severity: "info", author: "District Admin" },
  { source: "whatsapp", text: "Water pipeline burst near market area. Entire neighborhood without water. Need tanker supply urgently.", severity: "warning", author: "Ward Committee" },
  { source: "twitter", text: "School building collapsed but all children evacuated safely before collapse. Teachers acted heroically. #EarthquakeHeroes", severity: "info", author: "@school_update" },
  { source: "news", text: "International rescue teams from 5 countries arriving within 12 hours. Thermal imaging equipment being airlifted.", severity: "info", author: "Reuters" },
];

const FEED_MAP: Record<string, Omit<FeedItem, "id" | "timestamp">[]> = {
  flood: FLOOD_FEED,
  fire: WILDFIRE_FEED,
  wildfire: WILDFIRE_FEED,
  earthquake: EARTHQUAKE_FEED,
  collapse: EARTHQUAKE_FEED,
  storm: FLOOD_FEED,
  tornado: WILDFIRE_FEED,
  landslide: EARTHQUAKE_FEED,
  other: FLOOD_FEED,
};

export function getSimulatedFeed(disasterType: string): FeedItem[] {
  const items = FEED_MAP[disasterType.toLowerCase()] || FLOOD_FEED;
  const now = Date.now();
  return items.map((item, i) => ({
    ...item,
    id: makeId(),
    timestamp: now + i * 4000,
  }));
}

export async function fetchUSGSEarthquakes(): Promise<FeedItem[]> {
  try {
    const res = await fetch(
      "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&limit=3&orderby=time&minmagnitude=4",
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.features.map((f: { properties: { place: string; mag: number; time: number }; geometry: { coordinates: number[] } }) => ({
      id: makeId(),
      source: "usgs" as const,
      text: `USGS: M${f.properties.mag.toFixed(1)} earthquake — ${f.properties.place}`,
      timestamp: f.properties.time,
      severity: f.properties.mag >= 6 ? "critical" as const : f.properties.mag >= 4.5 ? "warning" as const : "info" as const,
      author: "USGS",
      coordinates: { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] },
    }));
  } catch {
    return [];
  }
}
