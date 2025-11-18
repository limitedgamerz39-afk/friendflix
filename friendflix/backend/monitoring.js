#!/usr/bin/env node

// monitoring.js
// Simple monitoring script for Friendflix backend

const express = require('express');
const app = express();
const PORT = process.env.MONITORING_PORT || 9091;

// Middleware
app.use(express.json());

// Metrics storage
let metrics = {
  activeUsers: 0,
  totalPosts: 0,
  apiLatency: {},
  errorRate: 0
};

// Prometheus-style metrics endpoint
app.get('/metrics', (req, res) => {
  let metricsOutput = '';
  
  // Active users
  metricsOutput += '# HELP friendflix_active_users Number of active users\n';
  metricsOutput += '# TYPE friendflix_active_users gauge\n';
  metricsOutput += `friendflix_active_users ${metrics.activeUsers}\n\n`;
  
  // Total posts
  metricsOutput += '# HELP friendflix_total_posts Total number of posts\n';
  metricsOutput += '# TYPE friendflix_total_posts gauge\n';
  metricsOutput += `friendflix_total_posts ${metrics.totalPosts}\n\n`;
  
  // API latency
  for (const [endpoint, latency] of Object.entries(metrics.apiLatency)) {
    metricsOutput += `# HELP friendflix_api_latency_${endpoint.replace(/[\/\-]/g, '_')} API latency for ${endpoint}\n`;
    metricsOutput += `# TYPE friendflix_api_latency_${endpoint.replace(/[\/\-]/g, '_')} gauge\n`;
    metricsOutput += `friendflix_api_latency_${endpoint.replace(/[\/\-]/g, '_')} ${latency}\n\n`;
  }
  
  // Error rate
  metricsOutput += '# HELP friendflix_error_rate Application error rate\n';
  metricsOutput += '# TYPE friendflix_error_rate gauge\n';
  metricsOutput += `friendflix_error_rate ${metrics.errorRate}\n\n`;
  
  res.set('Content-Type', 'text/plain');
  res.send(metricsOutput);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Update metrics (in a real app, these would be updated by the application)
setInterval(() => {
  // Simulate updating metrics
  metrics.activeUsers = Math.floor(Math.random() * 1000) + 500;
  metrics.totalPosts = Math.floor(Math.random() * 10000) + 5000;
  metrics.apiLatency['/api/posts'] = (Math.random() * 100).toFixed(2);
  metrics.apiLatency['/api/users'] = (Math.random() * 150).toFixed(2);
  metrics.errorRate = (Math.random() * 5).toFixed(2);
}, 5000);

// Start server
app.listen(PORT, () => {
  console.log(`Friendflix monitoring server running on port ${PORT}`);
});

module.exports = app;