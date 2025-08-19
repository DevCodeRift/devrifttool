/**
 * Politics and War API Client
 * GraphQL API v3 integration
 */

export interface Nation {
  id: string;
  nation_name: string;
  leader_name: string;
  continent: string;
  war_policy: string;
  domestic_policy: string;
  color: string;
  alliance_id?: string;
  alliance?: Alliance;
  score: number;
  update_tz: number;
  population: number;
  flag: string;
  vacation_mode_turns: number;
  beige_turns: number;
  espionage_available: boolean;
  last_active: string;
  date: string;
  soldiers: number;
  tanks: number;
  aircraft: number;
  ships: number;
  missiles: number;
  nukes: number;
  projects: number;
  city_timer: number;
  project_timer: number;
  wars_won: number;
  wars_lost: number;
  tax_id: string;
  alliance_position: string;
  alliance_position_id: string;
  cities: City[];
}

export interface Alliance {
  id: string;
  name: string;
  acronym: string;
  score: number;
  color: string;
  date: string;
  nations: Nation[];
}

export interface City {
  id: string;
  nation_id: string;
  name: string;
  date: string;
  infrastructure: number;
  land: number;
  powered: boolean;
  oil_power: number;
  wind_power: number;
  coal_power: number;
  nuclear_power: number;
  coal_mine: number;
  oil_well: number;
  uranium_mine: number;
  barracks: number;
  farm: number;
  police_station: number;
  hospital: number;
  recycling_center: number;
  subway: number;
}

export interface War {
  id: string;
  date: string;
  reason: string;
  war_type: string;
  attacker_id: string;
  defender_id: string;
  attacker_alliance_id?: string;
  defender_alliance_id?: string;
  ground_control: string;
  air_superiority: string;
  naval_blockade: string;
  attacker: Nation;
  defender: Nation;
  attacks: Attack[];
}

export interface Attack {
  id: string;
  date: string;
  attacker_id: string;
  defender_id: string;
  type: string;
  war_id: string;
  victor: string;
  success: number;
  attcas1: number;
  attcas2: number;
  defcas1: number;
  defcas2: number;
  city_id?: string;
  infrastructure_destroyed: number;
  improvements_lost: number;
  money_stolen: number;
  loot_info: string;
  resistance: number;
  city_infrastructure_before: number;
  infrastructure_destroyed_value: number;
  attacker: Nation;
  defender: Nation;
}

class PoliticsAndWarAPI {
  private baseUrl = 'https://api.politicsandwar.com/graphql';
  private apiKey: string;
  private nationId: string;

  constructor() {
    this.apiKey = process.env.POLITICS_AND_WAR_API_KEY || '';
    this.nationId = process.env.POLITICS_AND_WAR_NATION_ID || '';
  }

