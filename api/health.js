const {server}=require('../lib/server');
const {prepare,fail}=require('../lib/cors');
module.exports=async(req,res)=>{
 if(!prepare(req,res,'GET'))return;
 try{const {db,eventId,projectId}=server();const snap=await db.collection('publicEvents').doc(eventId).get();res.status(200).json({ok:true,projectId,eventId,initialized:snap.exists});}catch(e){fail(res,e);}
};
