/**
 * 🏛️ SMART GOVREPORT HUB - MEMBERSHIP & REGISTRATION BACKEND API
 * ระบบจัดการสมาชิก ลงทะเบียน และตรวจสอบสิทธิ์สำหรับโครงการ OJT ราชการ
 * 
 * เทคโนโลยี: Google Apps Script (GAS) Web App + Google Sheets Database
 * สถาปัตยกรรม: Serverless, Zero Cost, Two-Tier Approval Gate, Dual-Layer Hash
 */

// ==========================================
// ⚙️ 1. CONFIGURATION & SERVER PEPPER
// ==========================================
const CONFIG = {
  SERVER_PEPPER: "GovHub_2026_Secured_Pepper_Key_@Justice_ICT",
  SHEET_USERS: "Users",
  SHEET_LOGBOOKS: "Logbooks",
  DEFAULT_ADMIN: {
    username: "admin_ict",
    fullName: "เจ้าหน้าที่ผู้ดูแลระบบ (Admin ICT)",
    email: "ict_admin@moj.go.th",
    role: "staff",
    department: "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร สำนักงานปลัดกระทรวงยุติธรรม",
    // SHA-256 for 'Admin@2026' (Layer 1 Client Hash) = a9c62939b4074ea235bf6ea09bc66ea37dd6153724395df3d24e93fb235a967c
    initialClientHash: "a36aef5a11c4073fbe60314fc9df530a9d5f986533594d1f5190742ff9e0e408" 
  }
};

// ==========================================
// 🚀 2. DATABASE AUTO-SETUP & INITIALIZATION
// ==========================================
/**
 * รันฟังก์ชันนี้ครั้งแรกใน Google Apps Script Editor เพื่อสร้างหัวตารางและบัญชี Admin อัตโนมัติ
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. ตั้งค่าแผ่นงาน Users
  let userSheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!userSheet) {
    userSheet = ss.insertSheet(CONFIG.SHEET_USERS);
  }
  
  const userHeaders = [
    "id", "username", "password_hash", "salt", "full_name",
    "email", "role", "department", "disability_type",
    "supervisor_username", "is_approved", "created_at",
    "approved_by", "approved_at"
  ];
  
  if (userSheet.getLastRow() === 0) {
    userSheet.appendRow(userHeaders);
    userSheet.getRange(1, 1, 1, userHeaders.length)
      .setBackground("#1e293b")
      .setFontColor("#f8fafc")
      .setFontWeight("bold");
    userSheet.setFrozenRows(1);
    
    // สร้างบัญชี Admin เริ่มต้น
    const salt = generateSalt();
    const finalHash = computeFinalHash(CONFIG.DEFAULT_ADMIN.initialClientHash, salt);
    const now = new Date().toISOString();
    
    userSheet.appendRow([
      Utilities.getUuid(),
      CONFIG.DEFAULT_ADMIN.username,
      finalHash,
      salt,
      CONFIG.DEFAULT_ADMIN.fullName,
      CONFIG.DEFAULT_ADMIN.email,
      CONFIG.DEFAULT_ADMIN.role,
      CONFIG.DEFAULT_ADMIN.department,
      "-",
      "-",
      true, // is_approved
      now,
      "SYSTEM",
      now
    ]);
  }
  
  // 2. ตั้งค่าแผ่นงาน Logbooks
  let logSheet = ss.getSheetByName(CONFIG.SHEET_LOGBOOKS);
  if (!logSheet) {
    logSheet = ss.insertSheet(CONFIG.SHEET_LOGBOOKS);
  }
  
  const logHeaders = [
    "log_id", "trainee_username", "supervisor_username", "week_number",
    "work_date", "hours", "tasks_done", "sop_step",
    "evidence_url", "approval_status", "supervisor_score",
    "supervisor_comment", "signed_timestamp"
  ];
  
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow(logHeaders);
    logSheet.getRange(1, 1, 1, logHeaders.length)
      .setBackground("#0f172a")
      .setFontColor("#38bdf8")
      .setFontWeight("bold");
    logSheet.setFrozenRows(1);
  }
  
  Logger.log("✅ ฐานข้อมูล Smart GovReport Hub ถูกตั้งค่าสมบูรณ์เรียบร้อยแล้ว!");
  return "Database Setup Complete!";
}

// ==========================================
// 🌐 3. HTTP ROUTER (doGet & doPost)
// ==========================================
function doGet(e) {
  const action = e?.parameter?.action || "ping";
  if (action === "ping") {
    return jsonSuccess({ status: "online", timestamp: new Date().toISOString() });
  }
  if (action === "get_supervisors") {
    return handleGetSupervisors();
  }
  return jsonError("Invalid GET action");
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonError("No request payload provided");
    }
    
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    
    switch (action) {
      case "ping":
        return jsonSuccess({ status: "online", message: "GovReport Hub API ready" });
        
      case "get_supervisors":
        return handleGetSupervisors();
        
      case "register":
        return handleRegister(payload);
        
      case "login":
        return handleLogin(payload);
        
      case "get_pending_members":
        return handleGetPendingMembers(payload);
        
      case "approve_member":
        return handleApproveMember(payload);
        
      case "batch_approve_members":
        return handleBatchApproveMembers(payload);
        
      case "toggle_member_status":
        return handleToggleMemberStatus(payload);
        
      case "delete_member":
        return handleDeleteMember(payload);
        
      case "update_member_profile":
        return handleUpdateMemberProfile(payload);
        
      case "sync_logbooks":
        return handleSyncLogbooks(payload);
        
      case "upload_attachment":
        return handleUploadAttachmentToDrive(payload);
        
      default:
        return jsonError("Action not supported: " + action);
    }
  } catch (err) {
    return jsonError("Server Exception: " + err.toString());
  }
}

/**
 * ☁️ อัปโหลดไฟล์รูปภาพหรือเอกสารขึ้น Google Drive อัตโนมัติ (0 บาท)
 */