  private async graphqlRequest(query: string, variables?: Record<string, unknown>) {
    try {
      const url = `${this.baseUrl}?api_key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      return data.data;
    } catch (error) {
      console.error('Politics and War API Error:', error);
      throw error;
    }
  }

  // Get nation information
  async getNation(nationId?: string): Promise<Nation | null> {
    const id = nationId || this.nationId;
    if (!id) {
      throw new Error('Nation ID is required');
    }

    const query = `
      query GetNation($id: ID!) {
        nation(id: $id) {
          id
          nation_name
          leader_name
          continent
          war_policy
          domestic_policy
          color
          alliance_id
          alliance {
            id
            name
            acronym
            color
          }
          score
          update_tz
          population
          flag
          vacation_mode_turns
          beige_turns
          espionage_available
          last_active
          date
          soldiers
          tanks
          aircraft
          ships
          missiles
          nukes
          projects
          city_timer
          project_timer
          wars_won
          wars_lost
          tax_id
          alliance_position
          alliance_position_id
        }
      }
    `;

    const data = await this.graphqlRequest(query, { id });
    return data.nation;
  }

  // Get multiple nations
  async getNations(filters?: {
    first?: number;
    alliance_id?: string[];
    color?: string[];
    min_score?: number;
    max_score?: number;
  }): Promise<Nation[]> {
    const query = `
      query GetNations(
        $first: Int
        $alliance_id: [ID]
        $color: [String]
        $min_score: Float
        $max_score: Float
      ) {
        nations(
          first: $first
          alliance_id: $alliance_id
          color: $color
          min_score: $min_score
          max_score: $max_score
        ) {
          data {
            id
            nation_name
            leader_name
            continent
            color
            alliance_id
            alliance {
              id
              name
              acronym
            }
            score
            population
            last_active
            soldiers
            tanks
            aircraft
            ships
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, filters);
    return data.nations?.data || [];
  }

  // Get alliance information
  async getAlliance(allianceId: string): Promise<Alliance | null> {
    const query = `
      query GetAlliance($id: ID!) {
        alliance(id: $id) {
          id
          name
          acronym
          score
          color
          date
          nations {
            id
            nation_name
            leader_name
            score
            last_active
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, { id: allianceId });
    return data.alliance;
  }

  // Get wars involving a nation
  async getWars(filters?: {
    nation_id?: string[];
    alliance_id?: string[];
    min_id?: string;
    max_id?: string;
    active?: boolean;
    first?: number;
  }): Promise<War[]> {
    const query = `
      query GetWars(
        $nation_id: [ID]
        $alliance_id: [ID]
        $min_id: ID
        $max_id: ID
        $active: Boolean
        $first: Int
      ) {
        wars(
          nation_id: $nation_id
          alliance_id: $alliance_id
          min_id: $min_id
          max_id: $max_id
          active: $active
          first: $first
        ) {
          data {
            id
            date
            reason
            war_type
            attacker_id
            defender_id
            attacker_alliance_id
            defender_alliance_id
            ground_control
            air_superiority
            naval_blockade
            attacker {
              id
              nation_name
              leader_name
              flag
            }
            defender {
              id
              nation_name
              leader_name
              flag
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, filters);
    return data.wars?.data || [];
  }

  // Get nation's cities
  async getCities(nationId?: string): Promise<City[]> {
    const id = nationId || this.nationId;
    if (!id) {
      throw new Error('Nation ID is required');
    }

    const query = `
      query GetCities($nation_id: [ID!]) {
        cities(nation_id: $nation_id) {
          data {
            id
            nation_id
            name
            date
            infrastructure
            land
            powered
            oil_power
            wind_power
            coal_power
            nuclear_power
            coal_mine
            oil_well
            uranium_mine
            barracks
            farm
            police_station
            hospital
            recycling_center
            subway
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, { nation_id: [id] });
    return data.cities?.data || [];
  }

  // Get recent attacks
  async getAttacks(filters?: {
    min_id?: string;
    max_id?: string;
    nation_id?: string[];
    war_id?: string[];
    first?: number;
  }): Promise<Attack[]> {
    const query = `
      query GetAttacks(
        $min_id: ID
        $max_id: ID
        $nation_id: [ID]
        $war_id: [ID]
        $first: Int
      ) {
        attacks(
          min_id: $min_id
          max_id: $max_id
          nation_id: $nation_id
          war_id: $war_id
          first: $first
        ) {
          data {
            id
            date
            attacker_id
            defender_id
            type
            war_id
            victor
            success
            attcas1
            attcas2
            defcas1
            defcas2
            infrastructure_destroyed
            money_stolen
            attacker {
              id
              nation_name
              leader_name
            }
            defender {
              id
              nation_name
              leader_name
            }
          }
        }
      }
    `;

    const data = await this.graphqlRequest(query, filters);
    return data.attacks?.data || [];
  }

  // Check if API is configured
  isConfigured(): boolean {
    return !!(this.apiKey && this.nationId);
  }

  // Get API configuration status
  getConfigStatus() {
    return {
      hasApiKey: !!this.apiKey,
      hasNationId: !!this.nationId,
      isConfigured: this.isConfigured(),
    };
  }
}

// Export singleton instance
export const pwApi = new PoliticsAndWarAPI();
export default PoliticsAndWarAPI;
