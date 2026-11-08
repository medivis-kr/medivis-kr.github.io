"""Translation review spreadsheet for native speakers.

  python tools/i18n_review.py export <file.xlsx>   one sheet per language: English | current translation | Corrected | Comment
  python tools/i18n_review.py split <folder>       one file per language (to send to each country's reviewer)
  python tools/i18n_review.py import <file.xlsx> [more.xlsx ...]   copies every filled "Corrected" cell into src/i18n/<lang>.json

After import run `node tools/build.js`, check, then commit/push.
Rows are matched by the English text, so the order of the sheet does not matter.
"""
import json, sys, pathlib
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill

ROOT = pathlib.Path(__file__).resolve().parent.parent
I18N = ROOT / 'src' / 'i18n'
LANGS = {'pt': 'Português', 'es': 'Español', 'ar': 'العربية (Saudi Arabia)', 'kk': 'Қазақша (Kazakhstan)', 'mn': 'Монгол (Mongolia)'}


def export(out, langs=None):
    langs = {c: LANGS[c] for c in (langs or LANGS)}
    src = json.loads((I18N / '_source.json').read_text(encoding='utf-8'))
    wb = Workbook()
    guide = wb.active
    guide.title = 'Guide'
    for row in [
        ['MEDIVIS website – translation review'],
        [],
        ['1. Open the sheet of your language.'],
        ['2. Read the "Current translation" column next to the English original.'],
        ['3. Only if something is wrong or unnatural, write the corrected text in "Corrected" (leave it empty if OK).'],
        ['4. Keep product names / model numbers (INNOVISION, ELIN T5, SF-90, DICOM, LCD, DR, APR...) as they are.'],
        ['5. Keep HTML parts such as <br>, <br class="pc">, <a ...>...</a> exactly as they are.'],
        ['6. Use "Comment" for questions or notes.'],
    ]:
        guide.append(row)
    guide['A1'].font = Font(bold=True, size=14)
    guide.column_dimensions['A'].width = 110
    head = PatternFill('solid', fgColor='22317D')
    for code, name in langs.items():
        d = json.loads((I18N / f'{code}.json').read_text(encoding='utf-8'))
        ws = wb.create_sheet(code)
        ws.append(['#', 'English (source)', f'Current translation – {name}', 'Corrected', 'Comment'])
        for c in ws[1]:
            c.font = Font(bold=True, color='FFFFFF'); c.fill = head
        for i, en in enumerate(src, 1):
            ws.append([i, en, d.get(en, ''), '', ''])
        for col, w in zip('ABCDE', (5, 60, 60, 50, 30)):
            ws.column_dimensions[col].width = w
        for row in ws.iter_rows(min_row=2):
            for c in row[1:]:
                c.alignment = Alignment(wrap_text=True, vertical='top')
            if code == 'ar':
                for c in row[2:4]:
                    c.alignment = Alignment(wrap_text=True, vertical='top', horizontal='right', readingOrder=2)
        ws.freeze_panes = 'C2'
    wb.save(out)
    print('written', out)


def import_(path):
    wb = load_workbook(path)
    for code in LANGS:
        if code not in wb.sheetnames:
            continue
        f = I18N / f'{code}.json'
        d = json.loads(f.read_text(encoding='utf-8'))
        n = 0
        for _, en, _cur, fixed, *_ in wb[code].iter_rows(min_row=2, values_only=True):
            if en and fixed and str(fixed).strip() and d.get(en) != str(fixed).strip():
                d[en] = str(fixed).strip(); n += 1
        f.write_text(json.dumps(d, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
        print(f'{code}: {n} corrections applied')


def split(folder, date):
    folder = pathlib.Path(folder)
    for code, name in LANGS.items():
        export(folder / f'MEDIVIS website translation review_{code.upper()} {name.split(" (")[0]}_{date}.xlsx', [code])


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'export':
        export(sys.argv[2])
    elif cmd == 'split':
        split(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else '2026-11-09')
    else:
        for p in sys.argv[2:]:
            import_(p)
