import re
from typing import Dict, List, Tuple

class PDPASanitizer:
    """
    โมดูลความปลอดภัย PDPA Sanitizer (Double-Shield Data Protection)
    ทำหน้าที่ตรวจสอบและเซ็นเซอร์ข้อมูลส่วนบุคคลก่อนจัดเก็บหรือส่งออก
    """

    THAI_ID_PATTERN = re.compile(r'\b(?:\d[- ]?){12}\d\b')
    THAI_PHONE_PATTERN = re.compile(r'\b0[689]\d[- ]?\d{3}[- ]?\d{4}\b|\b0\d{1,2}[- ]?\d{3}[- ]?\d{4}\b')
    EMAIL_PATTERN = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    LINE_ID_PATTERN = re.compile(r'(?i)\b(?:line\s*(?:id)?|id\s*line)[:\s]*([a-zA-Z0-9._-]+)\b')

    @classmethod
    def mask_thai_id(cls, text: str) -> Tuple[str, List[str]]:
        findings = []
        def _repl(match):
            raw = match.group(0)
            clean = re.sub(r'[- ]', '', raw)
            if len(clean) == 13:
                findings.append(f"Thai National ID ({clean[:3]}...{clean[-2:]})")
                return f"{clean[0]}-****-*****-{clean[-3:-1]}-{clean[-1]}"
            return raw
        sanitized = cls.THAI_ID_PATTERN.sub(_repl, text)
        return sanitized, findings

    @classmethod
    def mask_phone(cls, text: str) -> Tuple[str, List[str]]:
        findings = []
        def _repl(match):
            raw = match.group(0)
            digits = re.sub(r'[- ]', '', raw)
            findings.append(f"Phone Number ({digits[:3]}...{digits[-2:]})")
            if len(digits) == 10:
                return f"{digits[:3]}-***-{digits[6:]}"
            elif len(digits) == 9:
                return f"{digits[:2]}-***-{digits[5:]}"
            return f"0XX-***-{digits[-4:]}"
        sanitized = cls.THAI_PHONE_PATTERN.sub(_repl, text)
        return sanitized, findings

    @classmethod
    def mask_email(cls, text: str) -> Tuple[str, List[str]]:
        findings = []
        def _repl(match):
            raw = match.group(0)
            findings.append(f"Email ({raw.split('@')[1]})")
            parts = raw.split('@')
            user, domain = parts[0], parts[1]
            if len(user) <= 2:
                masked_user = user[0] + "***"
            else:
                masked_user = user[0] + "***" + user[-1]
            return f"{masked_user}@{domain}"
        sanitized = cls.EMAIL_PATTERN.sub(_repl, text)
        return sanitized, findings

    @classmethod
    def mask_line_id(cls, text: str) -> Tuple[str, List[str]]:
        findings = []
        def _repl(match):
            line_id = match.group(1)
            findings.append(f"Line ID ({line_id[:2]}...)")
            return "Line ID: [REDACTED_PDPA]"
        sanitized = cls.LINE_ID_PATTERN.sub(_repl, text)
        return sanitized, findings

    @classmethod
    def sanitize(cls, text: str) -> Tuple[str, List[str]]:
        if not text:
            return "", []

        audit_log = []
        text, id_logs = cls.mask_thai_id(text)
        audit_log.extend(id_logs)

        text, phone_logs = cls.mask_phone(text)
        audit_log.extend(phone_logs)

        text, email_logs = cls.mask_email(text)
        audit_log.extend(email_logs)

        text, line_logs = cls.mask_line_id(text)
        audit_log.extend(line_logs)

        return text, audit_log
