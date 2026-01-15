import React, { useState, useEffect } from 'react';
import { tockCommands } from '../api';
import { Send, CheckCircle, AlertCircle, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { ApiRoute, ReportSettings } from '../types';

interface ReportApiSenderProps {
  showMessage: (type: 'success' | 'error', text: string) => void;
}

export const ReportApiSender: React.FC<ReportApiSenderProps> = ({ showMessage }) => {
  const [routes, setRoutes] = useState<ApiRoute[]>([]);
  const [settings, setSettings] = useState<ReportSettings>({
    auto_send_enabled: false,
    selected_api_route_id: undefined,
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRoute, setNewRoute] = useState({ name: '', url: '' });
  const [editRoute, setEditRoute] = useState({ name: '', url: '', enabled: true });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Load Report API routes (separate from regular API routes)
    const routesResult = await tockCommands.getAllReportApiRoutes();
    if (routesResult.success) {
      try {
        const parsedRoutes: ApiRoute[] = JSON.parse(routesResult.output);
        setRoutes(parsedRoutes);
      } catch (e) {
        console.error('Failed to parse report API routes response:', e);
      }
    }
    
    // Load report settings
    const settingsResult = await tockCommands.getReportSettings();
    if (settingsResult.success) {
      try {
        const parsedSettings: ReportSettings = JSON.parse(settingsResult.output);
        setSettings(parsedSettings);
      } catch (e) {
        console.error('Failed to parse report settings response:', e);
      }
    }
    
    setLoading(false);
  };

  const handleAddRoute = async () => {
    if (!newRoute.name || !newRoute.url) {
      showMessage('error', 'Name and URL are required');
      return;
    }

    const result = await tockCommands.addReportApiRoute(newRoute.name, newRoute.url);
    if (result.success) {
      showMessage('success', 'Report API route added successfully');
      setNewRoute({ name: '', url: '' });
      setIsAdding(false);
      loadData();
    } else {
      showMessage('error', result.error || 'Failed to add route');
    }
  };

  const handleUpdateRoute = async (id: number) => {
    const result = await tockCommands.updateReportApiRoute(
      id,
      editRoute.name,
      editRoute.url,
      editRoute.enabled
    );
    if (result.success) {
      showMessage('success', 'Report API route updated successfully');
      setEditingId(null);
      loadData();
    } else {
      showMessage('error', result.error || 'Failed to update route');
    }
  };

  const handleDeleteRoute = async (id: number) => {
    if (!confirm('Are you sure you want to delete this report API route?')) return;

    const result = await tockCommands.deleteReportApiRoute(id);
    if (result.success) {
      showMessage('success', 'Report API route deleted successfully');
      loadData();
    } else {
      showMessage('error', result.error || 'Failed to delete route');
    }
  };

  const handleToggleEnabled = async (route: ApiRoute) => {
    const result = await tockCommands.updateReportApiRoute(
      route.id!,
      route.name,
      route.url,
      !route.enabled
    );
    if (result.success) {
      loadData();
    }
  };

  const startEdit = (route: ApiRoute) => {
    setEditingId(route.id!);
    setEditRoute({ name: route.name, url: route.url, enabled: route.enabled });
  };

  const handleAutoSendToggle = async (enabled: boolean) => {
    const result = await tockCommands.updateReportSettings(
      enabled,
      settings.selected_api_route_id
    );
    
    if (result.success) {
      setSettings({ ...settings, auto_send_enabled: enabled });
      showMessage('success', enabled ? 'Auto-send enabled' : 'Auto-send disabled');
    } else {
      showMessage('error', result.error || 'Failed to update settings');
    }
  };

  const handleApiRouteChange = async (routeId: number | undefined) => {
    const result = await tockCommands.updateReportSettings(
      settings.auto_send_enabled,
      routeId
    );
    
    if (result.success) {
      setSettings({ ...settings, selected_api_route_id: routeId });
      showMessage('success', 'API route updated');
    } else {
      showMessage('error', result.error || 'Failed to update settings');
    }
  };

  const handleSendReport = async () => {
    if (!settings.selected_api_route_id) {
      showMessage('error', 'Please select an API route first');
      return;
    }
    
    setSending(true);
    const result = await tockCommands.sendMonthlyReportToApi(settings.selected_api_route_id);
    setSending(false);
    
    if (result.success) {
      showMessage('success', result.output);
      // Reload settings to get updated last_sent_at
      loadData();
    } else {
      showMessage('error', result.error || 'Failed to send report');
    }
  };

  const enabledRoutes = routes.filter(r => r.enabled);
  const selectedRoute = routes.find(r => r.id === settings.selected_api_route_id);

  return (
    <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mt-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">Monthly Report API Sender</h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex gap-2">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>About Monthly Reports:</strong> This feature sends your current month's activity report 
              to a selected API endpoint. The report includes all tracked activities for the current month.
            </p>
            <p className="text-xs text-blue-700 mt-2">
              The API will receive a POST request with JSON containing: year, month, report (text), and generated_at (timestamp).
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-slate-500">Loading...</div>
      ) : (
        <div className="space-y-4">
          {/* API Route Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select API Route for Reports
            </label>
            {enabledRoutes.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                No enabled API routes available. Please add and enable an API route in the section below.
              </div>
            ) : (
              <select
                value={settings.selected_api_route_id || ''}
                onChange={(e) => handleApiRouteChange(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              >
                <option value="">-- Select an API route --</option>
                {enabledRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.name} ({route.url})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Auto-send checkbox */}
          <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-slate-200">
            <input
              type="checkbox"
              id="auto-send-checkbox"
              checked={settings.auto_send_enabled}
              onChange={(e) => handleAutoSendToggle(e.target.checked)}
              disabled={!settings.selected_api_route_id}
              className="w-5 h-5 text-slate-700 border-slate-300 rounded focus:ring-2 focus:ring-slate-500"
            />
            <label 
              htmlFor="auto-send-checkbox" 
              className={`text-sm font-medium ${!settings.selected_api_route_id ? 'text-slate-400' : 'text-slate-700 cursor-pointer'}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle size={18} className={settings.auto_send_enabled ? 'text-green-600' : 'text-slate-400'} />
                Enable automatic monthly report sending
              </div>
              <p className="text-xs text-slate-500 mt-1">
                When enabled, reports will be automatically sent to the selected API route monthly.
                {!settings.selected_api_route_id && ' (Select an API route first)'}
              </p>
            </label>
          </div>

          {/* Manual send button */}
          <div>
            <button
              onClick={handleSendReport}
              disabled={sending || !settings.selected_api_route_id}
              className="w-full px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {sending ? (
                'Sending...'
              ) : (
                <>
                  <Send size={20} />
                  Send Monthly Report Now
                </>
              )}
            </button>
            {selectedRoute && (
              <p className="text-xs text-slate-500 mt-2 text-center">
                Report will be sent to: {selectedRoute.name} ({selectedRoute.url})
              </p>
            )}
            {settings.last_sent_at && (
              <p className="text-xs text-slate-500 mt-1 text-center">
                Last sent: {new Date(settings.last_sent_at).toLocaleString()}
              </p>
            )}
          </div>

          {/* Report API Routes Management */}
          <div className="border-t border-slate-200 pt-4 mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-800">Manage Report API Routes</h3>
              <button
                onClick={() => setIsAdding(true)}
                className="px-3 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus size={16} />
                Add Route
              </button>
            </div>

            {/* Add New Route Form */}
            {isAdding && (
              <div className="bg-white border border-slate-300 rounded-lg p-4 mb-3">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">New Report API Route</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Route Name"
                    value={newRoute.name}
                    onChange={(e) => setNewRoute({ ...newRoute, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <input
                    type="url"
                    placeholder="API URL"
                    value={newRoute.url}
                    onChange={(e) => setNewRoute({ ...newRoute, url: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddRoute}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Check size={16} />
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setIsAdding(false);
                        setNewRoute({ name: '', url: '' });
                      }}
                      className="flex-1 px-3 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Routes List */}
            {routes.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No report API routes configured. Click "Add Route" to create one.
              </p>
            ) : (
              <div className="space-y-2">
                {routes.map((route) => (
                  <div
                    key={route.id}
                    className="bg-white border border-slate-200 rounded-lg p-3"
                  >
                    {editingId === route.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editRoute.name}
                          onChange={(e) => setEditRoute({ ...editRoute, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <input
                          type="url"
                          value={editRoute.url}
                          onChange={(e) => setEditRoute({ ...editRoute, url: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={editRoute.enabled}
                              onChange={(e) => setEditRoute({ ...editRoute, enabled: e.target.checked })}
                              className="w-4 h-4"
                            />
                            Enabled
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateRoute(route.id!)}
                            className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <Check size={14} />
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 px-3 py-1.5 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors text-sm flex items-center justify-center gap-1"
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-slate-800 text-sm">{route.name}</h4>
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium ${
                                route.enabled
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {route.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{route.url}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleEnabled(route)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title={route.enabled ? 'Disable' : 'Enable'}
                          >
                            <CheckCircle size={16} className={route.enabled ? 'text-green-600' : ''} />
                          </button>
                          <button
                            onClick={() => startEdit(route)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteRoute(route.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
