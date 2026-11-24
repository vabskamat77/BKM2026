const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
function server() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const eventId = process.env.EVENT_ID;
  if (!projectId || !eventId || !/^[\w-]+$/.test(eventId)) throw new Error('Missing or invalid server configuration');
  let app = getApps()[0];
  if (!app) {
    const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');
    if (key.project_id !== projectId || !key.private_key || !key.client_email) throw new Error('Invalid service account configuration');
    app = initializeApp({credential: cert(key), projectId});
  }
  return {db:getFirestore(app), auth:getAuth(app), projectId, eventId};
}
module.exports = {server};
