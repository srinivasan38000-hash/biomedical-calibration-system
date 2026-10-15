import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtDate, calibrationState } from '../api.js';
import Badge from '../components/Badge.jsx';

const emptyForm = {
  name: '', assetId: '', category: '', manufacturer: '', model: '',
  serialNumber: '', location: '', status: 'Active',
  calibrationIntervalDays: 365, lastCalibrationDate: '',
};

export default function Equipment({ user }) {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  const canEdit = user.role === 'ADMIN' || user.role === 'TECHNICIAN';

  const load = () => {
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    api(`/equipment?${q}`).then(setList).catch((e) => setError(e.message));
  };

  useEffect(load, [status]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/equipment', { method: 'POST', body: form });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="row between">
        <h1>Biomedical Devices</h1>
        {canEdit && (
          <button className="btn primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Close' : '+ Add device'}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card grid" onSubmit={save}>
          <label>Device name *<input name="name" value={form.name} onChange={change} required /></label>
          <label>Asset ID *<input name="assetId" value={form.assetId} onChange={change} required /></label>
          <label>Category<input name="category" placeholder="e.g. Monitor, Infusion pump" value={form.category} onChange={change} /></label>
          <label>Manufacturer<input name="manufacturer" value={form.manufacturer} onChange={change} /></label>
          <label>Model<input name="model" value={form.model} onChange={change} /></label>
          <label>Serial number<input name="serialNumber" value={form.serialNumber} onChange={change} /></label>
          <label>Location / Department<input name="location" value={form.location} onChange={change} /></label>
          <label>Status
            <select name="status" value={form.status} onChange={change}>
              <option>Active</option><option>Under Maintenance</option><option>Out of Service</option>
            </select>
          </label>
          <label>Calibration interval (days)<input name="calibrationIntervalDays" type="number" min="1" value={form.calibrationIntervalDays} onChange={change} /></label>
          <label>Last calibration date (optional)<input name="lastCalibrationDate" type="date" value={form.lastCalibrationDate} onChange={change} /></label>
          <div className="full"><button className="btn primary" type="submit">Save device</button></div>
        </form>
      )}
      {error && <p className="error">{error}</p>}

      <div className="row filters">
        <input placeholder="Search name, asset ID, location..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
        <button className="btn" onClick={load}>Search</button>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option>Active</option><option>Under Maintenance</option><option>Out of Service</option>
        </select>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Device</th><th>Asset ID</th><th>Category</th><th>Location</th><th>Status</th><th>Next calibration</th><th>Calibration</th></tr>
          </thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan="7" className="muted">No devices found.</td></tr>}
            {list.map((d) => (
              <tr key={d._id}>
                <td><Link to={`/equipment/${d._id}`}>{d.name}</Link></td>
                <td>{d.assetId}</td>
                <td>{d.category}</td>
                <td>{d.location || '—'}</td>
                <td><Badge text={d.status} /></td>
                <td>{fmtDate(d.nextCalibrationDate)}</td>
                <td><Badge text={calibrationState(d.nextCalibrationDate)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
