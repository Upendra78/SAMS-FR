import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def apply_word_field_corrections():
    base_dir = os.path.abspath("project_report")
    revised_docx = os.path.join(base_dir, "SAMS-FR_Project_Report_Revised.docx")
    final_docx = os.path.join(base_dir, "SAMS-FR_Project_Report_Final.docx")
    final_pdf = os.path.join(base_dir, "SAMS-FR_Project_Report_Final.pdf")

    if not os.path.exists(revised_docx):
        raise FileNotFoundError(f"Cannot find {revised_docx}")

    print(f"Loading revised document: {revised_docx}")
    doc = docx.Document(revised_docx)

    # 1. Fix Section 3 Footer (Arabic page numbering only, restart at 1, no 'of 75')
    sec3 = doc.sections[2]
    # Verify sectPr has pgNumType start=1 fmt=decimal
    sectPr = sec3._sectPr
    pgNumType = sectPr.find(docx.oxml.ns.qn('w:pgNumType'))
    if pgNumType is None:
        pgNumType = parse_xml(r'<w:pgNumType xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:start="1" w:fmt="decimal"/>')
        sectPr.append(pgNumType)
    else:
        pgNumType.set(docx.oxml.ns.qn('w:start'), '1')
        pgNumType.set(docx.oxml.ns.qn('w:fmt'), 'decimal')

    # Ensure different first page is true
    sec3.different_first_page_header_footer = True

    # Clear Section 3 default footer and replace with clean centered PAGE field
    sec3_ftr = sec3.footer
    for p in list(sec3_ftr.paragraphs):
        p_elem = p._p
        p_elem.getparent().remove(p_elem)

    p_ftr = sec3_ftr.add_paragraph()
    p_ftr.alignment = WD_ALIGN_PARAGRAPH.CENTER
    # Add page number field: { PAGE }
    fld_xml = r'''
    <w:fldSimple xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:instr="PAGE">
        <w:r>
            <w:rPr>
                <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                <w:sz w:val="20"/>
                <w:color w:val="000000"/>
                <w:noProof/>
            </w:rPr>
            <w:t>1</w:t>
        </w:r>
    </w:fldSimple>
    '''
    p_ftr._p.append(parse_xml(fld_xml))
    print("Section 3 footer updated: Centered Arabic page number, restarting at 1, 'of 75' eliminated.")

    # 2. Fix Figure and Table Captions
    fig_idx = 1
    tbl_idx = 1

    for p in doc.paragraphs:
        if p.style.name == "Caption":
            txt = p.text.strip()
            if txt.startswith("Figure") and ":" in txt:
                # Figure caption
                title = txt.split(":", 1)[1].strip()
                # Clear existing runs/elements
                for child in list(p._p):
                    if child.tag.endswith(('r', 'fldSimple', 'hyperlink', 'smartTag')):
                        p._p.remove(child)

                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.keep_with_next = True
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(8)

                # Add run "Figure "
                r_prefix = parse_xml(r'''
                <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                        <w:i/>
                        <w:sz w:val="20"/>
                        <w:color w:val="000000"/>
                    </w:rPr>
                    <w:t xml:space="preserve">Figure </w:t>
                </w:r>
                ''')
                p._p.append(r_prefix)

                # Add SEQ Figure field
                seq_xml = f'''
                <w:fldSimple xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:instr="SEQ Figure \\* ARABIC">
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                            <w:i/>
                            <w:sz w:val="20"/>
                            <w:color w:val="000000"/>
                            <w:noProof/>
                        </w:rPr>
                        <w:t>{fig_idx}</w:t>
                    </w:r>
                </w:fldSimple>
                '''
                p._p.append(parse_xml(seq_xml))

                # Add title run
                # Escape xml special chars in title
                title_clean = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                r_title = parse_xml(f'''
                <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                        <w:i/>
                        <w:sz w:val="20"/>
                        <w:color w:val="000000"/>
                    </w:rPr>
                    <w:t xml:space="preserve">: {title_clean}</w:t>
                </w:r>
                ''')
                p._p.append(r_title)
                fig_idx += 1

            elif txt.startswith("Table") and ":" in txt:
                # Table caption
                title = txt.split(":", 1)[1].strip()
                for child in list(p._p):
                    if child.tag.endswith(('r', 'fldSimple', 'hyperlink', 'smartTag')):
                        p._p.remove(child)

                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.keep_with_next = True
                p.paragraph_format.space_before = Pt(8)
                p.paragraph_format.space_after = Pt(4)

                # Add run "Table "
                r_prefix = parse_xml(r'''
                <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                        <w:i/>
                        <w:sz w:val="20"/>
                        <w:color w:val="000000"/>
                    </w:rPr>
                    <w:t xml:space="preserve">Table </w:t>
                </w:r>
                ''')
                p._p.append(r_prefix)

                # Add SEQ Table field
                seq_xml = f'''
                <w:fldSimple xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:instr="SEQ Table \\* ARABIC">
                    <w:r>
                        <w:rPr>
                            <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                            <w:i/>
                            <w:sz w:val="20"/>
                            <w:color w:val="000000"/>
                            <w:noProof/>
                        </w:rPr>
                        <w:t>{tbl_idx}</w:t>
                    </w:r>
                </w:fldSimple>
                '''
                p._p.append(parse_xml(seq_xml))

                # Add title run
                title_clean = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                r_title = parse_xml(f'''
                <w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                    <w:rPr>
                        <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
                        <w:i/>
                        <w:sz w:val="20"/>
                        <w:color w:val="000000"/>
                    </w:rPr>
                    <w:t xml:space="preserve">: {title_clean}</w:t>
                </w:r>
                ''')
                p._p.append(r_title)
                tbl_idx += 1

    print(f"Updated {fig_idx - 1} Figure captions with SEQ Figure fields.")
    print(f"Updated {tbl_idx - 1} Table captions with SEQ Table fields.")

    # 3. Update LOF and LOT field instructions if needed
    for p in doc.paragraphs:
        for fld in p._p.findall(docx.oxml.ns.qn('w:fldSimple')):
            instr = fld.get(docx.oxml.ns.qn('w:instr'), '')
            if 'TOC' in instr and 'Figure' in instr:
                fld.set(docx.oxml.ns.qn('w:instr'), r'TOC \h \z \c "Figure"')
                print("Confirmed LOF field instruction: TOC \\h \\z \\c \"Figure\"")
            elif 'TOC' in instr and 'Table' in instr:
                fld.set(docx.oxml.ns.qn('w:instr'), r'TOC \h \z \c "Table"')
                print("Confirmed LOT field instruction: TOC \\h \\z \\c \"Table\"")

    print(f"Saving final corrected document to: {final_docx}")
    doc.save(final_docx)
    print("Document successfully saved.")

if __name__ == "__main__":
    apply_word_field_corrections()
