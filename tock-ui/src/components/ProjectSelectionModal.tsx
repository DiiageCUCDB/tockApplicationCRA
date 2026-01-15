import React, { useState, useEffect } from 'react';
import { X, Search, Star } from 'lucide-react';
import { ApiRoute } from '../types';

interface Project {
  name: string;
  description: string;
  lastUsed?: string;
  source?: string; // 'recent' | 'favorite' | api route name
  isFavorite?: boolean;
}

interface ProjectSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (project: Project) => void;
  projects: Project[];
  favorites: Project[];
  apiRoutes: ApiRoute[];
  onFetchFromApi: (routeId: number) => Promise<Project[]>;
  onToggleFavorite: (project: Project) => Promise<void>;
}

type FilterType = 'all' | 'favorites' | number; // number is API route ID

export const ProjectSelectionModal: React.FC<ProjectSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  projects,
  favorites,
  apiRoutes,
  onFetchFromApi,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [apiProjects, setApiProjects] = useState<Map<number, Project[]>>(new Map());
  const [loadingApi, setLoadingApi] = useState<number | null>(null);

  useEffect(() => {
    updateFilteredProjects();
  }, [searchQuery, projects, favorites, selectedFilter, apiProjects]);

  const updateFilteredProjects = () => {
    let sourceProjects: Project[] = [];

    // Determine source based on filter
    if (selectedFilter === 'all') {
      sourceProjects = [...projects];
    } else if (selectedFilter === 'favorites') {
      sourceProjects = favorites;
    } else if (typeof selectedFilter === 'number') {
      sourceProjects = apiProjects.get(selectedFilter) || [];
    }

    // Apply search filter
    const query = searchQuery.toLowerCase();
    const filtered = sourceProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
    );
    
    setFilteredProjects(filtered);
  };

  const handleFilterChange = async (filter: FilterType) => {
    setSelectedFilter(filter);
    
    // If selecting an API route and not yet loaded, fetch projects
    if (typeof filter === 'number' && !apiProjects.has(filter)) {
      setLoadingApi(filter);
      try {
        const projects = await onFetchFromApi(filter);
        setApiProjects(prev => new Map(prev).set(filter, projects));
      } catch (error) {
        console.error('Failed to fetch from API:', error);
      } finally {
        setLoadingApi(null);
      }
    }
  };

  const handleSelect = (project: Project) => {
    onSelect(project);
    setSearchQuery('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 id="modal-title" className="text-2xl font-bold text-slate-800">Select a Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: Filter Menu */}
          <div className="w-64 border-r border-slate-200 p-4 overflow-y-auto bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase">Filter by Source</h3>
            <div className="space-y-1">
              <button
                onClick={() => handleFilterChange('all')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                All Projects
              </button>
              
              <button
                onClick={() => handleFilterChange('favorites')}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedFilter === 'favorites'
                    ? 'bg-slate-700 text-white'
                    : 'hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Star size={16} />
                Favorites
                {favorites.length > 0 && (
                  <span className="ml-auto text-xs bg-slate-300 text-slate-700 px-2 py-0.5 rounded-full">
                    {favorites.length}
                  </span>
                )}
              </button>

              {apiRoutes.length > 0 && (
                <>
                  <div className="h-px bg-slate-300 my-3"></div>
                  <h4 className="text-xs font-semibold text-slate-600 mb-2 px-4">API SOURCES</h4>
                  {apiRoutes.map((route) => (
                    <button
                      key={route.id}
                      onClick={() => handleFilterChange(route.id!)}
                      disabled={!route.enabled}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        selectedFilter === route.id
                          ? 'bg-slate-700 text-white'
                          : route.enabled
                          ? 'hover:bg-slate-200 text-slate-700'
                          : 'text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{route.name}</span>
                        {loadingApi === route.id && (
                          <span className="text-xs">...</span>
                        )}
                      </div>
                      {!route.enabled && (
                        <span className="text-xs text-slate-400">Disabled</span>
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Right: Project List */}
          <div className="flex-1 flex flex-col">
            {/* Search Bar */}
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by project name or description..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* Project List */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingApi === selectedFilter ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-lg">Loading projects...</p>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Project Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Description</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Favorite</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProjects.map((project, idx) => {
                        // Create a more robust unique key using name, description hash, and index
                        const keyBase = `${project.name}-${project.description}`;
                        const hash = keyBase.split('').reduce((acc, char) => {
                          return ((acc << 5) - acc) + char.charCodeAt(0);
                        }, 0);
                        const key = `${hash}-${idx}`;
                        
                        return (
                          <tr
                            key={key}
                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                          >
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">{project.name}</td>
                          <td className="px-6 py-4 text-sm text-slate-600">{project.description}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => onToggleFavorite(project)}
                              className="p-1 hover:bg-slate-100 rounded transition-colors"
                              title={project.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            >
                              <Star 
                                size={20} 
                                className={project.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-slate-400"}
                              />
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleSelect(project)}
                              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium"
                            >
                              Select
                            </button>
                          </td>
                        </tr>
                      );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500 text-lg">
                    {searchQuery ? 'No projects match your search' : 'No projects found'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
