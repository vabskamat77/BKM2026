function denied(status,message){return Object.assign(new Error(message),{status});}
async function verifyAdmin(req,{auth,db}){
 const match=/^Bearer (\S+)$/.exec(req.headers.authorization||'');
 if(!match) throw denied(401,'Administrator sign-in required');
 let user;try{user=await auth.verifyIdToken(match[1],true);}catch{throw denied(401,'Invalid or expired administrator session');}
 const ref=db.collection('admins').doc(user.uid);
 const snap=await ref.get();
 if(!snap.exists||snap.data().active!==true||snap.data().role!=='admin')throw denied(403,'Administrator permission required');
 return {uid:user.uid,ref};
}
module.exports={verifyAdmin,denied};
