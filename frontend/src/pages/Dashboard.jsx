import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate, daysLeft } from '../api.js';

function Stat({ label, value, color }) {
  return (
    <div className={`stat ${color || ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function DeviceTable({ title, items, empty, overdue }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <table>
          <thead>
            <tr><th>Device</th><th>Asset ID</th><th>Location</th><th>Due date</th><th>{overdue ? 'Days overdue' : 'Days left'}</th></tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d._id}>
                <td><Link to={`/equipment/${d._id}`}>{d.name}</Link></td>
                <td>{d.assetId}</td>
                <td>{d.location || '—'}</td>
                <td>{fmtDate(d.nextCalibrationDate)}</td>
                <td>{Math.abs(daysLeft(d.nextCalibrationDate))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/dashboard').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p>Loading...</p>;
  const c = data.counts;

  return (
    <div>
      <h1>Dashboard</h1>
      <div className="stats">
        <Stat label="Total devices" value={c.total} />
        <Stat label="Active" value={c.active} color="green" />
        <Stat label="Overdue calibration" value={c.overdue} color="red" />
        <Stat label="Due in 30 days" value={c.dueSoon} color="orange" />
        <Stat label="Under maintenance" value={c.underMaintenance} color="orange" />
        <Stat label="Out of service" value={c.outOfService} color="red" />
        <Stat label="Never calibrated" value={c.neverCalibrated} />
        <Stat label="Open maintenance jobs" value={c.openMaintenance} color="blue" />
      </div>

      <DeviceTable title="Overdue calibrations" items={data.overdue} empty="No overdue devices. Great!" overdue />
      <DeviceTable title="Upcoming calibrations (next 30 days)" items={data.upcoming} empty="Nothing due in the next 30 days." />
    </div>
  );
}
