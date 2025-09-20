import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBrokerageAccount } from '@/hooks/useBrokerageAccount';
import { Link, RefreshCw, Plus, CheckCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SUPPORTED_BROKERS = [
  // Trading Platforms
  { value: 'tradingview', label: 'TradingView', demo: false, type: 'platform' },
  { value: 'tradovate', label: 'Tradovate', demo: false, type: 'platform' },
  
  // Prop Firms
  { value: 'topstep', label: 'TopStepTrader', demo: false, type: 'prop_firm' },
];

export const BrokerageConnectionDialog = () => {
  const { accounts, loading, addAccount, syncAccount, removeAccount } = useBrokerageAccount();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    broker_name: '',
    username: '',
    password: '',
    api_key: '',
    secret_key: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.broker_name || !formData.username || !formData.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const result = await addAccount({
      broker_name: formData.broker_name,
      username: formData.username,
      password: formData.password,
      api_key: formData.api_key || undefined,
      secret_key: formData.secret_key || undefined,
    });

    if (result) {
      const selectedBroker = SUPPORTED_BROKERS.find(b => b.value === formData.broker_name);
      let accountType = 'account';
      if (selectedBroker?.type === 'prop_firm') accountType = 'prop firm';
      else if (selectedBroker?.type === 'platform') accountType = 'platform';
      else if (selectedBroker?.type === 'brokerage') accountType = 'brokerage';
      
      toast({
        title: 'Success',
        description: `${selectedBroker?.label} ${accountType} connected successfully`,
      });
      setOpen(false);
      setFormData({ broker_name: '', username: '', password: '', api_key: '', secret_key: '' });
    }
  };

  const handleSync = async (accountId: string) => {
    await syncAccount(accountId);
    toast({
      title: 'Synced',
      description: 'Account data synchronized successfully',
    });
  };

  const handleRemove = async (accountId: string, brokerName: string) => {
    const success = await removeAccount(accountId);
    if (success) {
      toast({
        title: 'Account Removed',
        description: `${brokerName} account disconnected successfully`,
      });
    }
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
                            Username: {account.username}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemove(account.id, account.broker_name)}
                        >
                          <Trash2 className="w-4 h-4" />
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
                    Trading Platforms
                  </div>
                  {SUPPORTED_BROKERS.filter(broker => broker.type === 'platform').map((broker) => (
                    <SelectItem key={broker.value} value={broker.value}>
                      <div className="flex items-center gap-2">
                        {broker.label}
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-500">
                          Platform
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground border-t mt-2 pt-3">
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

            {/* API Key fields for supported brokers */}
            {(formData.broker_name === 'tradovate' || formData.broker_name === 'tradingview') && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key (Optional)</Label>
                  <Input
                    id="api_key"
                    value={formData.api_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                    placeholder="Enter your API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    API key for enhanced features (optional for basic connection)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret_key">Secret Key (Optional)</Label>
                  <Input
                    id="secret_key"
                    type="password"
                    value={formData.secret_key}
                    onChange={(e) => setFormData(prev => ({ ...prev, secret_key: e.target.value }))}
                    placeholder="Enter your secret key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Secret key for API authentication (optional for basic connection)
                  </p>
                </div>
              </>
            )}

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