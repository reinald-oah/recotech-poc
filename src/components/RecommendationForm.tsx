import React, { useState, useEffect } from 'react';
import { Save, X, Plus, Sparkles } from 'lucide-react';
import { supabase, Recommendation, Client } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AIAssistant } from './AIAssistant';

interface RecommendationFormProps {
  clients: Client[];
  onSuccess: () => void;
  onCancel: () => void;
  editingReco: Recommendation | null;
  existingRecommendations: Recommendation[];
}

export const RecommendationForm: React.FC<RecommendationFormProps> = ({
  clients,
  onSuccess,
  onCancel,
  editingReco,
  existingRecommendations
}) => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState(editingReco?.client_id || '');
  const [newClientName, setNewClientName] = useState('');
  const [newClientIndustry, setNewClientIndustry] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [title, setTitle] = useState(editingReco?.title || '');
  const [category, setCategory] = useState(editingReco?.category || 'Strategy');
  const [description, setDescription] = useState(editingReco?.description || '');
  const [context, setContext] = useState(editingReco?.context || '');
  const [prompt, setPrompt] = useState(editingReco?.prompt || '');
  const [priority, setPriority] = useState(editingReco?.priority || 'Medium');
  const [status, setStatus] = useState(editingReco?.status || 'Draft');
  const [tags, setTags] = useState(editingReco?.tags.join(', ') || '');
  const [suggestions, setSuggestions] = useState<Recommendation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const categories = ['SEO', 'Social Media', 'Content', 'Design', 'Development', 'Strategy'];
  const priorities = ['High', 'Medium', 'Low'];
  const statuses = ['Draft', 'Approved', 'Implemented', 'Archived'];

  useEffect(() => {
    if (category && !editingReco) {
      findSimilarRecommendations();
    }
  }, [category, context]);

  const findSimilarRecommendations = () => {
    const similar = existingRecommendations
      .filter((r) => {
        const matchCategory = r.category === category;
        const matchContext =
          context &&
          (r.context.toLowerCase().includes(context.toLowerCase()) ||
            r.description.toLowerCase().includes(context.toLowerCase()));
        return matchCategory && (matchContext || !context);
      })
      .slice(0, 3);

    setSuggestions(similar);
    setShowSuggestions(similar.length > 0);
  };

  const applySuggestion = (suggestion: Recommendation) => {
    setTitle(suggestion.title);
    setDescription(suggestion.description);
    setTags(suggestion.tags.join(', '));
    setPriority(suggestion.priority);
    setShowSuggestions(false);
  };

  const handleAIApply = (aiTitle: string, aiDescription: string) => {
    setTitle(aiTitle);
    setDescription(aiDescription);
  };

  const getSelectedClient = () => {
    return clients.find((c) => c.id === clientId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let finalClientId = clientId;

      if (showNewClient && newClientName.trim()) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: newClientName,
            industry: newClientIndustry,
            created_by: user?.id
          })
          .select()
          .single();

        if (clientError) throw clientError;
        finalClientId = newClient.id;
      }

      const recoData = {
        client_id: finalClientId || null,
        title,
        category,
        description,
        context,
        prompt,
        priority,
        status,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        created_by: user?.id,
        updated_at: new Date().toISOString()
      };

      if (editingReco) {
        const { error } = await supabase
          .from('recommendations')
          .update(recoData)
          .eq('id', editingReco.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recommendations')
          .insert(recoData);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          {editingReco ? 'Modifier la recommandation' : 'Nouvelle recommandation'}
        </h2>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Client
            </label>
            {!showNewClient ? (
              <div className="flex gap-2">
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} {client.industry && `(${client.industry})`}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewClient(true)}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Nouveau
                </button>
              </div>
            ) : (
              <div className="space-y-3 p-4 border border-slate-300 rounded-lg">
                <input
                  type="text"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Nom du client"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <input
                  type="text"
                  value={newClientIndustry}
                  onChange={(e) => setNewClientIndustry(e.target.value)}
                  placeholder="Secteur d'activité"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewClient(false)}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Titre de la recommandation *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Ex: Optimiser le référencement local"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Catégorie *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Priorité
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="seo, local, google-my-business"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Contexte
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Décrivez le contexte ou la situation qui a mené à cette recommandation..."
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description détaillée *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={6}
              placeholder="Décrivez la recommandation en détail..."
              required
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Prompt pour ChatGPT
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={4}
              placeholder="Entrez un prompt personnalisé pour questionner ChatGPT et enrichir cette recommandation..."
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <AIAssistant
            category={category}
            context={context}
            prompt={prompt}
            currentTitle={title}
            clientName={getSelectedClient()?.name}
            industry={getSelectedClient()?.industry}
            onApply={handleAIApply}
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">
                Suggestions basées sur vos recommandations précédentes
              </h3>
            </div>
            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => applySuggestion(suggestion)}
                  className="w-full text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-400 transition"
                >
                  <p className="font-medium text-slate-900">{suggestion.title}</p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                    {suggestion.description}
                  </p>
                  <div className="flex gap-2 mt-2">
                    {suggestion.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg flex items-center gap-2 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-5 h-5" />
            {loading ? 'Enregistrement...' : editingReco ? 'Mettre à jour' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
};
