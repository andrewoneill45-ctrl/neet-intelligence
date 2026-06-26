import React from 'react';
import { TrendLine, RankedBars, COL, pct, fmt1, rateColor } from './charts';

export default function MilburnLens({ data }) {
  const n = data.national.latest;
  const send = data.national.breakdowns.SEND || {};
  const a = data.admissions;
  const topNK = [...data.las].sort((x, y) => y.nk - x.nk).slice(0, 6)
    .map(l => ({ label: l.name, value: l.nk, color: COL.amber }));
  const regionBars = data.regions.map(r => ({ label: r.name, value: r.neetnk, color: rateColor(r.neetnk, 8), hl: r.name === 'North East' }));
  const sendBars = [
    { label: 'No SEN', value: send['No SEN'], color: rateColor(send['No SEN'], 11) },
    { label: 'SEN support', value: send['SEN support'], color: rateColor(send['SEN support'], 11) },
    { label: 'EHC plan', value: send['SEN EHC/statement'], color: rateColor(send['SEN EHC/statement'], 11) },
  ];

  const Claim = ({ k, quote, fig, children }) => (
    <div className="nd-claim">
      <div className="said"><div className="k">{k}</div><div className="q">{quote}</div>{fig && <div className="fig">{fig}</div>}</div>
      <div className="shows"><div className="k">Our data shows</div>{children}</div>
    </div>
  );

  return (
    <div className="nd-page-inner">
      <h1 className="nd-h1">The Milburn lens</h1>
      <p className="nd-sub">Each claim from the interim review, set against what the published DfE data actually shows. Where his figures cover 16 to 24, ours are the 16 to 17 and KS4 series that schools can act on directly.</p>

      <Claim k="On scale and trajectory" quote="The problem is large and getting worse, with NEET numbers heading past 1.25 million within five years on current trends." fig="957,000 NEET (16-24) today; £125bn estimated annual cost.">
        <div style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 8 }}>16 to 17 NEET or not known has risen every year since 2022, to {pct(n.neetnk)}.</div>
        <TrendLine series={data.national.ts} color={COL.crimson} height={170} />
      </Claim>

      <Claim k="On geography" quote="An identical young person fares worse in Hartlepool than in Harrogate. Place is a multiplier, and risk concentrates in the North and on the coast." fig="Eight of the ten highest-risk authorities are in the North and Midlands.">
        <RankedBars data={regionBars} labelWidth={150} max={8} />
      </Claim>

      <Claim k="On who is out of sight" quote="314,000 are out of work and out of sight; no institution owns the young person, and the system loses track of them." fig="No single owner after 18.">
        <div style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 8 }}>Even at 16 to 17, {pct(n.nk)} are "activity not known". The authorities where tracking breaks down most:</div>
        <RankedBars data={topNK} labelWidth={150} max={Math.max(...topNK.map(t => t.value)) * 1.05} />
      </Claim>

      <Claim k="On the defining shift" quote="The single largest change is health, disability and above all mental health and special needs. The disabled NEET rate has barely moved in a decade." fig="Disabled NEET rate above 29% (16-24).">
        <div style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 8 }}>EHC plan holders are about twice as likely to be NEET or not known as those with no need.</div>
        <RankedBars data={sendBars} labelWidth={120} max={12} />
      </Claim>

      <Claim k="On a system that acts late" quote="The system sees the risk early, school readiness, absence, low attainment, SEND, and acts late or not at all." fig="Risk-of-NEET tools exist but are not mandated.">
        <div style={{ fontSize: '0.84rem', color: '#475569', lineHeight: 1.55 }}>
          Our addition to his case: the most selective schools sit almost entirely outside the risk. Non-selective schools carry <b style={{ color: COL.crimson }}>{pct(a.nonselective_ns)}</b> with no sustained destination against <b style={{ color: COL.blue }}>{pct(a.selective_ns)}</b> in selective schools, and <b style={{ color: COL.crimson }}>{fmt1(a.nonselective_dis_ns / a.selective_dis_ns)}×</b> the risk for disadvantaged pupils. The system does not just act late; it sorts risk away from the institutions best able to absorb it.
        </div>
      </Claim>

      <p className="nd-note">Milburn quotations are summarised from the interim review, Young People and Work (28 May 2026). DfE figures: Participation and NEET age 16 to 17 by local authority, 2024/25; KS4 destination measures, 2022/23. The 16-24 figures (957,000, £125bn, 29%, 314,000) are Milburn's and are not directly comparable with the 16-17 series shown here.</p>
    </div>
  );
}
