import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Timer, ArrowDownUp } from 'lucide-react';

// Previous color definitions and helper functions remain the same...
const colors = [
  'rgb(239, 68, 68)',   // Red
  'rgb(34, 197, 94)',   // Green
  'rgb(59, 130, 246)',  // Blue
  'rgb(249, 115, 22)',  // Orange
  'rgb(168, 85, 247)',  // Purple
  'rgb(236, 72, 153)',  // Pink
  'rgb(14, 165, 233)',  // Light Blue
  'rgb(251, 191, 36)',  // Yellow
  'rgb(139, 92, 246)',  // Indigo
  'rgb(248, 113, 113)', // Light Red
  'rgb(16, 185, 129)',  // Teal
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
  const [isMoving, setIsMoving] = useState(true);
  const [direction, setDirection] = useState(1);
  const animationFrameRef = useRef();
  const lastTimeRef = useRef(performance.now());
  const directionRef = useRef(1);
  
  const mbPerSecond = throughputToMBs(throughput);
  const baseSpeed = Math.cbrt(mbPerSecond) * 2;
  const baseDuration = 1000 / baseSpeed;
  
  const barLength = Math.max(5, Math.min(40, (Math.log10(latency + 1) / Math.log10(maxLatency + 1)) * 40));
  const maxPosition = 100 - barLength;

  const blurAmount = Math.min(20, Math.max(2, Math.cbrt(mbPerSecond) * (barLength / 20)));

  useEffect(() => {
    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTimeRef.current;
      
      if (deltaTime >= 16) {
        lastTimeRef.current = currentTime;
        setIsMoving(true);
        
        setPosition(prevPosition => {
          let newPosition = prevPosition + (deltaTime / baseDuration * directionRef.current);
          if (newPosition > maxPosition) {
            newPosition = maxPosition;
            directionRef.current = -1;
            setDirection(-1);
          } else if (newPosition < 0) {
            newPosition = 0;
            directionRef.current = 1;
            setDirection(1);
          }
          return newPosition;
        });
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [maxPosition, baseDuration]);

  const getBlurStyle = () => {
    if (!isMoving) return '';
    const blurDirection = direction === 1 ? '-90' : '90';
    return `blur(${blurAmount}px) motion-safe:blur(${blurAmount}px)`;
  };

  return (
    <div className="relative w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
      <div
        className="absolute top-0 h-8 rounded-lg"
        style={{
          left: `${position}%`,
          width: `${barLength}%`,
          backgroundColor: color,
          boxShadow: `0 0 15px ${color}40`,
          filter: getBlurStyle(),
          transform: `scaleX(${1 + (blurAmount / 100)})`,
          transformOrigin: direction === 1 ? 'left' : 'right',
          transition: 'transform 0.1s',
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-full"
          style={{
            background: `linear-gradient(to ${direction === 1 ? 'left' : 'right'}, ${color}, transparent)`,
            opacity: 0.3,
            transform: `scaleX(${(blurAmount / 10)})`,
            transformOrigin: direction === 1 ? 'right' : 'left',
          }}
        />
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
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="flex gap-2">
          <Timer className="w-6 h-6" />
          <ArrowDownUp className="w-6 h-6" />
        </div>
        <div>
          <CardTitle>Operation Performance Visualization</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Bar length = latency (longer = slower) | Movement speed = throughput (faster = better)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <colgroup>
              <col className="w-40" />
              <col className="w-32" />
              <col className="w-32" />
              <col className="w-[calc(100%-416px)]" />
            </colgroup>
            <thead>
              <tr className="border-b border-gray-200">
                <th className="p-2 text-left font-medium">Operation</th>
                <th className="p-2 text-left font-medium">Throughput</th>
                <th className="p-2 text-left font-medium">Latency</th>
                <th className="p-2 text-left font-medium">Visualization</th>
              </tr>
            </thead>
            <tbody>
              {operations.map((op, i) => (
                <tr 
                  key={i} 
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  title={op.description}
                >
                  <td className="p-2 truncate font-medium" title={op.name}>
                    {op.name}
                  </td>
                  <td className="p-2 text-sm">
                    {formatThroughput(op.throughput)}
                  </td>
                  <td className="p-2 text-sm">
                    {formatLatency(op.latency)}
                  </td>
                  <td className="p-2">
                    <Bar 
                      throughput={op.throughput}
                      color={colors[i % colors.length]}
                      latency={op.latency}
                      maxLatency={maxLatency}
                    />
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