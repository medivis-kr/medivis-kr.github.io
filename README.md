# MEDIVIS 홈페이지 (medivis.co.kr): 정적 사이트

미담기획 호스팅(스마일서브 서버, 월 33,000원)을 끝내고 **GitHub Pages(무료)**로 옮기기 위한 저장소입니다.
2026-11-04에 실제 사이트(www.medivis.co.kr)를 그대로 복사해 정적 HTML로 바꿨습니다.

- `docs/`: 공개되는 사이트 전체 (GitHub Pages가 이 폴더를 그대로 서비스함)
- `tools/mirror.js`: 실제 사이트를 `docs/`로 복사 (**최초 1회용**: 다시 돌리면 `docs/`에서 고친 내용을 덮어씀)
- `tools/postprocess.js`: 복사본을 정적 사이트로 바꿈 (CSRF 토큰 제거, 문의 폼을 FormSubmit으로 연결, 404 추가)
- `tools/serve.js`: 로컬 미리보기 `node tools/serve.js` → http://localhost:8090
- `mirror-log.txt`: 복사할 때 받은 URL과 응답코드 (`/logo192.png`, `bg_section01.png`, `/a`는 실제 사이트에서도 404였음)

## 페이지 수정 (2026-11-05 리뉴얼 이후)
- 모든 HTML은 `node tools/build.js`가 만듭니다. `docs/`의 HTML을 직접 고치면 다음 빌드 때 덮어써집니다.
- 제품 추가/수정: `src/data/products.json` (목록 사진은 `docs/uploads/product/`, 상세 이미지는 `docs/uploads/product_board/`)
- 페이지 문구·구성: `tools/build.js`의 각 `pages[...]` 블록. 약관 본문: `src/content/*.html`
- 디자인: `docs/assets/site.css` (브랜드 컬러 변수는 맨 위 `:root`), 동작: `docs/assets/site.js`
- 확인: `node tools/serve.js` → http://localhost:8090, 그다음 commit/push
- `tools/mirror.js`·`postprocess.js`는 최초 이관 때만 쓴 도구라 다시 실행하지 않습니다.

## 다국어 (2026-11-09~)
- 언어: 영어(기본, 기존 주소 그대로), 포르투갈어 `/pt/`, 스페인어 `/es/`, 아랍어 `/ar/`(오른쪽→왼쪽), 카자흐어 `/kk/`, 몽골어 `/mn/`
- 화면의 모든 문구는 `tools/build.js`의 `t('영어 문장')`을 거칩니다. 번역은 `src/i18n/<언어>.json` (영어 문장 → 번역).
  빌드하면 `src/i18n/_source.json`에 영어 원문 목록이 다시 만들어지고, 번역이 빠진 문장은 영어로 나오며 빌드 메시지에 개수가 표시됩니다.
- 제품명·모델명(INNOVISION, ELIN T5, SF-90 …)은 번역하지 않습니다. 개인정보처리방침·이용약관은 법률 검토 전까지 영어만 있습니다.
- **원어민 검수**: `python tools/i18n_review.py export 검수표.xlsx` → 언어별 시트의 "Corrected" 칸에 수정 → `python tools/i18n_review.py import 검수표.xlsx` → `node tools/build.js` → commit/push
- 문구를 새로 넣거나 바꾸면 영어만 바뀐 상태로 올라갑니다. 다른 언어는 번역을 추가해야 합니다(빌드 메시지 확인).

## 바뀐 점
- **관리자 화면(/common/admin)이 없습니다.** 내용을 고치려면 `docs/` 안의 HTML을 직접 수정한 뒤 commit/push 합니다.
- **문의하기 폼**은 FormSubmit(formsubmit.co, 무료)을 거쳐 `info@medivis.co.kr`로 메일이 갑니다.

## 공개 절차 (사람이 직접 할 일)
1. **GitHub 계정**: 회사 계정 `medivis-kr`(info@medivis.co.kr, 2026-11-04 생성). 저장소 이름은 `medivis-kr.github.io`이고, 협업자는 raeun-shin과 joanne061212-design입니다.
   저장소 이름이 `<계정>.github.io`여야 사이트가 하위 경로 없이 루트(/)에서 열립니다. 이 사이트는 `/common/...`처럼 루트 기준 경로를 씁니다.
2. **Pages 켜기** (저장소 관리자인 medivis-kr 계정만 가능): Settings → Pages → Source `Deploy from a branch`, Branch `master` / 폴더 `/docs` → Save.
   먼저 https://medivis-kr.github.io 에서 사이트를 확인합니다. 그다음 DNS를 바꾸고 Custom domain에 `www.medivis.co.kr` 입력 → 연결되면 **Enforce HTTPS**를 체크합니다.
   (권장) 계정 Settings → Pages → Verified domains에서 medivis.co.kr 도메인 인증을 합니다. GitHub가 알려주는 TXT 레코드를 가비아에 추가하면 됩니다.
3. **가비아 DNS 변경** (My가비아 → 도메인 → medivis.co.kr → DNS 설정):

   | 타입 | 호스트 | 값 | 비고 |
   |---|---|---|---|
   | A | @ | 185.199.108.153 | 기존 115.68.168.215 삭제 |
   | A | @ | 185.199.109.153 | |
   | A | @ | 185.199.110.153 | |
   | A | @ | 185.199.111.153 | |
   | CNAME | www | `medivis-kr.github.io.` | 기존 www A 레코드(115.68.168.215) 삭제 |

   **MX(outlook.com)와 TXT(spf, MS=…) 레코드는 절대 건드리지 마세요. 회사 메일이 끊깁니다.**
4. **문의 폼 활성화**: 사이트가 뜨면 문의 폼으로 시험 문의를 1건 보냅니다. FormSubmit이 info@medivis.co.kr로 보내는 확인 메일에서 Activate를 누르면,
   이후 메일에 나오는 랜덤 주소로 `docs/medivis/inquiry/index.html`의 `formsubmit.co/ajax/info@medivis.co.kr` 부분을 바꿉니다(메일주소 노출 방지).
5. **개인정보처리방침 검토**: 문의 내용이 이제 FormSubmit(해외 서비스)을 거쳐 전달됩니다. 현재 방침의 "6. International Data Transfers"에 일반적인 국외이전 문구는 있지만, 수탁자(FormSubmit)를 명시할지 검토하세요.
6. 새 사이트를 확인한 뒤 미담기획에 호스팅 종료를 확정합니다 (12/15 예정).
