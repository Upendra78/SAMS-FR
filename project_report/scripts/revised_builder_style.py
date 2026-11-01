import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.enum.section import WD_SECTION
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

REVISED_DOCX_PATH = r"C:\Users\pandi\Projects\SAMS-FR\project_report\SAMS-FR_Project_Report_Revised.docx"
REVISED_PDF_PATH = r"C:\Users\pandi\Projects\SAMS-FR\project_report\SAMS-FR_Project_Report_Revised.pdf"
SCREENSHOT_BASE = r"C:\Users\pandi\Projects\SAMS-FR\project_report\assets\screenshots"
DIAGRAM_BASE = r"C:\Users\pandi\Projects\SAMS-FR\project_report\assets\diagrams"

# Academic Standard Color Palette: Strictly Black Text & Neutral Shades
COLOR_BLACK = RGBColor(0, 0, 0)
COLOR_GRAY = RGBColor(70, 70, 70)
COLOR_LIGHT_GRAY = RGBColor(120, 120, 120)

def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=140, bottom=140, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_academic_table_borders(table, color="94A3B8", sz="4"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'  <w:top w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:bottom w:val="single" w:sz="{sz}" w:space="0" w:color="{color}"/>'
        f'  <w:left w:val="none"/>'
        f'  <w:right w:val="none"/>'
        f'  <w:insideH w:val="single" w:sz="2" w:space="0" w:color="CBD5E1"/>'
        f'  <w:insideV w:val="none"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

def make_row_header(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))

def prevent_row_split(row):
    trPr = row._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))

def format_cell(cell, text, bold=False, italic=False, size=10, color=COLOR_BLACK, align=WD_ALIGN_PARAGRAPH.LEFT, bg=None):
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

def configure_styles(doc):
    styles = doc.styles
    
    # Normal Style
    normal = styles['Normal']
    normal.font.name = 'Times New Roman'
    normal.font.size = Pt(12)
    normal.font.color.rgb = COLOR_BLACK
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # Heading 1
    h1 = styles['Heading 1']
    h1.font.name = 'Times New Roman'
    h1.font.size = Pt(16)
    h1.font.bold = True
    h1.font.color.rgb = COLOR_BLACK
    h1.paragraph_format.space_before = Pt(18)
    h1.paragraph_format.space_after = Pt(12)
    h1.paragraph_format.keep_with_next = True
    h1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # Heading 2
    h2 = styles['Heading 2']
    h2.font.name = 'Times New Roman'
    h2.font.size = Pt(14)
    h2.font.bold = True
    h2.font.color.rgb = COLOR_BLACK
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(6)
    h2.paragraph_format.keep_with_next = True
    h2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # Heading 3
    h3 = styles['Heading 3']
    h3.font.name = 'Times New Roman'
    h3.font.size = Pt(12)
    h3.font.bold = True
    h3.font.color.rgb = COLOR_BLACK
    h3.paragraph_format.space_before = Pt(9)
    h3.paragraph_format.space_after = Pt(4)
    h3.paragraph_format.keep_with_next = True
    h3.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT

    # Caption
    if 'Caption' in styles:
        cap = styles['Caption']
    else:
        cap = styles.add_style('Caption', docx.enum.style.WD_STYLE_TYPE.PARAGRAPH)
    cap.font.name = 'Times New Roman'
    cap.font.size = Pt(10.5)
    cap.font.italic = False
    cap.font.color.rgb = COLOR_BLACK
    cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap.paragraph_format.space_before = Pt(4)
    cap.paragraph_format.space_after = Pt(10)

def add_body_paragraph(doc, text, bold_prefix="", indent=True):
    p = doc.add_paragraph(style='Normal')
    if indent:
        p.paragraph_format.first_line_indent = Inches(0.5)
    else:
        p.paragraph_format.first_line_indent = Inches(0)
        
    if bold_prefix:
        brun = p.add_run(bold_prefix)
        brun.font.name = "Times New Roman"
        brun.font.size = Pt(12)
        brun.bold = True
        brun.font.color.rgb = COLOR_BLACK
    
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.font.color.rgb = COLOR_BLACK
    return p

def add_bullet_item(doc, text, bold_prefix=""):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.line_spacing = 1.3
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.first_line_indent = Inches(-0.25)
    p.paragraph_format.left_indent = Inches(0.5)
    
    if bold_prefix:
        brun = p.add_run(bold_prefix)
        brun.font.name = "Times New Roman"
        brun.font.size = Pt(12)
        brun.bold = True
        brun.font.color.rgb = COLOR_BLACK
        
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(12)
    run.font.color.rgb = COLOR_BLACK
    return p

def add_figure_with_caption(doc, img_path, caption_text, figure_num_str, width_in_inches=5.8):
    if not os.path.exists(img_path):
        print(f"Warning: Figure path not found: {img_path}")
        return
        
    # Image paragraph with keep_with_next so it never separates from caption
    p_img = doc.add_paragraph()
    p_img.paragraph_format.space_before = Pt(10)
    p_img.paragraph_format.space_after = Pt(4)
    p_img.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_img.paragraph_format.keep_with_next = True
    
    run_img = p_img.add_run()
    run_img.add_picture(img_path, width=Inches(width_in_inches))
    
    # Caption paragraph immediately below image
    p_cap = doc.add_paragraph(style='Caption')
    p_cap.paragraph_format.space_before = Pt(2)
    p_cap.paragraph_format.space_after = Pt(12)
    p_cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    
    run_lbl = p_cap.add_run(f"Figure {figure_num_str}: ")
    run_lbl.font.name = "Times New Roman"
    run_lbl.font.size = Pt(10.5)
    run_lbl.bold = True
    run_lbl.font.color.rgb = COLOR_BLACK
    
    run_cap = p_cap.add_run(caption_text)
    run_cap.font.name = "Times New Roman"
    run_cap.font.size = Pt(10.5)
    run_cap.font.italic = False
    run_cap.font.color.rgb = COLOR_BLACK

def add_table_caption(doc, table_num_str, caption_text):
    p_cap = doc.add_paragraph(style='Caption')
    p_cap.paragraph_format.space_before = Pt(12)
    p_cap.paragraph_format.space_after = Pt(4)
    p_cap.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_cap.paragraph_format.keep_with_next = True
    
    run_lbl = p_cap.add_run(f"Table {table_num_str}: ")
    run_lbl.font.name = "Times New Roman"
    run_lbl.font.size = Pt(10.5)
    run_lbl.bold = True
    run_lbl.font.color.rgb = COLOR_BLACK
    
    run_cap = p_cap.add_run(caption_text)
    run_cap.font.name = "Times New Roman"
    run_cap.font.size = Pt(10.5)
    run_cap.font.italic = False
    run_cap.font.color.rgb = COLOR_BLACK

print("Report builder styling module loaded.")

