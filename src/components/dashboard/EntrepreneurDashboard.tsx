// Entrepreneur dashboard displaying submitted pitches with analytics
// Shows pitch performance metrics and provides access to create new pitches

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, TrendingUp, ThumbsUp, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface Pitch {
  id: string;
  title: string;
  target_audience: string;
  pain_point: string;
  product_description: string;
  elevator_pitch: string;
  status: 'draft' | 'published';
  ai_processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  ai_processing_error?: string;
  created_at: string;
  vote_counts?: {
    interesting: number;
    needs_work: number;
  };
  ai_feedback?: {
    overall_score: number;
  };
}

interface EntrepreneurDashboardProps {
  onCreatePitch: () => void;
  onViewPitch: (pitchId: string) => void;
}

export function EntrepreneurDashboard({ onCreatePitch, onViewPitch }: EntrepreneurDashboardProps) {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPitches: 0,
    totalVotes: 0,
    avgScore: 0,
  });
  const [retryingFeedback, setRetryingFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadPitches();

    const interval = setInterval(() => {
      const hasProcessingPitches = pitches.some(
        p => p.ai_processing_status === 'pending' || p.ai_processing_status === 'processing'
      );
      if (hasProcessingPitches) {
        loadPitches();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, pitches]);

  const retryAIFeedback = async (pitchId: string) => {
    setRetryingFeedback(pitchId);
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pitch-feedback`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pitch_id: pitchId }),
      });

      if (response.ok) {
        await loadPitches();
      } else {
        console.error('Failed to generate feedback');
        alert('Failed to generate AI feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error retrying feedback:', error);
      alert('Error generating feedback. Please try again.');
    } finally {
      setRetryingFeedback(null);
    }
  };

  const loadPitches = async () => {
    if (!user) return;

    try {
      const { data: pitchData, error: pitchError } = await supabase
        .from('pitches')
        .select('id, title, target_audience, pain_point, product_description, elevator_pitch, status, ai_processing_status, ai_processing_error, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (pitchError) throw pitchError;

      const pitchesWithData = await Promise.all(
        (pitchData || []).map(async (pitch) => {
          const [voteData, feedbackData] = await Promise.all([
            supabase
              .from('votes')
              .select('vote_type')
              .eq('pitch_id', pitch.id),
            supabase
              .from('ai_feedback')
              .select('overall_score')
              .eq('pitch_id', pitch.id)
              .maybeSingle(),
          ]);

          const votes = voteData.data || [];
          const vote_counts = {
            interesting: votes.filter((v) => v.vote_type === 'interesting').length,
            needs_work: votes.filter((v) => v.vote_type === 'needs_work').length,
          };

          return {
            ...pitch,
            vote_counts,
            ai_feedback: feedbackData.data ? { overall_score: feedbackData.data.overall_score } : undefined,
          };
        })
      );

      setPitches(pitchesWithData);

      const totalPitches = pitchesWithData.filter((p) => p.status === 'published').length;
      const totalVotes = pitchesWithData.reduce(
        (sum, p) => sum + (p.vote_counts?.interesting || 0) + (p.vote_counts?.needs_work || 0),
        0
      );
      const scoresWithFeedback = pitchesWithData.filter((p) => p.ai_feedback);
      const avgScore =
        scoresWithFeedback.length > 0
          ? scoresWithFeedback.reduce((sum, p) => sum + (p.ai_feedback?.overall_score || 0), 0) /
            scoresWithFeedback.length
          : 0;

      setStats({ totalPitches, totalVotes, avgScore });
    } catch (error) {
      console.error('Error loading pitches:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Pitches</h1>
          <p className="mt-2 text-sm text-gray-600">
            Track your submissions and performance metrics
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pitches</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPitches}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Votes</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVotes}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg AI Score</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}
                  <span className="text-base text-gray-500">/10</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onCreatePitch}
          className="w-full sm:w-auto mb-6 flex items-center justify-center rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Pitch
        </button>

        {pitches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pitches yet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Create your first pitch to get AI-powered feedback and community votes
            </p>
            <button
              onClick={onCreatePitch}
              className="inline-flex items-center rounded-lg bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 transition-all"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Pitch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pitches.map((pitch) => (
              <button
                key={pitch.id}
                onClick={() => onViewPitch(pitch.id)}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-700 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{pitch.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {pitch.product_description}
                    </p>
                  </div>
                  <div className="ml-4 flex flex-col items-end space-y-2">
                    {pitch.status === 'draft' && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                        Draft
                      </span>
                    )}
                    {pitch.status === 'published' && pitch.ai_processing_status === 'pending' && (
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full flex items-center">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Starting AI Analysis
                      </span>
                    )}
                    {pitch.status === 'published' && pitch.ai_processing_status === 'processing' && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded-full flex items-center">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        AI Analyzing
                      </span>
                    )}
                    {pitch.status === 'published' && pitch.ai_processing_status === 'completed' && pitch.ai_feedback && (
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        AI Complete
                      </span>
                    )}
                    {pitch.status === 'published' && pitch.ai_processing_status === 'failed' && (
                      <span className="px-3 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        AI Failed
                      </span>
                    )}
                  </div>
                </div>

                {pitch.status === 'published' && (
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="flex items-center text-emerald-600">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      <span>{pitch.vote_counts?.interesting || 0} Interesting</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span>{pitch.vote_counts?.needs_work || 0} Needs Work</span>
                    </div>
                    {pitch.ai_feedback ? (
                      <div className="flex items-center text-purple-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        <span className="font-medium">{pitch.ai_feedback.overall_score}/10</span>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          retryAIFeedback(pitch.id);
                        }}
                        disabled={retryingFeedback === pitch.id}
                        className="flex items-center text-gray-500 hover:text-blue-700 transition-colors disabled:opacity-50"
                      >
                        {retryingFeedback === pitch.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            <span className="text-xs">Generating...</span>
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-1" />
                            <span className="text-xs underline">Generate AI feedback</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
