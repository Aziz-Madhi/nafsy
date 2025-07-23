/**
 * Performance Dashboard - Development Tool
 * Real-time performance monitoring for optimization validation
 */

import React, { useState, useEffect } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '~/components/ui/text';
import { performanceMonitor } from '~/lib/performance-monitor';
import { bundleAnalyzer } from '~/lib/bundle-analyzer';

interface PerformanceDashboardProps {
  visible?: boolean;
  onClose?: () => void;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  visible = false,
  onClose,
}) => {
  const [metrics, setMetrics] = useState({
    startup: performanceMonitor.getStartupMetrics(),
    bundle: performanceMonitor.getBundleMetrics(),
    optimization: performanceMonitor.getOptimizationReport(),
    bundleAnalysis: bundleAnalyzer.generateSummary(),
  });

  useEffect(() => {
    if (visible) {
      const interval = setInterval(() => {
        setMetrics({
          startup: performanceMonitor.getStartupMetrics(),
          bundle: performanceMonitor.getBundleMetrics(),
          optimization: performanceMonitor.getOptimizationReport(),
          bundleAnalysis: bundleAnalyzer.generateSummary(),
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [visible]);

  if (!visible) return null;

  const formatTime = (ms: number) => (ms > 0 ? `${ms.toFixed(0)}ms` : 'N/A');
  const formatPercent = (percent: number) => `${percent.toFixed(1)}%`;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/80 z-50">
      <View className="flex-1 bg-white m-4 rounded-lg">
        <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
          <Text variant="title2" className="font-semibold">
            Performance Dashboard
          </Text>
          <Pressable
            onPress={onClose}
            className="px-3 py-1 bg-gray-100 rounded"
          >
            <Text>Close</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Startup Metrics */}
          <View className="mb-6">
            <Text variant="title3" className="font-semibold mb-3">
              🚀 Startup Performance
            </Text>
            <View className="bg-gray-50 p-3 rounded-lg">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">First Render</Text>
                <Text className="font-mono">
                  {formatTime(metrics.startup.firstRenderTime)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Time to Interactive</Text>
                <Text className="font-mono">
                  {formatTime(metrics.startup.timeToInteractive)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">JS Load Time</Text>
                <Text className="font-mono">
                  {formatTime(metrics.startup.jsLoadTime)}
                </Text>
              </View>
            </View>
          </View>

          {/* Bundle Optimization Summary */}
          <View className="mb-6">
            <Text variant="title3" className="font-semibold mb-3">
              📦 Bundle Optimization
            </Text>
            <View className="bg-blue-50 p-3 rounded-lg">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Total Reduction</Text>
                <Text className="font-mono text-blue-600">
                  {metrics.bundleAnalysis.totalReduction.toLocaleString()} lines
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Reduction Percentage</Text>
                <Text className="font-mono text-blue-600">
                  {formatPercent(metrics.bundleAnalysis.reductionPercentage)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Impact Score</Text>
                <Text className="font-mono text-blue-600">
                  {metrics.bundleAnalysis.impactScore}/100
                </Text>
              </View>
            </View>
          </View>

          {/* Lazy Loading Performance */}
          <View className="mb-6">
            <Text variant="title3" className="font-semibold mb-3">
              ⚡ Lazy Loading
            </Text>
            <View className="bg-green-50 p-3 rounded-lg">
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Average Load Time</Text>
                <Text className="font-mono text-green-600">
                  {formatTime(metrics.optimization.averageLazyLoadTime)}
                </Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-gray-600">Critical Path %</Text>
                <Text className="font-mono text-green-600">
                  {formatPercent(metrics.optimization.criticalPathPercentage)}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Performance Score</Text>
                <Text className="font-mono text-green-600">
                  {metrics.optimization.performanceScore}/100
                </Text>
              </View>
            </View>
          </View>

          {/* Component Load Times */}
          {Object.keys(metrics.bundle.componentLoadTimes).length > 0 && (
            <View className="mb-6">
              <Text variant="title3" className="font-semibold mb-3">
                🎯 Component Load Times
              </Text>
              <View className="bg-yellow-50 p-3 rounded-lg">
                {Object.entries(metrics.bundle.componentLoadTimes).map(
                  ([component, time]) => (
                    <View
                      key={component}
                      className="flex-row justify-between mb-2"
                    >
                      <Text className="text-gray-600 flex-1" numberOfLines={1}>
                        {component}
                      </Text>
                      <Text className="font-mono text-yellow-600 ml-2">
                        {formatTime(time)}
                      </Text>
                    </View>
                  )
                )}
              </View>
            </View>
          )}

          {/* Optimization Categories */}
          <View className="mb-6">
            <Text variant="title3" className="font-semibold mb-3">
              🔧 Optimizations by Type
            </Text>
            {Object.entries(metrics.bundleAnalysis.optimizationsByType).map(
              ([type, optimizations]) => {
                const totalReduction = optimizations.reduce(
                  (sum, opt) => sum + (opt.beforeSize - opt.afterSize),
                  0
                );
                const avgReduction =
                  optimizations.reduce((sum, opt) => sum + opt.reduction, 0) /
                  optimizations.length;

                return (
                  <View key={type} className="bg-purple-50 p-3 rounded-lg mb-2">
                    <View className="flex-row justify-between mb-2">
                      <Text className="font-semibold capitalize">{type}</Text>
                      <Text className="font-mono text-purple-600">
                        -{totalReduction} lines ({formatPercent(avgReduction)})
                      </Text>
                    </View>
                    <View className="ml-2">
                      {optimizations.slice(0, 3).map((opt, index) => (
                        <Text key={index} className="text-xs text-gray-600">
                          • {opt.componentName}: {opt.beforeSize}→
                          {opt.afterSize} (-{formatPercent(opt.reduction)})
                        </Text>
                      ))}
                      {optimizations.length > 3 && (
                        <Text className="text-xs text-gray-500">
                          ... and {optimizations.length - 3} more
                        </Text>
                      )}
                    </View>
                  </View>
                );
              }
            )}
          </View>

          {/* Actions */}
          <View className="flex-row gap-2 mb-4">
            <Pressable
              onPress={() => performanceMonitor.logAllMetrics()}
              className="flex-1 bg-blue-500 p-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                Log All Metrics
              </Text>
            </Pressable>
            <Pressable
              onPress={() => performanceMonitor.clearMetrics()}
              className="flex-1 bg-red-500 p-3 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                Clear Metrics
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};
