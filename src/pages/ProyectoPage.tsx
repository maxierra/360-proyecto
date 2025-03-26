import { useState, useEffect } from 'react';
import { ClipboardList, Plus, CheckCircle2, Circle, Trash2, Users, Calendar } from 'lucide-react';
import { format, addDays, differenceInDays, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

type Project = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string;
  due_date: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  assigned_to: string | null;
};

const ProyectoPage = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | TaskStatus>('all');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    priority: 'medium',
    status: 'pending' as TaskStatus,
    assigned_to: null
  });
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    status: 'pending' as TaskStatus
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const fixedUsers = [
    { id: 'maxi', name: 'Maxi' },
    { id: 'tomas', name: 'Tomas' },
    { id: 'leandro', name: 'Leandro' }
  ];

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim() || !selectedProject) {
      alert('Por favor, ingresa un título y selecciona un proyecto.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          project_id: selectedProject,
          title: newTask.title,
          description: newTask.description,
          due_date: newTask.due_date,
          status: newTask.status,
          priority: newTask.priority,
          assigned_to: newTask.assigned_to || null
        }])
        .select();

      if (error) {
        console.error('Error detallado:', error);
        alert(`Error al crear la tarea: ${error.message}`);
        return;
      }

      console.log('Tarea creada exitosamente:', data);
      await fetchTasks();
      setNewTask({
        title: '',
        description: '',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        priority: 'medium',
        status: 'pending' as TaskStatus,
        assigned_to: null
      });
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al crear la tarea. Por favor, intenta de nuevo.');
    }
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name.trim()) {
      alert('Por favor, ingresa un nombre para el proyecto.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: newProject.name,
          description: newProject.description,
          start_date: newProject.start_date,
          end_date: newProject.end_date,
          status: newProject.status
        }])
        .select();

      if (error) {
        console.error('Error detallado:', error);
        alert(`Error al crear el proyecto: ${error.message}`);
        return;
      }

      console.log('Proyecto creado exitosamente:', data);
      await fetchProjects();
      setNewProject({
        name: '',
        description: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
        status: 'pending' as TaskStatus
      });
      setShowProjectForm(false);
      setSelectedProject(data[0].id);
    } catch (error) {
      console.error('Error inesperado:', error);
      alert('Error inesperado al crear el proyecto. Por favor, intenta de nuevo.');
    }
  };

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Error al actualizar el estado de la tarea.');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      await fetchTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Error al eliminar la tarea.');
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
    }
  };

  const getPriorityText = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Resumen de Tareas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-100 rounded-lg p-4">
            <h3 className="text-red-800 font-medium mb-2">Pendientes</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-red-800">
                {tasks.filter(task => task.status === 'pending').length}
              </span>
              <span className="text-red-800">
                {tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'pending').length / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="bg-yellow-100 rounded-lg p-4">
            <h3 className="text-yellow-800 font-medium mb-2">En Progreso</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-yellow-800">
                {tasks.filter(task => task.status === 'in_progress').length}
              </span>
              <span className="text-yellow-800">
                {tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'in_progress').length / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="bg-green-100 rounded-lg p-4">
            <h3 className="text-green-800 font-medium mb-2">Completadas</h3>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-green-800">
                {tasks.filter(task => task.status === 'completed').length}
              </span>
              <span className="text-green-800">
                {tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'completed').length / tasks.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Seleccionar Proyecto</h2>
          <button
            onClick={() => setShowProjectForm(!showProjectForm)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {showProjectForm ? 'Cancelar' : 'Nuevo Proyecto'}
          </button>
        </div>

        {showProjectForm ? (
          <form onSubmit={addProject} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nombre</label>
                <input
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Ingrese el nombre del proyecto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                <textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de inicio</label>
                <input
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fecha de fin</label>
                <input
                  type="date"
                  value={newProject.end_date}
                  onChange={(e) => setNewProject({ ...newProject, end_date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Crear Proyecto
            </button>
          </form>
        ) : (
          <select
            value={selectedProject || ''}
            onChange={(e) => setSelectedProject(e.target.value || null)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Seleccione un proyecto</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Nueva Tarea</h2>
        <form onSubmit={addTask} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Título</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Ingrese el título de la tarea"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fecha límite</label>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Prioridad</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'low' | 'medium' | 'high' })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Asignar a usuario</label>
              <select
                value={newTask.assigned_to || ''}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value || null })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Seleccione un usuario</option>
                {fixedUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Agregar Tarea
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold mb-4">Tareas</h2>
        <div className="flex items-center mb-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | TaskStatus)}
            className="block w-48 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completadas</option>
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tasks
            .filter(task => selectedStatus === 'all' || task.status === selectedStatus)
            .map((task) => (
              <div
                key={task.id}
                className={`rounded-lg p-4 border border-gray-200 ${getStatusColor(task.status)}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-700">{task.title}</span>
                  <select
                    value={task.status}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                    className="mt-1 block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Fecha límite: {format(parseISO(task.due_date), 'dd/MM/yyyy')}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">
                      Prioridad: {getPriorityText(task.priority)}
                    </span>
                    <span className="text-sm text-gray-600">
                      Asignado a: {fixedUsers.find(u => u.id === task.assigned_to)?.name || 'Ninguno'}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ProyectoPage;