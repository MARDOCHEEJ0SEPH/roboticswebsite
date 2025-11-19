'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import dynamic from 'next/dynamic';

// Dynamically import map to avoid SSR issues
const RobotMap = dynamic(() => import('./components/RobotMap'), { ssr: false });

export default function Dashboard() {
  const [robots, setRobots] = useState([]);
  const [threats, setThreats] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    setSocket(newSocket);

    // Subscribe to dashboard updates
    newSocket.emit('dashboard:subscribe');

    // Listen for robot updates
    newSocket.on('robot:update', (robot) => {
      setRobots(prev => {
        const existing = prev.find(r => r.id === robot.id);
        if (existing) {
          return prev.map(r => r.id === robot.id ? robot : r);
        }
        return [...prev, robot];
      });
    });

    // Listen for threats
    newSocket.on('threat:detected', (threat) => {
      setThreats(prev => [threat, ...prev].slice(0, 10));
    });

    // Listen for system status
    newSocket.on('system:status', (status) => {
      setSystemStatus(status);
    });

    return () => newSocket.close();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              🤖 RoboGuard Pro
              <span className="text-sm text-green-400">● AUTONOMOUS</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <span className="text-gray-400">Robots Active:</span>
                <span className="ml-2 text-green-400 font-bold">{robots.filter(r => r.status === 'online').length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">Active Threats:</span>
                <span className="ml-2 text-red-400 font-bold">{threats.filter(t => t.status === 'active').length}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Robot Status Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Robot Fleet</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {robots.map(robot => (
                <RobotCard key={robot.id} robot={robot} />
              ))}
            </div>

            {/* Live Map */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Live Fleet Tracking</h3>
              <div className="h-96 bg-gray-900 rounded">
                <RobotMap robots={robots} threats={threats} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* System Status */}
            {systemStatus && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Autonomous System</h3>
                <div className="space-y-2 text-sm">
                  <StatusRow label="Mode" value={systemStatus.mode} status="success" />
                  <StatusRow label="Running" value={systemStatus.running ? 'Yes' : 'No'} status={systemStatus.running ? 'success' : 'error'} />
                  <StatusRow label="Evolution Gen" value={systemStatus.evolution?.generation || 0} status="info" />
                  <StatusRow label="Learning KB" value={systemStatus.learning?.knowledge_base_size || 0} status="info" />
                </div>
              </div>
            )}

            {/* Threats */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">Recent Threats</h3>
              <div className="space-y-2">
                {threats.length === 0 ? (
                  <p className="text-gray-400 text-sm">No active threats</p>
                ) : (
                  threats.map(threat => (
                    <ThreatCard key={threat.id} threat={threat} />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RobotCard({ robot }) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    charging: 'bg-yellow-500',
    maintenance: 'bg-blue-500',
    emergency: 'bg-red-500'
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{robot.name}</h4>
          <p className="text-sm text-gray-400">{robot.model}</p>
        </div>
        <span className={`w-3 h-3 rounded-full ${statusColors[robot.status]}`} />
      </div>
      <div className="mt-3 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Battery:</span>
          <span className={robot.batteryLevel < 20 ? 'text-red-400' : 'text-green-400'}>
            {robot.batteryLevel}%
          </span>
        </div>
        {robot.currentTask && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Task:</span>
            <span className="text-blue-400">{robot.currentTask}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ThreatCard({ threat }) {
  const levelColors = {
    low: 'text-yellow-400',
    medium: 'text-orange-400',
    high: 'text-red-400',
    critical: 'text-red-600'
  };

  return (
    <div className="bg-gray-900 rounded p-3 border border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`font-semibold ${levelColors[threat.threatLevel]}`}>
            {threat.threatType.replace('_', ' ').toUpperCase()}
          </p>
          <p className="text-xs text-gray-400 mt-1">{threat.description}</p>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(threat.detectedAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

function StatusRow({ label, value, status }) {
  const colors = {
    success: 'text-green-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };

  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className={colors[status]}>{value}</span>
    </div>
  );
}
