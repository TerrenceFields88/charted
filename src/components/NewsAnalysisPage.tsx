import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BloombergNewsPage } from '@/components/BloombergNewsPage';
import { InvestingAnalysisPage } from '@/components/InvestingAnalysisPage';

export const NewsAnalysisPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">News & Analysis</h1>
        <p className="text-muted-foreground">Stay updated with market news and technical analysis</p>
      </div>

      <Tabs defaultValue="news" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="news">Bloomberg News</TabsTrigger>
          <TabsTrigger value="analysis">Technical Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="news" className="mt-6">
          <BloombergNewsPage />
        </TabsContent>
        
        <TabsContent value="analysis" className="mt-6">
          <InvestingAnalysisPage />
        </TabsContent>
      </Tabs>
    </div>
  );
};