// Multi-step pitch submission form for entrepreneurs
// Guides users through creating a complete elevator pitch with draft saving capability

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

interface PitchFormData {
  title: string;
  target_audience: string;
  pain_point: string;
  product_description: string;
  elevator_pitch: string;
}

interface PitchSubmissionFormProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function PitchSubmissionForm({ onComplete, onCancel }: PitchSubmissionFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PitchFormData>({
    title: '',
    target_audience: '',
    pain_point: '',
    product_description: '',
    elevator_pitch: '',
  });

  const totalSteps = 5;

  useEffect(() => {
    loadDraft();
  }, []);

  const loadDraft = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDraftId(data.id);
        setFormData({
          title: data.title,
          target_audience: data.target_audience,
          pain_point: data.pain_point,
          product_description: data.product_description,
          elevator_pitch: data.elevator_pitch,
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = async () => {
    if (!user) return;

    try {
      if (draftId) {
        const { error } = await supabase
          .from('pitches')
          .update({
            ...formData,
            status: 'draft',
          })
          .eq('id', draftId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('pitches')
          .insert({
            ...formData,
            user_id: user.id,
            status: 'draft',
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setDraftId(data.id);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let pitchId = draftId;

      if (draftId) {
        const { error } = await supabase
          .from('pitches')
          .update({
            ...formData,
            status: 'published',
          })
          .eq('id', draftId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('pitches')
          .insert({
            ...formData,
            user_id: user.id,
            status: 'published',
          })
          .select()
          .single();

        if (error) throw error;
        pitchId = data.id;
      }

      if (pitchId) {
        const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pitch-feedback`;
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ pitch_id: pitchId }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Failed to generate AI feedback:', errorData);
          } else {
            const result = await response.json();
            console.log('AI feedback generated successfully:', result);
          }
        } catch (feedbackError) {
          console.error('Error calling AI feedback function:', feedbackError);
        }
      }

      onComplete();
    } catch (error) {
      console.error('Error submitting pitch:', error);
      alert('Error submitting pitch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    saveDraft();
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    saveDraft();
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateField = (field: keyof PitchFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.title.trim().length > 0;
      case 2:
        return formData.target_audience.trim().length > 0;
      case 3:
        return formData.pain_point.trim().length > 0;
      case 4:
        return formData.product_description.trim().length > 0;
      case 5:
        const wordCount = formData.elevator_pitch.trim().split(/\s+/).length;
        return wordCount >= 250 && wordCount <= 500;
      default:
        return false;
    }
  };

  const getWordCount = () => {
    return formData.elevator_pitch.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={step === 1 ? onCancel : handleBack}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <div className="flex space-x-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 w-12 rounded-full transition-all ${
                  i + 1 <= step ? 'bg-blue-700' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8 pb-24">
        <div className="max-w-2xl mx-auto">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">What's your pitch title?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Give your startup or idea a memorable name
                </p>
              </div>
              <div>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., EcoTrack - Sustainable Shopping Assistant"
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Who is your target audience?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Describe the specific group of people your product serves
                </p>
              </div>
              <div>
                <textarea
                  value={formData.target_audience}
                  onChange={(e) => updateField('target_audience', e.target.value)}
                  placeholder="e.g., Environmentally-conscious millennials who want to reduce their carbon footprint but struggle to find sustainable products"
                  rows={5}
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">What problem are you solving?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Describe the pain point your target audience experiences
                </p>
              </div>
              <div>
                <textarea
                  value={formData.pain_point}
                  onChange={(e) => updateField('pain_point', e.target.value)}
                  placeholder="e.g., Consumers want to shop sustainably but it's time-consuming to research product origins, manufacturing practices, and environmental impact"
                  rows={6}
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Describe your solution</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Explain what your product does and how it solves the problem
                </p>
              </div>
              <div>
                <textarea
                  value={formData.product_description}
                  onChange={(e) => updateField('product_description', e.target.value)}
                  placeholder="e.g., EcoTrack is a mobile app that scans product barcodes and instantly shows sustainability scores, carbon footprint, and ethical certifications"
                  rows={6}
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all resize-none"
                  autoFocus
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your elevator pitch</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Write your complete pitch (250-500 words)
                </p>
              </div>
              <div>
                <textarea
                  value={formData.elevator_pitch}
                  onChange={(e) => updateField('elevator_pitch', e.target.value)}
                  placeholder="Imagine you're in an elevator with a potential investor. Write your complete pitch here..."
                  rows={12}
                  className="block w-full rounded-lg border-gray-300 border px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-700 focus:border-transparent outline-none transition-all resize-none"
                  autoFocus
                />
                <div className="mt-2 flex items-center justify-between text-xs">
                  <span
                    className={`${
                      getWordCount() < 250
                        ? 'text-gray-500'
                        : getWordCount() > 500
                        ? 'text-red-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {getWordCount()} words
                  </span>
                  <span className="text-gray-500">250-500 words required</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 fixed bottom-0 left-0 right-0 border-t border-gray-200 bg-white px-6 py-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleNext}
            disabled={!isStepValid() || loading}
            className="w-full flex items-center justify-center rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : step === totalSteps ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Pitch
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
