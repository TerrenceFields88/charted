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

    const systemPrompt = `You are an expert financial analyst with deep knowledge of technical analysis, market trends, and trading strategies. Analyze the provided market data and give actionable trading recommendations.

Your response MUST be in valid JSON format with this exact structure:
{
  "recommendation": "BUY" | "SELL" | "HOLD",
  "confidence": number (0-100),
  "targetPrice": number,
  "stopLoss": number,
  "reasoning": "brief explanation",
  "keyFactors": ["factor1", "factor2", "factor3"],
  "timeframe": "same as input",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}`;

    const userPrompt = `Analyze this market data for ${symbol}:
- Current Price: $${price}
- Change: ${change >= 0 ? '+' : ''}${change} (${changePercent >= 0 ? '+' : ''}${changePercent}%)
- Timeframe: ${timeframe}
- Additional Market Context: ${JSON.stringify(marketData || {})}

Provide a trading recommendation considering:
1. Price momentum and trend direction
2. Support/resistance levels
3. Risk/reward ratio
4. Timeframe appropriateness
5. Current market conditions

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
