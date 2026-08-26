import React, { useState, useEffect, useRef } from 'react';
import { getChartsData } from '../../services/reportService';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import { Chart } from 'chart.js/auto';
import { TrendingUp, BarChart2, Award, Map, Droplet, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Analytics() {
  const [chartsData, setChartsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Canvas Refs
  const dailyVolumeRef = useRef(null);
  const qualityRef = useRef(null);
  const villageRef = useRef(null);
  const topQuantityRef = useRef(null);
  const monthlyRevenueRef = useRef(null);

  // Chart Instances
  const chartInstances = useRef({});

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getChartsData();
        if (res.success) {
          setChartsData(res.data);
        }
      } catch (err) {
        console.error('Failed to load charts analytics data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (!chartsData) return;

    // Destructure datasets
    const { daily, village, topQuantity, monthly } = chartsData;

    // Destroy existing instances to prevent overlays
    Object.keys(chartInstances.current).forEach((key) => {
      chartInstances.current[key]?.destroy();
    });

    const isDark = document.documentElement.classList.contains('dark');
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const textColor = isDark ? '#94a3b8' : '#475569';

    // 1. Daily Volume & Revenue Trend Line Chart
    if (dailyVolumeRef.current) {
      const ctx = dailyVolumeRef.current.getContext('2d');
      chartInstances.current.daily = new Chart(ctx, {
        type: 'line',
        data: {
          labels: daily.map(d => d._id),
          datasets: [
            {
              label: 'Milk Quantity (Liters)',
              data: daily.map(d => d.liters),
              borderColor: '#3b82f6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              yAxisID: 'yLiters',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5
            },
            {
              label: 'Value (₹)',
              data: daily.map(d => d.amount),
              borderColor: '#10b981',
              backgroundColor: 'transparent',
              yAxisID: 'yAmount',
              tension: 0.35,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { size: 10, weight: 'bold' } } }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
            yLiters: {
              type: 'linear',
              position: 'left',
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: 'Liters', color: textColor, font: { weight: 'bold' } }
            },
            yAmount: {
              type: 'linear',
              position: 'right',
              grid: { drawOnChartArea: false },
              ticks: { color: textColor },
              title: { display: true, text: 'Value (₹)', color: textColor, font: { weight: 'bold' } }
            }
          }
        }
      });
    }

    // 2. FAT & SNF Quality Curve
    if (qualityRef.current) {
      const ctx = qualityRef.current.getContext('2d');
      chartInstances.current.quality = new Chart(ctx, {
        type: 'line',
        data: {
          labels: daily.map(d => d._id),
          datasets: [
            {
              label: 'Average FAT %',
              data: daily.map(d => d.avgFat),
              borderColor: '#f59e0b',
              backgroundColor: 'transparent',
              tension: 0.3,
              borderWidth: 2
            },
            {
              label: 'Average SNF %',
              data: daily.map(d => d.avgSnf),
              borderColor: '#8b5cf6',
              backgroundColor: 'transparent',
              tension: 0.3,
              borderWidth: 2
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { labels: { color: textColor, font: { size: 10, weight: 'bold' } } }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 9 } } },
            y: {
              grid: { color: gridColor },
              ticks: { color: textColor },
              title: { display: true, text: 'Percentage Score %', color: textColor, font: { weight: 'bold' } }
            }
          }
        }
      });
    }

    // 3. Village-wise volume Bar Chart
    if (villageRef.current) {
      const ctx = villageRef.current.getContext('2d');
      chartInstances.current.village = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: village.map(v => v._id || 'Unknown'),
          datasets: [
            {
              label: 'Total Liters',
              data: village.map(v => v.liters),
              backgroundColor: '#6366f1',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    // 4. Top 10 Farmers by Milk Quantity Horizontal Bar Chart
    if (topQuantityRef.current) {
      const ctx = topQuantityRef.current.getContext('2d');
      chartInstances.current.topQty = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: topQuantity.map(f => f.name),
          datasets: [
            {
              label: 'Total Liters Collected',
              data: topQuantity.map(f => f.liters),
              backgroundColor: '#f43f5e',
              borderRadius: 6
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { display: false }, ticks: { color: textColor } }
          }
        }
      });
    }

    // 5. Monthly Revenue / Turnovers
    if (monthlyRevenueRef.current) {
      const ctx = monthlyRevenueRef.current.getContext('2d');
      chartInstances.current.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: monthly.map(m => m._id),
          datasets: [
            {
              label: 'Monthly Payout Liabilities',
              data: monthly.map(m => m.amount),
              backgroundColor: '#10b981',
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { grid: { color: gridColor }, ticks: { color: textColor } },
            y: { grid: { color: gridColor }, ticks: { color: textColor } }
          }
        }
      });
    }

    return () => {
      Object.keys(chartInstances.current).forEach((key) => {
        chartInstances.current[key]?.destroy();
      });
    };
  }, [chartsData]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <Breadcrumbs items={[{ label: 'Operations Analytics' }]} />
        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">
          Analytics Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Daily Intake & Value Trend */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-2.5">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Daily Milk Intake & Payout Trend</h3>
          </div>
          <div className="relative h-72">
            <canvas ref={dailyVolumeRef} />
          </div>
        </div>

        {/* Chart 2: FAT & SNF Quality curve */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-2.5">
            <Droplet className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Milk Quality FAT & SNF Curves</h3>
          </div>
          <div className="relative h-72">
            <canvas ref={qualityRef} />
          </div>
        </div>

        {/* Chart 3: Village wise breakdown */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-2.5">
            <Map className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Village-wise Volume Distribution</h3>
          </div>
          <div className="relative h-72">
            <canvas ref={villageRef} />
          </div>
        </div>

        {/* Chart 4: Top 10 Farmers */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-2.5">
            <Award className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Top 10 Farmers by Milk Volume</h3>
          </div>
          <div className="relative h-72">
            <canvas ref={topQuantityRef} />
          </div>
        </div>

        {/* Chart 5: Monthly Turnovers */}
        <div className="border border-slate-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-surface p-5 shadow-sm space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-2.5">
            <BarChart2 className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Monthly Turnovers (₹)</h3>
          </div>
          <div className="relative h-72">
            <canvas ref={monthlyRevenueRef} />
          </div>
        </div>

      </div>

    </div>
  );
}
