// Success screen displayed after pitch submission with AI feedback progress tracking
// Shows submission confirmation, AI processing status, and provides navigation options

import { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, TrendingUp, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SubmissionSuccessScreenProps {
  pitchId: string;
  pitchTitle: string;
  onViewPitch: () => void;
  onGoToDashboard: () => void;
}

interface ProcessingStage {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export function SubmissionSuccessScreen({
  pitchId,
  pitchTitle,
  onViewPitch,
  onGoToDashboard,
}: SubmissionSuccessScreenProps) {
  const [aiStatus, setAiStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: 'submitted', label: 'Pitch Submitted', status: 'completed' },
    { id: 'analyzing', label: 'AI Analysis In Progress', status: 'active' },
    { id: 'evaluating', label: 'Evaluating Strengths & Weaknesses', status: 'pending' },
    { id: 'scoring', label: 'Calculating Score', status: 'pending' },
  ]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkAIStatus();
    const interval = setInterval(checkAIStatus, 3000);
    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pitchId]);

  const checkAIStatus = async () => {
    try {
      const { data: pitch, error } = await supabase
        .from('pitches')
        .select('ai_processing_status, ai_processing_error')
        .eq('id', pitchId)
        .single();

      if (error) throw error;

      if (pitch) {
        const status = pitch.ai_processing_status || 'pending';
        setAiStatus(status);
        updateStages(status);

        if (status === 'completed' || status === 'failed') {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking AI status:', error);
    }
  };

  const updateStages = (status: string) => {
    const newStages: ProcessingStage[] = [
      { id: 'submitted', label: 'Pitch Submitted', status: 'completed' },
      {
        id: 'analyzing',
        label: 'AI Analysis In Progress',
        status: status === 'pending' ? 'active' : status === 'processing' ? 'active' : status === 'completed' ? 'completed' : 'failed',
      },
      {
        id: 'evaluating',
        label: 'Evaluating Strengths & Weaknesses',
        status: status === 'processing' ? 'active' : status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
      },
      {
        id: 'scoring',
        label: 'Calculating Score',
        status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : 'pending',
      },
    ];
    setStages(newStages);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'active':
        return <Loader2 className="w-5 h-5 text-blue-700 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-50 flex flex-col overflow-y-auto">
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6 animate-bounce">
              <CheckCircle className="w-10 h-10 text-emerald-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Pitch Submitted Successfully!
            </h1>
            <p className="text-xl text-gray-600 mb-2">{pitchTitle}</p>
            <p className="text-sm text-gray-500">
              Your pitch is now live and ready for community feedback
            </p>
          </div>

          {/* AI Processing Status Card */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 mb-8 shadow-lg">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">AI Feedback Generation</h2>
                <p className="text-sm text-gray-600">
                  {aiStatus === 'completed'
                    ? 'Analysis complete!'
                    : aiStatus === 'failed'
                    ? 'Analysis failed - you can retry from your dashboard'
                    : 'Analyzing your pitch with AI...'}
                </p>
              </div>
            </div>

            {/* Progress Stages */}
            <div className="space-y-4">
              {stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">{getStatusIcon(stage.status)}</div>
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        stage.status === 'completed'
                          ? 'text-emerald-600'
                          : stage.status === 'active'
                          ? 'text-blue-700'
                          : stage.status === 'failed'
                          ? 'text-red-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {stage.label}
                    </p>
                  </div>
                  {stage.status === 'completed' && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            {aiStatus !== 'completed' && aiStatus !== 'failed' && (
              <div className="mt-6">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-700 to-purple-600 transition-all duration-1000 ease-out"
                    style={{
                      width: `${
                        aiStatus === 'pending'
                          ? '25%'
                          : aiStatus === 'processing'
                          ? '75%'
                          : '100%'
                      }`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  This usually takes 10-30 seconds
                </p>
              </div>
            )}

            {/* Completion Message */}
            {aiStatus === 'completed' && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 mb-1">
                      AI Feedback Ready!
                    </p>
                    <p className="text-xs text-emerald-700">
                      Your pitch has been analyzed. View detailed feedback including strengths,
                      areas for improvement, and an overall score.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {aiStatus === 'failed' && (
              <div className="mt-6 p-4 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900 mb-1">
                      AI Analysis Failed
                    </p>
                    <p className="text-xs text-red-700">
                      There was an issue generating AI feedback. You can retry from your dashboard
                      or pitch detail page.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={onViewPitch}
              className="w-full flex items-center justify-center rounded-xl bg-blue-700 px-6 py-4 text-base font-semibold text-white shadow-lg hover:bg-blue-800 transition-all transform hover:scale-105"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              View Your Pitch
            </button>
            <button
              onClick={onGoToDashboard}
              className="w-full flex items-center justify-center rounded-xl bg-white border-2 border-gray-300 px-6 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Return to Dashboard
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Your pitch is now visible to the community. Start getting votes and feedback!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
