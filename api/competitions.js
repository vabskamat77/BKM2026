const {server}=require('../lib/server');
const {prepare,fail}=require('../lib/cors');
const {verifyAdmin,denied}=require('../lib/verify-admin');
module.exports=async(req,res)=>{
 if(!prepare(req,res,'GET'))return;
 try{const ctx=server();await verifyAdmin(req,ctx);const event=ctx.db.collection('events').doc(ctx.eventId);
 const [meta,schools,competitions]=await Promise.all([event.get(),event.collection('schools').get(),event.collection('competitions').get()]);
 if(!meta.exists)throw denied(409,'Initialize event first');
 res.status(200).json({ok:true,schools:schools.docs.map(d=>({id:d.id,name:d.data().name,code:d.data().code,active:d.data().active})).sort((a,b)=>a.id.localeCompare(b.id)),competitions:competitions.docs.map(d=>({...d.data(),id:d.id})).sort((a,b)=>a.name.localeCompare(b.name))});
 }catch(e){fail(res,e)}
};
