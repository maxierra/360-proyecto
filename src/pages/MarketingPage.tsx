import { useState, useEffect } from 'react';
import { Calendar, DollarSign, Users, BarChart2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type CampaignSource = 'facebook' | 'instagram' | 'mercadolibre' | 'gratuita';
type LeadStatus = 'contacto_inicial' | 'info_enviada' | 'contacto_personal' | 'registrado' | 'suscrito';

interface Campaign {
  id: string;
  name: string;
  source: CampaignSource;
  start_date: string;
  end_date: string;
  cost: number;
  contacto_inicial: number;
  info_enviada: number;
  contacto_personal: number;
  registrado: number;
  suscrito: number;
  created_at: string;
  updated_at: string;
}

interface Lead {
  id: string;
  campaign_id: string;
  name: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

const MarketingPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [newLead, setNewLead] = useState({
    name: '',
    status: 'contacto_inicial' as LeadStatus
  });
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    source: 'facebook' as CampaignSource,
    start_date: '',
    end_date: '',
    cost: 0,
    contacto_inicial: 0,
    info_enviada: 0,
    contacto_personal: 0,
    registrado: 0,
    suscrito: 0
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchLeads = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  };

  const addLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign || !newLead.name) return;

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          campaign_id: selectedCampaign.id,
          name: newLead.name,
          status: newLead.status
        });

      if (error) throw error;
      await fetchLeads(selectedCampaign.id);
      setNewLead({ name: '', status: 'contacto_inicial' });
    } catch (error) {
      console.error('Error adding lead:', error);
      alert('Error al agregar el lead');
    }
  };

  const updateLeadStatus = async (campaignId: string, leadId: string, status: LeadStatus) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', leadId);

      if (error) throw error;
      await fetchLeads(campaignId);
    } catch (error) {
      console.error('Error updating lead status:', error);
      alert('Error al actualizar el estado del lead');
    }
  };

  const addCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampaign.name || !newCampaign.start_date || !newCampaign.end_date) return;

    try {
      const { error } = await supabase
        .from('campaigns')
        .insert({
          name: newCampaign.name,
          source: newCampaign.source,
          start_date: newCampaign.start_date,
          end_date: newCampaign.end_date,
          cost: newCampaign.cost,
          contacto_inicial: newCampaign.contacto_inicial,
          info_enviada: newCampaign.info_enviada,
          contacto_personal: newCampaign.contacto_personal,
          registrado: newCampaign.registrado,
          suscrito: newCampaign.suscrito
        });

      if (error) throw error;
      await fetchCampaigns();
      setNewCampaign({
        name: '',
        source: 'facebook',
        start_date: '',
        end_date: '',
        cost: 0,
        contacto_inicial: 0,
        info_enviada: 0,
        contacto_personal: 0,
        registrado: 0,
        suscrito: 0
      });
    } catch (error) {
      console.error('Error adding campaign:', error);
      alert('Error al agregar la campaña');
    }
  };

  const updateCampaignMetrics = async (campaignId: string, stage: keyof Campaign, value: number) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ [stage]: parseInt(value.toString()) })
        .eq('id', campaignId);

      if (error) throw error;
      await fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign metrics:', error);
      alert('Error al actualizar las métricas de la campaña');
    }
  };

  const calculateMetrics = (campaign: Campaign) => {
    const revenue = campaign.suscrito * 20000; // Precio de suscripción
    const profit = revenue - campaign.cost;
    const roi = campaign.cost > 0 ? (profit / campaign.cost) * 100 : 0;
    return { revenue, profit, roi };
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'contacto_inicial': return 'bg-blue-100 text-blue-800';
      case 'info_enviada': return 'bg-yellow-100 text-yellow-800';
      case 'contacto_personal': return 'bg-purple-100 text-purple-800';
      case 'registrado': return 'bg-green-100 text-green-800';
      case 'suscrito': return 'bg-indigo-100 text-indigo-800';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {campaigns.map(campaign => (
        <div key={campaign.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">{campaign.name}</h2>
            <span className="text-sm text-gray-500">{campaign.source}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Fecha:</span>
                <span className="text-sm">
                  {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Costo:</span>
                <span className="text-sm">${campaign.cost.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Leads:</span>
                <span className="text-sm">{campaign.suscrito}</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {(() => {
                const { revenue, profit, roi } = calculateMetrics(campaign);
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ingresos:</span>
                      <span className="text-sm text-green-600">${revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Ganancia:</span>
                      <span className="text-sm text-green-600">${profit.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ROI:</span>
                      <span className="text-sm text-green-600">{roi.toFixed(2)}%</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Métricas de Conversión</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries({
                contacto_inicial: campaign.contacto_inicial,
                info_enviada: campaign.info_enviada,
                contacto_personal: campaign.contacto_personal,
                registrado: campaign.registrado,
                suscrito: campaign.suscrito
              }).map(([stage, count]) => (
                <div key={stage}>
                  <label className={`block text-sm font-medium mb-1 ${getStatusColor(stage as LeadStatus)}`}>
                    {stage.replace('_', ' ')}
                  </label>
                  <input
                    type="number"
                    value={count}
                    onChange={(e) => updateCampaignMetrics(campaign.id, stage as keyof Campaign, parseInt(e.target.value) || 0)}
                    className="w-full text-right rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    min="0"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Nueva Campaña</h2>
        <form onSubmit={addCampaign} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre de la Campaña</label>
              <input
                type="text"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Nombre de la campaña"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fuente</label>
              <select
                value={newCampaign.source}
                onChange={(e) => setNewCampaign({ ...newCampaign, source: e.target.value as CampaignSource })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="mercadolibre">MercadoLibre</option>
                <option value="gratuita">Gratuita</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Inicio</label>
              <input
                type="date"
                value={newCampaign.start_date}
                onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha de Fin</label>
              <input
                type="date"
                value={newCampaign.end_date}
                onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Costo de la Campaña</label>
              <input
                type="number"
                value={newCampaign.cost}
                onChange={(e) => setNewCampaign({ ...newCampaign, cost: Number(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Costo en pesos"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Agregar Campaña
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Campañas Activas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(campaign => (
            <div key={campaign.id} className="border rounded-lg p-4 relative">
              <button
                onClick={() => setSelectedCampaign(campaign)}
                className="absolute top-2 right-2 text-sm text-indigo-600 hover:text-indigo-800"
              >
                Gestionar Leads
              </button>
              <h3 className="font-semibold text-lg mb-2">{campaign.name}</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Costo: ${campaign.cost.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Leads: {campaign.suscrito}</span>
                </div>
                <div className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  <span>ROI: {calculateMetrics(campaign).roi.toFixed(2)}%</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Ingresos: ${calculateMetrics(campaign).revenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  <span>Ganancia: ${calculateMetrics(campaign).profit.toLocaleString()}</span>
                </div>
              </div>
              <div className="mt-4">
                <h4 className="font-medium mb-2">Métricas de Conversión</h4>
                <div className="space-y-2">
                  {Object.entries({
                    contacto_inicial: campaign.contacto_inicial,
                    info_enviada: campaign.info_enviada,
                    contacto_personal: campaign.contacto_personal,
                    registrado: campaign.registrado,
                    suscrito: campaign.suscrito
                  }).map(([stage, count]) => (
                    <div key={stage} className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(stage as LeadStatus)}`}>
                        {stage.replace('_', ' ')}
                      </span>
                      <input
                        type="number"
                        value={count}
                        onChange={(e) => updateCampaignMetrics(campaign.id, stage as keyof Campaign, parseInt(e.target.value) || 0)}
                        className="w-20 text-right rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        min="0"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketingPage;