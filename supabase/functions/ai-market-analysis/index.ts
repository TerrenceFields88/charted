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
    const { symbol, price, change, changePercent, timeframe, marketData } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing ${symbol} for ${timeframe} timeframe`);

    const systemPrompt = `You are an expert commodities futures trading analyst specializing in energy, metals, and agricultural commodities. You have deep knowledge of supply/demand fundamentals, seasonal patterns, geopolitical impacts, and technical analysis specific to futures markets.

Your response MUST be in valid JSON format with this exact structure:
{
  "recommendation": "BUY" | "SELL" | "HOLD",
  "confidence": number (0-100),
  "targetPrice": number,
  "stopLoss": number,
  "reasoning": "brief explanation focused on commodities fundamentals",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "timeframe": "same as input",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}`;

    const userPrompt = `Analyze this commodities future for ${symbol}:
- Current Price: $${price}
- Change: ${change >= 0 ? '+' : ''}${change} (${changePercent >= 0 ? '+' : ''}${changePercent}%)
- Timeframe: ${timeframe}
- Broader Commodities Market: ${JSON.stringify(marketData || {})}

Consider these commodities-specific factors:
1. Supply and demand fundamentals
2. Seasonal patterns and weather impacts (for agricultural commodities)
3. Geopolitical events affecting production or trade
4. Currency movements (USD strength/weakness)
5. Storage costs and contango/backwardation
6. Industrial demand trends
7. Producer hedging activity
8. Technical price levels and momentum

Provide a detailed trading recommendation based on both fundamental and technical analysis.
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
          { role: 'user', content: userPrompt }
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

    console.log('Analysis complete:', analysisData);

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        symbol,
        ...analysisData,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-market-analysis:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
