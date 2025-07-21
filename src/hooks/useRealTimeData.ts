import { useState, useEffect } from 'react';
import { FutureContract } from '@/types/futures';
import { mockFutures, getUpdatedPrice } from '@/data/mockData';

export const useRealTimeData = () => {
  const [futures, setFutures] = useState<FutureContract[]>(mockFutures);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Simulate real-time data updates every 3 seconds
    const interval = setInterval(() => {
      setFutures(prevFutures => 
        prevFutures.map(future => {
          const newPrice = getUpdatedPrice(future.price, future.volatility);
          const priceChange = newPrice - future.price;
          const percentChange = (priceChange / future.price) * 100;
          
          // Update momentum based on price direction
          const momentumAdjustment = priceChange > 0 ? 
            Math.min(2, Math.abs(priceChange * 10)) : 
            -Math.min(2, Math.abs(priceChange * 10));
          
          const newMomentum = Math.max(-100, Math.min(100, 
            future.momentum + momentumAdjustment + (Math.random() - 0.5) * 5
          ));
          
          return {
            ...future,
            price: newPrice,
            change: priceChange,
            changePercent: percentChange,
            momentum: Math.round(newMomentum),
            high24h: Math.max(future.high24h, newPrice),
            low24h: Math.min(future.low24h, newPrice),
            volume: future.volume + Math.floor(Math.random() * 1000),
          };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return { futures, isConnected };
};