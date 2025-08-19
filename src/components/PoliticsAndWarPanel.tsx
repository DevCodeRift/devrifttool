'use client';

import { useState, useEffect } from 'react';
import { Nation, Alliance, War } from '@/lib/pwapi';

interface PoliticsAndWarData {
  nation?: Nation;
  alliance?: Alliance;
  wars?: War[];
  loading: boolean;
  error?: string;
}

export default function PoliticsAndWarPanel() {
  const [data, setData] = useState<PoliticsAndWarData>({ loading: true });
  const [activeTab, setActiveTab] = useState<'nation' | 'alliance' | 'wars'>('nation');
  const [customNationId, setCustomNationId] = useState('');
  const [customAllianceId, setCustomAllianceId] = useState('');

  // Load nation data
  const loadNationData = async (nationId?: string) => {
    try {
      setData(prev => ({ ...prev, loading: true, error: undefined }));
      
      const url = nationId ? `/api/pw/nation?nationId=${nationId}` : '/api/pw/nation';
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch nation data');
      }
      
      setData(prev => ({ 
        ...prev, 
        nation: result.nation, 
        loading: false 
      }));
    } catch (error) {
      setData(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
    }
  };

  // Load alliance data
  const loadAllianceData = async (allianceId: string) => {
    try {
      setData(prev => ({ ...prev, loading: true, error: undefined }));
      
      const response = await fetch(`/api/pw/alliance?allianceId=${allianceId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch alliance data');
      }
      
      setData(prev => ({ 
        ...prev, 
        alliance: result.alliance, 
        loading: false 
      }));
    } catch (error) {
      setData(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
    }
  };

  // Load wars data
  const loadWarsData = async (nationId?: string) => {
    try {
      setData(prev => ({ ...prev, loading: true, error: undefined }));
      
      const url = nationId 
        ? `/api/pw/wars?nationId=${nationId}&active=true&first=20`
        : '/api/pw/wars?active=true&first=20';
      const response = await fetch(url);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch wars data');
      }
      
      setData(prev => ({ 
        ...prev, 
        wars: result.wars, 
        loading: false 
      }));
    } catch (error) {
      setData(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Unknown error',
        loading: false 
      }));
    }
  };

  // Load initial data
  useEffect(() => {
    if (activeTab === 'nation') {
      loadNationData();
    } else if (activeTab === 'wars') {
      loadWarsData();
    }
  }, [activeTab]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      'aqua': 'text-cyan-400',
      'black': 'text-gray-800',
      'blue': 'text-blue-500',
      'brown': 'text-amber-600',
      'green': 'text-green-500',
      'lime': 'text-lime-400',
      'maroon': 'text-red-800',
      'olive': 'text-yellow-600',
      'orange': 'text-orange-500',
      'pink': 'text-pink-400',
      'purple': 'text-purple-500',
      'red': 'text-red-500',
      'white': 'text-gray-100',
      'yellow': 'text-yellow-400'
    };
    return colorMap[color.toLowerCase()] || 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Politics & War</h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('nation')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'nation'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Nation
        </button>
        <button
          onClick={() => setActiveTab('alliance')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'alliance'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Alliance
        </button>
        <button
          onClick={() => setActiveTab('wars')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'wars'
              ? 'bg-blue-600 text-white'
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          }`}
        >
          Wars
        </button>
      </div>

      {/* Error Display */}
      {data.error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 font-medium">Error</p>
          <p className="text-red-300 text-sm">{data.error}</p>
        </div>
      )}

      {/* Loading State */}
      {data.loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading...</p>
        </div>
      )}

      {/* Nation Tab */}
      {activeTab === 'nation' && !data.loading && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nation ID (optional)"
              value={customNationId}
              onChange={(e) => setCustomNationId(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
            <button
              onClick={() => loadNationData(customNationId || undefined)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Load
            </button>
          </div>

          {data.nation && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center gap-4 mb-4">
                {data.nation.flag && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={data.nation.flag} 
                    alt={`${data.nation.nation_name} flag`}
                    className="w-16 h-12 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-white">{data.nation.nation_name}</h3>
                  <p className="text-gray-300">Led by {data.nation.leader_name}</p>
                  <p className={`font-medium ${getColorClass(data.nation.color)}`}>
                    {data.nation.color.charAt(0).toUpperCase() + data.nation.color.slice(1)} Team
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Score</p>
                  <p className="text-white font-bold">{formatNumber(data.nation.score)}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Population</p>
                  <p className="text-white font-bold">{formatNumber(data.nation.population)}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Cities</p>
                  <p className="text-white font-bold">{data.nation.cities?.length || 0}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Projects</p>
                  <p className="text-white font-bold">{data.nation.projects}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Soldiers</p>
                  <p className="text-white font-bold">{formatNumber(data.nation.soldiers)}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Tanks</p>
                  <p className="text-white font-bold">{formatNumber(data.nation.tanks)}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Aircraft</p>
                  <p className="text-white font-bold">{formatNumber(data.nation.aircraft)}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Ships</p>
                  <p className="text-white font-bold">{formatNumber(data.nation.ships)}</p>
                </div>
              </div>

              {data.nation.alliance && (
                <div className="mt-4 bg-gray-700 p-4 rounded">
                  <h4 className="text-white font-bold mb-2">Alliance</h4>
                  <p className="text-gray-300">
                    {data.nation.alliance.name} [{data.nation.alliance.acronym}]
                  </p>
                  <p className="text-gray-400 text-sm">
                    Position: {data.nation.alliance_position}
                  </p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Continent: <span className="text-white">{data.nation.continent}</span></p>
                  <p className="text-gray-400">War Policy: <span className="text-white">{data.nation.war_policy}</span></p>
                  <p className="text-gray-400">Domestic Policy: <span className="text-white">{data.nation.domestic_policy}</span></p>
                </div>
                <div>
                  <p className="text-gray-400">Wars Won: <span className="text-white">{data.nation.wars_won}</span></p>
                  <p className="text-gray-400">Wars Lost: <span className="text-white">{data.nation.wars_lost}</span></p>
                  <p className="text-gray-400">Last Active: <span className="text-white">{formatDate(data.nation.last_active)}</span></p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alliance Tab */}
      {activeTab === 'alliance' && !data.loading && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Alliance ID"
              value={customAllianceId}
              onChange={(e) => setCustomAllianceId(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
            <button
              onClick={() => customAllianceId && loadAllianceData(customAllianceId)}
              disabled={!customAllianceId}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Load
            </button>
          </div>

          {data.alliance && (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white">{data.alliance.name}</h3>
                <p className="text-gray-300">[{data.alliance.acronym}]</p>
                <p className={`font-medium ${getColorClass(data.alliance.color)}`}>
                  {data.alliance.color.charAt(0).toUpperCase() + data.alliance.color.slice(1)} Team
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Score</p>
                  <p className="text-white font-bold">{formatNumber(data.alliance.score)}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Members</p>
                  <p className="text-white font-bold">{data.alliance.nations?.length || 0}</p>
                </div>
                <div className="bg-gray-700 p-3 rounded">
                  <p className="text-gray-400 text-sm">Founded</p>
                  <p className="text-white font-bold">{formatDate(data.alliance.date)}</p>
                </div>
              </div>

              {data.alliance.nations && data.alliance.nations.length > 0 && (
                <div>
                  <h4 className="text-white font-bold mb-2">Top Members</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {data.alliance.nations
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 10)
                      .map((nation) => (
                        <div key={nation.id} className="bg-gray-700 p-3 rounded flex justify-between">
                          <div>
                            <p className="text-white font-medium">{nation.nation_name}</p>
                            <p className="text-gray-400 text-sm">Led by {nation.leader_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold">{formatNumber(nation.score)}</p>
                            <p className="text-gray-400 text-sm">score</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wars Tab */}
      {activeTab === 'wars' && !data.loading && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nation ID (optional)"
              value={customNationId}
              onChange={(e) => setCustomNationId(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            />
            <button
              onClick={() => loadWarsData(customNationId || undefined)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Load Wars
            </button>
          </div>

          {data.wars && (
            <div className="space-y-4">
              <p className="text-gray-400">Showing {data.wars.length} active wars</p>
              {data.wars.map((war) => (
                <div key={war.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-white font-bold">War #{war.id}</h4>
                    <span className="text-xs text-gray-400">{formatDate(war.date)}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-red-500/20 p-3 rounded">
                      <p className="text-red-400 font-medium mb-1">Attacker</p>
                      <p className="text-white">{war.attacker.nation_name}</p>
                      <p className="text-gray-300 text-sm">Led by {war.attacker.leader_name}</p>
                    </div>
                    <div className="bg-blue-500/20 p-3 rounded">
                      <p className="text-blue-400 font-medium mb-1">Defender</p>
                      <p className="text-white">{war.defender.nation_name}</p>
                      <p className="text-gray-300 text-sm">Led by {war.defender.leader_name}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <p className="text-gray-400">Ground</p>
                      <p className="text-white">{war.ground_control}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400">Air</p>
                      <p className="text-white">{war.air_superiority}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-400">Naval</p>
                      <p className="text-white">{war.naval_blockade}</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <p className="text-gray-400 text-sm">Reason: <span className="text-gray-300">{war.reason}</span></p>
                    <p className="text-gray-400 text-sm">Type: <span className="text-gray-300">{war.war_type}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
