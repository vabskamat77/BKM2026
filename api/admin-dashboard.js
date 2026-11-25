const {server}=require('../lib/server');
const {prepare,fail}=require('../lib/cors');
const {verifyAdmin,denied}=require('../lib/verify-admin');
const {outcome}=require('../lib/joker');
module.exports=async(req,res)=>{
 if(!prepare(req,res,'GET'))return;
 try{
 const ctx=server(); const admin=await verifyAdmin(req,ctx);
 const event=ctx.db.collection('events').doc(ctx.eventId);
 const pub=ctx.db.collection('publicEvents').doc(ctx.eventId);
 const data=await ctx.db.runTransaction(async tx=>{
 const [a,meta,schools,tally,competitions,published,jokers]=await Promise.all([admin.ref,event,event.collection('schools'),event.collection('standings').doc('master'),event.collection('competitions'),pub.collection('results'),event.collection('jokers')].map(ref=>tx.get(ref)));
 if(!a.exists||a.data().active!==true||a.data().role!=='admin')throw denied(403,'Administrator permission required');
 if(!meta.exists||!tally.exists)throw denied(409,'Initialize the event first');
 const rows=schools.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>a.id.localeCompare(b.id));
 const t=tally.data(), scores=t.schools||[], ids=new Set(rows.map(s=>s.id));
 const results=published.docs.map(d=>({...d.data(),competitionId:d.id}));
 return {ok:true,eventName:meta.data().name,schools:rows,stats:{registered:rows.length,active:rows.filter(s=>s.active).length,competitions:competitions.size,published:published.size,points:scores.reduce((sum,s)=>sum+(Number(s.points)||0),0),positiveSchools:new Set(scores.filter(s=>ids.has(s.schoolId)&&Number(s.points)>0).map(s=>s.schoolId)).size,successfulJokers:jokers.docs.filter(d=>ids.has(d.id)&&outcome(d.id,d.data().competitionId,results).status==='Successful').length}};
 },{readOnly:true});
 res.status(200).json(data);
 }catch(e){fail(res,e);}
};
