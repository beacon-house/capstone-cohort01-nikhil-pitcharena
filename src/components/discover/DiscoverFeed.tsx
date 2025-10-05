// Pitch discovery feed with swipeable card interface
// Allows users to browse and vote on entrepreneur pitches

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { PitchCard } from './PitchCard';
import { ThumbsUp, X, Loader2, CheckCircle } from 'lucide-react';

interface Pitch {
  id: string;
  user_id: string;
  title: string;
  target_audience: string;
  pain_point: string;
  product_description: string;
  elevator_pitch: string;
  vote_counts: {
    interesting: number;
    needs_work: number;
  };
  ai_score?: number;
}

interface DiscoverFeedProps {
  onViewPitch: (pitchId: string) => void;
}

export function DiscoverFeed({ onViewPitch }: DiscoverFeedProps) {
  const { user } = useAuth();
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [showVoteFeedback, setShowVoteFeedback] = useState<'interesting' | 'needs_work' | null>(null);

  useEffect(() => {
    loadPitches();
  }, [user]);

  const loadPitches = async () => {
    if (!user) return;

    try {
      const { data: votedPitchIds } = await supabase
        .from('votes')
        .select('pitch_id')
        .eq('user_id', user.id);

      const votedIds = votedPitchIds?.map((v) => v.pitch_id) || [];

      const { data: pitchData, error: pitchError } = await supabase
        .from('pitches')
        .select('*')
        .eq('status', 'published')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (pitchError) throw pitchError;

      const unvotedPitches = (pitchData || []).filter((p) => !votedIds.includes(p.id));

      const pitchesWithData = await Promise.all(
        unvotedPitches.map(async (pitch) => {
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
            ...pitch,
            vote_counts,
            ai_score: feedbackData.data?.overall_score,
          };
        })
      );

      setPitches(pitchesWithData);
    } catch (error) {
      console.error('Error loading pitches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: 'interesting' | 'needs_work') => {
    if (!user || currentIndex >= pitches.length || voting) return;

    setVoting(true);
    setShowVoteFeedback(voteType);

    try {
      const currentPitch = pitches[currentIndex];

      const { error } = await supabase.from('votes').insert({
        pitch_id: currentPitch.id,
        user_id: user.id,
        vote_type: voteType,
      });

      if (error) throw error;

      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setShowVoteFeedback(null);
        setVoting(false);
      }, 500);
    } catch (error) {
      console.error('Error voting:', error);
      setShowVoteFeedback(null);
      setVoting(false);
    }
  };

  const handleSwipeLeft = () => handleVote('needs_work');
  const handleSwipeRight = () => handleVote('interesting');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (currentIndex >= pitches.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all caught up!</h2>
          <p className="text-gray-600">Check back later for new pitches to review</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600">
              {pitches.length - currentIndex} {pitches.length - currentIndex === 1 ? 'pitch' : 'pitches'} remaining
            </p>
          </div>

          <div className="relative h-[600px] mb-8">
            {pitches.slice(currentIndex, currentIndex + 2).map((pitch, index) => (
              <div
                key={pitch.id}
                className="absolute inset-0"
                style={{
                  zIndex: pitches.length - index,
                }}
              >
                <PitchCard
                  pitch={pitch}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onTap={() => onViewPitch(pitch.id)}
                  isTopCard={index === 0}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleSwipeLeft}
              disabled={voting}
              className="w-16 h-16 rounded-full bg-white border-2 border-red-500 text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={handleSwipeRight}
              disabled={voting}
              className="w-16 h-16 rounded-full bg-white border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center"
            >
              <ThumbsUp className="w-8 h-8" />
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Swipe or tap buttons to vote</p>
          </div>
        </div>
      </div>
    </div>
  );
}
