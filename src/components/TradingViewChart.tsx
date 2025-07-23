import { useEffect, useRef } from 'react';

interface TradingViewChartProps {
  symbol?: string;
  width?: string | number;
  height?: string | number;
  theme?: 'light' | 'dark';
  interval?: string;
  style?: string;
}

export const TradingViewChart = ({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  height = 400,
  theme = 'dark',
  interval = '15',
  style = '1'
}: TradingViewChartProps) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    // Clear any existing content
    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: 'Etc/UTC',
      theme: theme,
      style: style,
      locale: 'en',
      enable_publishing: false,
      withdateranges: true,
      range: '1D',
      hide_side_toolbar: false,
      allow_symbol_change: true,
      details: true,
      hotlist: true,
      calendar: false,
      support_host: 'https://www.tradingview.com'
    });

    container.current.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, theme, interval, style]);

  return (
    <div className="tradingview-widget-container" style={{ height, width }}>
      <div ref={container} className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
      <div className="tradingview-widget-copyright">
        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
          <span className="blue-text text-xs">Track all markets on TradingView</span>
        </a>
      </div>
    </div>
  );
};

// Mini chart component for smaller displays
export const TradingViewMiniChart = ({
  symbol = 'NASDAQ:AAPL',
  width = '100%',
  height = 200,
  theme = 'dark'
}: Omit<TradingViewChartProps, 'interval' | 'style'>) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    container.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: '100%',
      height: '100%',
      locale: 'en',
      dateRange: '12M',
      colorTheme: theme,
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
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" style={{ height, width }}>
      <div ref={container} className="tradingview-widget-container__widget" style={{ height: '100%', width: '100%' }} />
    </div>
  );
};