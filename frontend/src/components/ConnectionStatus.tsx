export function ConnectionStatus({ status }: { status: 'connected' | 'reconnecting' | 'offline' }) {
  const config = {
    connected: { color: 'bg-plant-healthy', text: 'Connected' },
    reconnecting: { color: 'bg-plant-warning', text: 'Reconnecting...' },
    offline: { color: 'bg-plant-critical', text: 'Offline' }
  };

  const current = config[status] || config.offline;

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white shadow-sm"
      data-testid="connection-status"
    >
      <div className={`w-2 h-2 rounded-full ${current.color}`} />
      <span className="text-sm font-medium text-gray-700">{current.text}</span>
    </div>
  );
}
