import { ClipboardList, Package, Megaphone, TrendingUp, DollarSign } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/proyecto', icon: ClipboardList, text: 'Proyecto' },
    { path: '/items', icon: Package, text: 'Items del Proyecto' },
    { path: '/marketing', icon: Megaphone, text: 'Marketing' },
    { path: '/evolucion', icon: TrendingUp, text: 'Evolución de Proyecto' },
    { path: '/costos', icon: DollarSign, text: 'Costos de Mantenimiento' },
  ];

  return (
    <aside className="bg-indigo-800 text-white w-64 min-h-screen p-4">
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-900' : 'hover:bg-indigo-700'}`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.text}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;