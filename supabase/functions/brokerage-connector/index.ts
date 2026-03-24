import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrokerageCredentials {
  broker_name: string;
  username: string;
  password: string;
  api_key?: string;
  secret_key?: string;
}

interface BrokerageConnector {
  connect(credentials: BrokerageCredentials): Promise<any>;
  getAccountData(credentials: BrokerageCredentials): Promise<any>;
  getPositions(credentials: BrokerageCredentials): Promise<any>;
  getTrades(credentials: BrokerageCredentials, limit?: number): Promise<any>;
  getQuotes(credentials: BrokerageCredentials, symbols: string[]): Promise<any>;
}

class AlpacaConnector implements BrokerageConnector {
  private baseUrl = 'https://paper-api.alpaca.markets';

  async connect(credentials: BrokerageCredentials) {
    const response = await fetch(`${this.baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key || credentials.username,
        'APCA-API-SECRET-KEY': credentials.secret_key || credentials.password,
      }
    });

    if (!response.ok) {
      throw new Error(`Alpaca connection failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getAccountData(credentials: BrokerageCredentials) {
    const [account, positions] = await Promise.all([
      this.getAccount(credentials),
      this.getPositions(credentials)
    ]);

    return {
      balance: parseFloat(account.cash),
      equity: parseFloat(account.equity),
      margin_used: parseFloat(account.buying_power) - parseFloat(account.cash),
      margin_available: parseFloat(account.buying_power),
      positions,
      performance_metrics: {
        total_pnl: parseFloat(account.equity) - parseFloat(account.last_equity),
        daily_pnl: parseFloat(account.equity) - parseFloat(account.last_equity),
        weekly_pnl: 0, // Would need historical data
        monthly_pnl: 0, // Would need historical data
        win_rate: 0, // Would calculate from trades
        profit_factor: 0,
        sharpe_ratio: 0,
        max_drawdown: 0
      }
    };
  }

  private async getAccount(credentials: BrokerageCredentials) {
    const response = await fetch(`${this.baseUrl}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key || credentials.username,
        'APCA-API-SECRET-KEY': credentials.secret_key || credentials.password,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get account: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPositions(credentials: BrokerageCredentials) {
    const response = await fetch(`${this.baseUrl}/v2/positions`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key || credentials.username,
        'APCA-API-SECRET-KEY': credentials.secret_key || credentials.password,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get positions: ${response.statusText}`);
    }

    const positions = await response.json();
    return positions.map((pos: any) => ({
      symbol: pos.symbol,
      quantity: parseFloat(pos.qty),
      entry_price: parseFloat(pos.avg_entry_price),
      current_price: parseFloat(pos.market_value) / parseFloat(pos.qty),
      unrealized_pnl: parseFloat(pos.unrealized_pl),
      side: parseFloat(pos.qty) > 0 ? 'long' : 'short',
      value: parseFloat(pos.market_value)
    }));
  }

  async getTrades(credentials: BrokerageCredentials, limit = 50) {
    const response = await fetch(`${this.baseUrl}/v2/orders?status=filled&limit=${limit}`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key || credentials.username,
        'APCA-API-SECRET-KEY': credentials.secret_key || credentials.password,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get trades: ${response.statusText}`);
    }

    const orders = await response.json();
    return orders.map((order: any) => ({
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      quantity: parseFloat(order.filled_qty),
      price: parseFloat(order.filled_avg_price || order.limit_price),
      timestamp: order.filled_at || order.created_at,
      pnl: 0, // Would need to calculate based on entry/exit
      commission: 0 // Alpaca has commission-free trading
    }));
  }

  async getQuotes(credentials: BrokerageCredentials, symbols: string[]) {
    const symbolsParam = symbols.join(',');
    const response = await fetch(`${this.baseUrl}/v2/stocks/quotes/latest?symbols=${symbolsParam}`, {
      headers: {
        'APCA-API-KEY-ID': credentials.api_key || credentials.username,
        'APCA-API-SECRET-KEY': credentials.secret_key || credentials.password,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get quotes: ${response.statusText}`);
    }

    const data = await response.json();
    const quotes: { [symbol: string]: number } = {};
    
    for (const [symbol, quote] of Object.entries(data.quotes)) {
      quotes[symbol] = (quote as any).bp; // bid price
    }

    return quotes;
  }
}

// Mock connector for demo purposes when real API is not available
class MockConnector implements BrokerageConnector {
  async connect(credentials: BrokerageCredentials) {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      account_id: `mock_${credentials.broker_name}_${Date.now()}`,
      status: 'connected'
    };
  }

  async getAccountData(credentials: BrokerageCredentials) {
    const mockData = {
      balance: 10000 + Math.random() * 50000,
      equity: 10000 + Math.random() * 55000,
      margin_used: Math.random() * 5000,
      margin_available: 25000 + Math.random() * 10000,
      positions: this.generateMockPositions(),
      recent_trades: this.generateMockTrades(),
      performance_metrics: {
        total_pnl: (Math.random() - 0.5) * 10000,
        daily_pnl: (Math.random() - 0.5) * 1000,
        weekly_pnl: (Math.random() - 0.5) * 5000,
        monthly_pnl: (Math.random() - 0.5) * 15000,
        win_rate: 50 + Math.random() * 40,
        profit_factor: 1 + Math.random() * 2,
        sharpe_ratio: Math.random() * 3,
        max_drawdown: Math.random() * 0.2
      }
    };

    return mockData;
  }

  async getPositions(credentials: BrokerageCredentials) {
    return this.generateMockPositions();
  }

  async getTrades(credentials: BrokerageCredentials, limit = 50) {
    return this.generateMockTrades(limit);
  }

  async getQuotes(credentials: BrokerageCredentials, symbols: string[]) {
    const quotes: { [symbol: string]: number } = {};
    symbols.forEach(symbol => {
      quotes[symbol] = 100 + Math.random() * 500; // Random price between 100-600
    });
    return quotes;
  }

  private generateMockPositions() {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'SPY', 'QQQ'];
    const positions = [];

    for (let i = 0; i < Math.floor(Math.random() * 5) + 2; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const quantity = Math.floor(Math.random() * 100) + 1;
      const entryPrice = 100 + Math.random() * 400;
      const currentPrice = entryPrice * (0.9 + Math.random() * 0.2);
      
      positions.push({
        symbol,
        quantity,
        entry_price: entryPrice,
        current_price: currentPrice,
        unrealized_pnl: (currentPrice - entryPrice) * quantity,
        side: Math.random() > 0.5 ? 'long' : 'short',
        value: currentPrice * quantity
      });
    }

    return positions;
  }

  private generateMockTrades(limit = 20) {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'NVDA', 'SPY', 'QQQ'];
    const trades = [];

    for (let i = 0; i < limit; i++) {
      const symbol = symbols[Math.floor(Math.random() * symbols.length)];
      const price = 100 + Math.random() * 400;
      const quantity = Math.floor(Math.random() * 100) + 1;
      const pnl = (Math.random() - 0.5) * 1000;
      
      const date = new Date();
      date.setHours(date.getHours() - Math.floor(Math.random() * 24 * 7)); // Last week
      
      trades.push({
        id: `trade_${i}_${Date.now()}`,
        symbol,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        quantity,
        price,
        timestamp: date.toISOString(),
        pnl,
        commission: Math.random() * 10
      });
    }

    return trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
}

