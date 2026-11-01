import pymupdf
import docx
import os

pdf_path = os.path.abspath("project_report/SAMS-FR_Project_Report_Final.pdf")
docx_path = os.path.abspath("project_report/SAMS-FR_Project_Report_Final.docx")

print("==================================================================")
print("COMPREHENSIVE FINAL VALIDATION INSPECTION")
print("==================================================================")

print(f"DOCX Path: {docx_path}")
print(f"DOCX Size: {os.path.getsize(docx_path):,} bytes")
print(f"PDF Path:  {pdf_path}")
print(f"PDF Size:  {os.path.getsize(pdf_path):,} bytes")

doc = pymupdf.open(pdf_path)
total_pages = len(doc)
print(f"Total PDF Pages: {total_pages}")

# 1. Inspect Preliminary Pages (1 to 14)
print("\n--- Preliminary Pages Inspection ---")
for pno in range(14):
    page = doc[pno]
    txt = page.get_text().strip()
    lines = [l.strip() for l in txt.split("\n") if l.strip()]
    first_l = lines[0] if lines else "<BLANK>"
    last_l = lines[-1] if lines else "<BLANK>"
    print(f"PDF Page {pno+1:2d} | 1st: {first_l[:40]:40s} | Last: {last_l[:30]:30s}")

# 2. Inspect List of Figures
print("\n--- Inspecting List of Figures ---")
lof_pages = []
for pno in range(total_pages):
    txt = doc[pno].get_text()
    if "LIST OF FIGURES" in txt:
        lof_pages.append(pno + 1)
        print(f"Found LIST OF FIGURES on PDF Page {pno+1}:")
        for line in txt.split("\n"):
            line_s = line.strip()
            if line_s.startswith("Figure ") or line_s == "LIST OF FIGURES":
                print("  ", line_s[:90])

# 3. Inspect List of Tables
print("\n--- Inspecting List of Tables ---")
for pno in range(total_pages):
    txt = doc[pno].get_text()
    if "LIST OF TABLES" in txt and "TABLE OF CONTENTS" not in txt:
        print(f"Found LIST OF TABLES on PDF Page {pno+1}:")
        for line in txt.split("\n"):
            line_s = line.strip()
            if line_s.startswith("Table ") or line_s == "LIST OF TABLES":
                print("  ", line_s[:90])

# 4. Inspect Chapter 1 and Page Numbering Transition
print("\n--- Inspecting Chapter 1 & Header/Footer Transition ---")
for pno in range(13, 18):
    page = doc[pno]
    txt = page.get_text().strip()
    lines = [l.strip() for l in txt.split("\n") if l.strip()]
    print(f"\n[PDF Page {pno+1}]")
    print("Top 3 lines:")
    for l in lines[:3]:
        print("  ", l)
    print("Bottom 3 lines:")
    for l in lines[-3:]:
        print("  ", l)

# 5. Check "of 75" across the entire document
print("\n--- Scanning Entire Document for Unwanted 'of 75' or 'of 74' or 'of 76' ---")
found_of_numpages = False
for pno in range(total_pages):
    txt = doc[pno].get_text()
    for phrase in ["of 75", "of 74", "of 76", "of 77", "Page 2 of", "Page 3 of"]:
        if phrase in txt:
            print(f"WARNING: Found '{phrase}' on PDF Page {pno+1}!")
            found_of_numpages = True

if not found_of_numpages:
    print("SUCCESS: Zero occurrences of unwanted 'of 75' / total-page-count patterns found!")

# 6. Check Figures and Tables in Body
print("\n--- Counting All Figures and Tables in PDF Body ---")
figs_found = []
tbls_found = []
for pno in range(total_pages):
    page = doc[pno]
    txt = page.get_text()
    for line in txt.split("\n"):
        l = line.strip()
        if l.startswith("Figure ") and ":" in l:
            figs_found.append((pno+1, l[:80]))
        elif l.startswith("Table ") and ":" in l:
            tbls_found.append((pno+1, l[:80]))

print(f"Total Figure Captions found in PDF: {len(figs_found)}")
print(f"Total Table Captions found in PDF: {len(tbls_found)}")

# Print sample body figure captions
print("\nFirst 5 Figure Captions in Body:")
for p, f in figs_found[:5]:
    print(f"  Page {p}: {f}")
print("Last 5 Figure Captions in Body:")
for p, f in figs_found[-5:]:
    print(f"  Page {p}: {f}")

# Print all Table Captions in Body
print("\nAll Table Captions in Body:")
for p, t in tbls_found:
    print(f"  Page {p}: {t}")

doc.close()
