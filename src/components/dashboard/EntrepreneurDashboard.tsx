// Entrepreneur dashboard displaying submitted pitches with analytics
// Shows pitch performance metrics and provides access to create new pitches

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Plus, TrendingUp, ThumbsUp, AlertCircle, Loader2, Eye, RotateCw } from 'lucide-react';

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
        p => p.status === 'published' && (p.ai_processing_status === 'pending' || p.ai_processing_status === 'processing')
      );
      if (hasProcessingPitches) {
        loadPitches();
      }
    }, 3000);

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
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Pitches</h1>
          <p className="text-gray-600">Manage your pitches and track AI feedback</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Published Pitches</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalPitches}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVotes}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <ThumbsUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg AI Score</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.avgScore > 0 ? stats.avgScore.toFixed(1) : '-'}
                  {stats.avgScore > 0 && <span className="text-lg text-gray-500">/10</span>}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Create Button */}
        <button
          onClick={onCreatePitch}
          className="w-full sm:w-auto mb-6 flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Pitch
        </button>

        {/* Pitches List */}
        {pitches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No pitches yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first pitch to get started with AI feedback
            </p>
            <button
              onClick={onCreatePitch}
              className="inline-flex items-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-700 transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Pitch
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pitches.map((pitch) => {
              const isDraft = pitch.status === 'draft';
              const isAnalyzing = pitch.status === 'published' && (pitch.ai_processing_status === 'pending' || pitch.ai_processing_status === 'processing');
              const hasAIScore = pitch.ai_feedback?.overall_score;
              const aiFailed = pitch.status === 'published' && pitch.ai_processing_status === 'failed';

              return (
                <div
                  key={pitch.id}
                  className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Title and Score */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{pitch.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {pitch.product_description}
                      </p>
                    </div>

                    {hasAIScore && (
                      <div className="ml-4 flex-shrink-0 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <span className="text-2xl font-bold text-purple-600">{pitch.ai_feedback.overall_score}</span>
                          <span className="text-sm text-gray-600">/10</span>
                        </div>
                        <p className="text-xs text-gray-500 text-center mt-1">AI Score</p>
                      </div>
                    )}
                  </div>

                  {/* Status and Actions */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Draft Badge */}
                    {isDraft && (
                      <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                        Draft
                      </span>
                    )}

                    {/* AI Analysis Status */}
                    {isAnalyzing && (
                      <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        AI Analyzing...
                      </span>
                    )}

                    {/* AI Failed Badge */}
                    {aiFailed && (
                      <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-700 text-sm font-medium rounded-full">
                        <AlertCircle className="w-3 h-3 mr-1.5" />
                        AI Analysis Failed
                      </span>
                    )}

                    {/* Votes */}
                    {!isDraft && (
                      <>
                        <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full">
                          <ThumbsUp className="w-3 h-3 mr-1.5" />
                          {pitch.vote_counts?.interesting || 0} Interesting
                        </span>
                        <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                          {pitch.vote_counts?.needs_work || 0} Needs Work
                        </span>
                      </>
                    )}

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Retry Button */}
                      {aiFailed && (
                        <button
                          onClick={() => retryAIFeedback(pitch.id)}
                          disabled={retryingFeedback === pitch.id}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {retryingFeedback === pitch.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                              Retrying...
                            </>
                          ) : (
                            <>
                              <RotateCw className="w-4 h-4 mr-1.5" />
                              Retry AI Analysis
                            </>
                          )}
                        </button>
                      )}

                      {/* View Details Button */}
                      {hasAIScore && (
                        <button
                          onClick={() => onViewPitch(pitch.id)}
                          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-all"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          View Feedback
                        </button>
                      )}

                      {/* View Pitch (for non-AI-complete pitches) */}
                      {!hasAIScore && !isDraft && (
                        <button
                          onClick={() => onViewPitch(pitch.id)}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-all"
                        >
                          <Eye className="w-4 h-4 mr-1.5" />
                          View Pitch
                        </button>
                      )}

                      {/* Continue Draft */}
                      {isDraft && (
                        <button
                          onClick={() => onViewPitch(pitch.id)}
                          className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-semibold rounded-lg hover:bg-gray-700 transition-all"
                        >
                          Continue Draft
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
