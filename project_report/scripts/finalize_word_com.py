import os
import sys
import time
import win32com.client
import pythoncom

def run_word_com_final():
    base_dir = os.path.abspath("project_report")
    final_docx = os.path.join(base_dir, "SAMS-FR_Project_Report_Final.docx")
    final_pdf = os.path.join(base_dir, "SAMS-FR_Project_Report_Final.pdf")

    if not os.path.exists(final_docx):
        raise FileNotFoundError(f"Missing {final_docx}")

    print(f"Starting Word COM automation on: {final_docx}")
    t0 = time.time()
    
    pythoncom.CoInitialize()
    # DispatchEx guarantees a separate, new process instance, not attaching to any user Word process
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0

    wdoc = None
    try:
        print("Opening final document in Word...")
        wdoc = word.Documents.Open(final_docx, ReadOnly=False)
        print(f"Document opened. Elapsed: {time.time()-t0:.2f}s")

        print("Updating Table of Contents...")
        for i, toc in enumerate(wdoc.TablesOfContents):
            print(f"Updating TOC {i+1}...")
            toc.Update()

        print("Updating Tables of Figures / Tables...")
        for i, tof in enumerate(wdoc.TablesOfFigures):
            print(f"Updating TOF {i+1}...")
            tof.Update()

        print("Updating all document fields...")
        wdoc.Fields.Update()

        print("Updating Section headers and footers...")
        for s_idx, s in enumerate(wdoc.Sections):
            for h in s.Headers:
                if h.Exists:
                    h.Range.Fields.Update()
            for f in s.Footers:
                if f.Exists:
                    f.Range.Fields.Update()

        print("Saving final updated Word document...")
        wdoc.Save()
        print(f"Saved {final_docx}. Elapsed: {time.time()-t0:.2f}s")

        print(f"Exporting to PDF: {final_pdf}...")
        wdoc.SaveAs(final_pdf, FileFormat=17) # 17 = wdFormatPDF
        print(f"PDF export complete! Elapsed: {time.time()-t0:.2f}s")

    finally:
        if wdoc is not None:
            try:
                wdoc.Close(SaveChanges=False)
            except Exception as e:
                print(f"Error closing doc: {e}")
        try:
            word.Quit()
        except Exception as e:
            print(f"Error quitting word: {e}")
        pythoncom.CoUninitialize()

    print(f"Total Word COM execution time: {time.time()-t0:.2f}s")
    print("Word COM finalized successfully.")

if __name__ == "__main__":
    run_word_com_final()