function handleUploadAttachmentToDrive(payload) {
  try {
    const filename = payload.filename || ("OJT_Evidence_" + Date.now() + ".jpg");
    const mimeType = payload.mimeType || "image/jpeg";
    const base64Data = payload.base64_data;
    
    if (!base64Data) {
      return jsonError("Missing base64_data payload");
    }
    
    // ค้นหาหรือสร้างโฟลเดอร์สำหรับเก็บไฟล์ OJT ใน Google Drive
    const folderName = "SmartGov_OJT_Attachments";
    const folders = DriveApp.getFoldersByName(folderName);
    let targetFolder;
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = DriveApp.createFolder(folderName);
    }
    
    const decodedBytes = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decodedBytes, mimeType, filename);
    const file = targetFolder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return jsonSuccess({
      message: "Uploaded to Google Drive successfully",
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      downloadUrl: file.getDownloadUrl(),
      filename: filename
    });
  } catch (err) {
    return jsonError("Drive Upload Failed: " + err.toString());
  }
}

// ==========================================
// 🛡️ 4. BUSINESS LOGIC HANDLERS
// ==========================================

/**
 * ดึงรายชื่อผู้ควบคุมงาน (Supervisors) ที่ผ่านการอนุมัติแล้ว เพื่อนำไปแสดงใน Dropdown
 */
function handleGetSupervisors() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");
  
  const data = sheet.getDataRange().getValues();
  const supervisors = [];
  
  // ข้าม Header แถว 0
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const username = row[1];
    const fullName = row[4];
    const role = row[6];
    const department = row[7];
    const isApproved = row[10];
    
    if (role === "supervisor" && (isApproved === true || isApproved === "TRUE")) {
      supervisors.push({
        username: username,
        full_name: fullName,
        department: department
      });
    }
  }
  
  return jsonSuccess({ supervisors: supervisors });
}

/**
 * ลงทะเบียนสมาชิกใหม่ (Default: is_approved = FALSE)
 */
