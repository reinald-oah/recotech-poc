import { useState, useEffect } from 'react';
import { Trash2, Users, FileText, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Recommendation {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
  client_id: string;
  clients?: {
    name: string;
  };
}

interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  active: boolean;
  created_at: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'recommendations' | 'team'>('recommendations');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadRecommendations(), loadTeamMembers()]);
    setLoading(false);
  };

  const loadRecommendations = async () => {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*, clients(name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setRecommendations(data);
    }
  };

  const loadTeamMembers = async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTeamMembers(data);
    }
  };

  const handleDeleteRecommendation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) {
      return;
    }

    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', id);

    if (!error) {
      setRecommendations(recommendations.filter(r => r.id !== id));
    }
  };

  const handleToggleActive = async (memberId: string, currentActive: boolean) => {
    const { error } = await supabase
      .from('team_members')
      .update({ active: !currentActive })
      .eq('id', memberId);

    if (!error) {
      setTeamMembers(teamMembers.map(m =>
        m.id === memberId ? { ...m, active: !currentActive } : m
      ));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 hover:text-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 border-b border-slate-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'recommendations'
                  ? 'border-slate-900 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Recommendations
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === 'team'
                  ? 'border-slate-900 text-slate-900 font-medium'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Team Members
            </button>
          </nav>
        </div>

        {activeTab === 'recommendations' ? (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                All Recommendations ({recommendations.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {recommendations.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500">
                  No recommendations found
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div key={rec.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{rec.title}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
                        <span className="font-medium">{rec.clients?.name}</span>
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                          {rec.category}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          rec.status === 'Published' ? 'bg-green-100 text-green-800' :
                          rec.status === 'Draft' ? 'bg-slate-100 text-slate-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.status}
                        </span>
                        <span className="text-xs">
                          {new Date(rec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteRecommendation(rec.id)}
                      className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete recommendation"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                Team Members ({teamMembers.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {teamMembers.length === 0 ? (
                <div className="px-6 py-8 text-center text-slate-500">
                  No team members found
                </div>
              ) : (
                teamMembers.map((member) => (
                  <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{member.full_name}</h3>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
                        <span>{member.email}</span>
                        <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                          {member.role}
                        </span>
                        <span className="text-xs">
                          Joined {new Date(member.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <span className={`text-sm font-medium ${member.active ? 'text-green-600' : 'text-slate-400'}`}>
                        {member.active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={member.active}
                          onChange={() => handleToggleActive(member.id, member.active)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </div>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
