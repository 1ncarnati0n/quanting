1. 기술 스택: AI가 가장 잘 이해하는 도구 선택
AI 모델들(저를 포함하여)은 방대한 오픈소스 데이터로 학습되었기 때문에, 생태계가 크고 규칙이 명확한 도구를 사용할 때 가장 고품질의 코드를 작성합니다.

Tailwind CSS (스타일링): AI에게 가장 최적화된 도구입니다. 임의의 픽셀(px) 값 대신 정해진 유틸리티 클래스(예: p-4, text-lg)만 사용하도록 강제할 수 있어 일관성 유지에 탁월합니다.

Shadcn UI (컴포넌트 시스템): 현재 리액트 생태계의 표준과도 같습니다. 버튼, 모달, 입력창 등의 기본 뼈대를 제공하며, 접근성(Accessibility) 처리가 완벽합니다. npm으로 설치하는 것이 아니라 코드를 직접 프로젝트에 복사하는 방식이므로, Tauri 데스크탑 환경에 맞게 AI가 커스터마이징하기 좋습니다.

Lucide React (아이콘): Shadcn UI의 기본 아이콘 라이브러리입니다. AI가 아이콘 이름을 유추하여 삽입하기 가장 용이합니다.

2. 바이브 코딩을 위한 디자인 시스템 적용 방법 (How-to)
단순히 도구를 설치하는 것을 넘어, AI가 이 도구들을 '규칙에 맞게' 사용하도록 셋업해야 합니다.

① 디자인 토큰(Design Tokens) 중앙화
AI가 #FF5733 같은 헥스(Hex) 코드를 임의로 생성하지 못하게 막아야 합니다. global.css에 CSS 변수를 선언하고, tailwind.config.ts와 연동하세요.

CSS
/* global.css */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --radius: 0.5rem; /* 앱 전체의 모서리 둥글기 통일 */
}
바이브 코딩 팁: AI에게 *"버튼 색상은 파란색으로 해줘"*라고 하지 말고, *"버튼 배경은 bg-primary, 텍스트는 text-primary-foreground를 사용해"*라고 지시해야 일관성이 유지됩니다.

② 컴포넌트 단위의 점진적 생성
AI에게 "설정 페이지 전체를 만들어줘"라고 하면 높은 확률로 디자인이 망가집니다.

올바른 접근: Shadcn UI의 CLI를 통해 기초 컴포넌트(Button, Input, Card)를 먼저 생성합니다. 그 후 AI에게 *"우리가 가진 Card와 Button 컴포넌트만 조합해서 설정 페이지 레이아웃을 구성해줘"*라고 지시하세요.

③ 프로젝트 AI 규칙(Rules) 파일 작성 (가장 중요)
Cursor, GitHub Copilot 등 최신 AI 코딩 툴을 사용하신다면, 프로젝트 루트에 .cursorrules (또는 .github/copilot-instructions.md) 파일을 만들어 AI가 지켜야 할 UI/UX 원칙을 명시하세요.

규칙 파일 예시 (AI에게 지시할 내용):

새로운 UI 컴포넌트를 만들 때 반드시 Tailwind CSS만 사용하라.

임의의 컬러(hex)나 spacing(px) 값을 하드코딩하지 말고, Tailwind 설정에 있는 값만 사용하라.

UI 요소는 src/components/ui 폴더에 있는 Shadcn UI 컴포넌트를 우선적으로 재사용하라.

아이콘이 필요할 때는 lucide-react를 사용하라.

Tauri 데스크탑 앱이므로 텍스트 드래그가 발생하지 않도록 적절히 select-none 클래스를 활용하라.

3. Tauri 기반 데스크탑 앱만의 추가 UX 고려사항
웹 디자인을 그대로 데스크탑에 가져오면 어색합니다. AI에게 코드를 요청할 때 다음 사항을 반영하도록 요구하세요.

커스텀 타이틀바 (Window Controls): Tauri의 기본 OS 창 틀을 없애고(frameless), 앱 디자인에 맞는 상단 헤더를 직접 구현하세요. 이때 헤더 영역에는 data-tauri-drag-region 속성을 주어 창을 드래그할 수 있게 해야 합니다.

반응형 스크롤링: 브라우저처럼 전체 화면이 스크롤되는 것을 막고, 사이드바는 고정된 채 본문 콘텐츠 영역만 스크롤되도록 레이아웃을 짭니다 (h-screen, overflow-hidden, 본문 영역에만 overflow-y-auto 적용).