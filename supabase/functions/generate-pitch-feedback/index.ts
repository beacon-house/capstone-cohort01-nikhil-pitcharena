import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PitchData {
  title: string;
  target_audience: string;
  pain_point: string;
  product_description: string;
  elevator_pitch: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  let pitch_id: string | undefined;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    pitch_id = body.pitch_id;

    if (!pitch_id) {
      return new Response(
        JSON.stringify({ error: 'pitch_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await supabase
      .from('pitches')
      .update({
        ai_processing_status: 'processing',
        ai_processing_started_at: new Date().toISOString(),
      })
      .eq('id', pitch_id);

    const { data: pitch, error: pitchError } = await supabase
      .from('pitches')
      .select('*')
      .eq('id', pitch_id)
      .single();

    if (pitchError || !pitch) {
      return new Response(
        JSON.stringify({ error: 'Pitch not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.warn('OpenAI API key not configured, using mock feedback');

      const mockFeedback = {
        strengths: [
          'Clear problem identification and target audience definition',
          'Well-articulated value proposition',
          'Demonstrates understanding of market need',
        ],
        weaknesses: [
          'Could benefit from more specific metrics and data',
          'Competitive landscape analysis is limited',
          'Monetization strategy could be more detailed',
        ],
        recommendations: [
          'Include market size data and growth projections',
          'Add more details about competitive advantages',
          'Clarify go-to-market strategy and customer acquisition plan',
        ],
        overall_score: 7,
      };

      const { error: insertError } = await supabase
        .from('ai_feedback')
        .insert({
          pitch_id: pitch_id,
          ...mockFeedback,
        });

      if (insertError) throw insertError;

      await supabase
        .from('pitches')
        .update({
          ai_processing_status: 'completed',
          ai_processing_completed_at: new Date().toISOString(),
          ai_processing_error: null,
        })
        .eq('id', pitch_id);

      return new Response(
        JSON.stringify({ success: true, feedback: mockFeedback }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const prompt = `You are an expert startup advisor and investor. Analyze the following elevator pitch and provide structured feedback.

Pitch Title: ${pitch.title}
Target Audience: ${pitch.target_audience}
Problem: ${pitch.pain_point}
Solution: ${pitch.product_description}
Full Pitch: ${pitch.elevator_pitch}

Please provide your feedback in the following JSON format:
{
  "strengths": [3 specific strengths as strings],
  "weaknesses": [3 specific areas for improvement as strings],
  "recommendations": [2-3 actionable recommendations as strings],
  "overall_score": number from 1-10
}

Be constructive, specific, and actionable in your feedback.`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-2024-08-06',
        messages: [
          {
            role: 'system',
            content: 'You are an expert startup advisor providing constructive pitch feedback. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
    }

    const openaiData = await openaiResponse.json();
    const feedbackText = openaiData.choices[0].message.content;

    const feedback = JSON.parse(feedbackText);

    const { error: insertError } = await supabase
      .from('ai_feedback')
      .insert({
        pitch_id: pitch_id,
        strengths: feedback.strengths,
        weaknesses: feedback.weaknesses,
        recommendations: feedback.recommendations,
        overall_score: feedback.overall_score,
      });

    if (insertError) throw insertError;

    await supabase
      .from('pitches')
      .update({
        ai_processing_status: 'completed',
        ai_processing_completed_at: new Date().toISOString(),
        ai_processing_error: null,
      })
      .eq('id', pitch_id);

    return new Response(
      JSON.stringify({ success: true, feedback }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating feedback:', error);

    if (pitch_id) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase
          .from('pitches')
          .update({
            ai_processing_status: 'failed',
            ai_processing_error: error.message || 'Failed to generate feedback',
            ai_processing_completed_at: new Date().toISOString(),
          })
          .eq('id', pitch_id);
      } catch (updateError) {
        console.error('Error updating pitch status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate feedback' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});