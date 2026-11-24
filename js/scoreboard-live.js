import {db,EVENT_ID} from './firebase-config.js';
import {doc,collection,onSnapshot} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import {calculate} from './scoreboard-model.mjs';
const $=id=>document.getElementById(id), bodies=[...document.querySelectorAll('.score-table tbody')];
let master,results,view='overall',cached=[true,true],failed=false;
const el=(tag,cls,value)=>{const n=document.createElement(tag);n.className=cls;n.textContent=value;return n};
function status(message,live=false){$('live-status').textContent=message;$('connection').textContent=live?'LIVE':'Waiting / offline';$('connection').classList.toggle('connected',live)}
function render(){if(failed||!master||!results)return;try{
 // Wait for matching published snapshots, including corrections with unchanged count.
 const tally=calculate(master,results,'overall');const byId=new Map(master.schools.map(s=>[s.schoolId,s]));
 if(master.publishedCount!==tally.count||tally.rows.some(s=>['points','first','second','third'].some(k=>s[k]!==byId.get(s.schoolId)[k]))){status('Synchronizing published results…');return;}
 const data=calculate(master,results,view);const title=view==='overall'?'Overall championship standings':view+' championship standings';$('view-title').textContent=title;$('podium-title').textContent=title;
 bodies.forEach(b=>b.replaceChildren());const split=Math.ceil(data.rows.length/2);data.rows.forEach((s,i)=>{const tr=document.createElement('tr'),rank=el('td','','');rank.append(el('span','rank r'+s.rank,s.rank??'—'));tr.append(rank,el('td','school-name',s.name+(s.active?'':' (Inactive)')), ...['first','second','third','points'].map(k=>el('td','',s[k])));bodies[i<split?0:1].append(tr)});
 const grid=$('podium-grid');grid.replaceChildren();if(!data.top.length){grid.append(el('p','podium-empty',data.count?'No prize or points leaders yet':'Awaiting published results'));}else for(const rank of [2,1,3]){const card=el('article','podium-card place-'+rank,'');const group=data.top.filter(s=>s.rank===rank);card.append(el('div','podium-medal',['','🥇','🥈','🥉'][rank]));if(!group.length)card.append(el('div','podium-name','—'));for(const s of group){card.append(el('div','podium-name',s.name),el('div','podium-points',s.points),el('div','podium-label','POINTS'));}grid.append(card)}
 status(`${data.count} published competition(s) in this view · ${tally.count} overall · ${data.rows.reduce((n,s)=>n+s.points,0)} points${cached.some(Boolean)?' · Cached data; may be outdated':''}`,!cached.some(Boolean));
 }catch(e){status('Unable to display standings: '+e.message)}}
const error=e=>{failed=true;status('Live connection failed: '+e.code+'. Reload to retry.')};
const root=['publicEvents',EVENT_ID];onSnapshot(doc(db,...root,'standings','master'),{includeMetadataChanges:true},s=>{master=s.exists()?s.data():null;cached[0]=s.metadata.fromCache;if(!master)status('Waiting for event initialization');render()},error);onSnapshot(collection(db,...root,'results'),{includeMetadataChanges:true},s=>{results=s.docs.map(d=>d.data());cached[1]=s.metadata.fromCache;render()},error);
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));render()});$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('screen').requestFullscreen()}catch{alert('Fullscreen unavailable; try F11.')}};
