import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface ClientData {
  id: string;
  month: string;
  month_text: string;
  active_clients: number;
  trial_clients: number;
  paid_clients: number;
  expenses: number;
  income: number;
  net_income: number;
  profit_per_partner: number;
}

const EvolucionPage = () => {
  const [clientData, setClientData] = useState<ClientData[]>([]);
  const [newClientData, setNewClientData] = useState<Partial<ClientData>>({
    month: format(new Date(), 'yyyy-MM-dd'),
    month_text: format(new Date(), 'MMMM', { locale: es }),
    active_clients: 0,
    trial_clients: 0,
    paid_clients: 0,
    expenses: 0
  });
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ rowId: string; fieldName: keyof ClientData } | null>(null);

  const handleFieldChange = async (field: keyof ClientData, value: string | number) => {
    if (!editingRow) return;

    try {
      const newValue = field === 'month_text' ? value : parseFloat(value as string);
      
      // Update in Supabase
      await supabase
        .from('client_evolution')
        .update({ [field]: newValue })
        .eq('id', editingRow);

      // Update local state
      setClientData(prev => 
        prev.map(item => 
          item.id === editingRow ? { ...item, [field]: newValue } : item
        )
      );

      // If it's paid_clients, recalculate income, net_income and profit
      if (field === 'paid_clients') {
        const currentRow = clientData.find(item => item.id === editingRow);
        if (currentRow) {
          const income = Math.round(newValue * 20000);
          const netIncome = Math.round(income - (currentRow.expenses || 0));
          const profitPerPartner = Math.round(netIncome / 3);
          
          await supabase
            .from('client_evolution')
            .update({
              income: income,
              net_income: netIncome,
              profit_per_partner: profitPerPartner
            })
            .eq('id', editingRow);

          setClientData(prev => 
            prev.map(item => 
              item.id === editingRow ? { 
                ...item, 
                income: income,
                net_income: netIncome,
                profit_per_partner: profitPerPartner
              } : item
            )
          );
        }
      }

      // If it's expenses, recalculate net_income and profit
      if (field === 'expenses') {
        const currentRow = clientData.find(item => item.id === editingRow);
        if (currentRow) {
          const netIncome = Math.round((currentRow.income || 0) - newValue);
          const profitPerPartner = Math.round(netIncome / 3);
          
          await supabase
            .from('client_evolution')
            .update({
              net_income: netIncome,
              profit_per_partner: profitPerPartner
            })
            .eq('id', editingRow);

          setClientData(prev => 
            prev.map(item => 
              item.id === editingRow ? { 
                ...item, 
                net_income: netIncome,
                profit_per_partner: profitPerPartner
              } : item
            )
          );
        }
      }
    } catch (error: any) {
      console.error('Error updating field:', error);
      if (error.message?.includes('invalid input syntax for type integer')) {
        alert('Error: Los valores numéricos deben ser enteros');
      } else {
        alert('Error al actualizar el campo');
      }
    }
  };

  const addClientData = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Check if the month already exists using month_text
      const { data: existingData, error: fetchError } = await supabase
        .from('client_evolution')
        .select('id')
        .eq('month_text', newClientData.month_text)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      if (existingData) {
        alert('Ya existe un registro para este mes');
        return;
      }

      // Calculate values
      const income = Math.round(newClientData.paid_clients * 20000);
      const netIncome = Math.round(income - (newClientData.expenses || 0));
      const profitPerPartner = Math.round(netIncome / 3);

      // Prepare data with rounded values
      const dataToInsert = {
        month: format(new Date(), 'yyyy-MM-dd'),
        month_text: newClientData.month_text,
        active_clients: Math.round(newClientData.active_clients),
        trial_clients: Math.round(newClientData.trial_clients),
        paid_clients: Math.round(newClientData.paid_clients),
        expenses: Math.round(newClientData.expenses),
        income: income,
        net_income: netIncome,
        profit_per_partner: profitPerPartner
      };

      const { error } = await supabase
        .from('client_evolution')
        .insert(dataToInsert);

      if (error) throw error;

      // Reset form
      setNewClientData({
        month: format(new Date(), 'yyyy-MM-dd'),
        month_text: format(new Date(), 'MMMM', { locale: es }),
        active_clients: 0,
        trial_clients: 0,
        paid_clients: 0,
        expenses: 0
      });

      // Refresh data
      await fetchClientData();
    } catch (error: any) {
      console.error('Error adding client data:', error);
      if (error.message?.includes('duplicate key value violates unique constraint')) {
        alert('Ya existe un registro para este mes');
      } else if (error.message?.includes('invalid input syntax for type integer')) {
        alert('Error: Los valores numéricos deben ser enteros');
      } else {
        alert('Error al agregar los datos del cliente');
      }
    }
  };

  const fetchClientData = async () => {
    try {
      const { data, error } = await supabase
        .from('client_evolution')
        .select('*')
        .order('month', { ascending: true });

      if (error) throw error;

      // Calculate values for each row
      const formattedData = data?.map(item => {
        const income = Math.round(item.paid_clients * 20000);
        const netIncome = Math.round(income - (item.expenses || 0));
        const profitPerPartner = Math.round(netIncome / 3);

        return {
          ...item,
          income: income,
          net_income: netIncome,
          profit_per_partner: profitPerPartner
        };
      }) || [];

      setClientData(formattedData);
    } catch (error) {
      console.error('Error fetching client data:', error);
      alert('Error al cargar los datos');
    }
  };

  useEffect(() => {
    fetchClientData();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Evolución de Clientes</h2>
        
        <form onSubmit={addClientData} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mes</label>
              <select
                value={newClientData.month_text}
                onChange={(e) => {
                  setNewClientData(prev => ({
                    ...prev,
                    month_text: e.target.value
                  }));
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="Enero">Enero</option>
                <option value="Febrero">Febrero</option>
                <option value="Marzo">Marzo</option>
                <option value="Abril">Abril</option>
                <option value="Mayo">Mayo</option>
                <option value="Junio">Junio</option>
                <option value="Julio">Julio</option>
                <option value="Agosto">Agosto</option>
                <option value="Septiembre">Septiembre</option>
                <option value="Octubre">Octubre</option>
                <option value="Noviembre">Noviembre</option>
                <option value="Diciembre">Diciembre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Clientes Activos</label>
              <input
                type="number"
                value={newClientData.active_clients}
                onChange={(e) => setNewClientData(prev => ({
                  ...prev,
                  active_clients: parseInt(e.target.value) || 0
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Clientes Trial</label>
              <input
                type="number"
                value={newClientData.trial_clients}
                onChange={(e) => setNewClientData(prev => ({
                  ...prev,
                  trial_clients: parseInt(e.target.value) || 0
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Clientes Pagos</label>
              <input
                type="number"
                value={newClientData.paid_clients}
                onChange={(e) => setNewClientData(prev => ({
                  ...prev,
                  paid_clients: parseInt(e.target.value) || 0
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gastos</label>
              <input
                type="number"
                value={newClientData.expenses}
                onChange={(e) => setNewClientData(prev => ({
                  ...prev,
                  expenses: parseFloat(e.target.value) || 0
                }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Agregar Datos
          </button>
        </form>

        {clientData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Historial de Datos</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mes
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clientes Activos
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clientes Trial
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clientes Pagos
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gastos
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingresos
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ingreso Neto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ganancia por Socio
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientData.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRow === item.id && editingField?.fieldName === 'month_text' ? (
                          <select
                            value={item.month_text}
                            onChange={(e) => handleFieldChange('month_text', e.target.value)}
                            onBlur={() => setEditingRow(null)}
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="Enero">Enero</option>
                            <option value="Febrero">Febrero</option>
                            <option value="Marzo">Marzo</option>
                            <option value="Abril">Abril</option>
                            <option value="Mayo">Mayo</option>
                            <option value="Junio">Junio</option>
                            <option value="Julio">Julio</option>
                            <option value="Agosto">Agosto</option>
                            <option value="Septiembre">Septiembre</option>
                            <option value="Octubre">Octubre</option>
                            <option value="Noviembre">Noviembre</option>
                            <option value="Diciembre">Diciembre</option>
                          </select>
                        ) : (
                          <div className="flex items-center justify-between">
                            {item.month_text}
                            <button
                              onClick={() => {
                                setEditingRow(item.id);
                                setEditingField({ rowId: item.id, fieldName: 'month_text' });
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRow === item.id && editingField?.fieldName === 'active_clients' ? (
                          <input
                            type="number"
                            value={item.active_clients}
                            onChange={(e) => handleFieldChange('active_clients', e.target.value)}
                            onBlur={() => setEditingRow(null)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            {item.active_clients}
                            <button
                              onClick={() => {
                                setEditingRow(item.id);
                                setEditingField({ rowId: item.id, fieldName: 'active_clients' });
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRow === item.id && editingField?.fieldName === 'trial_clients' ? (
                          <input
                            type="number"
                            value={item.trial_clients}
                            onChange={(e) => handleFieldChange('trial_clients', e.target.value)}
                            onBlur={() => setEditingRow(null)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            {item.trial_clients}
                            <button
                              onClick={() => {
                                setEditingRow(item.id);
                                setEditingField({ rowId: item.id, fieldName: 'trial_clients' });
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRow === item.id && editingField?.fieldName === 'paid_clients' ? (
                          <input
                            type="number"
                            value={item.paid_clients}
                            onChange={(e) => handleFieldChange('paid_clients', e.target.value)}
                            onBlur={() => setEditingRow(null)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            {item.paid_clients}
                            <button
                              onClick={() => {
                                setEditingRow(item.id);
                                setEditingField({ rowId: item.id, fieldName: 'paid_clients' });
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {editingRow === item.id && editingField?.fieldName === 'expenses' ? (
                          <input
                            type="number"
                            value={item.expenses}
                            onChange={(e) => handleFieldChange('expenses', e.target.value)}
                            onBlur={() => setEditingRow(null)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        ) : (
                          <div className="flex items-center justify-between">
                            ${item.expenses?.toLocaleString() || '0'}
                            <button
                              onClick={() => {
                                setEditingRow(item.id);
                                setEditingField({ rowId: item.id, fieldName: 'expenses' });
                              }}
                              className="ml-2 text-indigo-600 hover:text-indigo-800"
                            >
                              ✎
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.income?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.net_income?.toLocaleString() || '0'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.profit_per_partner?.toLocaleString() || '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvolucionPage;