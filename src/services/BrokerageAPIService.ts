import { supabase } from '@/integrations/supabase/client';

export interface BrokerageCredentials {
  broker_name: string;
  username: string;
  password: string;
  api_key?: string;
  secret_key?: string;
  account_id?: string;
}

export interface BrokerageAccountData {
  balance: number;
  equity: number;
  margin_used: number;
  margin_available: number;
  positions: Position[];
  recent_trades: Trade[];
  performance_metrics: PerformanceMetrics;
}

export interface Position {
  symbol: string;
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  side: 'long' | 'short';
  value: number;
}

export interface Trade {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: string;
  pnl?: number;
  commission?: number;
}

export interface PerformanceMetrics {
  total_pnl: number;
  daily_pnl: number;
  weekly_pnl: number;
  monthly_pnl: number;
  win_rate: number;
  profit_factor: number;
  sharpe_ratio: number;
  max_drawdown: number;
}

class BrokerageAPIService {
  private static instance: BrokerageAPIService;
  
  static getInstance(): BrokerageAPIService {
    if (!BrokerageAPIService.instance) {
      BrokerageAPIService.instance = new BrokerageAPIService();
    }
    return BrokerageAPIService.instance;
  }

  async connectBrokerageAccount(credentials: BrokerageCredentials): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Call edge function to handle secure brokerage connection
      const { data, error } = await supabase.functions.invoke('brokerage-connector', {
        body: { 
          action: 'connect',
          credentials 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error connecting to brokerage:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect to brokerage' 
      };
    }
  }

  async syncAccountData(accountId: string): Promise<{ success: boolean; data?: BrokerageAccountData; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('brokerage-connector', {
        body: { 
          action: 'sync',
          account_id: accountId 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return { success: true, data: data.account_data };
    } catch (error) {
      console.error('Error syncing account data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sync account data' 
      };
    }
  }

  async getAccountPositions(accountId: string): Promise<Position[]> {
    try {
      const { data, error } = await supabase.functions.invoke('brokerage-connector', {
        body: { 
          action: 'positions',
          account_id: accountId 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.positions || [];
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  async getAccountTrades(accountId: string, limit: number = 50): Promise<Trade[]> {
    try {
      const { data, error } = await supabase.functions.invoke('brokerage-connector', {
        body: { 
          action: 'trades',
          account_id: accountId,
          limit 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.trades || [];
    } catch (error) {
      console.error('Error fetching trades:', error);
      return [];
    }
  }

  async getPerformanceMetrics(accountId: string): Promise<PerformanceMetrics | null> {
    try {
      const { data, error } = await supabase.functions.invoke('brokerage-connector', {
        body: { 
          action: 'performance',
          account_id: accountId 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.performance;
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return null;
    }
  }

  async getRealTimeQuotes(symbols: string[]): Promise<{ [symbol: string]: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('brokerage-connector', {
        body: { 
          action: 'quotes',
          symbols 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data.quotes || {};
    } catch (error) {
      console.error('Error fetching real-time quotes:', error);
      return {};
    }
  }

  // Broker-specific connection methods
  getBrokerConnectionInfo(brokerName: string): { apiEndpoint: string; authMethod: string; requirements: string[] } {
    const brokerConfigs: { [key: string]: any } = {
      alpaca: {
        apiEndpoint: 'https://paper-api.alpaca.markets',
        authMethod: 'api_key',
        requirements: ['api_key', 'secret_key']
      },
      interactive_brokers: {
        apiEndpoint: 'https://localhost:5000/v1/portal',
        authMethod: 'session',
        requirements: ['username', 'password']
      },
      td_ameritrade: {
        apiEndpoint: 'https://api.tdameritrade.com/v1',
        authMethod: 'oauth',
        requirements: ['username', 'password', 'client_id']
      },
      ftmo: {
        apiEndpoint: 'https://ftmo.com/api/v1',
        authMethod: 'credentials',
        requirements: ['username', 'password']
      },
      my_forex_funds: {
        apiEndpoint: 'https://myforexfunds.com/api',
        authMethod: 'credentials',
        requirements: ['username', 'password']
      },
      tradingview: {
        apiEndpoint: 'https://charting-library.tradingview.com',
        authMethod: 'session',
        requirements: ['username', 'password']
      }
    };

    return brokerConfigs[brokerName] || {
      apiEndpoint: '',
      authMethod: 'credentials',
      requirements: ['username', 'password']
    };
  }
}

export default BrokerageAPIService;