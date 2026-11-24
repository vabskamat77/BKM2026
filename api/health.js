const {server}=require('../lib/server');
const {prepare,fail}=require('../lib/cors');
module.exports=async(req,res)=>{
 if(!prepare(req,res,'GET'))return;
 try{
  const {db,eventId,projectId}=server();
  const event=db.collection('events').doc(eventId);
  const snap=await db.collection('publicEvents').doc(eventId).get();
  if(!snap.exists)return res.status(200).json({ok:true,projectId,eventId,initialized:false});
  const [schools,competitions]=await Promise.all([event.collection('schools').where('active','==',true).count().get(),event.collection('competitions').count().get()]);
  res.status(200).json({ok:true,projectId,eventId,initialized:true,schoolCount:schools.data().count,competitionCount:competitions.data().count});
 }catch(e){fail(res,e);}
};
