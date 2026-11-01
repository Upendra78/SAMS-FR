import os
import win32com.client
import pythoncom

def finalize_word_report():
    base_dir = os.path.abspath("project_report")
    docx_path = os.path.join(base_dir, "SAMS-FR_Project_Report_Revised.docx")
    pdf_path = os.path.join(base_dir, "SAMS-FR_Project_Report_Revised.pdf")

    if not os.path.exists(docx_path):
        raise FileNotFoundError(f"Cannot find {docx_path}")

    print(f"Opening Word COM for: {docx_path}")
    pythoncom.CoInitialize()
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0

    try:
        wdoc = word.Documents.Open(docx_path)
        print("Document opened successfully in Word.")

        # Replace placeholders with native Word TOC, LOF, LOT
        # Look through paragraphs for placeholders
        for p in list(wdoc.Paragraphs):
            text = p.Range.Text.strip()
            if text == "TOC_PLACEHOLDER":
                print("Found TOC_PLACEHOLDER. Inserting native Table of Contents...")
                rng = p.Range
                # Delete placeholder text first
                rng.Text = ""
                # Add Table of Contents
                # TablesOfContents.Add(Range, UseHeadingStyles, UpperHeadingLevel, LowerHeadingLevel, UseFields, TableID, RightAlignPageNumbers, IncludePageNumbers, AddedStyles, UseHyperlinks, HidePageNumbersInWeb)
                wdoc.TablesOfContents.Add(
                    Range=rng,
                    UseHeadingStyles=True,
                    UpperHeadingLevel=1,
                    LowerHeadingLevel=3,
                    RightAlignPageNumbers=True,
                    IncludePageNumbers=True
                )
            elif text == "LOF_PLACEHOLDER":
                print("Found LOF_PLACEHOLDER. Inserting native List of Figures...")
                rng = p.Range
                rng.Text = ""
                # TablesOfFigures.Add(Range, Caption, IncludeLabel, UseHeadingStyles, UpperHeadingLevel, LowerHeadingLevel, UseFields, TableID, RightAlignPageNumbers, IncludePageNumbers, AddedStyles, UseHyperlinks, HidePageNumbersInWeb)
                wdoc.TablesOfFigures.Add(
                    Range=rng,
                    Caption="Figure",
                    IncludeLabel=True,
                    RightAlignPageNumbers=True,
                    IncludePageNumbers=True
                )
            elif text == "LOT_PLACEHOLDER":
                print("Found LOT_PLACEHOLDER. Inserting native List of Tables...")
                rng = p.Range
                rng.Text = ""
                wdoc.TablesOfFigures.Add(
                    Range=rng,
                    Caption="Table",
                    IncludeLabel=True,
                    RightAlignPageNumbers=True,
                    IncludePageNumbers=True
                )

        print("Updating all document fields and tables...")
        # Update TOCs
        for toc in wdoc.TablesOfContents:
            toc.Update()
        # Update TOFs
        for tof in wdoc.TablesOfFigures:
            tof.Update()
        # Update all fields in main story and headers/footers
        wdoc.Fields.Update()
        for s in wdoc.Sections:
            for h in s.Headers:
                h.Range.Fields.Update()
            for f in s.Footers:
                f.Range.Fields.Update()

        print(f"Saving finalized Word document: {docx_path}")
        wdoc.Save()

        print(f"Exporting to PDF: {pdf_path}")
        # 17 = wdFormatPDF
        wdoc.SaveAs(pdf_path, FileFormat=17)
        print("PDF export complete!")

        wdoc.Close(SaveChanges=False)
        print("Document closed cleanly.")

    finally:
        word.Quit()
        pythoncom.CoUninitialize()
        print("Word application terminated.")

if __name__ == "__main__":
    finalize_word_report()

