import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, BASE_URL, fmtDate, toInputDate, calibrationState } from '../api.js';
import Badge from '../components/Badge.jsx';

export default function EquipmentDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [cals, setCals] = useState([]);
  const [maint, setMaint] = useState([]);
  const [error, setError] = useState('');

  const [calForm, setCalForm] = useState({ calibrationDate: '', nextDueDate: '', performedBy: '', result: 'Pass', notes: '' });
  const [file, setFile] = useState(null);
  const [mForm, setMForm] = useState({ type: 'Preventive', date: '', technician: '', description: '', cost: 0, status: 'Completed' });

  const canEdit = user.role === 'ADMIN' || user.role === 'TECHNICIAN';
  const isAdmin = user.role === 'ADMIN';

  const load = async () => {
    try {
      const [d, c, m] = await Promise.all([
        api(`/equipment/${id}`),
        api(`/calibrations?equipment=${id}`),
        api(`/maintenance?equipment=${id}`),
      ]);
      setDevice(d); setCals(c); setMaint(m);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, [id]);

  const addCalibration = async (e) => {
    e.preventDefault();
    setError('');
    const fd = new FormData();
    fd.append('equipment', id);
    Object.entries(calForm).forEach(([k, v]) => v && fd.append(k, v));
    if (file) fd.append('certificate', file);
    try {
      await api('/calibrations', { method: 'POST', body: fd, isForm: true });
      setCalForm({ calibrationDate: '', nextDueDate: '', performedBy: '', result: 'Pass', notes: '' });
      setFile(null);
      e.target.reset();
      load();
    } catch (err) { setError(err.message); }
  };

  const addMaintenance = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/maintenance', { method: 'POST', body: { ...mForm, equipment: id } });
      setMForm({ type: 'Preventive', date: '', technician: '', description: '', cost: 0, status: 'Completed' });
      load();
    } catch (err) { setError(err.message); }
  };

  const changeStatus = async (status) => {
    try { await api(`/equipment/${id}`, { method: 'PUT', body: { status } }); load(); }
    catch (err) { setError(err.message); }
  };

  const markDone = async (m) => {
    await api(`/maintenance/${m._id}`, { method: 'PUT', body: { status: 'Completed' } });
    load();
  };

  const remove = async (path, msg) => {
    if (!window.confirm(msg)) return;
    try { await api(path, { method: 'DELETE' }); load(); }
    catch (err) { setError(err.message); }
  };

  const deleteDevice = async () => {
    if (!window.confirm('Delete this device and ALL its records?')) return;
    await api(`/equipment/${id}`, { method: 'DELETE' });
    navigate('/equipment');
  };

  if (!device) return <p>{error || 'Loading...'}</p>;

  return (
    <div>
      <Link to="/equipment">← Back to devices</Link>
      <div className="row between">
        <h1>{device.name}</h1>
        {isAdmin && <button className="btn danger" onClick={deleteDevice}>Delete device</button>}
      </div>
      {error && <p className="error">{error}</p>}

      <div className="card info">
        <div><span className="muted">Asset ID</span><br />{device.assetId}</div>
        <div><span className="muted">Category</span><br />{device.category || '—'}</div>
        <div><span className="muted">Manufacturer / Model</span><br />{device.manufacturer || '—'} {device.model}</div>
        <div><span className="muted">Serial no.</span><br />{device.serialNumber || '—'}</div>
        <div><span className="muted">Location</span><br />{device.location || '—'}</div>
        <div><span className="muted">Status</span><br />
          {canEdit ? (
            <select value={device.status} onChange={(e) => changeStatus(e.target.value)}>
              <option>Active</option><option>Under Maintenance</option><option>Out of Service</option>
            </select>
          ) : <Badge text={device.status} />}
        </div>
        <div><span className="muted">Last calibrated</span><br />{fmtDate(device.lastCalibrationDate)}</div>
        <div><span className="muted">Next due</span><br />{fmtDate(device.nextCalibrationDate)} <Badge text={calibrationState(device.nextCalibrationDate)} /></div>
      </div>

      {/* ---------------- Calibration ---------------- */}
      <h2>Calibration records</h2>
      {canEdit && (
        <form className="card grid" onSubmit={addCalibration}>
          <label>Calibration date *<input type="date" required value={calForm.calibrationDate} onChange={(e) => setCalForm({ ...calForm, calibrationDate: e.target.value })} /></label>
          <label>Next due date (auto if empty)<input type="date" value={calForm.nextDueDate} onChange={(e) => setCalForm({ ...calForm, nextDueDate: e.target.value })} /></label>
          <label>Performed by<input value={calForm.performedBy} onChange={(e) => setCalForm({ ...calForm, performedBy: e.target.value })} /></label>
          <label>Result
            <select value={calForm.result} onChange={(e) => setCalForm({ ...calForm, result: e.target.value })}>
              <option>Pass</option><option>Fail</option>
            </select>
          </label>
          <label>Certificate (PDF / image / Word, max 5 MB)<input type="file" accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" onChange={(e) => setFile(e.target.files[0])} /></label>
          <label>Notes<input value={calForm.notes} onChange={(e) => setCalForm({ ...calForm, notes: e.target.value })} /></label>
          <div className="full"><button className="btn primary" type="submit">Add calibration record</button></div>
        </form>
      )}
      <div className="card">
        <table>
          <thead><tr><th>Date</th><th>Next due</th><th>By</th><th>Result</th><th>Notes</th><th>Certificate</th>{isAdmin && <th></th>}</tr></thead>
          <tbody>
            {cals.length === 0 && <tr><td colSpan="7" className="muted">No calibration records yet.</td></tr>}
            {cals.map((c) => (
              <tr key={c._id}>
                <td>{fmtDate(c.calibrationDate)}</td>
                <td>{fmtDate(c.nextDueDate)}</td>
                <td>{c.performedBy || '—'}</td>
                <td><Badge text={c.result} /></td>
                <td>{c.notes || '—'}</td>
                <td>{c.certificateFile ? <a href={`${BASE_URL}/uploads/${c.certificateFile}`} target="_blank" rel="noreferrer">{c.certificateName || 'View'}</a> : '—'}</td>
                {isAdmin && <td><button className="btn small-btn danger" onClick={() => remove(`/calibrations/${c._id}`, 'Delete this calibration record?')}>Delete</button></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---------------- Maintenance ---------------- */}
      <h2>Maintenance records</h2>
      {canEdit && (
        <form className="card grid" onSubmit={addMaintenance}>
          <label>Type
            <select value={mForm.type} onChange={(e) => setMForm({ ...mForm, type: e.target.value })}>
              <option>Preventive</option><option>Corrective</option>
            </select>
          </label>
          <label>Date *<input type="date" required value={mForm.date} onChange={(e) => setMForm({ ...mForm, date: e.target.value })} /></label>
          <label>Technician<input value={mForm.technician} onChange={(e) => setMForm({ ...mForm, technician: e.target.value })} /></label>
          <label>Cost<input type="number" min="0" value={mForm.cost} onChange={(e) => setMForm({ ...mForm, cost: e.target.value })} /></label>
          <label>Status
            <select value={mForm.status} onChange={(e) => setMForm({ ...mForm, status: e.target.value })}>
              <option>Completed</option><option>In Progress</option><option>Scheduled</option>
            </select>
          </label>
          <label>Description *<input required value={mForm.description} onChange={(e) => setMForm({ ...mForm, description: e.target.value })} /></label>
          <div className="full"><button className="btn primary" type="submit">Add maintenance record</button></div>
        </form>
      )}
      <div className="card">
        <table>
          <thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Technician</th><th>Cost</th><th>Status</th>{canEdit && <th></th>}</tr></thead>
          <tbody>
            {maint.length === 0 && <tr><td colSpan="7" className="muted">No maintenance records yet.</td></tr>}
            {maint.map((m) => (
              <tr key={m._id}>
                <td>{fmtDate(m.date)}</td>
                <td>{m.type}</td>
                <td>{m.description}</td>
                <td>{m.technician || '—'}</td>
                <td>{m.cost}</td>
                <td><Badge text={m.status} /></td>
                {canEdit && (
                  <td>
                    {m.status !== 'Completed' && <button className="btn small-btn" onClick={() => markDone(m)}>Mark done</button>}{' '}
                    {isAdmin && <button className="btn small-btn danger" onClick={() => remove(`/maintenance/${m._id}`, 'Delete this maintenance record?')}>Delete</button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
