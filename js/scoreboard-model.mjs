export function calculate(master, results, view) {
 if(view==='overall'&&master.resultRevisions){const rows=master.schools.map(s=>({...s,active:s.active!==false}));return {rows,count:master.publishedCount,top:master.topThree||[]};}
 const selected=results.filter(r=>r.status==='published'&&(view==='overall'||r.competitionCategory===view||r.stageType===view));
 const rows=master.schools.map(s=>({...s,active:s.active!==false,points:0,first:0,second:0,third:0}));
 const map=new Map(rows.map(s=>[s.schoolId,s]));
 if(map.size!==rows.length||map.has(undefined))throw Error('Invalid school IDs');
 for(const r of selected){if(!Array.isArray(r.awards))throw Error('Missing published awards');const seen=new Set();for(const a of r.awards){const s=map.get(a.schoolId);if(!s||seen.has(a.schoolId))throw Error('Invalid published school award');seen.add(a.schoolId);for(const k of ['points','first','second','third']){if(!Number.isSafeInteger(a[k])||a[k]<0)throw Error('Invalid award');s[k]+=a[k]}}}
 const cmp=(a,b)=>b.points-a.points||b.first-a.first||b.second-a.second||b.third-a.third;
 rows.sort((a,b)=>Number(b.active)-Number(a.active)||cmp(a,b)||a.schoolId.localeCompare(b.schoolId));
 rows.forEach((s,i)=>s.rank=!s.active?null:i&&rows[i-1].active&&cmp(s,rows[i-1])===0?rows[i-1].rank:i+1);
 return {rows,count:selected.length,top:selected.length?rows.filter(s=>s.active&&s.rank<=3&&(s.points>0||s.first+s.second+s.third>0)):[]};
}

// The public master includes only approved adjustments. Derive the difference
// from the synchronized published placement awards, without reading private Jokers.
export function jokerAdjustments(master,results){
 const regular=new Map(master.schools.map(s=>[s.schoolId,0]));
 for(const r of results){if(r.status!=='published')continue;for(const a of r.awards){if(!regular.has(a.schoolId)||!Number.isSafeInteger(a.points))throw Error('Invalid published award');regular.set(a.schoolId,regular.get(a.schoolId)+a.points);}}
 return new Map(master.schools.map(s=>[s.schoolId,s.points-regular.get(s.schoolId)]));
}
