// Politics and War API client
const PWS_API_BASE = 'https://politicsandwar.com/api'

interface Nation {
  nationid: string
  nation: string
  leader: string
  continent: string
  war_policy: string
  domestic_policy: string
  color: string
  alliance: string
  allianceposition: string
  cities: number
  infrastructure: number
  technology: number
  oil_production: number
  uranium_production: number
  iron_production: number
  bauxite_production: number
  lead_production: number
  coal_production: number
  food_production: number
  powered: number
  projects: number
  project_bits: number
  iron_works: number
  bauxite_works: number
  arms_stockpile: number
  emergency_gasoline_reserve: number
  mass_irrigation: number
  international_trade_center: number
  missile_launch_pad: number
  nuclear_research_facility: number
  iron_dome: number
  vital_defense_system: number
  central_intelligence_agency: number
  center_for_civil_engineering: number
  propaganda_bureau: number
  uranium_enrichment_program: number
  urban_planning: number
  advanced_urban_planning: number
  space_program: number
  spy_satellite: number
  moon_landing: number
  pirate_economy: number
  recycling_initiative: number
  telecommunications_satellite: number
  green_technologies: number
  arable_land_agency: number
  clinical_research_center: number
  specialized_police_training: number
  advanced_engineering_corps: number
  government_support_agency: number
  research_and_development_center: number
  resource_production_center: number
  metropolitan_planning: number
  military_salvage: number
  fallout_shelter: number
  advanced_pirate_economy: number
  mars_landing: number
  surveillance_network: number
  gulag: number
  city_planning: number
  advanced_city_planning: number
  activity_center: number
  bureau_of_domestic_affairs: number
}

interface Alliance {
  id: string
  name: string
  acronym: string
  color: string
  founded: string
  members: number
  applicants: number
  score: number
  acceptmem: string
  flag: string
  forumlink: string
  irclink: string
  discord: string
}

class PoliticsAndWarAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.POLITICS_AND_WAR_API_KEY || ''
    this.baseUrl = PWS_API_BASE
    
    if (!this.apiKey) {
      console.warn('Politics and War API key not configured')
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, string> = {}) {
    if (!this.apiKey) {
      throw new Error('Politics and War API key not configured')
    }

    const url = new URL(`${this.baseUrl}${endpoint}`)
    url.searchParams.append('key', this.apiKey)
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value)
    })

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async getNation(nationId: string): Promise<{ nations: Nation[] }> {
    return this.makeRequest('/nation/id', { id: nationId })
  }

  async getNationByName(nationName: string): Promise<{ nations: Nation[] }> {
    return this.makeRequest('/nation', { nation: nationName })
  }

  async getAlliance(allianceId: string): Promise<{ alliances: Alliance[] }> {
    return this.makeRequest('/alliance/id', { id: allianceId })
  }

  async getAllianceByName(allianceName: string): Promise<{ alliances: Alliance[] }> {
    return this.makeRequest('/alliance', { alliance: allianceName })
  }

  async getMyNation(): Promise<{ nations: Nation[] }> {
    const nationId = process.env.POLITICS_AND_WAR_NATION_ID
    if (!nationId) {
      throw new Error('Nation ID not configured')
    }
    return this.getNation(nationId)
  }

  // Helper method to check if API is configured
  isConfigured(): boolean {
    return !!this.apiKey && !!process.env.POLITICS_AND_WAR_NATION_ID
  }
}

export const pwAPI = new PoliticsAndWarAPI()
export type { Nation, Alliance }
