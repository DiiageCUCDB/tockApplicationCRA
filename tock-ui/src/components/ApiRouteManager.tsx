import React, { useState, useEffect } from 'react';
import { tockCommands } from '../api';
import { Plus, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';
import { ApiRoute } from '../types';

interface ApiRouteManagerProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export const ApiRouteManager: React.FC<ApiRouteManagerProps> = ({ showMessage }) => {
  const [routes, setRoutes] = useState<ApiRoute[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRoute, setNewRoute] = useState({ name: '', url: '' });
  const [editRoute, setEditRoute] = useState({ name: '', url: '', enabled: true });

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    const result = await tockCommands.getAllApiRoutes();
    if (result.success) {
      try {
        const parsedRoutes: ApiRoute[] = JSON.parse(result.output);
        setRoutes(parsedRoutes);
      } catch (e) {
        console.error('Failed to parse routes:', e);
      }
    }
  };

  const handleAdd = async () => {
    if (!newRoute.name || !newRoute.url) {
      showMessage('error', 'Name and URL are required');
      return;
    }

    const result = await tockCommands.addApiRoute(newRoute.name, newRoute.url);
    if (result.success) {
      showMessage('success', 'API route added successfully');
      setNewRoute({ name: '', url: '' });
      setIsAdding(false);
      loadRoutes();
    } else {
      showMessage('error', result.error || 'Failed to add route');
    }
  };

  const handleUpdate = async (id: number) => {
    const result = await tockCommands.updateApiRoute(
      id,
      editRoute.name,
      editRoute.url,
      editRoute.enabled
    );
    if (result.success) {
      showMessage('success', 'API route updated successfully');
      setEditingId(null);
      loadRoutes();
    } else {
      showMessage('error', result.error || 'Failed to update route');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this API route?')) return;

    const result = await tockCommands.deleteApiRoute(id);
    if (result.success) {
      showMessage('success', 'API route deleted successfully');
      loadRoutes();
    } else {
      showMessage('error', result.error || 'Failed to delete route');
    }
  };

  const handleToggleEnabled = async (route: ApiRoute) => {
    const result = await tockCommands.updateApiRoute(
      route.id!,
      route.name,
      route.url,
      !route.enabled
    );
    if (result.success) {
      loadRoutes();
    }
  };

  const startEdit = (route: ApiRoute) => {
    setEditingId(route.id!);
    setEditRoute({ name: route.name, url: route.url, enabled: route.enabled });
  };

  return (
    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-800">API Project Sources</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? 'Cancel' : 'Add Route'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex gap-2">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> API routes should return JSON in one of these formats:
            </p>
            <pre className="text-xs bg-blue-100 p-2 rounded mt-2 overflow-x-auto">
              {`Format 1 (Array):
[
  {"name": "project1", "description": "Description 1"},
  {"name": "project2", "description": "Description 2"}
]

Format 2 (Object with results):
{
  "results": [
    {"name": "project1", "description": "Description 1"},
    {"name": "project2", "description": "Description 2"}
  ]
}`}
            </pre>
            <p className="text-xs text-blue-700 mt-2">
              If an API route is not accessible, it will show an error but won't block the application.
            </p>
          </div>
        </div>
      </div>

      {/* Add New Route Form */}
      {isAdding && (
        <div className="bg-white p-4 rounded-lg border border-slate-300 mb-4">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">New API Route</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Route Name *
              </label>
              <input
                type="text"
                value={newRoute.name}
                onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="e.g., Company API"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                API URL *
              </label>
              <input
                type="url"
                value={newRoute.url}
                onChange={(e) => setNewRoute({ ...newRoute, url: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500"
                placeholder="https://api.example.com/projects"
              />
            </div>
            <button
              onClick={handleAdd}
              className="w-full px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Add Route
            </button>
          </div>
        </div>
      )}

      {/* Routes List */}
      <div className="space-y-2">
        {routes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No API routes configured. Add one to get started.
          </div>
        ) : (
          routes.map((route) => (
            <div
              key={route.id}
              className="bg-white p-4 rounded-lg border border-slate-200 flex items-center gap-4"
            >
              {editingId === route.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={editRoute.name}
                    onChange={(e) => setEditRoute({ ...editRoute, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <input
                    type="url"
                    value={editRoute.url}
                    onChange={(e) => setEditRoute({ ...editRoute, url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(route.id!)}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
                    >
                      <Check size={14} />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800">{route.name}</h4>
                    <p className="text-sm text-slate-600 truncate">{route.url}</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded text-xs ${
                        route.enabled
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {route.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleEnabled(route)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        route.enabled
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {route.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => startEdit(route)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(route.id!)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
