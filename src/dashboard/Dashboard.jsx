import React, { useState, useEffect } from 'react';
import Overview from './Overview';
import ReadyToWork from './ReadyToWork';
import Simulator from './Simulator';
import Geography from './Geography';
import Admissions from './Admissions';
import SendDisadvantage from './SendDisadvantage';
import Qualifications from './Qualifications';
import International from './International';
import WhiteWorkingClass from './WhiteWorkingClass';
import MilburnLens from './MilburnLens';

export default function Dashboard({ view, go, jumpToMap }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/neet_dashboard.json?v=' + Date.now()).then(r => r.json()).then(setData).catch(e => setErr(String(e)));
  }, []);

  if (err) return <div className="nd-page"><div className="nd-page-inner"><div className="nd-card">Could not load dashboard data: {err}</div></div></div>;
  if (!data) return <div className="nd-page"><div className="nd-page-inner" style={{ color: '#64748b', paddingTop: 40 }}>Loading NEET data…</div></div>;

  const Page = { overview: Overview, readytowork: ReadyToWork, simulator: Simulator, geography: Geography, admissions: Admissions, send: SendDisadvantage, qualifications: Qualifications, international: International, wwc: WhiteWorkingClass, milburn: MilburnLens }[view] || Overview;
  return <div className="nd-page"><Page data={data} go={go} jumpToMap={jumpToMap} /></div>;
}
