import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Modern Chart Component with multiple chart types
 * @param {Object} props - Chart props
 * @param {string} props.type - Chart type (line, bar, pie, doughnut)
 * @param {Object} props.data - Chart data
 * @param {Object} props.options - Chart options
 * @param {string} props.className - Additional CSS classes
 * @param {number} props.height - Chart height
 * @param {boolean} props.responsive - Whether chart is responsive
 */
const Chart = ({ 
  type = 'line', 
  data, 
  options = {}, 
  className = '', 
  height = 300,
  responsive = true 
}) => {
  const chartRef = useRef(null);

  // Default modern chart options
  const defaultOptions = {
    responsive: responsive,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 20,
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        }
      }
    },
    scales: type === 'pie' || type === 'doughnut' ? {} : {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          color: '#6B7280'
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          borderColor: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif"
          },
          color: '#6B7280'
        }
      }
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        borderWidth: 2,
        hoverBorderWidth: 3
      },
      line: {
        tension: 0.4,
        borderWidth: 3
      },
      bar: {
        borderRadius: 6,
        borderSkipped: false
      }
    }
  };

  // Merge default options with provided options
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins
    }
  };

  // Modern color schemes
  const getModernColors = (count = 1) => {
    const colors = [
      '#3B82F6', // Blue
      '#10B981', // Emerald
      '#F59E0B', // Amber
      '#EF4444', // Red
      '#8B5CF6', // Purple
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#6366F1'  // Indigo
    ];
    return colors.slice(0, count);
  };

  // Prepare chart data
  const prepareChartData = () => {
    // If data is already in Chart.js format, return as-is
    if (data.datasets) return data;

    // Convert simplified data format to Chart.js format
    return {
      labels: data.labels || [],
      datasets: [{
        label: data.label || 'Data',
        data: data.values || [],
        backgroundColor: data.backgroundColor || getModernColors(1)[0] + '20',
        borderColor: data.borderColor || getModernColors(1)[0],
        fill: type === 'line',
        tension: type === 'line' ? 0.4 : undefined
      }]
    };
  };

  const chartData = prepareChartData();

  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data: chartData,
      options: mergedOptions,
      height: height
    };

    switch (type) {
      case 'bar':
        return <Bar {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'line':
      default:
        return <Line {...commonProps} />;
    }
  };

  return (
    <div className={`w-full ${className}`} style={{ height: `${height}px` }}>
      {renderChart()}
    </div>
  );
};

/**
 * Predefined chart components for common use cases
 */
export const RevenueChart = ({ data, period = 'monthly' }) => {
  const chartData = {
    labels: data?.labels || [],
    values: data?.values || [],
    label: 'Revenue',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6'
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: `Revenue Trend (${period})`,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          }
        }
      }
    }
  };

  return <Chart type="line" data={chartData} options={options} height={300} />;
};

export const OccupancyChart = ({ data }) => {
  const chartData = {
    labels: ['Occupied', 'Vacant'],
    values: [data?.occupied || 0, data?.vacant || 0],
    backgroundColor: ['#10B981', '#F3F4F6'],
    borderColor: ['#059669', '#D1D5DB']
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: 'Room Occupancy',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      }
    }
  };

  return <Chart type="doughnut" data={chartData} options={options} height={250} />;
};

export const TicketStatusChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || ['Open', 'In Progress', 'Resolved', 'Closed'],
    values: data?.values || [0, 0, 0, 0],
    backgroundColor: [
      '#EF4444',
      '#F59E0B', 
      '#10B981',
      '#6B7280'
    ]
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: 'Ticket Status Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      }
    }
  };

  return <Chart type="bar" data={chartData} options={options} height={300} />;
};

export const PaymentTrendChart = ({ data }) => {
  const chartData = {
    labels: data?.labels || [],
    datasets: [
      {
        label: 'Completed',
        data: data?.completed || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: '#10B981'
      },
      {
        label: 'Pending',
        data: data?.pending || [],
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderColor: '#F59E0B'
      },
      {
        label: 'Overdue',
        data: data?.overdue || [],
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: '#EF4444'
      }
    ]
  };

  const options = {
    plugins: {
      title: {
        display: true,
        text: 'Payment Status Trend',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      }
    },
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true,
        beginAtZero: true
      }
    }
  };

  return <Chart type="bar" data={chartData} options={options} height={300} />;
};

export default Chart;
