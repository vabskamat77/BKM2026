const {server}=require('../lib/server');
const {prepare,fail}=require('../lib/cors');
const {verifyAdmin,denied}=require('../lib/verify-admin');
module.exports=async(req,res)=>{
 if(!prepare(req,res,'GET'))return;
 try{
 const ctx=server(); await verifyAdmin(req,ctx);
 const event=ctx.db.collection('events').doc(ctx.eventId);
 const [meta,schools,tally]=await Promise.all([event.get(),event.collection('schools').get(),event.collection('standings').doc('master').get()]);
 if(!meta.exists||!tally.exists)throw denied(409,'Initialize the event first');
 const rows=schools.docs.map(d=>({ ...d.data(),id:d.id})).sort((a,b)=>a.id.localeCompare(b.id));
 const m=meta.data(),t=tally.data();
 res.status(200).json({ok:true,eventName:m.name,schools:rows,stats:{registered:rows.length,active:rows.filter(s=>s.active).length,competitions:m.competitionCount||0,published:t.publishedCount||0,points:(t.schools||[]).reduce((sum,s)=>sum+(Number(s.points)||0),0)}});
 }catch(e){fail(res,e);}
};
