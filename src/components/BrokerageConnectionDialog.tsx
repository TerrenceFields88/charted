import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBrokerageAccount } from '@/hooks/useBrokerageAccount';
import { Link, RefreshCw, Plus, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUPPORTED_BROKERS = [
  // Traditional Brokerages
  { value: 'alpaca', label: 'Alpaca Trading', demo: true, type: 'brokerage' },
  { value: 'interactive_brokers', label: 'Interactive Brokers', demo: false, type: 'brokerage' },
  { value: 'td_ameritrade', label: 'TD Ameritrade', demo: false, type: 'brokerage' },
  { value: 'etrade', label: 'E*TRADE', demo: false, type: 'brokerage' },
  { value: 'robinhood', label: 'Robinhood', demo: false, type: 'brokerage' },
  
  // Prop Firms
  { value: 'ftmo', label: 'FTMO', demo: false, type: 'prop_firm' },
  { value: 'my_forex_funds', label: 'MyForexFunds', demo: false, type: 'prop_firm' },
  { value: 'the5ers', label: 'The5%ers', demo: false, type: 'prop_firm' },
  { value: 'funded_trader', label: 'Funded Trader', demo: false, type: 'prop_firm' },
  { value: 'apex_trader', label: 'Apex Trader Funding', demo: false, type: 'prop_firm' },
  { value: 'topstep', label: 'TopstepTrader', demo: false, type: 'prop_firm' },
  { value: 'earn2trade', label: 'Earn2Trade', demo: false, type: 'prop_firm' },
  { value: 'elite_trader_funding', label: 'Elite Trader Funding', demo: false, type: 'prop_firm' },
  { value: 'take_profit_trader', label: 'Take Profit Trader', demo: false, type: 'prop_firm' },
];

export const BrokerageConnectionDialog = () => {
  const { accounts, loading, addAccount, syncAccount } = useBrokerageAccount();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    broker_name: '',
    account_id: '',
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.broker_name || !formData.account_id || !formData.username || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const result = await addAccount({
      broker_name: formData.broker_name,
      account_id: formData.account_id,
      username: formData.username,
      password: formData.password,
    });

    if (result) {
      const selectedBroker = SUPPORTED_BROKERS.find(b => b.value === formData.broker_name);
      const accountType = selectedBroker?.type === 'prop_firm' ? 'prop firm' : 'brokerage';
      
      toast({
        title: 'Success',
        description: `${selectedBroker?.label} ${accountType} account connected successfully`,
      });
      setOpen(false);
      setFormData({ broker_name: '', account_id: '', username: '', password: '' });
    }
  };

  const handleSync = async (accountId: string) => {
    await syncAccount(accountId);
    toast({
      title: 'Synced',
      description: 'Account data synchronized successfully',
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Link className="w-4 h-4 mr-2" />
          Connect Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Trading Account</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Connect your brokerage or prop firm account to sync trading data
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Connected Accounts */}
          {accounts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Connected Accounts</h4>
              {accounts.map((account) => (
                <Card key={account.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-bullish" />
                        <div>
                          <div className="font-medium">{account.broker_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Account: {account.account_id}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-bullish border-bullish">
                          Active
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(account.id)}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Add New Account Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broker">Trading Platform</Label>
              <Select
                value={formData.broker_name}
                onValueChange={(value) => setFormData(prev => ({ ...prev, broker_name: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your trading platform" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                    Brokerages
                  </div>
                  {SUPPORTED_BROKERS.filter(broker => broker.type === 'brokerage').map((broker) => (
                    <SelectItem key={broker.value} value={broker.value}>
                      <div className="flex items-center gap-2">
                        {broker.label}
                        {broker.demo && (
                          <Badge variant="secondary" className="text-xs">Demo</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-2 pt-3">
                    Prop Firms
                  </div>
                  {SUPPORTED_BROKERS.filter(broker => broker.type === 'prop_firm').map((broker) => (
                    <SelectItem key={broker.value} value={broker.value}>
                      <div className="flex items-center gap-2">
                        {broker.label}
                        <Badge variant="outline" className="text-xs border-primary text-primary">
                          Prop
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_id">Account ID</Label>
              <Input
                id="account_id"
                value={formData.account_id}
                onChange={(e) => setFormData(prev => ({ ...prev, account_id: e.target.value }))}
                placeholder="Enter your account ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your login username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your login password"
                required
              />
              <p className="text-xs text-muted-foreground">
                Login credentials are securely encrypted and never shared
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Connect Account
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};