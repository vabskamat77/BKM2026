const {server}=require('../lib/server');
const {prepare,fail}=require('../lib/cors');
const {verifyAdmin,denied}=require('../lib/verify-admin');
const {FieldValue}=require('firebase-admin/firestore');
const {isReel}=require('../lib/joker');
const {awards}=require('../lib/scoring');
const {tally}=require('../lib/joker');
const statuses=['draft','scheduled'];
function validate(b){
 if(!b||typeof b!=='object'||Array.isArray(b))throw denied(400,'Invalid request');
 const text=(k,required=false)=>{if(typeof b[k]!=='string'||b[k].trim().length>120||(required&&!b[k].trim()))throw denied(400,'Invalid '+k);return b[k].trim()};
 const name=text('name',true),nameKonkani=text('nameKonkani'),category=text('category',true);
 if(!['Gold','Silver'].includes(b.competitionCategory))throw denied(400,'Select Gold or Silver competition category');
 if(!['Onstage','Offstage'].includes(b.stageType))throw denied(400,'Select Onstage or Offstage');
 if(!['individual','team'].includes(b.type)||!statuses.includes(b.status))throw denied(400,'Invalid type or status');
 const s=b.scoring;if(!s||['first','second','third'].some(k=>!Number.isInteger(s[k])||s[k]<0||s[k]>10000))throw denied(400,'Points must be whole numbers from 0 to 10000');
 if(s.first<s.second||s.second<s.third)throw denied(400,'Place points must be in descending order');
 return {name,nameKonkani,category,competitionCategory:b.competitionCategory,stageType:b.stageType,type:b.type,status:b.status,scoring:{first:s.first,second:s.second,third:s.third,participationEnabled:false,participation:0}};
}
module.exports=async(req,res)=>{
 if(!prepare(req,res,'POST'))return;
 try{const ctx=server(),admin=await verifyAdmin(req,ctx),{db,eventId}=ctx;let b=req.body;if(typeof b==='string'){try{b=JSON.parse(b)}catch{throw denied(400,'Invalid JSON')}}
 const patch=validate(b),editing=b.id!==null&&b.id!==undefined;if(editing&&(typeof b.id!=='string'||! /^[A-Za-z0-9_-]{1,80}$/.test(b.id)||!Number.isInteger(b.revision)))throw denied(400,'Invalid competition ID or revision');
 const event=db.collection('events').doc(eventId),pub=db.collection('publicEvents').doc(eventId),col=event.collection('competitions'),ref=editing?col.doc(b.id):col.doc();
 await db.runTransaction(async tx=>{
 const [a,m,p,old,privateResult,publicResult,jokers,schools,allResults,allJokers]=await Promise.all([tx.get(admin.ref),tx.get(event),tx.get(pub),tx.get(ref),tx.get(event.collection('results').doc(ref.id)),tx.get(pub.collection('results').doc(ref.id)),tx.get(event.collection('jokers').where('competitionId','==',ref.id)),tx.get(event.collection('schools')),tx.get(pub.collection('results')),tx.get(event.collection('jokers'))]);
 if(!a.exists||a.data().active!==true||a.data().role!=='admin')throw denied(403,'Administrator permission required');
 if(!m.exists||!p.exists)throw denied(409,'Initialize event first');
 if(editing&&!old.exists)throw denied(404,'Competition not found');
 if(editing&&(old.data().revision!==b.revision))throw denied(409,'Competition changed; refresh and try again');
 const published=publicResult.exists||old.data()?.published===true||old.data()?.status==='published';
 if(published&&!publicResult.exists)throw denied(409,'Published result missing; repair before editing');
 if(published)patch.status='published';else if(old.exists&&!statuses.includes(old.data().status))patch.status=old.data().status;
 if(privateResult.exists&&!published&&patch.status!=='completed')throw denied(409,'Keep competition completed while a result draft exists');
 const stamp=FieldValue.serverTimestamp();
 function reviseResult(r){const scoring={...patch.scoring,participationEnabled:r.scoring?.participationEnabled===true,participation:r.scoring?.participation||0};return {...r,name:patch.name,nameKonkani:patch.nameKonkani,competitionCategory:patch.competitionCategory,stageType:patch.stageType,scoring,awards:awards({scoring,schoolIds:r.participants},r),revision:r.revision+1,updatedAt:stamp};}

 if(isReel(patch)&&!jokers.empty)throw denied(409,'Remove assigned Jokers before renaming to Reel');
 const revision=editing?b.revision+1:1;
 if(privateResult.exists)tx.set(privateResult.ref,reviseResult(privateResult.data()));
 if(publicResult.exists){const updated=reviseResult(publicResult.data());const results=allResults.docs.map(d=>d.id===ref.id?updated:d.data());const master={...tally(schools.docs.map(d=>({...d.data(),id:d.id})),results,allJokers.docs.map(d=>({...d.data(),schoolId:d.id}))),updatedAt:stamp};tx.set(publicResult.ref,updated);tx.set(event.collection('standings').doc('master'),master);tx.set(pub.collection('standings').doc('master'),master);}

 if(editing)tx.update(ref,{...patch,schoolIds:FieldValue.delete(),revision,updatedAt:FieldValue.serverTimestamp()});else{tx.create(ref,{...patch,revision,published:false,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});tx.update(event,{competitionCount:FieldValue.increment(1)});}
 tx.create(event.collection('auditLogs').doc(),{action:editing?'update-competition':'create-competition',uid:admin.uid,competitionId:ref.id,before:editing?old.data():null,after:patch,at:FieldValue.serverTimestamp()});
 });res.status(editing?200:201).json({ok:true,id:ref.id,message:editing?'Competition updated':'Competition created'});
 }catch(e){fail(res,e)}
};