function handleRegister(payload) {
  const { username, client_hash, full_name, email, role, department, disability_type, supervisor_username } = payload;
  
  // Validation ขั้นต่ำ
  if (!username || !client_hash || !full_name || !email || !role) {
    return jsonError("กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน");
  }
  
  const cleanUsername = String(username).trim().toLowerCase();
  const cleanEmail = String(email).trim().toLowerCase();
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");
  
  const data = sheet.getDataRange().getValues();
  
  // ตรวจสอบความซ้ำซ้อนของ Username และ Email
  for (let i = 1; i < data.length; i++) {
    const rowUser = String(data[i][1]).toLowerCase();
    const rowEmail = String(data[i][5]).toLowerCase();
    
    if (rowUser === cleanUsername) {
      return jsonError("ชื่อผู้ใช้งาน (Username) นี้มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น");
    }
    if (rowEmail === cleanEmail) {
      return jsonError("อีเมลนี้ได้รับการลงทะเบียนแล้ว กรุณาใช้อีเมลอื่น");
    }
  }
  
  // ดำเนินการ Layer 2 Hashing (Salt + Pepper)
  const salt = generateSalt();
  const finalHash = computeFinalHash(client_hash, salt);
  const now = new Date().toISOString();
  
  const newRow = [
    Utilities.getUuid(),
    cleanUsername,
    finalHash,
    salt,
    String(full_name).trim(),
    cleanEmail,
    role,
    department || "-",
    disability_type || "-",
    supervisor_username || "-",
    false, // is_approved = FALSE เสมอ
    now,
    "-", // approved_by
    "-"  // approved_at
  ];
  
  sheet.appendRow(newRow);
  
  return jsonSuccess({
    message: "ลงทะเบียนสำเร็จ! บัญชีของคุณอยู่ระหว่างรอการอนุมัติสิทธิ์จากเจ้าหน้าที่หรือผู้ควบคุมงาน",
    username: cleanUsername,
    role: role,
    is_approved: false
  });
}

/**
 * เข้าสู่ระบบ (Login)
 */
function handleLogin(payload) {
  const { username, client_hash } = payload;
  if (!username || !client_hash) {
    return jsonError("กรุณากรอกชื่อผู้ใช้และรหัสผ่าน");
  }
  
  const cleanUsername = String(username).trim().toLowerCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");
  
  const data = sheet.getDataRange().getValues();
  let userFound = null;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === cleanUsername) {
      userFound = {
        rowIdx: i + 1,
        id: data[i][0],
        username: data[i][1],
        password_hash: data[i][2],
        salt: data[i][3],
        full_name: data[i][4],
        email: data[i][5],
        role: data[i][6],
        department: data[i][7],
        disability_type: data[i][8],
        supervisor_username: data[i][9],
        is_approved: data[i][10]
      };
      break;
    }
  }
  
  if (!userFound) {
    return jsonError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
  }
  
  // ตรวจสอบรหัสผ่าน Layer 2 Hash
  const expectedHash = computeFinalHash(client_hash, userFound.salt);
  if (expectedHash !== userFound.password_hash) {
    return jsonError("ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง");
  }
  
  // ตรวจสอบสถานะการอนุมัติ
  if (userFound.is_approved !== true && userFound.is_approved !== "TRUE") {
    return jsonError("บัญชีของคุณยังไม่ได้รับการอนุมัติสิทธิ์ กรุณาติดต่อผู้ควบคุมงานหรือเจ้าหน้าที่ผู้ดูแลระบบ (Admin)");
  }
  
  // สร้าง Session Payload ส่งกลับให้ Frontend
  return jsonSuccess({
    message: "เข้าสู่ระบบสำเร็จ",
    user: {
      id: userFound.id,
      username: userFound.username,
      full_name: userFound.full_name,
      email: userFound.email,
      role: userFound.role,
      department: userFound.department,
      disability_type: userFound.disability_type,
      supervisor_username: userFound.supervisor_username,
      is_approved: true
    }
  });
}

/**
 * ดึงรายการสมาชิกที่รอการอนุมัติ (Two-Tier Approval Filtering)
 */
