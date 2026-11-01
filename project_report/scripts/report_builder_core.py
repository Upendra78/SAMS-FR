import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

DOCX_PATH = r"C:\Users\pandi\Projects\SAMS-FR\project_report\SAMS-FR_Project_Report.docx"
PDF_PATH = r"C:\Users\pandi\Projects\SAMS-FR\project_report\SAMS-FR_Project_Report.pdf"
SCREENSHOT_BASE = r"C:\Users\pandi\Projects\SAMS-FR\project_report\assets\screenshots"
DIAGRAM_BASE = r"C:\Users\pandi\Projects\SAMS-FR\project_report\assets\diagrams"

# Academic Color Palette
COLOR_NAVY = RGBColor(16, 42, 77)      # #102A4D - Deep Academic Navy
COLOR_SLATE = RGBColor(43, 62, 80)     # #2B3E50 - Charcoal Slate
COLOR_BLUE = RGBColor(37, 99, 235)     # #2563EB - Accent Blue
COLOR_BODY = RGBColor(51, 65, 85)      # #334155 - Body Slate
COLOR_MUTED = RGBColor(100, 116, 139)  # #64748B - Muted Gray

def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_table_borders(table, color="D2D6DC", sz="4", val="single"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:insideH w:val="{val}" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def format_cell(cell, text, bold=False, italic=False, size=10, color=COLOR_BODY, align=WD_ALIGN_PARAGRAPH.LEFT, bg=None):
    if bg:
        set_cell_background(cell, bg)
    set_cell_margins(cell)
    p = cell.paragraphs[0]
    p.alignment = align
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.15
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run.bold = bold
    run.font.italic = italic
    run.font.color.rgb = color
    return run

def add_header_footer(doc):
    for s_idx, section in enumerate(doc.sections):
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = True

        # Header
        header = section.header
        hp = header.paragraphs[0]
        hp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        hrun = hp.add_run("SAMS-FR: Smart Attendance Management System Using Face Recognition")
        hrun.font.name = "Times New Roman"
        hrun.font.size = Pt(8.5)
        hrun.font.italic = True
        hrun.font.color.rgb = COLOR_MUTED

        # Footer
        footer = section.footer
        fp = footer.paragraphs[0]
        fp.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        frun1 = fp.add_run("Academic Project Report  |  Page ")
        frun1.font.name = "Times New Roman"
        frun1.font.size = Pt(9)
        frun1.font.color.rgb = COLOR_MUTED
        
        fldSimple = OxmlElement('w:fldSimple')
        fldSimple.set(qn('w:instr'), 'PAGE')
        fp._p.append(fldSimple)

        frun2 = fp.add_run(" of ")
        frun2.font.name = "Times New Roman"
        frun2.font.size = Pt(9)
        frun2.font.color.rgb = COLOR_MUTED

        fldSimple2 = OxmlElement('w:fldSimple')
        fldSimple2.set(qn('w:instr'), 'NUMPAGES')
        fp._p.append(fldSimple2)

def add_heading_1(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(22)
    p.paragraph_format.space_after = Pt(8)
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(16)
    run.bold = True
    run.font.color.rgb = COLOR_NAVY
    return p

def add_heading_2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(16)
    p.paragraph_format.space_after = Pt(6)
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(13.5)
    run.bold = True
    run.font.color.rgb = COLOR_SLATE
    return p

def add_heading_3(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.keep_with_next = True
    p.paragraph_format.space_before = Pt(12)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.bold = True
    run.font.color.rgb = COLOR_NAVY
    return p

def add_body(doc, text, bold_prefix="", italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.3
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if bold_prefix:
        brun = p.add_run(bold_prefix)
        brun.font.name = "Times New Roman"
        brun.font.size = Pt(11.5)
        brun.bold = True
        brun.font.color.rgb = COLOR_NAVY
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(11.5)
    run.font.italic = italic
    run.font.color.rgb = COLOR_BODY
    return p

def add_bullet(doc, text, bold_prefix=""):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.line_spacing = 1.25
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    if bold_prefix:
        brun = p.add_run(bold_prefix)
        brun.font.name = "Times New Roman"
        brun.font.size = Pt(11.5)
        brun.bold = True
        brun.font.color.rgb = COLOR_NAVY
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(11.5)
    run.font.color.rgb = COLOR_BODY
    return p

def add_figure(doc, img_path, caption, fig_num, width_in_inches=5.8):
    if not os.path.exists(img_path):
        print(f"Warning: Figure path not found: {img_path}")
        return
    p_img = doc.add_paragraph()
    p_img.paragraph_format.space_before = Pt(12)
    p_img.paragraph_format.space_after = Pt(4)
    p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.keep_with_next = True
    run = p_img.add_run()
    run.add_picture(img_path, width=Inches(width_in_inches))

    p_cap = doc.add_paragraph()
    p_cap.paragraph_format.space_before = Pt(2)
    p_cap.paragraph_format.space_after = Pt(12)
    p_cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    lbl = p_cap.add_run(f"Figure {fig_num}: ")
    lbl.font.name = "Times New Roman"
    lbl.font.size = Pt(10)
    lbl.bold = True
    lbl.font.color.rgb = COLOR_NAVY
    crun = p_cap.add_run(caption)
    crun.font.name = "Times New Roman"
    crun.font.size = Pt(10)
    crun.font.italic = True
    crun.font.color.rgb = COLOR_BODY

print("Base report builder module loaded.")
