const colors = {
  OK: 'green',
  Active: 'green',
  Pass: 'green',
  Completed: 'green',
  'Due soon': 'orange',
  'Under Maintenance': 'orange',
  'In Progress': 'orange',
  Scheduled: 'blue',
  Overdue: 'red',
  Fail: 'red',
  'Out of Service': 'red',
  'Not calibrated': 'grey',
};

export default function Badge({ text }) {
  return <span className={`badge ${colors[text] || 'grey'}`}>{text}</span>;
}
