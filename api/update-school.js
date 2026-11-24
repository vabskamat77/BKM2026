const {server}=require('../lib/server');
const {prepare,fail}=require('../lib/cors');
const {verifyAdmin,denied}=require('../lib/verify-admin');
const {FieldValue}=require('firebase-admin/firestore');
module.exports=async(req,res)=>{
 if(!prepare(req,res,'POST'))return;
 try{
 const ctx=server(),admin=await verifyAdmin(req,ctx),{db,eventId}=ctx;
 let b=req.body; if(typeof b==='string'){try{b=JSON.parse(b)}catch{throw denied(400,'Invalid JSON')}}
 if(!b||typeof b.id!=='string'||!/^school-(0[1-9]|1[0-9]|20)$/.test(b.id)||typeof b.name!=='string'||typeof b.nameKonkani!=='string'||typeof b.code!=='string'||typeof b.active!=='boolean')throw denied(400,'Invalid school fields');
 const name=b.name.trim(),nameKonkani=b.nameKonkani.trim(),code=b.code.trim().toUpperCase(),active=b.active;
 if(!name||name.length>120||nameKonkani.length>120||! /^[A-Z0-9-]{1,16}$/.test(code))throw denied(400,'Enter a name and a valid code (1–16 letters, numbers or hyphens)');
 const event=db.collection('events').doc(eventId),pub=db.collection('publicEvents').doc(eventId),ref=event.collection('schools').doc(b.id),privT=event.collection('standings').doc('master'),pubT=pub.collection('standings').doc('master');
 await db.runTransaction(async tx=>{
 const [a,all,p,q,m,n]=await Promise.all([tx.get(admin.ref),tx.get(event.collection('schools')),tx.get(privT),tx.get(pubT),tx.get(event),tx.get(pub)]);
 if(!a.exists||a.data().active!==true||a.data().role!=='admin')throw denied(403,'Administrator permission required');
 const old=all.docs.find(d=>d.id===b.id); if(!old||!p.exists||!q.exists||!m.exists||!n.exists)throw denied(409,'School or event records missing');
 if(all.docs.some(d=>d.id!==b.id&&String(d.data().code).toUpperCase()===code))throw denied(409,'School code already in use');
 // Activation changes are limited to setup, before competitions are configured.
 if(old.data().active!==active&&((m.data().competitionCount||0)>0||(p.data().publishedCount||0)>0))throw denied(409,'Activation cannot change after competitions are configured');
 const patch={name,nameKonkani,code,active};
 tx.update(ref,{...patch,updatedAt:FieldValue.serverTimestamp()});
 for(const [r,s] of [[privT,p],[pubT,q]]){
 const data=s.data(); if(!Array.isArray(data.schools)||!data.schools.some(x=>x.schoolId===b.id))throw denied(409,'Standings record missing');
 const update=x=>x.schoolId===b.id?{...x,...patch}:x;
 tx.update(r,{schools:data.schools.map(update),topThree:(data.topThree||[]).map(update),updatedAt:FieldValue.serverTimestamp()});
 }
 tx.create(event.collection('auditLogs').doc(),{action:'update-school',uid:admin.uid,schoolId:b.id,before:{name:old.data().name,nameKonkani:old.data().nameKonkani||'',code:old.data().code,active:old.data().active},after:patch,at:FieldValue.serverTimestamp()});
 });
 res.status(200).json({ok:true,message:'School updated'});
 }catch(e){fail(res,e);}
};
