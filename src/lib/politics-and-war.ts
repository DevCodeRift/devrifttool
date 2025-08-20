// Politics and War API v3 (GraphQL) client
const PW_API_BASE = 'https://api.politicsandwar.com/graphql'

export interface Nation {
  id: string
  nation_name: string
  leader_name: string
  continent: string
  war_policy: string
  domestic_policy: string
  color: string
  alliance_id: string
  alliance_position: string
  num_cities: number
  cities: number
  score: number
  population: number
  soldiers: number
  tanks: number
  aircraft: number
  ships: number
  missiles: number
  nukes: number
  spies: number
  money: number
  coal: number
  oil: number
  uranium: number
  iron: number
  bauxite: number
  lead: number
  gasoline: number
  munitions: number
  steel: number
  aluminum: number
  food: number
  credits: number
  projects: number
  last_active: string
  date: string
  flag: string
  vacation_mode_turns: number
  beige_turns: number
  espionage_available: boolean
}

export interface Alliance {
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

export class PoliticsAndWarAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.POLITICS_AND_WAR_API_KEY || ''
    this.baseUrl = PW_API_BASE
    
    if (!this.apiKey) {
      console.warn('Politics and War API key not configured')
    }
  }

  private async makeGraphQLRequest(query: string) {
    if (!this.apiKey) {
      throw new Error('Politics and War API key not configured')
    }

    try {
      const url = `${this.baseUrl}?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DevRiftTool/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`)
      }

      return data.data
    } catch (error) {
      console.error('Politics and War API error:', error)
      throw error
    }
  }

  async getNation(nationId: string) {
    const query = `{
      nations(id: ${nationId}) {
        data {
          id
          nation_name
          leader_name
          continent
          color
          num_cities
          score
          population
          soldiers
          tanks
          aircraft
          ships
          missiles
          nukes
          spies
          money
          coal
          oil
          uranium
          iron
          bauxite
          lead
          gasoline
          munitions
          steel
          aluminum
          food
          credits
          projects
          last_active
          date
          flag
          vacation_mode_turns
          beige_turns
          espionage_available
          alliance_id
          war_policy
          domestic_policy
        }
      }
    }`

    const result = await this.makeGraphQLRequest(query)
    return { nations: result.nations.data }
  }

  async getNationByName(nationName: string) {
    const query = `{
      nations(nation_name: ["${nationName}"]) {
        data {
          id
          nation_name
          leader_name
          continent
          color
          num_cities
          score
          population
          soldiers
          tanks
          aircraft
          ships
          missiles
          nukes
          spies
          money
          coal
          oil
          uranium
          iron
          bauxite
          lead
          gasoline
          munitions
          steel
          aluminum
          food
          credits
          projects
          last_active
          date
          flag
          vacation_mode_turns
          beige_turns
          espionage_available
          alliance_id
          war_policy
          domestic_policy
        }
      }
    }`

    const result = await this.makeGraphQLRequest(query)
    return { nations: result.nations.data }
  }

  async getAlliance(allianceId: string) {
    const query = `{
      alliances(id: ${allianceId}) {
        data {
          id
          name
          acronym
          color
          founded
          members
          applicants
          score
          acceptmem
          flag
          forumlink
          irclink
          discord
        }
      }
    }`

    const result = await this.makeGraphQLRequest(query)
    return { alliances: result.alliances.data }
  }

  async getAllianceByName(allianceName: string) {
    const query = `{
      alliances(name: ["${allianceName}"]) {
        data {
          id
          name
          acronym
          color
          founded
          members
          applicants
          score
          acceptmem
          flag
          forumlink
          irclink
          discord
        }
      }
    }`

    const result = await this.makeGraphQLRequest(query)
    return { alliances: result.alliances.data }
  }

  async getMyNation() {
    // Use the API key to get current user's nation
    const query = `{
      me {
        nation {
          id
          nation_name
          leader_name
          continent
          color
          num_cities
          score
          population
          soldiers
          tanks
          aircraft
          ships
          missiles
          nukes
          spies
          money
          coal
          oil
          uranium
          iron
          bauxite
          lead
          gasoline
          munitions
          steel
          aluminum
          food
          credits
          projects
          last_active
          date
          flag
          vacation_mode_turns
          beige_turns
          espionage_available
          alliance_id
          war_policy
          domestic_policy
        }
      }
    }`

    const result = await this.makeGraphQLRequest(query)
    return { nations: result.me ? [result.me.nation] : [] }
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }
}

export const pwAPI = new PoliticsAndWarAPI()
