const db=require('../config/db');
async function q(sql,p=[]){try{const [r]=await db.execute(sql,p);return r}catch(e){return null}}
async function getDepartmentByName(n){let r=await q('SELECT * FROM departments WHERE department_name=? LIMIT 1',[n]);return r&&r[0]}
async function getDepartments(){return await q('SELECT * FROM departments ORDER BY department_name')||[]}
async function saveAttachment(d){return await q('INSERT INTO complaint_attachments (complaint_id,file_name,file_path,file_type,file_size) VALUES (?,?,?,?,?)',[d.complaint_id,d.file_name,d.file_path,d.file_type,d.file_size])}
async function createNotification(d){return await q('INSERT INTO notifications (user_id,admin_id,title,message,type) VALUES (?,?,?,?,?)',[d.user_id||null,d.admin_id||null,d.title,d.message,d.type||'info'])}
async function getNotifications(u){return u.role==='student'?await q('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC',[u.id])||[]:await q('SELECT * FROM notifications WHERE admin_id=? OR admin_id IS NULL ORDER BY created_at DESC',[u.id])||[]}
async function logAudit(d){return await q('INSERT INTO audit_logs (actor_type,actor_id,action,description,ip_address) VALUES (?,?,?,?,?)',[d.actor_type||'system',d.actor_id||null,d.action,d.description||'',d.ip_address||null])}
async function saveChatMessage(d){return await q('INSERT INTO chatbot_messages (user_id,sender,message) VALUES (?,?,?)',[d.user_id,d.sender,d.message])}
async function getChatHistory(id){return await q('SELECT * FROM chatbot_messages WHERE user_id=? ORDER BY created_at',[id])||[]}
module.exports={getDepartmentByName,getDepartments,saveAttachment,createNotification,getNotifications,logAudit,saveChatMessage,getChatHistory};