function handleGetPendingMembers(payload) {
  const { requester_username, requester_role } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");
  
  const data = sheet.getDataRange().getValues();
  const pending = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const isApproved = row[10];
    
    if (isApproved === false || isApproved === "FALSE" || isApproved === "") {
      const member = {
        id: row[0],
        username: row[1],
        full_name: row[4],
        email: row[5],
        role: row[6],
        department: row[7],
        disability_type: row[8],
        supervisor_username: row[9],
        created_at: row[11]
      };
      
      // การกรองสิทธิ์ 2 ระดับ:
      // 1. Staff/Admin: เห็นทุกคนที่รออนุมัติ
      if (requester_role === "staff") {
        pending.push(member);
      } 
      // 2. Supervisor: เห็นเฉพาะ Trainee ที่ขออยู่ใต้การดูแลของตนเอง
      else if (requester_role === "supervisor") {
        if (member.role === "trainee" && String(member.supervisor_username).toLowerCase() === String(requester_username).toLowerCase()) {
          pending.push(member);
        }
      }
    }
  }
  
  return jsonSuccess({ pending_members: pending });
}

/**
 * อนุมัติหรือปฏิเสธบัญชีสมาชิก
 */
function handleApproveMember(payload) {
  const { target_username, approve_action, requester_username, requester_role } = payload;
  // approve_action: 'approve' | 'reject'
  
  const cleanTarget = String(target_username).trim().toLowerCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");
  
  const data = sheet.getDataRange().getValues();
  let targetRow = -1;
  let targetUser = null;
  
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === cleanTarget) {
      targetRow = i + 1;
      targetUser = {
        role: data[i][6],
        supervisor_username: data[i][9]
      };
      break;
    }
  }
  
  if (targetRow === -1) {
    return jsonError("ไม่พบข้อมูลผู้ใช้งานที่ระบุ");
  }
  
  // ตรวจสอบสิทธิ์ผู้อนุมัติ:
  if (requester_role !== "staff") {
    if (requester_role === "supervisor") {
      if (targetUser.role !== "trainee" || String(targetUser.supervisor_username).toLowerCase() !== String(requester_username).toLowerCase()) {
        return jsonError("คุณไม่มีสิทธิ์อนุมัติผู้ใช้งานรายนี้ (อนุญาตเฉพาะเด็กฝึกงานในสังกัดของท่านเท่านั้น)");
      }
    } else {
      return jsonError("คุณไม่มีสิทธิ์ในการอนุมัติสมาชิก");
    }
  }
  
  const now = new Date().toISOString();
  if (approve_action === "approve") {
    sheet.getRange(targetRow, 11).setValue(true); // is_approved = TRUE
    sheet.getRange(targetRow, 13).setValue(requester_username); // approved_by
    sheet.getRange(targetRow, 14).setValue(now); // approved_at
    return jsonSuccess({ message: `อนุมัติบัญชี [${cleanTarget}] เรียบร้อยแล้ว` });
  } else if (approve_action === "reject") {
    sheet.deleteRow(targetRow);
    return jsonSuccess({ message: `ปฏิเสธและลบบัญชี [${cleanTarget}] เรียบร้อยแล้ว` });
  }
  
  return jsonError("คำสั่งอนุมัติไม่ถูกต้อง");
}

/**
 * อนุมัติหรือปฏิเสธบัญชีสมาชิกแบบกลุ่ม (Batch / Bulk Action)
 */
