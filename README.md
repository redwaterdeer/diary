# 오늘의 씀

모바일 전용 그림일기 웹 앱입니다.  
사진과 일기 내용을 작성하면, 내용에 맞는 성경 말씀을 추천합니다.

## 화면 구성

| 화면 | 파일 | 설명 |
|------|------|------|
| 1번 | `index.html` | 로그인 |
| 2번 | `signup.html` | 신규 가입 |
| 3번 | `view.html` | 보기 방식 선택 |
| 4번 | `calendar.html` | 캘린더 뷰 |
| 5번 | `diary.html` | 일기 작성/조회 |
| 6번 | `feed.html` | 수직 피드 |
| 7번 | `diary-new.html` | 신규 일기 등록 |

## 실행 방법

1. 이 폴더를 다운로드하거나 clone 합니다.
2. `index.html`을 브라우저에서 엽니다.  
   (로컬에서도 동작합니다. Chrome / Edge 권장)
3. GitHub Pages를 쓰는 경우: 저장소 Settings → Pages → Deploy from branch → `/ (root)` 선택

## 마스터 계정

- ID: `redwaterdeer`
- PW: `10qp29wo!Q`

## 기술

- HTML / CSS / JavaScript
- 데이터 저장: `localStorage`
- 폰트: 양재백두체 (`fonts/YangjaeBaekduB.ttf`)

## 폴더 구조

```
그림일기/
├── index.html
├── signup.html
├── view.html
├── calendar.html
├── diary.html
├── diary-new.html
├── feed.html
├── css/
│   └── style.css
├── js/
│   ├── auth.js
│   ├── login.js
│   ├── signup.js
│   ├── view.js
│   ├── calendar.js
│   ├── diary.js
│   └── feed.js
├── images/
├── fonts/
└── README.md
```

## 라이선스

수업/개인 학습용 프로젝트입니다.
