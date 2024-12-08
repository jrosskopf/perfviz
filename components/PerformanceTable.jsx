'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Timer, ArrowDownUp } from 'lucide-react';

// Previous color definitions and helper functions remain the same...
const colors = [
  'rgb(99, 102, 241)',   // Indigo
  'rgb(168, 85, 247)',   // Purple
  'rgb(236, 72, 153)',   // Pink
  'rgb(14, 165, 233)',   // Sky
  'rgb(34, 197, 94)',    // Green
  'rgb(245, 158, 11)',   // Amber
  'rgb(239, 68, 68)',    // Red
  'rgb(59, 130, 246)',   // Blue
  'rgb(16, 185, 129)',   // Emerald
  'rgb(249, 115, 22)',   // Orange
  'rgb(139, 92, 246)',   // Violet
];

const formatLatency = (ns) => {
  if (ns >= 1000000) return `${(ns/1000000).toFixed(1)} ms`;
  if (ns >= 1000) return `${(ns/1000).toFixed(1)} μs`;
  return `${ns.toFixed(1)} ns`;
};

const formatThroughput = (throughput) => {
  const [value, unit] = throughput.split(' ');
  return `${parseFloat(value).toFixed(1)} ${unit}`;
};

const throughputToMBs = (throughput) => {
  const [value, unit] = throughput.split(' ');
  const numValue = parseFloat(value);
  switch(unit) {
    case 'GiB/s': return numValue * 1024;
    case 'MiB/s': return numValue;
    default: return numValue;
  }
};

const Bar = ({ throughput, color, latency, maxLatency }) => {
  const [position, setPosition] = useState(0);
  const animationFrameRef = useRef();
  const directionRef = useRef(1);
  
  const barLength = Math.max(10, Math.min(70, (Math.log10(latency) / Math.log10(maxLatency)) * 70));
  const maxPosition = 100 - barLength;
  
  const mbPerSecond = throughputToMBs(throughput);
  const speed = Math.max(0.001, Math.min(6, mbPerSecond / 5120));

  useEffect(() => {
    let lastTime = performance.now();
    
    const animate = (currentTime) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      setPosition(prevPosition => {
        let newPosition = prevPosition + (directionRef.current * speed * (deltaTime / 16) * 3);
        
        if (newPosition >= maxPosition) {
          newPosition = maxPosition;
          directionRef.current = -1;
        } else if (newPosition <= 0) {
          newPosition = 0;
          directionRef.current = 1;
        }
        
        return newPosition;
      });
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '20px',
      backgroundColor: 'rgb(243, 244, 246)',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: `${position}%`,
        height: '20px',
        width: `${barLength}%`,
        backgroundColor: color,
        borderRadius: '4px',
        boxShadow: `0 0 12px ${color}30`,
        transition: 'left 0.05s linear',
        transform: `scaleX(${directionRef.current === 1 ? 1.1 : 0.9})`,
        transformOrigin: directionRef.current === 1 ? 'left' : 'right'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `linear-gradient(to ${directionRef.current === 1 ? 'right' : 'left'}, ${color}, ${color}00)`,
          opacity: 0.3
        }} />
      </div>
    </div>
  );
};

// PerformanceTable component remains the same...
const PerformanceTable = () => {
  const operations = [
    {
      name: "CPU L1 Cache Access",
      throughput: "30 GiB/s",
      latency: 0.5,
      description: "Ultra-fast on-core cache"
    },
    {
      name: "CPU L2 Cache Access",
      throughput: "20 GiB/s",
      latency: 7,
      description: "Fast on-core cache"
    },
    {
      name: "CPU L3 Cache Access",
      throughput: "15 GiB/s",
      latency: 20,
      description: "Shared cache between cores"
    },
    {
      name: "Sequential Memory R/W",
      throughput: "10 GiB/s",
      latency: 100,
      description: "Predictable memory access"
    },
    {
      name: "Random Memory R/W",
      throughput: "1 GiB/s",
      latency: 50,
      description: "Unpredictable memory access"
    },
    {
      name: "Sequential SSD read",
      throughput: "4 GiB/s",
      latency: 1000,
      description: "Reading consecutive SSD blocks"
    },
    {
      name: "Sequential SSD write",
      throughput: "1 GiB/s",
      latency: 10000,
      description: "Writing consecutive SSD blocks"
    },
    {
      name: "Random SSD Read",
      throughput: "70 MiB/s",
      latency: 100000,
      description: "Reading scattered SSD blocks"
    },
    {
      name: "Network Same-Zone",
      throughput: "10 GiB/s",
      latency: 250000,
      description: "Same datacenter communication"
    },
    {
      name: "Compression",
      throughput: "500 MiB/s",
      latency: 100000,
      description: "Data compression operation"
    },
    {
      name: "NA East <-> West",
      throughput: "25 MiB/s",
      latency: 60000000,
      description: "Cross-continent network"
    }
  ].sort((a, b) => throughputToMBs(b.throughput) - throughputToMBs(a.throughput));

  const maxLatency = Math.max(...operations.map(op => op.latency));

  return (
    <Card className="w-full bg-white/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="flex gap-2">
          <Timer className="w-6 h-6 text-indigo-500" />
          <ArrowDownUp className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <CardTitle className="text-xl font-semibold text-gray-900">Operation Performance Visualization</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Bar length = latency (longer = slower) | Movement speed = throughput (faster = better)
          </p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <colgroup>
              <col className="w-[320px] min-w-[320px]" />
              <col className="w-[140px] min-w-[140px]" />
              <col className="w-[140px] min-w-[140px]" />
              <col style={{ width: '75%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className="h-14 px-8 text-left font-medium text-xs tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                  Operation
                </th>
                <th className="h-14 px-8 text-right font-medium text-xs tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                  Throughput
                </th>
                <th className="h-14 px-8 text-right font-medium text-xs tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200">
                  Latency
                </th>
                <th className="h-14 px-8 text-left font-medium text-xs tracking-wide text-gray-500 bg-gray-50 border-b border-gray-200 w-full">
                  Visualization
                </th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op, i) => (
                <tr 
                  key={i} 
                  className={`
                    border-b border-gray-200
                    hover:bg-blue-50/40 transition-colors
                    ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                  `}
                  title={op.description}
                >
                  <td className="h-12 px-8 text-xs text-gray-900 whitespace-nowrap" title={op.name}>
                    {op.name}
                  </td>
                  <td className="h-12 px-8 text-[11px] text-gray-600 whitespace-nowrap font-mono tabular-nums text-right">
                    {formatThroughput(op.throughput)}
                  </td>
                  <td className="h-12 px-8 text-[11px] text-gray-600 whitespace-nowrap font-mono tabular-nums text-right">
                    {formatLatency(op.latency)}
                  </td>
                  <td className="h-12 px-8">
                    <div className="w-full">
                      <Bar 
                        throughput={op.throughput}
                        color={colors[i % colors.length]}
                        latency={op.latency}
                        maxLatency={maxLatency}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PerformanceTable;