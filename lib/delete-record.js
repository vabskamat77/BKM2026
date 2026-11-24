const {denied}=require('./verify-admin');const {FieldValue}=require('firebase-admin/firestore');const {tally}=require('./joker');
module.exports=async({db,eventId},admin,b)=>{
 if(b.confirm!==true||typeof b.id!=='string'||!/^[\w-]{1,80}$/.test(b.id))throw denied(400,'Invalid deletion request');
 const e=db.collection('events').doc(eventId),p=db.collection('publicEvents').doc(eventId),school=b.action==='delete-school';
 await db.runTransaction(async tx=>{
 const [a,em,pm,ss,cs,rs,ps,js]=await Promise.all([tx.get(admin.ref),tx.get(e),tx.get(p),tx.get(e.collection('schools')),tx.get(e.collection('competitions')),tx.get(e.collection('results')),tx.get(p.collection('results')),tx.get(e.collection('jokers'))]);
 if(!a.exists||a.data().active!==true||a.data().role!=='admin')throw denied(403,'Administrator permission required');if(!em.exists||!pm.exists)throw denied(409,'Event missing');
 const target=(school?ss:cs).docs.find(d=>d.id===b.id);if(!target)throw denied(404,'Record not found');if(!school&&target.data().revision!==b.revision)throw denied(409,'Competition changed; refresh');
 const references=r=>[...(r.participants||[]),...(r.winners||[]),...(r.awards||[]).map(x=>x.schoolId)].includes(b.id);
 if(school&&[...rs.docs,...ps.docs].some(d=>references(d.data())))throw denied(409,'School is referenced by saved results. Remove those references or delete the affected competitions first.');
 const stamp=FieldValue.serverTimestamp();const removedJokers=js.docs.filter(d=>school?d.id===b.id:d.data().competitionId===b.id);const removedResults=school?[]:[...rs.docs,...ps.docs].filter(d=>d.id===b.id);
 const schools=ss.docs.filter(d=>!school||d.id!==b.id).map(d=>({...d.data(),id:d.id}));const results=ps.docs.filter(d=>school||d.id!==b.id).map(d=>d.data());const assignments=js.docs.filter(d=>!removedJokers.includes(d)).map(d=>({...d.data(),schoolId:d.id}));const master={...tally(schools,results,assignments),updatedAt:stamp};
 tx.delete(target.ref);for(const d of [...removedJokers,...removedResults])tx.delete(d.ref);
 if(school)for(const d of cs.docs){const c=d.data();if(Array.isArray(c.schoolIds)&&c.schoolIds.includes(b.id))tx.update(d.ref,{schoolIds:c.schoolIds.filter(id=>id!==b.id),revision:(c.revision||0)+1,updatedAt:stamp});}
 const counts={schoolCount:schools.length,competitionCount:cs.size-(school?0:1),publishedCount:master.publishedCount};tx.update(e,counts);tx.update(p,counts);tx.set(e.collection('standings').doc('master'),master);tx.set(p.collection('standings').doc('master'),master);
 tx.create(e.collection('auditLogs').doc(),{action:b.action,uid:admin.uid,id:b.id,before:target.data(),removedResults:removedResults.map(d=>({path:d.ref.path,data:d.data()})),removedJokers:removedJokers.map(d=>({schoolId:d.id,data:d.data()})),at:stamp});
 });
};
