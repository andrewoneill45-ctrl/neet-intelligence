import React from 'react';
import { RankedBars, GroupedBars, COL, pct, fmt1, rateColor } from './charts';

const SEND_LABEL = { 'No SEN': 'No SEN', 'SEN support': 'SEN support', 'SEN EHC/statement': 'EHC plan' };
const SEND_ORDER = ['No SEN', 'SEN support', 'SEN EHC/statement'];
const ETH_LABEL = { white: 'White', mixed: 'Mixed', asian: 'Asian', black: 'Black', chinese: 'Chinese', other: 'Other', 'not known': 'Not known' };

export default function SendDisadvantage({ data }) {
  const send = data.national.breakdowns.SEND || {};
  const sendBars = SEND_ORDER.filter(k => send[k] != null).map(k => ({
    label: SEND_LABEL[k] || k, value: send[k], color: rateColor(send[k], 11),
  }));
  const eth = data.national.breakdowns.ethnicity || {};
  const ethBars = Object.entries(eth).filter(([k]) => k !== 'not known').sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({ label: ETH_LABEL[k] || k, value: v, color: COL.blue }));

  const a = data.admissions;
  const disGroups = [{
    label: 'School leavers with no sustained destination',
    bars: [
      { v: a.nondis_ns_national, color: COL.blue, name: 'Not disadvantaged' },
      { v: a.dis_ns_national, color: COL.crimson, name: 'Disadvantaged' },
    ],
  }];

  const regionEhcp = data.regions.filter(r => r.send && r.send.ehcp != null)
    .map(r => ({ label: r.name, value: r.send.ehcp, color: rateColor(r.send.ehcp, 16), hl: r.name === 'North East' }))
    .sort((x, y) => y.value - x.value);

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">SEND and disadvantage: the defining shift</h1>
      <p className="nd-sub">Milburn's central finding is that health, disability and special needs now define who becomes and stays NEET. The data bears this out at every level: need and disadvantage track disengagement far more strongly than anything else schools are measured on.</p>

      <div className="nd-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="nd-card">
          <div className="nd-card-title">NEET or not known by special need (16-17, 2025)</div>
          <div className="nd-card-desc">Young people with an EHC plan are roughly twice as likely to be NEET or not known as those with no identified need.</div>
          <RankedBars data={sendBars} labelWidth={120} max={12} />
        </div>
        <div className="nd-card">
          <div className="nd-card-title">The disadvantage gap at school leaving</div>
          <div className="nd-card-desc">Share of leavers with no sustained destination, disadvantaged vs not (KS4 2022/23).</div>
          <GroupedBars groups={disGroups} maxV={13} width={460} />
          <div className="nd-mult" style={{ marginTop: 6 }}>Disadvantaged leavers are <b>{fmt1(a.dis_ns_national / a.nondis_ns_national)}×</b> as likely to have no sustained destination.</div>
        </div>
      </div>

      <div className="nd-grid" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
        <div className="nd-card">
          <div className="nd-card-title">EHC plan NEET / not known by region</div>
          <div className="nd-card-desc">The SEND gradient is not evenly spread. Where it is steepest, the inclusion and participation agendas matter most.</div>
          <RankedBars data={regionEhcp} labelWidth={150} max={Math.max(...regionEhcp.map(r => r.value)) * 1.05} />
        </div>
        <div className="nd-card">
          <div className="nd-card-title">NEET or not known by ethnicity (16-17, 2025)</div>
          <div className="nd-card-desc">For context alongside need and disadvantage.</div>
          <RankedBars data={ethBars} labelWidth={120} max={Math.max(...ethBars.map(b => b.value)) * 1.1} />
        </div>
      </div>

      <div className="nd-callout">
        <b>Policy read.</b> This is the territory of the SEND reforms, the National Inclusion Framework and the Inclusion Premium. The data supports making participation an explicit aim of inclusion policy: a plan for what a young person can do, with supported routes into work, rather than a gateway out of the labour market. It is the strongest single argument in the room for prevention spend following need.
      </div>
      <p className="nd-note">Source: DfE, Participation and NEET age 16 to 17 by local authority, 2024/25 (SEND and ethnicity breakdowns); KS4 destination measures, 2022/23 cohort (disadvantage). Disadvantage at KS4 uses the published disadvantaged pupil definition.</p>
    </div>
  );
}