function getConnector(brokerName: string): BrokerageConnector {
  switch (brokerName) {
    case 'alpaca':
      return new AlpacaConnector();
    default:
      return new MockConnector(); // Use mock for unsupported brokers
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    // Validate JWT using anon client
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: authenticatedUser }, error: authError } = await anonClient.auth.getUser();

    if (authError || !authenticatedUser) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = authenticatedUser.id;

    // Service client for DB operations
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const { action, credentials, account_id, symbols, limit } = await req.json();

    console.log(`Processing brokerage action: ${action} for user: ${userId}`);

    // Helper: fetch account with ownership check
    const getOwnedAccount = async (accountId: string) => {
      const { data: account, error: fetchError } = await supabaseClient
        .from('brokerage_accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !account) {
        throw new Error('Account not found or access denied');
      }
      return account;
    };

    // Helper: decrypt credentials using pgcrypto
    const decryptionKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const decryptCredential = async (encrypted: string | null): Promise<string> => {
      if (!encrypted) return '';
      try {
        const { data, error } = await supabaseClient.rpc('decrypt_credential', {
          p_encrypted: encrypted,
          p_key: decryptionKey
        });
        if (error) {
          console.error('Decryption error:', error);
          return encrypted; // Fallback for legacy unencrypted data
        }
        return data || '';
      } catch {
        return encrypted; // Fallback for legacy unencrypted data
      }
    };

    let result: any = {};

    switch (action) {
      case 'connect': {
        if (!credentials) {
          throw new Error('Credentials are required for connection');
        }

        const connector = getConnector(credentials.broker_name);
        const connectionResult = await connector.connect(credentials);

        // Encrypt sensitive credentials using pgcrypto before storing
        const encryptionKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

        // Check if account already exists for this user/broker combo
        const { data: existingAccount } = await supabaseClient
          .from('brokerage_accounts')
          .select('id')
          .eq('broker_name', credentials.broker_name)
          .eq('username', credentials.username)
          .eq('user_id', userId)
          .maybeSingle();

        if (existingAccount) {
          // Update existing account
          const { error: dbError } = await supabaseClient
            .from('brokerage_accounts')
            .update({
              last_sync_at: new Date().toISOString(),
              is_active: true
            })
            .eq('id', existingAccount.id)
            .eq('user_id', userId);

          if (dbError) {
            console.error('Database error:', dbError);
          }

          result = {
            success: true,
            connection: connectionResult,
            account_id: existingAccount.id,
            message: `Successfully reconnected to ${credentials.broker_name}`
          };
        } else {
          // Create new account with encrypted credentials via SQL
          const { data: newAccountData, error: insertError } = await supabaseClient
            .rpc('create_brokerage_account_encrypted', {
              p_user_id: userId,
              p_broker_name: credentials.broker_name,
              p_username: credentials.username,
              p_password: credentials.password || '',
              p_api_key: credentials.api_key || '',
              p_encryption_key: encryptionKey
            });

          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error('Failed to store account credentials securely');
          }

          result = {
            success: true,
            connection: connectionResult,
            account_id: newAccountData,
            message: `Successfully connected to ${credentials.broker_name}`
          };
        }
        break;
      }

      case 'sync': {
        if (!account_id) {
          throw new Error('Account ID is required for sync');
        }

        const account = await getOwnedAccount(account_id);

        const connector = getConnector(account.broker_name);
        const accountData = await connector.getAccountData({
          broker_name: account.broker_name,
          username: account.username,
          password: account.password_encrypted,
          api_key: account.api_key_encrypted
        });

        // Update sync timestamp
        await supabaseClient
          .from('brokerage_accounts')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', account_id)
          .eq('user_id', userId);

        result = {
          success: true,
          account_data: accountData
        };
        break;
      }

      case 'positions': {
        const account = await getOwnedAccount(account_id);

        const connector = getConnector(account.broker_name);
        const positions = await connector.getPositions({
          broker_name: account.broker_name,
          username: account.username,
          password: account.password_encrypted
        });

        result = { success: true, positions };
        break;
      }

      case 'trades': {
        const account = await getOwnedAccount(account_id);

        const connector = getConnector(account.broker_name);
        const trades = await connector.getTrades({
          broker_name: account.broker_name,
          username: account.username,
          password: account.password_encrypted
        }, limit || 50);

        result = { success: true, trades };
        break;
      }

      case 'quotes': {
        if (!symbols || !Array.isArray(symbols)) {
          throw new Error('Symbols array is required for quotes');
        }

        const connector = new MockConnector();
        const quotes = await connector.getQuotes({} as any, symbols);

        result = { success: true, quotes };
        break;
      }

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Brokerage connector error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});