import { useEffect, useRef } from 'react';

interface TradingViewMiniChartProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
}

export const TradingViewMiniChart = ({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  height = 200,
  theme = 'dark'
}: TradingViewMiniChartProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear any existing content
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol,
      width,
      height,
      locale: 'en',
      dateRange: '12M',
      colorTheme: theme,
      trendLineColor: 'rgba(41, 98, 255, 1)',
      underLineColor: 'rgba(41, 98, 255, 0.3)',
      underLineBottomColor: 'rgba(41, 98, 255, 0)',
      isTransparent: true,
      autosize: true,
      largeChartUrl: ''
    });

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, width, height, theme]);

  return (
    <div className="tradingview-widget-container rounded-lg overflow-hidden">
      <div ref={container} className="tradingview-widget" />
    </div>
  );
};