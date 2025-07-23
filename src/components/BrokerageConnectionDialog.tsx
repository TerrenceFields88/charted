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
  { value: 'alpaca', label: 'Alpaca Trading', demo: true },
  { value: 'interactive_brokers', label: 'Interactive Brokers', demo: false },
  { value: 'td_ameritrade', label: 'TD Ameritrade', demo: false },
  { value: 'etrade', label: 'E*TRADE', demo: false },
  { value: 'robinhood', label: 'Robinhood', demo: false },
];

export const BrokerageConnectionDialog = () => {
  const { accounts, loading, addAccount, syncAccount } = useBrokerageAccount();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    broker_name: '',
    account_id: '',
    api_key: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.broker_name || !formData.account_id) {
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
      api_key: formData.api_key,
    });

    if (result) {
      toast({
        title: 'Success',
        description: 'Brokerage account connected successfully',
      });
      setOpen(false);
      setFormData({ broker_name: '', account_id: '', api_key: '' });
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
          Connect Brokerage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect Your Brokerage Account</DialogTitle>
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
              <Label htmlFor="broker">Broker</Label>
              <Select
                value={formData.broker_name}
                onValueChange={(value) => setFormData(prev => ({ ...prev, broker_name: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your broker" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_BROKERS.map((broker) => (
                    <SelectItem key={broker.value} value={broker.value}>
                      <div className="flex items-center gap-2">
                        {broker.label}
                        {broker.demo && (
                          <Badge variant="secondary" className="text-xs">Demo</Badge>
                        )}
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
              <Label htmlFor="api_key">API Key (Optional)</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
                placeholder="Enter your API key"
              />
              <p className="text-xs text-muted-foreground">
                API keys are securely encrypted and never shared
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