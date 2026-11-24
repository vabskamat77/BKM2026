const {server}=require('../lib/server');
const {prepare,fail}=require('../lib/cors');
const {verifyAdmin,denied}=require('../lib/verify-admin');
const {FieldValue}=require('firebase-admin/firestore');
module.exports=async(req,res)=>{
 if(!prepare(req,res,'POST'))return;
 try{
  const ctx=server();const admin=await verifyAdmin(req,ctx);const {db,eventId}=ctx;
  const event=db.collection('events').doc(eventId), pub=db.collection('publicEvents').doc(eventId);
  const schools=Array.from({length:20},(_,i)=>{const n=String(i+1).padStart(2,'0');return {id:'school-'+n,name:'School '+n,nameKonkani:'',code:'S'+n,active:true};});
  const standings=schools.map(s=>({schoolId:s.id,name:s.name,points:0,first:0,second:0,third:0,rank:1}));
  const settings={languages:['en','kok'],theme:'heritage',masterSeconds:20,resultSeconds:10,autoplay:true,showStandings:true,mode:'auto'};
  const meta={eventId,name:'11th Bhurgyancho Kala Mel',organization:'Antruz Ghudyo',schoolCount:20,competitionCount:0,publishedCount:0,status:'setup',createdAt:FieldValue.serverTimestamp()};
  const created=await db.runTransaction(async tx=>{
   const [a,b,c]=await Promise.all([tx.get(event),tx.get(pub),tx.get(admin.ref)]);
   if(!c.exists||c.data().active!==true||c.data().role!=='admin')throw denied(403,'Administrator permission required');
   if(a.exists&&b.exists)return false;
   if(a.exists||b.exists)throw denied(409,'Partial event already exists; initialization stopped to protect data');
   const children=[event.collection('schools'),event.collection('competitions'),event.collection('results'),event.collection('settings'),event.collection('standings'),event.collection('auditLogs'),event.collection('announcements'),pub.collection('standings'),pub.collection('settings'),pub.collection('results')];
   const existing=await Promise.all(children.map(q=>tx.get(q.limit(1))));
   if(existing.some(q=>!q.empty))throw denied(409,'Existing event records found; initialization stopped');
   tx.create(event,{...meta,createdBy:admin.uid});tx.create(pub,meta);
   schools.forEach(s=>tx.create(event.collection('schools').doc(s.id),s));
   const tally={schools:standings,topThree:[],publishedCount:0,updatedAt:FieldValue.serverTimestamp()};
   tx.create(event.collection('standings').doc('master'),tally);tx.create(pub.collection('standings').doc('master'),tally);
   tx.create(event.collection('settings').doc('display'),settings);tx.create(pub.collection('settings').doc('display'),settings);
   tx.create(event.collection('auditLogs').doc(),{action:'initialize-event',uid:admin.uid,at:FieldValue.serverTimestamp()});
   return true;
  });
  res.status(created?201:200).json({ok:true,created,eventId,message:created?'Event initialized with 20 schools':'Event already exists; no changes made'});
 }catch(e){fail(res,e);}
};
