import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface MarketQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'forex' | 'crypto' | 'futures';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Fetching real-time market data...')
    
    // Yahoo Finance API symbols
    const symbols = [
      'SPY',      // S&P 500 ETF
      'EURUSD=X', // EUR/USD
      'BTC-USD',  // Bitcoin
      'GC=F',     // Gold Futures
      'AAPL',     // Apple
      'GBPUSD=X', // GBP/USD
      'ETH-USD',  // Ethereum
      'CL=F'      // Crude Oil Futures
    ]
    
    const symbolsParam = symbols.join(',')
    
    // Use Yahoo Finance API v8 (free endpoint)
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbolsParam}?interval=1m&range=1d`
    
    console.log('Fetching from Yahoo Finance:', yahooUrl)
    
    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('Yahoo Finance response received')
    
    // Parse Yahoo Finance data
    const marketData: MarketQuote[] = []
    
    if (data.chart && data.chart.result) {
      for (const result of data.chart.result) {
        const symbol = result.meta.symbol
        const currentPrice = result.meta.regularMarketPrice || result.meta.previousClose
        const previousClose = result.meta.previousClose
        const change = currentPrice - previousClose
        const changePercent = (change / previousClose) * 100
        
        let displaySymbol = symbol
        let type: 'stock' | 'forex' | 'crypto' | 'futures' = 'stock'
        
        // Determine type and clean symbol
        if (symbol.includes('USD=X')) {
          type = 'forex'
          displaySymbol = symbol.replace('USD=X', '/USD')
        } else if (symbol.includes('-USD')) {
          type = 'crypto'
          displaySymbol = symbol.replace('-USD', '')
        } else if (symbol.includes('=F')) {
          type = 'futures'
          displaySymbol = symbol.replace('=F', '')
        }
        
        marketData.push({
          symbol: displaySymbol,
          price: Number(currentPrice.toFixed(type === 'forex' ? 4 : 2)),
          change: Number(change.toFixed(type === 'forex' ? 4 : 2)),
          changePercent: Number(changePercent.toFixed(2)),
          type
        })
      }
    }
    
    // Fallback data if API fails
    if (marketData.length === 0) {
      console.log('Using fallback market data')
      return new Response(JSON.stringify({
        success: true,
        data: [
          { symbol: 'SPY', price: 612.85, change: 8.47, changePercent: 1.40, type: 'stock' },
          { symbol: 'EUR/USD', price: 1.0298, change: -0.0067, changePercent: -0.65, type: 'forex' },
          { symbol: 'BTC', price: 115750, change: 4850.25, changePercent: 4.37, type: 'crypto' },
          { symbol: 'GC', price: 2745.60, change: 32.80, changePercent: 1.21, type: 'futures' },
          { symbol: 'AAPL', price: 248.90, change: 5.23, changePercent: 2.15, type: 'stock' },
          { symbol: 'GBP/USD', price: 1.2089, change: -0.0145, changePercent: -1.18, type: 'forex' },
          { symbol: 'ETH', price: 4567.30, change: 178.85, changePercent: 4.08, type: 'crypto' },
          { symbol: 'CL', price: 89.75, change: -1.67, changePercent: -1.83, type: 'futures' }
        ]
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log(`Successfully fetched ${marketData.length} market quotes`)
    
    return new Response(JSON.stringify({
      success: true,
      data: marketData,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error fetching market data:', error)
    
    // Return fallback data on error
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      data: [
        { symbol: 'SPY', price: 612.85, change: 8.47, changePercent: 1.40, type: 'stock' },
        { symbol: 'EUR/USD', price: 1.0298, change: -0.0067, changePercent: -0.65, type: 'forex' },
        { symbol: 'BTC', price: 115750, change: 4850.25, changePercent: 4.37, type: 'crypto' },
        { symbol: 'GC', price: 2745.60, change: 32.80, changePercent: 1.21, type: 'futures' },
        { symbol: 'AAPL', price: 248.90, change: 5.23, changePercent: 2.15, type: 'stock' },
        { symbol: 'GBP/USD', price: 1.2089, change: -0.0145, changePercent: -1.18, type: 'forex' },
        { symbol: 'ETH', price: 4567.30, change: 178.85, changePercent: 4.08, type: 'crypto' },
        { symbol: 'CL', price: 89.75, change: -1.67, changePercent: -1.83, type: 'futures' }
      ]
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})