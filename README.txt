1. Install Tesseract OCR
winget install Tesseract-OCR

2. Install dependencies
pip install -r ./requirements.txt

3. Build EXE file for the translator
python -m PyInstaller ./main.py
python -m PyInstaller -F ./main.py
