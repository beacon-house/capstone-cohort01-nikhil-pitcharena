// Global leaderboard displaying top-voted pitches
// Shows most interesting pitches ranked by community votes

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, ThumbsUp, TrendingUp, Loader2 } from 'lucide-react';

interface LeaderboardPitch {
  id: string;
  title: string;
  product_description: string;
  vote_counts: {
    interesting: number;
    needs_work: number;
  };
  ai_score?: number;
  rank: number;
}

interface LeaderboardProps {
  onViewPitch: (pitchId: string) => void;
}

export function Leaderboard({ onViewPitch }: LeaderboardProps) {
  const [pitches, setPitches] = useState<LeaderboardPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('pitches')
        .select('*')
        .eq('status', 'published');

      if (filter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (filter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      }

      const { data: pitchData, error: pitchError } = await query;

      if (pitchError) throw pitchError;

      const pitchesWithData = await Promise.all(
        (pitchData || []).map(async (pitch) => {
          const [voteData, feedbackData] = await Promise.all([
            supabase.from('votes').select('vote_type').eq('pitch_id', pitch.id),
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
            id: pitch.id,
            title: pitch.title,
            product_description: pitch.product_description,
            vote_counts,
            ai_score: feedbackData.data?.overall_score,
            rank: 0,
          };
        })
      );

      const sortedPitches = pitchesWithData
        .sort((a, b) => b.vote_counts.interesting - a.vote_counts.interesting)
        .map((pitch, index) => ({ ...pitch, rank: index + 1 }))
        .slice(0, 20);

      setPitches(sortedPitches);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Trophy className="w-6 h-6 text-orange-600" />;
    return <span className="text-lg font-bold text-gray-600">{rank}</span>;
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
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
              <p className="text-sm text-gray-600">Top pitches ranked by community</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'all'
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'week'
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filter === 'today'
                  ? 'bg-blue-700 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Today
            </button>
          </div>
        </div>

        {pitches.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No pitches yet</h3>
            <p className="text-sm text-gray-600">
              Be the first to submit a pitch and climb the leaderboard
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pitches.map((pitch) => (
              <button
                key={pitch.id}
                onClick={() => onViewPitch(pitch.id)}
                className={`w-full bg-white rounded-xl border-2 p-6 hover:border-blue-700 hover:shadow-md transition-all text-left ${
                  pitch.rank <= 3 ? 'border-yellow-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                    {getRankBadge(pitch.rank)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{pitch.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {pitch.product_description}
                    </p>

                    <div className="flex items-center space-x-6 text-sm">
                      <div className="flex items-center text-emerald-600">
                        <ThumbsUp className="w-4 h-4 mr-1" />
                        <span className="font-semibold">{pitch.vote_counts.interesting}</span>
                        <span className="ml-1 text-gray-500">votes</span>
                      </div>

                      {pitch.ai_score && (
                        <div className="flex items-center text-purple-600">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          <span className="font-semibold">{pitch.ai_score}/10</span>
                        </div>
                      )}

                      <div className="flex items-center text-gray-500">
                        <span>
                          {Math.round(
                            (pitch.vote_counts.interesting /
                              (pitch.vote_counts.interesting + pitch.vote_counts.needs_work || 1)) *
                              100
                          )}
                          % positive
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
