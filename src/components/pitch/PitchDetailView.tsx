// Detailed pitch view with full elevator pitch and AI feedback
// Displays comprehensive pitch information and AI-generated analysis

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { X, ThumbsUp, AlertCircle, TrendingUp, Lightbulb, Target, Loader2 } from 'lucide-react';

interface AIFeedback {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overall_score: number;
}

interface PitchDetail {
  id: string;
  user_id: string;
  title: string;
  target_audience: string;
  pain_point: string;
  product_description: string;
  elevator_pitch: string;
  status: string;
  created_at: string;
  vote_counts: {
    interesting: number;
    needs_work: number;
  };
  ai_feedback?: AIFeedback;
  user_vote?: 'interesting' | 'needs_work' | null;
}

interface PitchDetailViewProps {
  pitchId: string;
  onClose: () => void;
}

export function PitchDetailView({ pitchId, onClose }: PitchDetailViewProps) {
  const { user } = useAuth();
  const [pitch, setPitch] = useState<PitchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [retryingFeedback, setRetryingFeedback] = useState(false);

  useEffect(() => {
    loadPitchDetail();
  }, [pitchId]);

  const retryAIFeedback = async () => {
    setRetryingFeedback(true);
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
        await loadPitchDetail();
      } else {
        console.error('Failed to generate feedback');
        alert('Failed to generate AI feedback. Please try again.');
      }
    } catch (error) {
      console.error('Error retrying feedback:', error);
      alert('Error generating feedback. Please try again.');
    } finally {
      setRetryingFeedback(false);
    }
  };

  const loadPitchDetail = async () => {
    try {
      const { data: pitchData, error: pitchError } = await supabase
        .from('pitches')
        .select('*')
        .eq('id', pitchId)
        .single();

      if (pitchError) throw pitchError;

      const [voteData, feedbackData, userVoteData] = await Promise.all([
        supabase.from('votes').select('vote_type').eq('pitch_id', pitchId),
        supabase
          .from('ai_feedback')
          .select('*')
          .eq('pitch_id', pitchId)
          .maybeSingle(),
        user
          ? supabase
              .from('votes')
              .select('vote_type')
              .eq('pitch_id', pitchId)
              .eq('user_id', user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const votes = voteData.data || [];
      const vote_counts = {
        interesting: votes.filter((v) => v.vote_type === 'interesting').length,
        needs_work: votes.filter((v) => v.vote_type === 'needs_work').length,
      };

      const aiFeedback = feedbackData.data
        ? {
            strengths: Array.isArray(feedbackData.data.strengths) ? feedbackData.data.strengths : [],
            weaknesses: Array.isArray(feedbackData.data.weaknesses) ? feedbackData.data.weaknesses : [],
            recommendations: Array.isArray(feedbackData.data.recommendations) ? feedbackData.data.recommendations : [],
            overall_score: feedbackData.data.overall_score,
          }
        : undefined;

      setPitch({
        ...pitchData,
        vote_counts,
        ai_feedback: aiFeedback,
        user_vote: userVoteData.data?.vote_type || null,
      });
    } catch (error) {
      console.error('Error loading pitch detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (voteType: 'interesting' | 'needs_work') => {
    if (!user || !pitch || pitch.user_id === user.id || voting) return;

    setVoting(true);
    try {
      if (pitch.user_vote) {
        await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('pitch_id', pitchId)
          .eq('user_id', user.id);
      } else {
        await supabase.from('votes').insert({
          pitch_id: pitchId,
          user_id: user.id,
          vote_type: voteType,
        });
      }

      await loadPitchDetail();
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Pitch not found</p>
          <button onClick={onClose} className="mt-4 text-blue-700 hover:text-blue-800">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isOwnPitch = user?.id === pitch.user_id;

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">Pitch Details</h1>
        <div className="w-10" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-900 flex-1">{pitch.title}</h2>
            {pitch.ai_feedback && (
              <div className="ml-4 flex items-center space-x-2 px-4 py-2 bg-purple-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="text-lg font-bold text-purple-600">
                  {pitch.ai_feedback.overall_score}/10
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center text-emerald-600">
              <ThumbsUp className="w-4 h-4 mr-1" />
              <span className="font-medium">{pitch.vote_counts.interesting} Interesting</span>
            </div>
            <div className="flex items-center text-gray-500">
              <AlertCircle className="w-4 h-4 mr-1" />
              <span className="font-medium">{pitch.vote_counts.needs_work} Needs Work</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-blue-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Target className="w-5 h-5 text-blue-700 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Target Audience</h3>
                <p className="text-gray-700 leading-relaxed">{pitch.target_audience}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Problem</h3>
                <p className="text-gray-700 leading-relaxed">{pitch.pain_point}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-emerald-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Solution</h3>
                <p className="text-gray-700 leading-relaxed">{pitch.product_description}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Full Elevator Pitch</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{pitch.elevator_pitch}</p>
          </div>

          {pitch.status === 'published' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">AI Feedback</h3>
              </div>

              {pitch.ai_feedback ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-600 mb-3">STRENGTHS</h4>
                    <ul className="space-y-2">
                      {pitch.ai_feedback.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-emerald-600 mt-1">•</span>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-red-600 mb-3">AREAS FOR IMPROVEMENT</h4>
                    <ul className="space-y-2">
                      {pitch.ai_feedback.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-red-600 mt-1">•</span>
                          <span className="text-gray-700">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-blue-700 mb-3">RECOMMENDATIONS</h4>
                    <ul className="space-y-2">
                      {pitch.ai_feedback.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-blue-700 mt-1">•</span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  {retryingFeedback ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-4" />
                      <p className="text-gray-600 text-center">
                        AI is analyzing your pitch...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                      <p className="text-gray-600 text-center mb-4">
                        AI feedback hasn't been generated yet.
                      </p>
                      <button
                        onClick={retryAIFeedback}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      >
                        Generate AI Feedback
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {!isOwnPitch && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-6 pb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleVote('needs_work')}
                  disabled={voting || pitch.user_vote === 'needs_work'}
                  className={`flex-1 flex items-center justify-center rounded-lg px-6 py-4 text-sm font-semibold transition-all ${
                    pitch.user_vote === 'needs_work'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-white text-red-600 border-2 border-red-500 hover:bg-red-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Needs Work
                </button>

                <button
                  onClick={() => handleVote('interesting')}
                  disabled={voting || pitch.user_vote === 'interesting'}
                  className={`flex-1 flex items-center justify-center rounded-lg px-6 py-4 text-sm font-semibold transition-all ${
                    pitch.user_vote === 'interesting'
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-500'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  Interesting
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
