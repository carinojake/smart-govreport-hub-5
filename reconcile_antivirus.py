#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
==============================================================================
Antivirus Audit & Reconciliation Automation Engine (Star Cat vs XDR)
กระทรวงยุติธรรม (Ministry of Justice - MOJ)
พัฒนาสำหรับ: พี่แจ็ค (Jake)
สถาปัตยกรรมระบบโดย: เซียน SA (5.2) ร่วมกับ โค้ดเดอร์หลังบ้าน (5.5)
==============================================================================
"""

import sys
import os
import re
import json
import argparse
from datetime import datetime
from collections import Counter, defaultdict

try:
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
    from openpyxl.utils import get_column_letter
except ImportError:
    print("[Error] openpyxl is required. Run: pip install openpyxl")
    sys.exit(1)

# ==============================================================================
# 1. MOJ Department Mapping & Metadata
# ==============================================================================

CENTRAL_DEPTS = {
    "HRMD": "กองบริหารทรัพยากรบุคคล",
    "FMD": "กองคลัง (Financial Management)",
    "GAF": "กองกลาง (General Affairs)",
    "LAD": "กองกฎหมาย (Legal Affairs)",
    "SPD": "กองยุทธศาสตร์และแผนงาน",
    "ICTC": "ศูนย์เทคโนโลยีสารสนเทศและการสื่อสาร",
    "OM": "สำนักงานรัฐมนตรี/สำนักงานปลัด",
    "DCD": "กองประสานเชิงยุทธศาสตร์",
    "IAD": "กลุ่มตรวจสอบภายใน",
    "HRDI": "สถาบันพัฒนาบุคลากรด้านการยุติธรรม",
    "JIDV": "กองพัฒนาระบบการยุติธรรมเด็กและเยาวชน",
    "SPCP": "กองส่งเสริมการมีส่วนร่วมด้านการยุติธรรม",
    "JSL": "สถาบันอนุญาโตตุลาการ/นิติวิทยาศาสตร์",
    "OIG": "สำนักผู้ตรวจราชการกระทรวง",
    "PSDG": "กลุ่มพัฒนาระบบบริหาร",
    "VIP": "ห้องรับรอง/ผู้บริหารระดับสูง",
    "ORC": "กลุ่มคุ้มครองจริยธรรม",
    "IAG": "กลุ่มคุ้มครองความปลอดภัยข้อมูล",
    "ACR": "กลุ่มงานบัญชีและพัสดุ",
    "ACC": "กลุ่มงานบัญชี",
    "DDIT": "กลุ่มสนับสนุนไอทีพิเศษ",
    "OHPR": "กลุ่มงานประชาสัมพันธ์",
    "OJPC": "สำนักนโยบายและประสานแผน",
    "OJAC": "สำนักอำนวยการกลาง"
}

HIGH_RISK_DEPTS = {"FMD", "HRMD", "LAD", "SPD", "ICTC", "IAD", "VIP", "ACR", "ACC"}

PROVINCE_CODES = {
    "CMI": "ยุติธรรมจังหวัดเชียงใหม่", "PBI": "ยุติธรรมจังหวัดเพชรบุรี", "PLK": "ยุติธรรมจังหวัดพิษณุโลก",
    "SNI": "ยุติธรรมจังหวัดสุราษฎร์ธานี", "YLA": "ยุติธรรมจังหวัดยะลา", "UBN": "ยุติธรรมจังหวัดอุบลราชธานี",
    "NMA": "ยุติธรรมจังหวัดนครราชสีมา", "SKA": "ยุติธรรมจังหวัดสงขลา", "SRN": "ยุติธรรมจังหวัดสุรินทร์",
    "AYA": "ยุติธรรมจังหวัดอยุธยา", "UDN": "ยุติธรรมจังหวัดอุดรธานี", "NPT": "ยุติธรรมจังหวัดนครปฐม",
    "RBR": "ยุติธรรมจังหวัดราชบุรี", "NST": "ยุติธรรมจังหวัดนครศรีธรรมราช", "LPG": "ยุติธรรมจังหวัดลำปาง",
    "NSN": "ยุติธรรมจังหวัดนครสวรรค์", "SSK": "ยุติธรรมจังหวัดศรีสะเกษ", "NBI": "ยุติธรรมจังหวัดนนทบุรี",
    "PRI": "ยุติธรรมจังหวัดปราจีนบุรี", "SNK": "ยุติธรรมจังหวัดสกลนคร", "BRM": "ยุติธรรมจังหวัดบุรีรัมย์",
    "TRG": "ยุติธรรมจังหวัดตรัง", "CPM": "ยุติธรรมจังหวัดชัยภูมิ", "CRI": "ยุติธรรมจังหวัดเชียงราย",
    "KKN": "ยุติธรรมจังหวัดขอนแก่น", "KPT": "ยุติธรรมจังหวัดกำแพงเพชร", "LPN": "ยุติธรรมจังหวัดลำพูน",
    "MKM": "ยุติธรรมจังหวัดมหาสารคาม", "PLG": "ยุติธรรมจังหวัดพัทลุง", "RET": "ยุติธรรมจังหวัดร้อยเอ็ด",
    "RNG": "ยุธรรมจังหวัดระนอง", "UTT": "ยุติธรรมจังหวัดอุตรดิตถ์", "PKT": "ยุติธรรมจังหวัดภูเก็ต",
    "TAK": "ยุติธรรมจังหวัดตาก", "YST": "ยุติธรรมจังหวัดยโสธร", "CCO": "ยุติธรรมจังหวัดฉะเชิงเทรา",
    "CTI": "ยุติธรรมจังหวัดจันทบุรี", "KBI": "ยุติธรรมจังหวัดกระบี่", "KSN": "ยุติธรรมจังหวัดกาฬสินธุ์",
    "PNB": "ยุติธรรมจังหวัดเพชรบูรณ์", "PRE": "ยุติธรรมจังหวัดแพร่", "PTN": "ยุติธรรมจังหวัดปัตตานี",
    "SBR": "ยุติธรรมจังหวัดสระบุรี", "SKN": "ยุติธรรมจังหวัดสกลนคร", "SRI": "ยุติธรรมจังหวัดสิงห์บุรี",
    "LRI": "ยุติธรรมจังหวัดลพบุรี", "MDH": "ยุติธรรมจังหวัดมุกดาหาร", "NBP": "ยุติธรรมจังหวัดหนองบัวลำภู",
    "NWT": "ยุติธรรมจังหวัดนราธิวาส", "NYK": "ยุติธรรมจังหวัดนครนายก", "PKN": "ยุติธรรมจังหวัดพิจิตร",
    "PYO": "ยุติธรรมจังหวัดพะเยา", "STI": "ยุติธรรมจังหวัดสุโขทัย", "BKN": "ยุติธรรมจังหวัดบึงกาฬ",
    "NKI": "ยุติธรรมจังหวัดหนองคาย", "PNA": "ยุติธรรมจังหวัดพังงา", "TRT": "ยุติธรรมจังหวัดตราด",
    "ATG": "ยุติธรรมจังหวัดอ่างทอง", "CBI": "ยุติธรรมจังหวัดชลบุรี", "NPM": "ยุติธรรมจังหวัดนครพนม",
    "SKM": "ยุติธรรมจังหวัดสมุทรสงคราม", "SKW": "ยุติธรรมจังหวัดสระแก้ว", "SPB": "ยุติธรรมจังหวัดสุพรรณบุรี",
    "UTI": "ยุติธรรมจังหวัดอุทัยธานี", "CNT": "ยุติธรรมจังหวัดชัยนาท", "MSN": "ยุติธรรมจังหวัดแม่ฮ่องสอน",
    "PCT": "ยุติธรรมจังหวัดพิจิตร", "SPK": "ยุติธรรมจังหวัดสมุทรปราการ", "NAN": "ยุติธรรมจังหวัดน่าน",
    "STN": "ยุติธรรมจังหวัดสตูล", "CPN": "ยุติธรรมจังหวัดชุมพร", "KRI": "ยุติธรรมจังหวัดกาญจนบุรี",
    "PTE": "ยุติธรรมจังหวัดปทุมธานี", "LEI": "ยุติธรรมจังหวัดเลย"
}

def parse_device_info(name):
    """
    Parse department, device type, classification, and friendly name.
    """
    clean_name = str(name).strip()
    upper = clean_name.upper()

    # Device Type detection
    if "NB" in upper or "LAPTOP" in upper or "NOTEBOOK" in upper:
        dev_type = "Notebook"
    elif "PC" in upper or "DESKTOP" in upper or re.search(r'\b[0-9]{2,}\b', upper):
        dev_type = "Desktop/PC"
    else:
        dev_type = "Workstation/Other"

    # Shadow IT / Default name patterns
    if upper.startswith("DESKTOP-") or upper.startswith("LAPTOP-") or "PAKORN" in upper or upper == "MOJ":
        dept_code = "UNSTANDARDIZED"
        dept_name = "ชื่อเครื่องผิดมาตรฐาน/เครื่องส่วนบุคคล"
        category = "Shadow IT / รอตรวจสอบชื่อ"
        priority = "เร่งด่วน (IT Investigation)"
        return dept_code, dept_name, dev_type, category, priority

    # Standard MOJ pattern: MOJ-[DEPT]-[OPTIONAL_TYPE][NUM]
    parts = re.split(r'[-_]', clean_name)
    dept_raw = "OTHER"
    if len(parts) > 1:
        dept_raw = re.sub(r'[0-9]+', '', parts[1]).upper()

    if dept_raw in CENTRAL_DEPTS:
        dept_name = CENTRAL_DEPTS[dept_raw]
        category = "หน่วยงานส่วนกลาง"
        priority = "ความเสี่ยงสูง (High Risk)" if dept_raw in HIGH_RISK_DEPTS else "ปานกลาง (Medium)"
    elif dept_raw in PROVINCE_CODES:
        dept_name = PROVINCE_CODES[dept_raw]
        category = "สำนักงานยุติธรรมจังหวัด"
        priority = "ปกติ (Regional Standard)"
    elif dept_raw == "JFO":
        dept_name = "สนง.ยุติธรรมจังหวัด (ส่วนประสานงาน)"
        category = "สำนักงานยุติธรรมจังหวัด"
        priority = "ปานกลาง (Medium)"
    else:
        dept_raw = dept_raw if dept_raw else "OTHER"
        dept_name = f"หน่วยงานอื่นๆ ({dept_raw})"
        category = "อื่นๆ / ไม่ระบุฝ่าย"
        priority = "รอตรวจสอบฝ่าย"

    return dept_raw, dept_name, dev_type, category, priority

# ==============================================================================
# 2. Reconciliation Engine Core
# ==============================================================================

class AntivirusReconciler:
    def __init__(self, filepath):
        self.filepath = filepath
        self.wb = openpyxl.load_workbook(filepath, data_only=True)
        self.load_data()
        self.reconcile()

    def load_data(self):
        # Sheet 1: ข้อมูลที่ตรวจสอบ
        ws1 = self.wb['ข้อมูลที่ตรวจสอบ']
        rows1 = list(ws1.iter_rows(values_only=True))
        self.raw_starcat = []
        for r in rows1[1:]:
            if len(r) > 1 and r[1] is not None and str(r[1]).strip():
                self.raw_starcat.append(str(r[1]).strip())

        # Sheet 2: ข้อมูล XDR (or column C of sheet 1)
        if 'ข้อมูล XDR' in self.wb.sheetnames:
            ws2 = self.wb['ข้อมูล XDR']
            rows2 = list(ws2.iter_rows(values_only=True))
            self.raw_xdr = [str(r[0]).strip() for r in rows2 if r[0] is not None and str(r[0]).strip()]
        else:
            self.raw_xdr = []
            for r in rows1[1:]:
                if len(r) > 2 and r[2] is not None and str(r[2]).strip():
                    self.raw_xdr.append(str(r[2]).strip())

    def reconcile(self):
        # Duplicate detection
        self.starcat_counts = Counter(self.raw_starcat)
        self.xdr_counts = Counter(self.raw_xdr)

        self.starcat_dups = {k: v for k, v in self.starcat_counts.items() if v > 1}
        self.xdr_dups = {k: v for k, v in self.xdr_counts.items() if v > 1}

        # Unique sets
        self.set_starcat = set(self.raw_starcat)
        self.set_xdr = set(self.raw_xdr)

        # Matched / Missing / Shadow
        self.compliant = sorted(list(self.set_starcat & self.set_xdr))
        self.missing_xdr = sorted(list(self.set_starcat - self.set_xdr))
        self.shadow_it = sorted(list(self.set_xdr - self.set_starcat))

        # Overall Metrics
        self.total_starcat = len(self.set_starcat)
        self.total_xdr = len(self.set_xdr)
        self.total_compliant = len(self.compliant)
        self.total_missing = len(self.missing_xdr)
        self.total_shadow = len(self.shadow_it)
        self.coverage_rate = (self.total_compliant / self.total_starcat * 100) if self.total_starcat else 0

        # Department Grouping
        self.dept_stats = defaultdict(lambda: {
            "name": "", "category": "", "total": 0, "compliant": 0, "missing": 0, "priority": ""
        })

        for device in self.set_starcat:
            dept_code, dept_name, dev_type, category, priority = parse_device_info(device)
            stat = self.dept_stats[dept_code]
            stat["name"] = dept_name
            stat["category"] = category
            stat["total"] += 1
            stat["priority"] = priority
            if device in self.set_xdr:
                stat["compliant"] += 1
            else:
                stat["missing"] += 1

        for dept_code, stat in self.dept_stats.items():
            stat["rate"] = (stat["compliant"] / stat["total"] * 100) if stat["total"] > 0 else 0

# ==============================================================================
# 3. Multi-Tab Excel Generator
# ==============================================================================

def generate_excel_report(rec, output_path):
    wb = openpyxl.Workbook()
    # Remove default sheet
    wb.remove(wb.active)

    # Styling Palette
    FONT_FAMILY = "Sarabun"
    navy_fill = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid")
    dark_gray_fill = PatternFill(start_color="334155", end_color="334155", fill_type="solid")
    kpi_card_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
    alert_red_fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
    alert_yellow_fill = PatternFill(start_color="FEF3C7", end_color="FEF3C7", fill_type="solid")
    success_green_fill = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid")

    font_title = Font(name=FONT_FAMILY, size=16, bold=True, color="1B365D")
    font_subtitle = Font(name=FONT_FAMILY, size=11, italic=True, color="64748B")
    font_header = Font(name=FONT_FAMILY, size=11, bold=True, color="FFFFFF")
    font_bold = Font(name=FONT_FAMILY, size=10, bold=True)
    font_regular = Font(name=FONT_FAMILY, size=10)
    font_kpi_label = Font(name=FONT_FAMILY, size=9, bold=True, color="475569")

    thin_gray = Side(style='thin', color='E2E8F0')
    border_cell = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)
    border_card = Border(
        left=Side(style='medium', color='CBD5E1'),
        right=Side(style='medium', color='CBD5E1'),
        top=Side(style='medium', color='CBD5E1'),
        bottom=Side(style='medium', color='CBD5E1')
    )

    # --------------------------------------------------------------------------
    # TAB 1: Executive_Summary
    # --------------------------------------------------------------------------
    ws1 = wb.create_sheet(title="Executive_Summary")
    ws1.views.sheetView[0].showGridLines = True

    # Title Banner
    ws1.cell(row=2, column=2, value="รายงานผลการตรวจสอบและกระทบยอดการลงโปรแกรม Anti-Virus (Star Cat vs XDR)").font = font_title
    ws1.cell(row=3, column=2, value=f"กระทรวงยุติธรรม (MOJ) | ข้อมูล ณ วันที่ {datetime.now().strftime('%d/%m/%Y')} | สรุปโดย เซียน SA (5.2)").font = font_subtitle

    # KPI Summary Cards (Row 5 to 6)
    kpis = [
        ("ทรัพย์สินในระบบ Star Cat", f"{rec.total_starcat:,} เครื่อง", "1B365D"),
        ("ติดตั้ง XDR ทั้งหมด", f"{rec.total_xdr:,} เครื่อง", "0284C7"),
        ("ติดตั้งสมบูรณ์ (Compliant)", f"{rec.total_compliant:,} เครื่อง", "16A34A"),
        ("อัตราครอบคลุม (Coverage)", f"{rec.coverage_rate:.1f}%", "D97706"),
        ("ยังไม่ติดตั้ง XDR (Action Gap)", f"{rec.total_missing:,} เครื่อง", "DC2626"),
        ("พบใน XDR นอกระบบ (Shadow IT)", f"{rec.total_shadow:,} เครื่อง", "9333EA")
    ]

    col_idx = 2
    for label, val, color_hex in kpis:
        c1 = ws1.cell(row=5, column=col_idx, value=label)
        c1.font = font_kpi_label
        c1.alignment = Alignment(horizontal="center", vertical="center")
        c1.fill = kpi_card_fill

        c2 = ws1.cell(row=6, column=col_idx, value=val)
        c2.font = Font(name=FONT_FAMILY, size=16, bold=True, color=color_hex)
        c2.alignment = Alignment(horizontal="center", vertical="center")
        c2.fill = kpi_card_fill

        ws1.cell(row=5, column=col_idx).border = border_card
        ws1.cell(row=6, column=col_idx).border = border_card
        col_idx += 1

    # Department Breakdown Header
    ws1.cell(row=9, column=2, value="ตารางสรุปสถานะความคืบหน้าการติดตั้ง XDR แยกตามส่วนราชการ/กอง/ฝ่าย").font = Font(name=FONT_FAMILY, size=12, bold=True, color="1E293B")

    headers_ws1 = ["รหัสฝ่าย", "ชื่อส่วนราชการ / กอง / ฝ่าย", "กลุ่มงาน", "ทรัพย์สินทั้งหมด", "ติดตั้ง XDR แล้ว", "ยังไม่ติดตั้ง XDR", "Coverage %", "ระดับความเสี่ยง"]
    for i, h in enumerate(headers_ws1, start=2):
        cell = ws1.cell(row=10, column=i, value=h)
        cell.font = font_header
        cell.fill = navy_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border_cell

    # Sort departments by missing count descending
    sorted_depts = sorted(rec.dept_stats.items(), key=lambda x: (x[1]["missing"], x[1]["total"]), reverse=True)
    row_num = 11
    for code, st in sorted_depts:
        ws1.cell(row=row_num, column=2, value=code).alignment = Alignment(horizontal="center")
        ws1.cell(row=row_num, column=3, value=st["name"])
        ws1.cell(row=row_num, column=4, value=st["category"]).alignment = Alignment(horizontal="center")
        ws1.cell(row=row_num, column=5, value=st["total"]).alignment = Alignment(horizontal="right")
        ws1.cell(row=row_num, column=6, value=st["compliant"]).alignment = Alignment(horizontal="right")
        ws1.cell(row=row_num, column=7, value=st["missing"]).alignment = Alignment(horizontal="right")

        rate_cell = ws1.cell(row=row_num, column=8, value=f"{st['rate']:.1f}%")
        rate_cell.alignment = Alignment(horizontal="right")

        # Color coding for coverage
        if st["rate"] >= 80:
            rate_cell.fill = success_green_fill
        elif st["rate"] >= 50:
            rate_cell.fill = alert_yellow_fill
        else:
            rate_cell.fill = alert_red_fill

        p_cell = ws1.cell(row=row_num, column=9, value=st["priority"])
        p_cell.alignment = Alignment(horizontal="center")
        if "High" in st["priority"]:
            pass

        for col in range(2, 10):
            if col == 9 and "High" in st["priority"]:
                ws1.cell(row=row_num, column=col).font = Font(name=FONT_FAMILY, size=10, bold=True, color="DC2626")
            else:
                ws1.cell(row=row_num, column=col).font = font_regular
            ws1.cell(row=row_num, column=col).border = border_cell

        row_num += 1

    # Total row
    ws1.cell(row=row_num, column=2, value="รวมทั้งสิ้น").alignment = Alignment(horizontal="center")
    ws1.cell(row=row_num, column=3, value="-")
    ws1.cell(row=row_num, column=4, value="-").alignment = Alignment(horizontal="center")
    ws1.cell(row=row_num, column=5, value=rec.total_starcat).alignment = Alignment(horizontal="right")
    ws1.cell(row=row_num, column=6, value=rec.total_compliant).alignment = Alignment(horizontal="right")
    ws1.cell(row=row_num, column=7, value=rec.total_missing).alignment = Alignment(horizontal="right")
    ws1.cell(row=row_num, column=8, value=f"{rec.coverage_rate:.1f}%").alignment = Alignment(horizontal="right")
    ws1.cell(row=row_num, column=9, value="-").alignment = Alignment(horizontal="center")
    for col in range(2, 10):
        c = ws1.cell(row=row_num, column=col)
        c.font = font_bold
        c.fill = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
        c.border = border_cell

    # --------------------------------------------------------------------------
    # TAB 2: Missing_XDR_ActionList (1,074 เครื่อง)
    # --------------------------------------------------------------------------
    ws2 = wb.create_sheet(title="Missing_XDR_ActionList")
    ws2.views.sheetView[0].showGridLines = True

    ws2.cell(row=2, column=2, value="รายการเครื่องที่มีในระบบ Star Cat แต่ยังไม่พบการติดตั้ง XDR (Security Gap)").font = font_title
    ws2.cell(row=3, column=2, value=f"ต้องเร่งประสานงานติดตั้งรวมทั้งหมด {rec.total_missing:,} เครื่อง เรียงลำดับตามความเร่งด่วน").font = font_subtitle

    headers_ws2 = ["ลำดับ", "รหัสเครื่อง (Asset Name)", "รหัสฝ่าย", "ชื่อกอง / ฝ่าย", "ประเภทอุปกรณ์", "กลุ่มงาน", "ระดับความเร่งด่วน", "คำแนะนำในการดำเนินงาน"]
    for i, h in enumerate(headers_ws2, start=2):
        cell = ws2.cell(row=5, column=i, value=h)
        cell.font = font_header
        cell.fill = PatternFill(start_color="DC2626", end_color="DC2626", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border_cell

    missing_items = []
    for d in rec.missing_xdr:
        code, name, dtype, cat, prio = parse_device_info(d)
        missing_items.append((d, code, name, dtype, cat, prio))

    # Sort: High risk first, then by department
    missing_items.sort(key=lambda x: (0 if "High" in x[5] else 1 if "ปานกลาง" in x[5] else 2, x[1], x[0]))

    row_num = 6
    for idx, item in enumerate(missing_items, start=1):
        dev, code, name, dtype, cat, prio = item
        action = "ติดต่อผู้รับผิดชอบเครื่องเพื่อติดตั้ง XDR ทันที" if "High" in prio else "ติดตั้ง XDR ตามรอบตรวจซ่อม"
        ws2.cell(row=row_num, column=2, value=idx).alignment = Alignment(horizontal="center")
        ws2.cell(row=row_num, column=3, value=dev)
        ws2.cell(row=row_num, column=4, value=code).alignment = Alignment(horizontal="center")
        ws2.cell(row=row_num, column=5, value=name)
        ws2.cell(row=row_num, column=6, value=dtype).alignment = Alignment(horizontal="center")
        ws2.cell(row=row_num, column=7, value=cat).alignment = Alignment(horizontal="center")

        p_cell = ws2.cell(row=row_num, column=8, value=prio)
        p_cell.alignment = Alignment(horizontal="center")
        if "High" in prio:
            p_cell.fill = alert_red_fill
            p_cell.font = Font(name=FONT_FAMILY, size=10, bold=True, color="B91C1C")
        elif "ปานกลาง" in prio:
            p_cell.fill = alert_yellow_fill

        ws2.cell(row=row_num, column=9, value=action)

        for col in range(2, 10):
            if col != 8:
                ws2.cell(row=row_num, column=col).font = font_regular
            ws2.cell(row=row_num, column=col).border = border_cell
        row_num += 1

    # --------------------------------------------------------------------------
    # TAB 3: Shadow_IT_Unregistered (114 เครื่อง)
    # --------------------------------------------------------------------------
    ws3 = wb.create_sheet(title="Shadow_IT_Unregistered")
    ws3.views.sheetView[0].showGridLines = True

    ws3.cell(row=2, column=2, value="รายการเครื่องที่พบในระบบ XDR แต่ไม่อยู่ในทะเบียน Star Cat (Shadow IT)").font = font_title
    ws3.cell(row=3, column=2, value=f"รวมทั้งหมด {rec.total_shadow:,} เครื่อง ต้องตรวจสอบการขึ้นทะเบียนทรัพย์สินและการติดตั้ง Star Cat Agent").font = font_subtitle

    headers_ws3 = ["ลำดับ", "รหัสเครื่องใน XDR", "หมวดหมู่ข้อสังเกต", "ประเภทอุปกรณ์", "สถานะใน Star Cat", "การดำเนินการที่แนะนำ"]
    for i, h in enumerate(headers_ws3, start=2):
        cell = ws3.cell(row=5, column=i, value=h)
        cell.font = font_header
        cell.fill = PatternFill(start_color="7C3AED", end_color="7C3AED", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border_cell

    row_num = 6
    for idx, dev in enumerate(rec.shadow_it, start=1):
        code, name, dtype, cat, prio = parse_device_info(dev)
        if "UNSTANDARDIZED" in code:
            obs = "ชื่อเครื่องตั้งต้น Windows / เครื่องส่วนบุคคล"
            rec_act = "ให้ช่าง IT สแกนเครื่องจริง ตรวจสอบผู้ใช้งาน และเปลี่ยนชื่อให้ตรงระเบียบ MOJ"
        elif "OTHER" in code:
            obs = "เครื่องนอกแผนก / ชื่อไม่ตรงฟอร์แมต"
            rec_act = "ตรวจสอบทะเบียนทรัพย์สินพัสดุ และติดตั้ง Star Cat Agent เพิ่มเติม"
        else:
            obs = f"เครื่องสังกัด {name} (มี XDR แต่หลุดสำรวจ Star Cat)"
            rec_act = "นำเข้ารหัสเครื่องในฐานข้อมูล Star Cat Asset Management"

        ws3.cell(row=row_num, column=2, value=idx).alignment = Alignment(horizontal="center")
        ws3.cell(row=row_num, column=3, value=dev)
        ws3.cell(row=row_num, column=4, value=obs)
        ws3.cell(row=row_num, column=5, value=dtype).alignment = Alignment(horizontal="center")
        ws3.cell(row=row_num, column=6, value="ไม่มีใน Star Cat").alignment = Alignment(horizontal="center")
        ws3.cell(row=row_num, column=7, value=rec_act)

        for col in range(2, 8):
            ws3.cell(row=row_num, column=col).font = font_regular
            ws3.cell(row=row_num, column=col).border = border_cell
        row_num += 1

    # --------------------------------------------------------------------------
    # TAB 4: Data_Hygiene_Duplicates
    # --------------------------------------------------------------------------
    ws4 = wb.create_sheet(title="Data_Hygiene_Duplicates")
    ws4.views.sheetView[0].showGridLines = True

    ws4.cell(row=2, column=2, value="รายการชื่อเครื่องที่มีความซ้ำซ้อนในฐานข้อมูล (Data Hygiene Audit)").font = font_title
    ws4.cell(row=3, column=2, value="พบรายการซ้ำใน Star Cat 17 รายการ และใน XDR 7 รายการ ควรตรวจสอบการเคลียร์ประวัติเก่า").font = font_subtitle

    headers_ws4 = ["ลำดับ", "ระบบที่พบ", "รหัสชื่อเครื่อง (Asset Name)", "จำนวนครั้งที่ซ้ำในระบบ", "ข้อสังเกตและคำแนะนำ"]
    for i, h in enumerate(headers_ws4, start=2):
        cell = ws4.cell(row=5, column=i, value=h)
        cell.font = font_header
        cell.fill = dark_gray_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border_cell

    row_num = 6
    idx_dup = 1
    for name, cnt in sorted(rec.starcat_dups.items(), key=lambda x: x[1], reverse=True):
        ws4.cell(row=row_num, column=2, value=idx_dup).alignment = Alignment(horizontal="center")
        ws4.cell(row=row_num, column=3, value="Star Cat (Asset Management)").alignment = Alignment(horizontal="center")
        ws4.cell(row=row_num, column=4, value=name)
        ws4.cell(row=row_num, column=5, value=cnt).alignment = Alignment(horizontal="right")
        ws4.cell(row=row_num, column=6, value="อาจมีประวัติลงทะเบียนซ้ำซ้อนตอนเปลี่ยนเครื่องหรือ Format OS")
        for col in range(2, 7):
            ws4.cell(row=row_num, column=col).font = font_regular
            ws4.cell(row=row_num, column=col).border = border_cell
        row_num += 1
        idx_dup += 1

    for name, cnt in sorted(rec.xdr_dups.items(), key=lambda x: x[1], reverse=True):
        ws4.cell(row=row_num, column=2, value=idx_dup).alignment = Alignment(horizontal="center")
        ws4.cell(row=row_num, column=3, value="XDR Security Console").alignment = Alignment(horizontal="center")
        ws4.cell(row=row_num, column=4, value=name)
        ws4.cell(row=row_num, column=5, value=cnt).alignment = Alignment(horizontal="right")
        ws4.cell(row=row_num, column=6, value="ตรวจสอบ Endpoint Agent UUID ว่าเป็นเครื่องเดียวกันหรือ Duplicate Agent")
        for col in range(2, 7):
            ws4.cell(row=row_num, column=col).font = font_regular
            ws4.cell(row=row_num, column=col).border = border_cell
        row_num += 1
        idx_dup += 1

    # --------------------------------------------------------------------------
    # TAB 5: Master_Consolidated (รวมทุกอุปกรณ์)
    # --------------------------------------------------------------------------
    ws5 = wb.create_sheet(title="Master_Consolidated")
    ws5.views.sheetView[0].showGridLines = True

    ws5.cell(row=2, column=2, value="ฐานข้อมูลอุปกรณ์ทั้งหมดจากการ Reconcile (Master Data)").font = font_title
    ws5.cell(row=3, column=2, value="รวมข้อมูล Star Cat และ XDR พร้อมสถานะความปลอดภัยเพื่อใช้สืบค้น").font = font_subtitle

    headers_ws5 = ["ลำดับ", "รหัสเครื่อง (Asset Name)", "รหัสฝ่าย", "ชื่อกอง/ฝ่าย", "ประเภทอุปกรณ์", "Star Cat", "XDR Status", "ผลการกระทบยอด"]
    for i, h in enumerate(headers_ws5, start=2):
        cell = ws5.cell(row=5, column=i, value=h)
        cell.font = font_header
        cell.fill = navy_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = border_cell

    all_devices = sorted(list(rec.set_starcat | rec.set_xdr))
    row_num = 6
    for idx, dev in enumerate(all_devices, start=1):
        code, name, dtype, cat, prio = parse_device_info(dev)
        in_sc = dev in rec.set_starcat
        in_xdr = dev in rec.set_xdr

        if in_sc and in_xdr:
            status = "Compliant (ปลอดภัย)"
            st_fill = success_green_fill
        elif in_sc and not in_xdr:
            status = "Missing XDR (ขาด Antivirus)"
            st_fill = alert_red_fill
        else:
            status = "Shadow IT (อยู่นอก Star Cat)"
            st_fill = alert_yellow_fill

        ws5.cell(row=row_num, column=2, value=idx).alignment = Alignment(horizontal="center")
        ws5.cell(row=row_num, column=3, value=dev)
        ws5.cell(row=row_num, column=4, value=code).alignment = Alignment(horizontal="center")
        ws5.cell(row=row_num, column=5, value=name)
        ws5.cell(row=row_num, column=6, value=dtype).alignment = Alignment(horizontal="center")
        ws5.cell(row=row_num, column=7, value="มีในระบบ" if in_sc else "ไม่มี").alignment = Alignment(horizontal="center")
        ws5.cell(row=row_num, column=8, value="ติดตั้งแล้ว" if in_xdr else "ยังไม่ติดตั้ง").alignment = Alignment(horizontal="center")

        s_cell = ws5.cell(row=row_num, column=9, value=status)
        s_cell.alignment = Alignment(horizontal="center")
        s_cell.fill = st_fill

        for col in range(2, 10):
            ws5.cell(row=row_num, column=col).font = font_regular
            ws5.cell(row=row_num, column=col).border = border_cell
        row_num += 1

    # Auto-fit column widths for all sheets
    for sheet in wb.worksheets:
        for col in sheet.columns:
            max_len = 0
            col_letter = get_column_letter(col[0].column)
            if col[0].column < 2:
                sheet.column_dimensions[col_letter].width = 4
                continue
            for cell in col:
                val_str = str(cell.value or '')
                # Approximate width for Thai and English
                char_len = sum(2 if ord(c) > 127 else 1 for c in val_str)
                if char_len > max_len:
                    max_len = char_len
            sheet.column_dimensions[col_letter].width = max(max_len + 3, 12)

    wb.save(output_path)
    print(f"[Success] Multi-tab Excel Report generated at: {output_path}")

# ==============================================================================
# 4. Standalone Interactive HTML Dashboard Generator
# ==============================================================================

def generate_html_dashboard(rec, output_path):
    # Prepare JSON payloads
    master_records = []
    all_devices = sorted(list(rec.set_starcat | rec.set_xdr))
    for dev in all_devices:
        code, name, dtype, cat, prio = parse_device_info(dev)
        in_sc = dev in rec.set_starcat
        in_xdr = dev in rec.set_xdr
        if in_sc and in_xdr:
            status = "Compliant"
            badge = "bg-emerald-100 text-emerald-800"
        elif in_sc and not in_xdr:
            status = "Missing XDR"
            badge = "bg-rose-100 text-rose-800 font-semibold"
        else:
            status = "Shadow IT"
            badge = "bg-amber-100 text-amber-800"

        master_records.append({
            "device": dev,
            "deptCode": code,
            "deptName": name,
            "devType": dtype,
            "category": cat,
            "priority": prio,
            "inStarCat": in_sc,
            "inXdr": in_xdr,
            "status": status,
            "badge": badge
        })

    # Prepare Department Chart Data (Top 15 by missing)
    sorted_depts = sorted(rec.dept_stats.items(), key=lambda x: x[1]["missing"], reverse=True)[:15]
    chart_labels = [d[0] for d in sorted_depts]
    chart_compliant = [d[1]["compliant"] for d in sorted_depts]
    chart_missing = [d[1]["missing"] for d in sorted_depts]

    html_content = f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ระบบตรวจสอบและกระทบยอด Anti-Virus MOJ (Star Cat vs XDR)</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif;
    }}
  </style>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen">

  <!-- Navigation Bar -->
  <header class="bg-slate-900 text-white shadow-md border-b border-slate-800">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <div class="flex items-center gap-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500 text-white">MOJ Security Audit</span>
          <h1 class="text-xl font-bold tracking-tight">รายงานกระทบยอด Anti-Virus: Star Cat vs XDR</h1>
        </div>
        <p class="text-xs text-slate-400 mt-1">กระทรวงยุติธรรม | จัดทำโดย เซียน SA (5.2) สำหรับ พี่แจ็ค (Jake) | อัปเดต: {datetime.now().strftime('%d/%m/%Y %H:%M')}</p>
      </div>
      <div class="flex items-center gap-3">
        <a href="AntiVirus_Audit_Report.xlsx" download class="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          ดาวน์โหลด Excel Report
        </a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

    <!-- KPI Summary Row -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ทรัพย์สิน Star Cat</span>
        <div class="text-2xl font-bold text-slate-800 mt-2">{rec.total_starcat:,}</div>
        <span class="text-xs text-slate-500">ในระบบ Inventory</span>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ติดตั้งใน XDR</span>
        <div class="text-2xl font-bold text-sky-600 mt-2">{rec.total_xdr:,}</div>
        <span class="text-xs text-slate-500">รวม Shadow IT</span>
      </div>
      <div class="bg-white p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 shadow-sm">
        <span class="text-xs font-semibold text-emerald-700 uppercase tracking-wider">ติดตั้งสมบูรณ์</span>
        <div class="text-2xl font-bold text-emerald-600 mt-2">{rec.total_compliant:,}</div>
        <span class="text-xs text-emerald-600 font-medium">คุ้มครองครบ 2 ระบบ</span>
      </div>
      <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">ความครอบคลุม (Coverage)</span>
        <div class="text-2xl font-bold text-amber-600 mt-2">{rec.coverage_rate:.1f}%</div>
        <span class="text-xs text-amber-600 font-medium">เป้าหมายมาตรฐาน 100%</span>
      </div>
      <div class="bg-white p-5 rounded-xl border border-rose-200 bg-rose-50/40 shadow-sm">
        <span class="text-xs font-semibold text-rose-700 uppercase tracking-wider">ขาด XDR (Security Gap)</span>
        <div class="text-2xl font-bold text-rose-600 mt-2">{rec.total_missing:,}</div>
        <span class="text-xs text-rose-600 font-medium">ความเสี่ยงสูง ต้องเร่งลง</span>
      </div>
      <div class="bg-white p-5 rounded-xl border border-purple-200 bg-purple-50/40 shadow-sm">
        <span class="text-xs font-semibold text-purple-700 uppercase tracking-wider">Shadow IT</span>
        <div class="text-2xl font-bold text-purple-600 mt-2">{rec.total_shadow:,}</div>
        <span class="text-xs text-purple-600 font-medium">อยู่นอกระบบ Star Cat</span>
      </div>
    </div>

    <!-- Charts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Donut Chart -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
        <h3 class="text-base font-semibold text-slate-800 w-full mb-4">สัดส่วนความปลอดภัยภาพรวม</h3>
        <div class="w-64 h-64 relative flex items-center justify-center">
          <canvas id="donutChart"></canvas>
        </div>
        <div class="w-full mt-4 grid grid-cols-3 text-center text-xs gap-2 pt-3 border-t border-slate-100">
          <div><span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span>Compliant: {rec.total_compliant}</div>
          <div><span class="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 mr-1"></span>Missing: {rec.total_missing}</div>
          <div><span class="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 mr-1"></span>Shadow: {rec.total_shadow}</div>
        </div>
      </div>

      <!-- Top Departments Bar Chart -->
      <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
        <h3 class="text-base font-semibold text-slate-800 mb-4">15 กอง/ส่วนราชการที่ยังค้างติดตั้ง XDR สูงสุด (High Missing Volume)</h3>
        <div class="h-64">
          <canvas id="barChart"></canvas>
        </div>
      </div>
    </div>

    <!-- Interactive Data Explorer Table -->
    <div class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-lg font-bold text-slate-800">ระบบสืบค้นและคัดกรองข้อมูลอุปกรณ์ (Device Explorer)</h2>
          <p class="text-sm text-slate-500">กรองรายชื่อเครื่องตามสถานะ, ส่วนราชการ, ความเร่งด่วน หรือพิมพ์ค้นหาได้ทันที</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <input type="text" id="searchInput" placeholder="ค้นหาชื่อเครื่อง, กอง, แผนก..." class="px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 w-64">
          <select id="statusFilter" class="px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900">
            <option value="ALL">สถานะทั้งหมด</option>
            <option value="Missing XDR" selected>ขาด XDR (1,074 เครื่อง)</option>
            <option value="Compliant">ติดตั้งสมบูรณ์ (829 เครื่อง)</option>
            <option value="Shadow IT">Shadow IT (114 เครื่อง)</option>
          </select>
          <select id="priorityFilter" class="px-3.5 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900">
            <option value="ALL">ความเร่งด่วนทั้งหมด</option>
            <option value="High Risk">ความเสี่ยงสูง (High Risk)</option>
            <option value="IT Investigation">IT Investigation</option>
          </select>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm border-collapse">
          <thead>
            <tr class="bg-slate-100 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <th class="py-3 px-4 text-center w-16">ลำดับ</th>
              <th class="py-3 px-4">รหัสเครื่อง (Asset Name)</th>
              <th class="py-3 px-4">กอง / ฝ่าย</th>
              <th class="py-3 px-4 text-center">ประเภท</th>
              <th class="py-3 px-4 text-center">กลุ่มงาน</th>
              <th class="py-3 px-4 text-center">ระดับความเสี่ยง</th>
              <th class="py-3 px-4 text-center">สถานะ</th>
            </tr>
          </thead>
          <tbody id="tableBody" class="divide-y divide-slate-200">
            <!-- Rendered by JavaScript -->
          </tbody>
        </table>
      </div>

      <div class="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
        <div>แสดง <span id="displayedCount" class="font-semibold text-slate-800">0</span> จากทั้งหมด <span class="font-semibold text-slate-800">{len(all_devices):,}</span> เครื่อง</div>
        <div class="text-xs text-slate-400">ระบบตรวจสอบอัตโนมัติ กระทรวงยุติธรรม</div>
      </div>
    </div>

  </main>

  <script>
    // Master Data from Python Engine
    const rawData = {json.dumps(master_records, ensure_ascii=False)};

    // Initialize Charts
    const donutCtx = document.getElementById('donutChart').getContext('2d');
    new Chart(donutCtx, {{
      type: 'doughnut',
      data: {{
        labels: ['Compliant', 'Missing XDR', 'Shadow IT'],
        datasets: [{{
          data: [{rec.total_compliant}, {rec.total_missing}, {rec.total_shadow}],
          backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }}]
      }},
      options: {{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {{
          legend: {{ display: false }}
        }},
        cutout: '70%'
      }}
    }});

    const barCtx = document.getElementById('barChart').getContext('2d');
    new Chart(barCtx, {{
      type: 'bar',
      data: {{
        labels: {json.dumps(chart_labels, ensure_ascii=False)},
        datasets: [
          {{
            label: 'ยังไม่ลง XDR',
            data: {json.dumps(chart_missing)},
            backgroundColor: '#EF4444'
          }},
          {{
            label: 'ลง XDR แล้ว',
            data: {json.dumps(chart_compliant)},
            backgroundColor: '#10B981'
          }}
        ]
      }},
      options: {{
        responsive: true,
        maintainAspectRatio: false,
        scales: {{
          x: {{ stacked: true }},
          y: {{ stacked: true, beginAtZero: true }}
        }},
        plugins: {{
          legend: {{ position: 'top' }}
        }}
      }}
    }});

    // Table Filtering Logic
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const priorityFilter = document.getElementById('priorityFilter');
    const tableBody = document.getElementById('tableBody');
    const displayedCount = document.getElementById('displayedCount');

    function renderTable() {{
      const query = searchInput.value.toLowerCase().trim();
      const status = statusFilter.value;
      const priority = priorityFilter.value;

      const filtered = rawData.filter(item => {{
        const matchesQuery = !query || 
          item.device.toLowerCase().includes(query) ||
          item.deptCode.toLowerCase().includes(query) ||
          item.deptName.toLowerCase().includes(query);

        const matchesStatus = status === 'ALL' || item.status === status;
        const matchesPriority = priority === 'ALL' || item.priority.includes(priority);

        return matchesQuery && matchesStatus && matchesPriority;
      }});

      displayedCount.innerText = filtered.length.toLocaleString();

      // Show top 250 items for super fast DOM rendering
      const slice = filtered.slice(0, 250);
      let html = '';
      slice.forEach((item, idx) => {{
        html += `
          <tr class="hover:bg-slate-50 transition">
            <td class="py-2.5 px-4 text-center text-slate-400 text-xs">${{idx + 1}}</td>
            <td class="py-2.5 px-4 font-mono font-medium text-slate-900">${{item.device}}</td>
            <td class="py-2.5 px-4">
              <div class="font-medium text-slate-800">${{item.deptName}}</div>
              <div class="text-xs text-slate-400 font-mono">${{item.deptCode}}</div>
            </td>
            <td class="py-2.5 px-4 text-center text-xs text-slate-600">${{item.devType}}</td>
            <td class="py-2.5 px-4 text-center text-xs text-slate-500">${{item.category}}</td>
            <td class="py-2.5 px-4 text-center text-xs font-medium">
              <span class="${{item.priority.includes('High') ? 'text-rose-600' : 'text-slate-600'}}">${{item.priority}}</span>
            </td>
            <td class="py-2.5 px-4 text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${{item.badge}}">
                ${{item.status}}
              </span>
            </td>
          </tr>
        `;
      }});

      if (filtered.length === 0) {{
        html = '<tr><td colspan="7" class="py-8 text-center text-slate-400">ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา</td></tr>';
      }} else if (filtered.length > 250) {{
        html += `<tr><td colspan="7" class="py-4 text-center text-xs text-slate-400 bg-slate-50 font-medium">แสดงตัวอย่าง 250 รายการแรกจาก ${{filtered.length.toLocaleString()}} รายการที่พบ (กรุณาใช้การค้นหาเฉพาะเจาะจงหรือดูในไฟล์ Excel สำหรับรายการทั้งหมด)</td></tr>`;
      }}

      tableBody.innerHTML = html;
    }}

    searchInput.addEventListener('input', renderTable);
    statusFilter.addEventListener('change', renderTable);
    priorityFilter.addEventListener('change', renderTable);

    // Initial render
    renderTable();
  </script>
</body>
</html>
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"[Success] Standalone Interactive HTML Dashboard generated at: {output_path}")

# ==============================================================================
# 5. CLI Main Runner
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="Antivirus Audit & Reconciliation Automation Engine")
    parser.add_argument("--input", default="/Users/jake/Downloads/สำเนาของ ตรวจสอบการลงโปรแกรม Anti Virus.xlsx", help="Input Excel file path")
    parser.add_argument("--output-excel", default="/Users/jake/Downloads/AntiVirus_Audit_Report.xlsx", help="Output Multi-tab Excel file path")
    parser.add_argument("--output-html", default="/Users/jake/Downloads/antivirus_dashboard.html", help="Output Interactive HTML Dashboard file path")

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"[Error] Input file not found at: {args.input}")
        sys.exit(1)

    print(f"[*] Reading source spreadsheet: {args.input}")
    rec = AntivirusReconciler(args.input)
    print(f"[*] Reconciled: Star Cat={rec.total_starcat:,} | XDR={rec.total_xdr:,}")
    print(f"    - Compliant: {rec.total_compliant:,} ({rec.coverage_rate:.1f}%)")
    print(f"    - Missing XDR: {rec.total_missing:,}")
    print(f"    - Shadow IT: {rec.total_shadow:,}")
    print(f"    - Star Cat Duplicates: {len(rec.starcat_dups):,}")
    print(f"    - XDR Duplicates: {len(rec.xdr_dups):,}")

    generate_excel_report(rec, args.output_excel)
    generate_html_dashboard(rec, args.output_html)
    print("[*] Reconciliation Pipeline completed successfully!")

if __name__ == "__main__":
    main()