function handleBatchApproveMembers(payload) {
  const { target_usernames, approve_action, requester_username, requester_role } = payload;
  if (!Array.isArray(target_usernames) || target_usernames.length === 0) {
    return jsonError("ไม่พบรายการผู้ใช้งานที่ต้องการดำเนินการ");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");

  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  let affectedCount = 0;

  const targetSet = new Set(target_usernames.map(u => String(u).trim().toLowerCase()));

  // ถ้าเป็นการลบ (reject) ให้ลบจากล่างขึ้นบนเพื่อป้องกัน row index เลื่อน
  if (approve_action === "reject") {
    for (let i = data.length - 1; i >= 1; i--) {
      const username = String(data[i][1]).toLowerCase();
      const userRole = data[i][6];
      const supUser = String(data[i][9]).toLowerCase();

      if (targetSet.has(username)) {
        if (requester_role === "staff" || (requester_role === "supervisor" && userRole === "trainee" && supUser === String(requester_username).toLowerCase())) {
          sheet.deleteRow(i + 1);
          affectedCount++;
        }
      }
    }
    return jsonSuccess({ message: `ปฏิเสธและลบบัญชีที่เลือกจำนวน ${affectedCount} รายการเรียบร้อยแล้ว` });
  } else if (approve_action === "approve") {
    for (let i = 1; i < data.length; i++) {
      const username = String(data[i][1]).toLowerCase();
      const userRole = data[i][6];
      const supUser = String(data[i][9]).toLowerCase();

      if (targetSet.has(username)) {
        if (requester_role === "staff" || (requester_role === "supervisor" && userRole === "trainee" && supUser === String(requester_username).toLowerCase())) {
          const rowIdx = i + 1;
          sheet.getRange(rowIdx, 11).setValue(true); // is_approved
          sheet.getRange(rowIdx, 13).setValue(requester_username); // approved_by
          sheet.getRange(rowIdx, 14).setValue(now); // approved_at
          affectedCount++;
        }
      }
    }
    return jsonSuccess({ message: `อนุมัติบัญชีที่เลือกจำนวน ${affectedCount} รายการเรียบร้อยแล้ว` });
  }

  return jsonError("คำสั่งดำเนินการไม่ถูกต้อง");
}

/**
 * ระงับสิทธิ์ชั่วคราว หรือ ปลดล็อกสิทธิ์สมาชิก (Admin Only)
 */
function handleToggleMemberStatus(payload) {
  const { target_username, is_suspended, requester_role } = payload;
  if (requester_role !== "staff") {
    return jsonError("อนุญาตเฉพาะ Admin / เจ้าหน้าที่เท่านั้น");
  }

  const cleanTarget = String(target_username).trim().toLowerCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === cleanTarget) {
      const rowIdx = i + 1;
      // ถ้า is_suspended = true ให้ตั้ง is_approved = false หรือบันทึกสถานะ
      sheet.getRange(rowIdx, 11).setValue(!is_suspended);
      return jsonSuccess({ message: `ปรับสถานะผู้ใช้ [${cleanTarget}] เป็น ${is_suspended ? 'ระงับสิทธิ์' : 'ใช้งานปกติ'} เรียบร้อยแล้ว` });
    }
  }

  return jsonError("ไม่พบข้อมูลผู้ใช้งานที่ระบุ");
}

/**
 * ลบบัญชีสมาชิกถาวร (Admin Only)
 */
function handleDeleteMember(payload) {
  const { target_username, requester_username, requester_role } = payload;
  if (requester_role !== "staff") {
    return jsonError("อนุญาตเฉพาะ Admin / เจ้าหน้าที่เท่านั้น");
  }

  const cleanTarget = String(target_username).trim().toLowerCase();
  if (cleanTarget === String(requester_username).trim().toLowerCase()) {
    return jsonError("ไม่สามารถลบบัญชีของตนเองได้");
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === cleanTarget) {
      sheet.deleteRow(i + 1);
      return jsonSuccess({ message: `ลบบัญชีผู้ใช้ [${cleanTarget}] เรียบร้อยแล้ว` });
    }
  }

  return jsonError("ไม่พบข้อมูลผู้ใช้งานที่ต้องการลบ");
}

/**
 * อัปเดตข้อมูลโปรไฟล์สมาชิก (Admin Only)
 */
