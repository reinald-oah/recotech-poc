import React, { useState } from 'react';
import { Sparkles, Wand2, Plus, Loader2, X } from 'lucide-react';
import { getAIAssistance, AIAssistRequest } from '../lib/openai';

interface AIAssistantProps {
  category: string;
  context: string;
  prompt: string;
  currentTitle: string;
  clientName?: string;
  industry?: string;
  onApply: (title: string, description: string) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  category,
  context,
  prompt,
  currentTitle,
  clientName,
  industry,
  onApply
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<{ title: string; description: string } | null>(null);

  const handleAIRequest = async (action: 'generate') => {
    setLoading(true);
    setError('');
    setSuggestion(null);

    try {
      const request: AIAssistRequest = {
        action,
        category,
        context,
        prompt,
        currentTitle,
        clientName,
        industry
      };

      const result = await getAIAssistance(request);
      setSuggestion(result);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion.title, suggestion.description);
      setSuggestion(null);
      setIsOpen(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium rounded-lg transition shadow-sm"
      >
        <Sparkles className="w-5 h-5" />
        Assistance IA
      </button>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-slate-900">Assistant IA ChatGPT</h3>
        </div>
        <button
          onClick={() => {
            setIsOpen(false);
            setSuggestion(null);
            setError('');
          }}
          className="text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-slate-600 mb-4">
        Laissez ChatGPT vous aider à rédiger ou améliorer votre recommandation.
      </p>

      <div className="flex justify-center mb-4">
        <button
          type="button"
          onClick={() => handleAIRequest('generate')}
          disabled={loading}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-blue-50 border-2 border-blue-300 text-blue-700 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Wand2 className="w-5 h-5" />
          Générer
        </button>
      </div>

      {loading && (
        <div className="bg-white rounded-lg p-6 text-center border border-blue-200">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">ChatGPT travaille sur votre demande...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {suggestion && !loading && (
        <div className="bg-white rounded-lg p-5 border-2 border-blue-300 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-slate-900">Suggestion de ChatGPT</h4>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition text-sm"
            >
              <Wand2 className="w-4 h-4" />
              Appliquer
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Titre</p>
              <p className="text-slate-900 font-medium">{suggestion.title}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Description</p>
              <div className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {suggestion.description}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-slate-500">
        <p className="font-medium mb-1">Comment ça marche :</p>
        <p className="ml-4">• <strong>Générer :</strong> Crée une recommandation complète basée sur la catégorie et le contexte</p>
      </div>
    </div>
  );
};
