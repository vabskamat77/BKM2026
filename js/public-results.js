const $=id=>document.getElementById(id);
const el=(tag,cls,value='')=>{const n=document.createElement(tag);n.className=cls;n.textContent=value;return n};
let master=null,results=null,failed=false,cached=[true,true];
function render(){
 if(failed||!master||!results)return;
 const root=$('results');root.replaceChildren();
 if(master.publishedCount!==results.length||(master.resultRevisions&&results.some(r=>master.resultRevisions[r.competitionId]!==r.revision))){$('status').textContent='Synchronizing published results…';return;}
 const names=new Map((master.schools||[]).map(s=>[s.schoolId,s.name]));
 const q=$('search').value.trim().toLowerCase(),cat=$('category').value;
 const shown=results.filter(r=>(cat==='all'||r.competitionCategory===cat)&&[r.name,r.nameKonkani].some(n=>String(n||'').toLowerCase().includes(q))).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
 $('status').textContent=(cached.some(Boolean)?'Cached data — awaiting live connection. ':'Live results · ')+shown.length+' of '+results.length+' published competitions';
 if(!shown.length){root.append(el('p','',results.length?'No matching competitions.':'No competition results published yet.'));return;}
 for(const r of shown){
 const card=el('article','result-card result-preview-podium');card.append(el('h2','',r.name),el('p','',r.competitionCategory||''));
 const grid=el('div','podium-grid');
 for(const i of [1,0,2]){const id=r.winners?.[i],award=r.awards?.find(a=>a.schoolId===id),place=el('article','podium-card place-'+(i+1));place.append(el('div','podium-medal',['🥇','🥈','🥉'][i]),el('div','podium-name',id?(names.get(id)||'School unavailable'):'Not awarded'));if(id&&award)place.append(el('div','podium-points',String(award.points)),el('div','podium-label','POINTS'));grid.append(place);}
 card.append(grid,el('p','',(r.participants?.length||0)+' participating schools'));root.append(card);
 }
}
function error(e){failed=true;$('results').replaceChildren();$('status').textContent='Unable to load results: '+e.message;}
$('search').addEventListener('input',render);$('category').addEventListener('change',render);
try{const {db,EVENT_ID}=await import('./firebase-config.js');const {doc,collection,onSnapshot}=await import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js');onSnapshot(doc(db,'publicEvents',EVENT_ID,'standings','master'),{includeMetadataChanges:true},s=>{if(!s.exists()){error(new Error('Event standings not initialized'));return;}master=s.data();cached[0]=s.metadata.fromCache;render();},error);onSnapshot(collection(db,'publicEvents',EVENT_ID,'results'),{includeMetadataChanges:true},s=>{results=s.docs.map(d=>d.data()).filter(r=>r.status==='published');cached[1]=s.metadata.fromCache;render();},error);}catch(e){error(e);}
