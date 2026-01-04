import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64, timeframe } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!imageBase64) {
      throw new Error('No image provided');
    }

    console.log(`Analyzing uploaded chart for ${timeframe} timeframe`);

    const systemPrompt = `You are an expert commodities futures chart analyst with deep knowledge of technical analysis, price action, and chart patterns.

Your response MUST be in valid JSON format with this exact structure:
{
  "symbol": "detected symbol or 'Unknown'",
  "recommendation": "BUY" | "SELL" | "HOLD",
  "confidence": number (0-100),
  "entryPrice": number,
  "targetPrice": number,
  "stopLoss": number,
  "reasoning": "detailed technical analysis explanation",
  "keyPatterns": ["pattern1", "pattern2", "pattern3"],
  "supportLevels": [number, number],
  "resistanceLevels": [number, number],
  "trend": "BULLISH" | "BEARISH" | "SIDEWAYS",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "indicators": {
    "rsi": "overbought" | "oversold" | "neutral",
    "macd": "bullish" | "bearish" | "neutral",
    "movingAverages": "above" | "below" | "at"
  }
}`;

    const userPrompt = `Analyze this commodities futures chart screenshot for trading opportunities.
Timeframe: ${timeframe}

Please identify:
1. The commodity/symbol if visible
2. Current price levels and trend direction
3. Key support and resistance levels
4. Chart patterns (head and shoulders, triangles, flags, etc.)
5. Technical indicator signals (RSI, MACD, Moving Averages)
6. Entry, target, and stop loss recommendations
7. Risk assessment

Provide a detailed trading recommendation based on technical analysis.
Return ONLY valid JSON with your analysis.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: [
              { type: 'text', text: userPrompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}` 
                } 
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits exhausted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Extract JSON from response (handle markdown code blocks if present)
    let analysisData;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      analysisData = JSON.parse(jsonMatch ? jsonMatch[0] : aiResponse);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      throw new Error('Invalid AI response format');
    }

    console.log('Chart analysis complete:', analysisData);

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        ...analysisData,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chart-analysis:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Chart analysis failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
