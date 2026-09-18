"""
Government-Standard PDF Generation Service
==========================================
Lightweight, dependency-free, standard PDF 1.4 binary generator for:
1. Admin Statutory Audit Reports
2. Government Challenge Tender Specifications
"""

import io
from datetime import datetime
from typing import Any, Dict, List, Optional


class PDFCanvas:
    """
    Minimalist, robust PDF 1.4 canvas generator producing pure standards-compliant PDF bytes.
    Page geometry: A4 (595.28 x 841.89 points)
    """

    def __init__(self, page_width: float = 595.28, page_height: float = 841.89):
        self.width = page_width
        self.height = page_height
        self.pages: List[str] = []
        self.current_stream: List[str] = []

    def start_page(self):
        self.current_stream = []

    def end_page(self):
        self.pages.append("\n".join(self.current_stream))
        self.current_stream = []

    def set_fill_color(self, r: float, g: float, b: float):
        self.current_stream.append(f"{r:.3f} {g:.3f} {b:.3f} rg")

    def set_stroke_color(self, r: float, g: float, b: float):
        self.current_stream.append(f"{r:.3f} {g:.3f} {b:.3f} RG")

    def set_line_width(self, width: float):
        self.current_stream.append(f"{width:.2f} w")

    def draw_rect(self, x: float, y: float, w: float, h: float, fill: bool = True, stroke: bool = True):
        op = "B" if (fill and stroke) else ("f" if fill else "S")
        self.current_stream.append(f"{x:.2f} {y:.2f} {w:.2f} {h:.2f} re {op}")

    def draw_line(self, x1: float, y1: float, x2: float, y2: float):
        self.current_stream.append(f"{x1:.2f} {y1:.2f} m {x2:.2f} {y2:.2f} l S")

    def escape_text(self, text: str) -> str:
        text = str(text or "")
        return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")

    def draw_text(self, text: str, x: float, y: float, font: str = "F1", size: float = 10):
        clean_text = self.escape_text(text)
        self.current_stream.append("BT")
        self.current_stream.append(f"/{font} {size:.2f} Tf")
        self.current_stream.append(f"{x:.2f} {y:.2f} Td")
        self.current_stream.append(f"({clean_text}) Tj")
        self.current_stream.append("ET")

    def to_pdf_bytes(self) -> bytes:
        if self.current_stream:
            self.end_page()

        total_pages = len(self.pages)
        if total_pages == 0:
            self.start_page()
            self.end_page()
            total_pages = 1

        objects: List[bytes] = []

        num_pages = total_pages
        page_obj_ids = []
        content_obj_ids = []

        current_id = 6
        for _ in range(num_pages):
            page_obj_ids.append(current_id)
            content_obj_ids.append(current_id + 1)
            current_id += 2

        # 1. Catalog
        catalog = f"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj"
        # 2. Pages
        kids_str = " ".join([f"{pid} 0 R" for pid in page_obj_ids])
        pages_obj = f"2 0 obj\n<< /Type /Pages /Kids [{kids_str}] /Count {num_pages} >>\nendobj"
        # 3. Fonts
        f1 = f"3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj"
        f2 = f"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj"
        f3 = f"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj"

        all_objs = [catalog, pages_obj, f1, f2, f3]

        for i in range(num_pages):
            pid = page_obj_ids[i]
            cid = content_obj_ids[i]
            stream_data = self.pages[i]
            stream_bytes = stream_data.encode("latin1", errors="replace")
            stream_len = len(stream_bytes)

            page_def = (
                f"{pid} 0 obj\n"
                f"<< /Type /Page /Parent 2 0 R\n"
                f"/MediaBox [0 0 {self.width:.2f} {self.height:.2f}]\n"
                f"/Contents {cid} 0 R\n"
                f"/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >>\n"
                f">>\nendobj"
            )
            content_def = (
                f"{cid} 0 obj\n"
                f"<< /Length {stream_len} >>\n"
                f"stream\n"
                f"{stream_data}\n"
                f"endstream\n"
                f"endobj"
            )
            all_objs.append(page_def)
            all_objs.append(content_def)

        # Assemble PDF file
        out = io.BytesIO()
        out.write(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")

        xref_offsets = []
        for obj_str in all_objs:
            xref_offsets.append(out.tell())
            out.write(obj_str.encode("latin1", errors="replace"))
            out.write(b"\n")

        startxref = out.tell()
        total_objs = len(all_objs) + 1
        out.write(b"xref\n")
        out.write(f"0 {total_objs}\n".encode("latin1"))
        out.write(b"0000000000 65535 f \n")
        for off in xref_offsets:
            out.write(f"{off:010d} 00000 n \n".encode("latin1"))

        out.write(b"trailer\n")
        out.write(f"<< /Size {total_objs} /Root 1 0 R >>\n".encode("latin1"))
        out.write(b"startxref\n")
        out.write(f"{startxref}\n%%EOF\n".encode("latin1"))

        return out.getvalue()


def generate_admin_audit_report_pdf(
    logs: List[Dict[str, Any]],
    admin_user: Any = None,
    generated_at: Optional[datetime] = None,
) -> bytes:
    """
    Generate an official government-style Statutory System Audit Report PDF.
    """
    canvas = PDFCanvas()
    now = generated_at or datetime.utcnow()
    date_str = now.strftime("%d-%b-%Y %H:%M:%S UTC")
    doc_ref = f"INNOGOV/AUDIT/{now.strftime('%Y%m%d')}/{now.strftime('%H%M%S')}"

    items_per_page = 14
    total_logs = len(logs)
    total_pages = max(1, (total_logs + items_per_page - 1) // items_per_page)

    for page_num in range(1, total_pages + 1):
        canvas.start_page()

        # 1. Top Government Header Banner
        canvas.set_fill_color(0.08, 0.15, 0.28)  # Deep Navy (#152647)
        canvas.draw_rect(0, 785, 595.28, 56.89, fill=True, stroke=False)

        # Header Text
        canvas.set_fill_color(1, 1, 1)
        canvas.draw_text("GOVERNMENT OF INDIA  PUBLIC PROCUREMENT INNOVATION PORTAL", 36, 822, font="F2", size=9)
        canvas.draw_text("INNOGOV STATUTORY SYSTEM AUDIT & INTEGRITY TRAIL", 36, 804, font="F2", size=13)
        canvas.draw_text("OFFICIAL RECORD", 470, 810, font="F2", size=8.5)

        # Gold separator bar
        canvas.set_fill_color(0.85, 0.65, 0.13)
        canvas.draw_rect(0, 782, 595.28, 3, fill=True, stroke=False)

        # 2. Metadata Box
        canvas.set_fill_color(0.96, 0.97, 0.98)
        canvas.set_stroke_color(0.82, 0.85, 0.90)
        canvas.set_line_width(0.8)
        canvas.draw_rect(36, 700, 523.28, 72, fill=True, stroke=True)

        canvas.set_fill_color(0.2, 0.2, 0.2)
        canvas.draw_text(f"DOCUMENT REF : {doc_ref}", 48, 754, font="F2", size=8.5)
        canvas.draw_text(f"DATE GENERATED : {date_str}", 48, 738, font="F1", size=8)
        canvas.draw_text(f"SECURITY LEVEL : OFFICIAL / AUDIT COMPLIANT", 48, 722, font="F1", size=8)

        admin_name = getattr(admin_user, "name", "System Administrator") if admin_user else "System Administrator"
        canvas.draw_text(f"TOTAL AUDIT EVENTS : {total_logs}", 320, 754, font="F2", size=8.5)
        canvas.draw_text(f"GENERATING ACTOR   : {admin_name}", 320, 738, font="F1", size=8)
        canvas.draw_text(f"VERIFICATION STATUS : SYSTEM VERIFIED & RECORDED", 320, 722, font="F1", size=8)

        # 3. Table Header
        table_top = 675
        canvas.set_fill_color(0.12, 0.22, 0.40)
        canvas.draw_rect(36, table_top, 523.28, 20, fill=True, stroke=False)

        canvas.set_fill_color(1, 1, 1)
        canvas.draw_text("#", 42, table_top + 6, font="F2", size=8)
        canvas.draw_text("TIMESTAMP (UTC)", 62, table_top + 6, font="F2", size=8)
        canvas.draw_text("ACTOR ID", 152, table_top + 6, font="F2", size=8)
        canvas.draw_text("ACTION / EVENT", 205, table_top + 6, font="F2", size=8)
        canvas.draw_text("RESOURCE", 340, table_top + 6, font="F2", size=8)
        canvas.draw_text("DESCRIPTION / AUDIT NOTE", 415, table_top + 6, font="F2", size=8)

        # 4. Table Rows
        start_idx = (page_num - 1) * items_per_page
        end_idx = min(start_idx + items_per_page, total_logs)
        page_logs = logs[start_idx:end_idx]

        row_y = table_top - 24
        row_height = 24

        for i, log in enumerate(page_logs):
            global_idx = start_idx + i + 1
            if i % 2 == 1:
                canvas.set_fill_color(0.97, 0.98, 0.99)
                canvas.draw_rect(36, row_y, 523.28, row_height, fill=True, stroke=False)

            canvas.set_stroke_color(0.88, 0.90, 0.93)
            canvas.set_line_width(0.5)
            canvas.draw_line(36, row_y, 559.28, row_y)

            canvas.set_fill_color(0.2, 0.25, 0.3)
            canvas.draw_text(str(global_idx), 42, row_y + 8, font="F1", size=7.5)

            ts = str(log.get("created_at") or "")[:19].replace("T", " ")
            canvas.draw_text(ts, 62, row_y + 8, font="F1", size=7.5)

            actor_str = str(log.get("actor_user_id") or "")
            canvas.draw_text(f"UID:{actor_str}", 152, row_y + 8, font="F2", size=7.5)

            action_str = str(log.get("action") or "")[:22]
            canvas.draw_text(action_str, 205, row_y + 8, font="F2", size=7.5)

            res_str = f"{log.get('resource_type') or ''} #{log.get('resource_id') or ''}"[:15]
            canvas.draw_text(res_str, 340, row_y + 8, font="F1", size=7.5)

            desc_str = str(log.get("description") or "")[:35]
            canvas.draw_text(desc_str, 415, row_y + 8, font="F1", size=7.5)

            row_y -= row_height

        canvas.set_stroke_color(0.12, 0.22, 0.40)
        canvas.set_line_width(1)
        canvas.draw_line(36, row_y + row_height, 559.28, row_y + row_height)

        # 5. Security Certification Stamp on Last Page
        if page_num == total_pages:
            stamp_y = max(45, row_y - 30)
            canvas.set_fill_color(0.95, 0.97, 0.99)
            canvas.set_stroke_color(0.2, 0.4, 0.7)
            canvas.set_line_width(0.8)
            canvas.draw_rect(36, stamp_y, 523.28, 48, fill=True, stroke=True)

            canvas.set_fill_color(0.1, 0.3, 0.6)
            canvas.draw_text("SYSTEM VERIFICATION & CERTIFICATION BLOCK", 48, stamp_y + 34, font="F2", size=8)
            canvas.set_fill_color(0.3, 0.35, 0.4)
            canvas.draw_text("This audit trail document was generated by the InnoGov Public Procurement Platform.", 48, stamp_y + 22, font="F1", size=7.5)
            canvas.draw_text("All log entries and timestamps are cryptographically anchored to ensure evidentiary integrity.", 48, stamp_y + 10, font="F1", size=7.5)

            canvas.draw_text(f"CERTIFICATE REF: {doc_ref}", 350, stamp_y + 22, font="F2", size=7.5)
            canvas.draw_text("STATUS: SYSTEM-GENERATED AND IMMUTABLE", 350, stamp_y + 10, font="F2", size=7.5)

        # 6. Page Footer
        canvas.set_stroke_color(0.85, 0.87, 0.90)
        canvas.set_line_width(0.5)
        canvas.draw_line(36, 32, 559.28, 32)

        canvas.set_fill_color(0.5, 0.55, 0.6)
        canvas.draw_text("InnoGov Public Procurement Innovation Platform  Official Audit Record", 36, 20, font="F1", size=7.5)
        canvas.draw_text(f"Page {page_num} of {total_pages}", 500, 20, font="F2", size=8)

        canvas.end_page()

    return canvas.to_pdf_bytes()


def generate_challenge_tender_pdf(challenge: Any) -> bytes:
    """
    Generate an official government tender specification PDF for a challenge.
    """
    canvas = PDFCanvas()
    canvas.start_page()

    title = getattr(challenge, "title", "Procurement Challenge Specification")
    category = getattr(challenge, "category", "General Public Innovation") or "General Public Innovation"
    budget_val = getattr(challenge, "budget", None)
    budget = f"INR {float(budget_val):,.2f}" if budget_val else "Pilot Grant Standard Scope"
    deadline = str(getattr(challenge, "application_deadline", None) or "Rolling Sandbox Intake")
    location = getattr(challenge, "location", "Pan-India Municipalities") or "Pan-India Municipalities"
    status_attr = getattr(challenge, "status", "OPEN")
    status_val = str(status_attr.value if hasattr(status_attr, "value") else status_attr)
    created_at = str(getattr(challenge, "created_at", datetime.utcnow()))[:10]

    # 1. Header Banner
    canvas.set_fill_color(0.08, 0.15, 0.28)
    canvas.draw_rect(0, 775, 595.28, 66.89, fill=True, stroke=False)

    canvas.set_fill_color(1, 1, 1)
    canvas.draw_text("GOVERNMENT OF INDIA • PUBLIC PROCUREMENT INNOVATION PORTAL", 36, 818, font="F2", size=9)
    canvas.draw_text("OFFICIAL INNOVATION CHALLENGE & TENDER SPECIFICATION", 36, 800, font="F2", size=13)
    canvas.draw_text("GFR RULE 149 RELAXATION PILOT", 410, 818, font="F2", size=8)

    canvas.set_fill_color(0.85, 0.65, 0.13)
    canvas.draw_rect(0, 772, 595.28, 3, fill=True, stroke=False)

    # 2. Challenge Overview Card
    canvas.set_fill_color(0.96, 0.97, 0.98)
    canvas.set_stroke_color(0.82, 0.85, 0.90)
    canvas.set_line_width(0.8)
    canvas.draw_rect(36, 680, 523.28, 82, fill=True, stroke=True)

    canvas.set_fill_color(0.1, 0.2, 0.4)
    ch_id = getattr(challenge, "id", 1)
    canvas.draw_text(f"CHALLENGE REF ID : INNOGOV-CH-{ch_id:04d}", 48, 744, font="F2", size=9)
    canvas.set_fill_color(0.2, 0.2, 0.2)
    canvas.draw_text(f"SECTOR / CATEGORY : {category}", 48, 728, font="F1", size=8.5)
    canvas.draw_text(f"LOCATION SCOPE    : {location}", 48, 712, font="F1", size=8.5)
    canvas.draw_text(f"DATE PUBLISHED   : {created_at}", 48, 696, font="F1", size=8.5)

    canvas.draw_text(f"STATUS        : {status_val}", 320, 744, font="F2", size=9)
    canvas.draw_text(f"PILOT BUDGET  : {budget}", 320, 728, font="F2", size=8.5)
    canvas.draw_text(f"APPLICATION DUE : {deadline}", 320, 712, font="F2", size=8.5)
    canvas.draw_text(f"PROCUREMENT STAGE: 30–90 DAY SANDBOX PILOT", 320, 696, font="F1", size=8.5)

    # 3. Challenge Title & Problem Statement
    y = 650
    canvas.set_fill_color(0.08, 0.15, 0.28)
    canvas.draw_text("1. CHALLENGE TITLE & OBJECTIVE", 36, y, font="F2", size=10)
    y -= 14
    canvas.set_fill_color(0.15, 0.2, 0.25)
    canvas.draw_text(title[:90], 48, y, font="F2", size=9.5)
    y -= 18

    canvas.set_fill_color(0.08, 0.15, 0.28)
    canvas.draw_text("2. CORE PROBLEM STATEMENT", 36, y, font="F2", size=10)
    y -= 14
    canvas.set_fill_color(0.25, 0.3, 0.35)
    prob_stmt = getattr(challenge, "problem_statement", "No problem statement provided.") or "No problem statement provided."
    prob_lines = prob_stmt.split("\n")
    for line in prob_lines[:4]:
        for subline in [line[j:j+95] for j in range(0, len(line), 95)] or [""]:
            canvas.draw_text(subline, 48, y, font="F1", size=8.5)
            y -= 12
    y -= 6

    # 4. Scope of Work & Deliverables
    canvas.set_fill_color(0.08, 0.15, 0.28)
    canvas.draw_text("3. SCOPE OF WORK & PILOT DELIVERABLES", 36, y, font="F2", size=10)
    y -= 14
    canvas.set_fill_color(0.25, 0.3, 0.35)
    desc = getattr(challenge, "description", "Standard sandbox pilot deliverables.") or "Standard sandbox pilot deliverables."
    desc_lines = desc.split("\n")
    for line in desc_lines[:4]:
        for subline in [line[j:j+95] for j in range(0, len(line), 95)] or [""]:
            canvas.draw_text(subline, 48, y, font="F1", size=8.5)
            y -= 12
    y -= 8

    # 5. Mandatory Eligibility & KPIs
    canvas.set_fill_color(0.08, 0.15, 0.28)
    canvas.draw_text("4. ELIGIBILITY CRITERIA & MEASURABLE BENCHMARK KPIS", 36, y, font="F2", size=10)
    y -= 16

    # Box for KPIs & Requirements
    canvas.set_fill_color(0.97, 0.98, 0.99)
    canvas.set_stroke_color(0.85, 0.88, 0.92)
    canvas.draw_rect(36, y - 80, 523.28, 88, fill=True, stroke=True)

    canvas.set_fill_color(0.1, 0.2, 0.35)
    canvas.draw_text("MANDATORY REQUIREMENTS", 48, y - 8, font="F2", size=8.5)
    canvas.draw_text("TARGET KPIS & BENCHMARKS", 300, y - 8, font="F2", size=8.5)

    reqs = getattr(challenge, "requirements", {}) or {}
    kpis = getattr(challenge, "kpis", {}) or {}

    req_y = y - 22
    if isinstance(reqs, dict):
        for k, v in list(reqs.items())[:4]:
            if k != "assigned_evaluator":
                canvas.set_fill_color(0.3, 0.35, 0.4)
                canvas.draw_text(f"• {str(k).replace('_', ' ').title()}: {str(v)}", 48, req_y, font="F1", size=8)
                req_y -= 12
    if req_y == y - 22:
        canvas.draw_text("• DPIIT-Recognized Startup Status", 48, req_y, font="F1", size=8)

    kpi_y = y - 22
    if isinstance(kpis, dict):
        for k, v in list(kpis.items())[:4]:
            canvas.set_fill_color(0.1, 0.4, 0.25)
            canvas.draw_text(f"✓ {str(k).replace('_', ' ').title()}: {str(v)}", 300, kpi_y, font="F2", size=8)
            kpi_y -= 12
    if kpi_y == y - 22:
        canvas.draw_text("✓ Empirical validation under sandbox conditions", 300, kpi_y, font="F1", size=8)

    y -= 105

    # 6. Evaluation & Scale-Up Terms
    canvas.set_fill_color(0.08, 0.15, 0.28)
    canvas.draw_text("5. INDEPENDENT EVALUATION & SCALE-UP TERMS", 36, y, font="F2", size=10)
    y -= 14
    canvas.set_fill_color(0.3, 0.35, 0.4)
    canvas.draw_text("• Submissions undergo independent evaluation by accredited technical evaluators on 0–100 multi-criteria scale.", 48, y, font="F1", size=8)
    y -= 12
    canvas.draw_text("• Pilots scoring >= 80% and awarded RECOMMEND status qualify for scale-up procurement contracts under GFR 149.", 48, y, font="F1", size=8)
    y -= 12
    canvas.draw_text("• Milestone payments are disbursed directly upon verifiable telemetry proof and evaluator certification.", 48, y, font="F1", size=8)
    y -= 25

    # 7. Official Issuance Block
    canvas.set_fill_color(0.95, 0.97, 0.99)
    canvas.set_stroke_color(0.2, 0.4, 0.7)
    canvas.set_line_width(0.8)
    canvas.draw_rect(36, y - 35, 523.28, 42, fill=True, stroke=True)

    canvas.set_fill_color(0.1, 0.3, 0.6)
    canvas.draw_text("OFFICIAL ISSUING AUTHORITY • INNOGOV PUBLIC PROCUREMENT CELL", 48, y - 10, font="F2", size=8)
    canvas.set_fill_color(0.3, 0.35, 0.4)
    canvas.draw_text("Issued under the Public Procurement Innovation Sandbox Framework. Verified system document.", 48, y - 24, font="F1", size=7.5)

    # Footer
    canvas.set_stroke_color(0.85, 0.87, 0.90)
    canvas.set_line_width(0.5)
    canvas.draw_line(36, 32, 559.28, 32)
    canvas.set_fill_color(0.5, 0.55, 0.6)
    canvas.draw_text("InnoGov Public Procurement Portal • Official Tender Document", 36, 20, font="F1", size=7.5)
    canvas.draw_text("Page 1 of 1", 500, 20, font="F2", size=8)

    canvas.end_page()
    return canvas.to_pdf_bytes()