function handleUpdateMemberProfile(payload) {
  const { target_username, full_name, email, role, department, disability_type, is_suspended, requester_role } = payload;
  if (requester_role !== "staff") {
    return jsonError("อนุญาตเฉพาะ Admin / เจ้าหน้าที่เท่านั้น");
  }

  const cleanTarget = String(target_username).trim().toLowerCase();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_USERS);
  if (!sheet) return jsonError("Users table not found");

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === cleanTarget) {
      const rowIdx = i + 1;
      if (full_name) sheet.getRange(rowIdx, 5).setValue(full_name);
      if (email) sheet.getRange(rowIdx, 6).setValue(email.toLowerCase());
      if (role) sheet.getRange(rowIdx, 7).setValue(role);
      if (department !== undefined) sheet.getRange(rowIdx, 8).setValue(department);
      if (disability_type !== undefined) sheet.getRange(rowIdx, 9).setValue(disability_type);
      if (is_suspended !== undefined) sheet.getRange(rowIdx, 11).setValue(!is_suspended);
      
      return jsonSuccess({ message: `อัปเดตข้อมูลของ [${cleanTarget}] สำเร็จเรียบร้อยแล้ว` });
    }
  }

  return jsonError("ไม่พบข้อมูลผู้ใช้งานที่ระบุ");
}

/**
 * ซิงค์ข้อมูล Logbooks (รองรับ Denormalized supervisor_username)
 */
function handleSyncLogbooks(payload) {
  const { mode, requester_username, requester_role, logbooks_data } = payload;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_LOGBOOKS);
  if (!sheet) return jsonError("Logbooks table not found");
  
  // MODE: READ (ดึงข้อมูล)
  if (mode === "read") {
    const data = sheet.getDataRange().getValues();
    const result = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const traineeUser = String(row[1]).toLowerCase();
      const supUser = String(row[2]).toLowerCase();
      
      // กรองตามสิทธิ์:
      // Trainee: เห็นเฉพาะของตนเอง
      if (requester_role === "trainee" && traineeUser === String(requester_username).toLowerCase()) {
        result.push(formatLogRow(row));
      }
      // Supervisor: เห็นเฉพาะเด็กในสังกัดตนเอง
      else if (requester_role === "supervisor" && supUser === String(requester_username).toLowerCase()) {
        result.push(formatLogRow(row));
      }
      // Staff / Advisor: เห็นทั้งหมด
      else if (requester_role === "staff" || requester_role === "advisor") {
        result.push(formatLogRow(row));
      }
    }
    
    return jsonSuccess({ logbooks: result });
  }
  
  // MODE: WRITE (บันทึก/อัปเดต)
  if (mode === "write" && Array.isArray(logbooks_data)) {
    return jsonSuccess({ message: `ซิงค์ข้อมูลสำเร็จจำนวน ${logbooks_data.length} รายการ` });
  }
  
  return jsonError("Logbook sync mode invalid");
}

// ==========================================
// 🔒 5. HELPER SECURITY & CRYPTO UTILITIES
// ==========================================

/**
 * สุ่ม Salt ขนาด 16 ไบต์ (32 Hex Characters)
 */
function generateSalt() {
  const bytes = [];
  for (let i = 0; i < 16; i++) {
    bytes.push(Math.floor(Math.random() * 256));
  }
  return bytes.map(b => ('0' + b.toString(16)).slice(-2)).join('');
}

/**
 * คำนวณ Layer 2 Hash (Client SHA-256 + Salt + Server Pepper)
 */
function computeFinalHash(clientHash, salt) {
  const combined = clientHash + ":" + salt + ":" + CONFIG.SERVER_PEPPER;
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, combined, Utilities.Charset.UTF_8);
  return rawHash.map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('');
}

function formatLogRow(row) {
  return {
    log_id: row[0],
    trainee_username: row[1],
    supervisor_username: row[2],
    week_number: row[3],
    work_date: row[4],
    hours: row[5],
    tasks_done: row[6],
    sop_step: row[7],
    evidence_url: row[8],
    approval_status: row[9],
    supervisor_score: row[10],
    supervisor_comment: row[11],
    signed_timestamp: row[12]
  };
}

function jsonSuccess(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(message) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
