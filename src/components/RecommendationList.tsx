import React from 'react';
import { Edit2, Trash2, Calendar, User, Tag, AlertCircle, FileText, Palette } from 'lucide-react';
import { Recommendation, Client } from '../lib/supabase';
import { exportToPowerPoint, exportToCanva } from '../utils/exportUtils';

interface RecommendationListProps {
  recommendations: Recommendation[];
  clients: Client[];
  onEdit: (reco: Recommendation) => void;
  onDelete: (id: string) => void;
}

export const RecommendationList: React.FC<RecommendationListProps> = ({
  recommendations,
  clients,
  onEdit,
  onDelete
}) => {
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client ? client.name : 'Client non spécifié';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700';
      case 'Approved':
        return 'bg-blue-100 text-blue-700';
      case 'Implemented':
        return 'bg-green-100 text-green-700';
      case 'Archived':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      SEO: 'bg-emerald-100 text-emerald-700',
      'Social Media': 'bg-pink-100 text-pink-700',
      Content: 'bg-blue-100 text-blue-700',
      Design: 'bg-violet-100 text-violet-700',
      Development: 'bg-cyan-100 text-cyan-700',
      Strategy: 'bg-orange-100 text-orange-700'
    };
    return colors[category] || 'bg-slate-100 text-slate-700';
  };

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          Aucune recommandation trouvée
        </h3>
        <p className="text-slate-600">
          Commencez par créer une nouvelle recommandation pour votre client.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.map((reco) => (
        <div
          key={reco.id}
          className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-slate-900">{reco.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(reco.status)}`}>
                  {reco.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3">{getClientName(reco.client_id)}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(reco)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Modifier"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete(reco.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getCategoryColor(reco.category)}`}>
              {reco.category}
            </span>
            <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${getPriorityColor(reco.priority)}`}>
              {reco.priority} Priority
            </span>
          </div>

          {reco.context && (
            <div className="mb-3 p-3 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-700">
                <span className="font-medium">Contexte:</span> {reco.context}
              </p>
            </div>
          )}

          <p className="text-slate-700 mb-4 leading-relaxed">{reco.description}</p>

          {reco.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <Tag className="w-4 h-4 text-slate-400" />
              {reco.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(reco.created_at).toLocaleDateString('fr-FR')}
              </div>
              {reco.updated_at !== reco.created_at && (
                <div className="flex items-center gap-1">
                  <span>Mis à jour:</span>
                  {new Date(reco.updated_at).toLocaleDateString('fr-FR')}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportToPowerPoint(reco, getClientName(reco.client_id))}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition"
                title="Exporter vers PowerPoint"
              >
                <FileText className="w-4 h-4" />
                PowerPoint
              </button>
              <button
                onClick={() => exportToCanva(reco, getClientName(reco.client_id))}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition"
                title="Exporter vers Canva"
              >
                <Palette className="w-4 h-4" />
                Canva
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
