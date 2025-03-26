import React, { useState, useEffect } from 'react';
import { format, parseISO, startOfMonth, endOfMonth, set } from 'date-fns';
import { es } from 'date-fns/locale';
import { Line } from 'react-chartjs-2';
import { supabase } from '../lib/supabase';

interface CostEntry {
  id: string;
  description: string;
  amount: number;
  frequency: 'monthly' | 'annual';
  start_date: string;
}

const CostosPage = () => {
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [newCost, setNewCost] = useState<Omit<CostEntry, 'id'>>({ 
    description: '',
    amount: 0,
    frequency: 'monthly',
    start_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchCosts();
  }, []);

  const fetchCosts = async () => {
    try {
      const { data, error } = await supabase
        .from('costs')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setCosts(data as CostEntry[]);
    } catch (error) {
      console.error('Error fetching costs:', error);
    }
  };

  const handleAmountChange = (value: string) => {
    const amount = value ? parseFloat(value) : 0;
    setNewCost(prev => ({ ...prev, amount }));
  };

  const addCost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCost.description.trim() || newCost.amount <= 0) return;

    try {
      // Convert month input to full date (first day of the month)
      const fullDate = format(new Date(newCost.start_date), 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('costs')
        .insert([{
          id: Date.now().toString(),
          description: newCost.description,
          amount: newCost.amount,
          frequency: newCost.frequency,
          start_date: fullDate
        }]);

      if (error) throw error;
      
      // Refresh the costs list
      await fetchCosts();
      
      // Reset the form
      setNewCost({
        description: '',
        amount: 0,
        frequency: 'monthly',
        start_date: format(new Date(), 'yyyy-MM-dd')
      });
    } catch (error) {
      console.error('Error adding cost:', error);
    }
  };

  const calculateMonthlyCosts = () => {
    const monthlyTotals: { [key: string]: number } = {};

    costs.forEach(cost => {
      const amount = cost.frequency === 'monthly' ? cost.amount : cost.amount / 12;
      const startDate = parseISO(cost.start_date);
      const monthKey = format(startDate, 'yyyy-MM');
      
      if (monthKey) {
        monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + amount;
      }
    });

    return monthlyTotals;
  };

  const monthlyTotals = calculateMonthlyCosts();
  const sortedMonths = Object.keys(monthlyTotals).sort();

  // Ensure selectedMonth is always one of the available months
  const availableMonths = sortedMonths;
  const validSelectedMonth = availableMonths.includes(selectedMonth) ? selectedMonth : availableMonths[0] || format(new Date(), 'yyyy-MM');

  const chartData = {
    labels: sortedMonths.map(month => format(parseISO(month), 'MMMM yyyy', { locale: es })),
    datasets: [
      {
        label: 'Costos Mensuales',
        data: sortedMonths.map(month => monthlyTotals[month]),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Evolución de Costos Mensuales'
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Registro de Costos Fijos</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700">Filtrar por Mes</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="mb-6 h-64">
          <Line data={chartData} options={chartOptions} />
        </div>

        <form onSubmit={addCost} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Descripción</label>
            <input
              type="text"
              value={newCost.description}
              onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Descripción del costo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Monto</label>
            <input
              type="number"
              value={newCost.amount || ''}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Frecuencia</label>
            <select
              value={newCost.frequency}
              onChange={(e) => setNewCost({ ...newCost, frequency: e.target.value as 'monthly' | 'annual' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="monthly">Mensual</option>
              <option value="annual">Anual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fecha de inicio</label>
            <input
              type="date"
              value={newCost.start_date}
              onChange={(e) => setNewCost({ ...newCost, start_date: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="col-span-1 md:col-span-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Agregar Costo
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalles</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMonths.length > 0 ? (
                sortedMonths
                  .map((month) => (
                    <tr key={month}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {format(parseISO(month), 'MMMM yyyy', { locale: es })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${monthlyTotals[month].toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {costs
                          .filter(cost => {
                            const costDate = parseISO(cost.start_date);
                            const costYearMonth = format(costDate, 'yyyy-MM');
                            return costYearMonth === month;
                          })
                          .map(cost => (
                            <div key={cost.id} className="mb-1">
                              {cost.description}: ${cost.amount.toLocaleString()} 
                              ({cost.frequency === 'monthly' ? 'Mensual' : 'Anual'})
                            </div>
                          ))
                        }
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm text-gray-500 text-center">
                    No hay costos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CostosPage;