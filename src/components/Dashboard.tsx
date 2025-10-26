import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, LogOut, FileText, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Recommendation, Client } from '../lib/supabase';
import { RecommendationForm } from './RecommendationForm';
import { RecommendationList } from './RecommendationList';
import { StatsCard } from './StatsCard';
import { ImportButton } from './ImportButton';

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [editingReco, setEditingReco] = useState<Recommendation | null>(null);

  const categories = ['SEO', 'Social Media', 'Content', 'Design', 'Development', 'Strategy'];
  const statuses = ['Draft', 'Approved', 'Implemented', 'Archived'];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRecommendations();
  }, [recommendations, searchTerm, filterCategory, filterStatus]);

  const loadData = async () => {
    try {
      const [recosResult, clientsResult] = await Promise.all([
        supabase
          .from('recommendations')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('*')
          .order('name')
      ]);

      if (recosResult.data) setRecommendations(recosResult.data);
      if (clientsResult.data) setClients(clientsResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecommendations = () => {
    let filtered = [...recommendations];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term) ||
          r.tags.some((tag) => tag.toLowerCase().includes(term))
      );
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter((r) => r.category === filterCategory);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    setFilteredRecommendations(filtered);
  };

  const handleCreateOrUpdate = async () => {
    await loadData();
    setShowForm(false);
    setEditingReco(null);
  };

  const handleEdit = (reco: Recommendation) => {
    setEditingReco(reco);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette recommandation ?')) {
      await supabase.from('recommendations').delete().eq('id', id);
      await loadData();
    }
  };

  const stats = {
    total: recommendations.length,
    draft: recommendations.filter((r) => r.status === 'Draft').length,
    approved: recommendations.filter((r) => r.status === 'Approved').length,
    implemented: recommendations.filter((r) => r.status === 'Implemented').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Recos Manager</h1>
                <p className="text-xs text-slate-500">Recommandations clients</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total"
            value={stats.total}
            icon={FileText}
            color="blue"
          />
          <StatsCard
            title="Brouillon"
            value={stats.draft}
            icon={FileText}
            color="slate"
          />
          <StatsCard
            title="Approuvées"
            value={stats.approved}
            icon={FileText}
            color="green"
          />
          <StatsCard
            title="Implémentées"
            value={stats.implemented}
            icon={TrendingUp}
            color="cyan"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher par titre, description ou tags..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">Toutes catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
              >
                <option value="all">Tous statuts</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ImportButton onImportComplete={loadData} />
              <button
                onClick={() => {
                  setEditingReco(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition"
              >
                <Plus className="w-5 h-5" />
                Nouvelle reco
              </button>
            </div>
          </div>
        </div>

        {showForm ? (
          <RecommendationForm
            clients={clients}
            onSuccess={handleCreateOrUpdate}
            onCancel={() => {
              setShowForm(false);
              setEditingReco(null);
            }}
            editingReco={editingReco}
            existingRecommendations={recommendations}
          />
        ) : (
          <RecommendationList
            recommendations={filteredRecommendations}
            clients={clients}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
};
