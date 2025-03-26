import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, CheckCircle2, Circle, Trash2, Users, Calendar } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, TimeScale } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { format, addDays, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProyectoPage from './pages/ProyectoPage';
import ItemsPage from './pages/ItemsPage';
import MarketingPage from './pages/MarketingPage';
import EvolucionPage from './pages/EvolucionPage';
import CostosPage from './pages/CostosPage';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  TimeScale
);

type TaskStatus = 'pendiente' | 'en_progreso' | 'completada';

interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  status: TaskStatus;
  createdAt: Date;
  startDate: Date;
  endDate: Date;
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
  });

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Date.now().toString(),
      title: newTask.title,
      description: newTask.description,
      assignedTo: newTask.assignedTo,
      status: 'pendiente',
      createdAt: new Date(),
      startDate: new Date(newTask.startDate),
      endDate: new Date(newTask.endDate),
    };

    setTasks([...tasks, task]);
    setNewTask({
      title: '',
      description: '',
      assignedTo: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(addDays(new Date(), 7), 'yyyy-MM-dd'),
    });
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, status } : task
    ));
  };

  const deleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_progreso': return 'bg-blue-100 text-blue-800';
      case 'completada': return 'bg-green-100 text-green-800';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pendiente': return 'Pendiente';
      case 'en_progreso': return 'En Progreso';
      case 'completada': return 'Completada';
    }
  };

  const getBarColor = (status: TaskStatus) => {
    switch (status) {
      case 'pendiente': return 'rgba(234, 179, 8, 0.8)';
      case 'en_progreso': return 'rgba(59, 130, 246, 0.8)';
      case 'completada': return 'rgba(34, 197, 94, 0.8)';
    }
  };

  const ganttData = {
    labels: tasks.map(task => task.title),
    datasets: [
      {
        label: 'Duración de la tarea',
        data: tasks.map(task => ({
          x: task.startDate,
          y: task.title,
          duration: differenceInDays(new Date(task.endDate), new Date(task.startDate))
        })),
        backgroundColor: tasks.map(task => getBarColor(task.status)),
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const ganttOptions = {
    indexAxis: 'y' as const,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day',
          displayFormats: {
            day: 'dd/MM/yyyy'
          }
        },
        title: {
          display: true,
          text: 'Fecha'
        }
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Tareas'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const task = tasks[context.dataIndex];
            return [
              `Inicio: ${format(task.startDate, 'dd/MM/yyyy')}`,
              `Fin: ${format(task.endDate, 'dd/MM/yyyy')}`,
              `Estado: ${getStatusText(task.status)}`,
              `Asignado a: ${task.assignedTo || 'Sin asignar'}`
            ];
          }
        }
      }
    },
    maintainAspectRatio: false,
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<ProyectoPage />} />
          <Route path="/proyecto" element={<ProyectoPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/marketing" element={<MarketingPage />} />
          <Route path="/evolucion" element={<EvolucionPage />} />
          <Route path="/costos" element={<CostosPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;