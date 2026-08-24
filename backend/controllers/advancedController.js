const db = require("../config/db");
const Advanced = require("../models/advancedModel");
const Complaint = require("../models/complaintModel");
const Member = require("../models/memberModel");
const { canAccessComplaint, filterComplaintsForUser } = require("../utils/complaintAccess");

async function getDepartments(req, res) {
  try { res.json({ success: true, departments: await Advanced.getDepartments() }); }
  catch (e) { console.error("Failed to load departments:", e); res.status(500).json({ success:false, message:"Failed to load departments" }); }
}

async function getNotifications(req, res) {
  try { res.json({ success: true, notifications: await Advanced.getNotifications(req.user) }); }
  catch (e) { console.error("Failed to load notifications:", e); res.status(500).json({ success:false, message:"Failed to load notifications" }); }
}

async function getDepartmentComplaints(req, res) {
  try {
    const all = await Complaint.getAllComplaints();
    const requestedDepartment = ["admin", "super_admin"].includes(req.user.role)
      ? (req.query.department || "")
      : "";
    const complaints = await filterComplaintsForUser(req.user, all, requestedDepartment);

    return res.json({ success: true, department: requestedDepartment, complaints });
  } catch (e) {
    console.error("Failed to load department complaints:", e);
    return res.status(500).json({ success:false, message:"Failed to load department complaints" });
  }
}

async function updateDepartmentComplaintStatus(req, res) {
  try {
    const { complaint_id } = req.params;
    const { status, note } = req.body;
    const allowed = ["Pending", "In Progress", "Resolved"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ success:false, message:"Invalid status" });
    }

    const complaint = await Complaint.findComplaintById(complaint_id);
    if (!complaint) return res.status(404).json({ success:false, message:"Complaint not found" });

    const complaintDetails = (await Complaint.getAllComplaints()).find(
      item => Number(item.complaint_id) === Number(complaint_id)
    );
    if (!(await canAccessComplaint(req.user, complaintDetails))) {
      return res.status(403).json({ success: false, message: "You can only update assigned complaints" });
    }

    await Complaint.updateComplaintStatus(complaint_id, status);
    await Complaint.createStatusTracking({
      complaint_id,
      previous_status: complaint.status,
      new_status: status,
      changed_by_admin_id: req.user.id,
      note: note || "Updated by department admin"
    });

    await Advanced.createNotification({
      user_id: complaint.user_id,
      title: `Complaint #${complaint_id} updated`,
      message: `Your complaint status is now ${status}.${note ? ` Department note: ${note}` : ""}`,
      type: status === "Resolved" ? "success" : "info"
    });

    await Member.logMemberActivity({ admin_id: req.user.id, role: req.user.role, action: 'STATUS_UPDATED', complaint_id, description: `Status changed to ${status}` });

    await Advanced.logAudit({
      actor_type: "admin",
      actor_id: req.user.id,
      action: "DEPARTMENT_STATUS_UPDATE",
      description: `Complaint #${complaint_id} updated to ${status}`,
      ip_address: req.ip
    });

    return res.json({ success:true, message:"Complaint status updated successfully" });
  } catch (e) {
    console.error("Failed to update department complaint:", e);
    return res.status(500).json({ success:false, message:"Failed to update department complaint" });
  }
}

async function getAdvancedAnalytics(req,res){
  try{
    let [resolution]=await db.execute("SELECT status,COUNT(*) total FROM complaints GROUP BY status");
    let [departmentLoad]=await db.execute("SELECT COALESCE(d.department_name,c.detected_category,'Unassigned') label,COUNT(*) total FROM complaints c LEFT JOIN departments d ON c.department_id=d.department_id GROUP BY COALESCE(d.department_name,c.detected_category,'Unassigned') ORDER BY total DESC").catch(()=>db.execute("SELECT detected_category label, COUNT(*) total FROM complaints GROUP BY detected_category"));
    let [dailyTrend]=await db.execute("SELECT DATE(created_at) date,COUNT(*) total FROM complaints GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30");
    res.json({success:true,analytics:{resolution,departmentLoad,dailyTrend}});
  }catch(e){res.status(500).json({success:false,message:e.message});}
}

async function getPredictions(req,res){
  try{
    const [d]=await db.execute("SELECT COALESCE(detected_category,'Other') label, COUNT(*) total FROM complaints GROUP BY COALESCE(detected_category,'Other') ORDER BY total DESC LIMIT 1");
    const [h]=await db.execute("SELECT COUNT(*) total FROM complaints WHERE priority='High'");
    let top=d[0]||{label:"No Data",total:0};
    res.json({success:true,prediction:{futureSpike:top.total>5?"Possible spike detected":"No major spike yet",nextHighRiskDepartment:top.label,riskyComplaints:h[0].total,recommendation:`Monitor ${top.label}. High-priority complaints: ${h[0].total}.`}});
  }catch(e){res.status(500).json({success:false,message:e.message});}
}

async function getAuditLogs(req,res){try{const [logs]=await db.execute("SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100");res.json({success:true,logs});}catch(e){res.status(500).json({success:false,message:e.message});}}

async function exportComplaintsCsv(req,res){
  try{
    const all=await Complaint.getAllComplaints();
    const csv="Complaint ID,R-Number,Title,Department,Category,Sentiment,Priority,Status,Created At\n"+all.map(r=>[r.complaint_id,r.registration_no,`"${String(r.title).replace(/"/g,'""')}"`,r.department_name||"",r.detected_category,r.sentiment,r.priority,r.status,r.created_at].join(",")).join("\n");
    res.setHeader("Content-Type","text/csv");
    res.setHeader("Content-Disposition","attachment; filename=complaints_report.csv");
    res.send(csv);
  }catch(e){res.status(500).json({success:false,message:e.message});}
}

module.exports={getDepartments,getNotifications,getDepartmentComplaints,updateDepartmentComplaintStatus,getAdvancedAnalytics,getPredictions,getAuditLogs,exportComplaintsCsv};
