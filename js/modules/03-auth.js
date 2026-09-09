/**
 * 🏛️ MODULE 3: SECURITY & RBAC SUITE
 * มาตรฐาน NIST 6+ PIN, Web Crypto SHA-256 และการจำแนก 4 สิทธิ์การใช้งาน
 */

export class AuthSecuritySuite {
  constructor() {
    this.sessionKey = 'smartgov_v25_auth';
    this.currentUser = this.loadSession();
  }

  loadSession() {
    try {
      const raw = sessionStorage.getItem(this.sessionKey);
      return raw ? JSON.parse(raw) : {
        username: 'new_trainee',
        role: 'trainee',
        fullName: 'ผู้ฝึกภาคปฏิบัติการคนพิการ',
        isLoggedIn: true
      };
    } catch {
      return null;
    }
  }

  saveSession(user) {
    this.currentUser = user;
    sessionStorage.setItem(this.sessionKey, JSON.stringify(user));
  }

  async hashPin(pin) {
    if (!pin || pin.length < 6) {
      throw new Error('รหัส PIN ต้องมีความยาวอย่างน้อย 6 หลักตามมาตรฐาน NIST');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  getRole() {
    return this.currentUser?.role || 'trainee';
  }

  isTrainee() {
    return this.getRole() === 'trainee';
  }

  isSupervisor() {
    return this.getRole() === 'supervisor' || this.getRole() === 'staff';
  }

  isAdvisor() {
    return this.getRole() === 'advisor' || this.getRole() === 'staff';
  }

  isStaff() {
    return this.getRole() === 'staff';
  }

  switchRole(role, fullName) {
    this.saveSession({
      username: `${role}_user`,
      role,
      fullName: fullName || (role === 'supervisor' ? 'ผู้ควบคุมการฝึกงาน' : role === 'advisor' ? 'อาจารย์นิเทศก์' : 'เจ้าหน้าที่ผู้ดูแลระบบ'),
      isLoggedIn: true
    });
  }
}

export const auth = new AuthSecuritySuite();
