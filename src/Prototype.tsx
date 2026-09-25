import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BarChartIcon, CheckCircledIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon,
  Cross2Icon, CubeIcon, HeartFilledIcon, HomeIcon, LightningBoltIcon,
  ExclamationTriangleIcon, EyeClosedIcon, EyeOpenIcon, LockClosedIcon, MoonIcon,
  PlayIcon, ReaderIcon, ReloadIcon, RocketIcon, SpeakerLoudIcon, StarFilledIcon,
  SunIcon, TargetIcon,
} from "@radix-ui/react-icons";
import { KeyboardInput, MobileScroll, useKeyboard } from "./mobile";

type MainView = "home" | "learn" | "review" | "report" | "growth";
type View = MainView | "lesson" | "result";
type Theme = "light" | "dark";
type NavId = "home" | "learn" | "review" | "report";
type LessonMode = "lesson" | "review" | "weakness";
type AppScenario = "default" | "new" | "empty" | "offline" | "server" | "long" | "signed-out";
type AsyncState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "empty" }
  | { status: "error"; kind: "offline" | "server"; message: string };

type Challenge = {
  label: string;
  prompt: string;
  helper: string;
  options: string[];
  answer: string;
  explanation: string;
};

type ProgressState = {
  xp: number;
  level: number;
  stars: number;
  streak: number;
  overall: number;
  completedStages: number;
  completedQuests: LessonMode[];
};

type Quest = {
  mode: LessonMode;
  type: string;
  title: string;
  detail: string;
  reward: string;
};

type Lesson = {
  id: string;
  type: string;
  title: string;
  meta: string;
  kind: "note" | "video" | "practice" | "audio";
  state: "complete" | "active" | "locked";
};

type ReportSkill = { name: string; value: number };

type MastData = {
  courseLabel: string;
  unitEyebrow: string;
  unitTitle: string;
  unitProgress: number;
  quests: Quest[];
  lessons: Lesson[];
  reviewTitles: string[];
  weeklyActivity: number[];
  reportSkills: ReportSkill[];
};

const defaultData: MastData = {
  courseLabel: "중2 수학 · 일차함수",
  unitEyebrow: "중2 수학 · 단원 4",
  unitTitle: "일차함수",
  unitProgress: 50,
  quests: [
    { mode: "lesson", type: "새 개념", title: "일차함수의 식", detail: "개념 확인 · 4문제 · 약 8분", reward: "+20 XP" },
    { mode: "review", type: "오답 복습", title: "최근 오답 3문제", detail: "풀이 과정 다시 확인 · 약 6분", reward: "+10 XP" },
    { mode: "weakness", type: "약점 훈련", title: "기울기와 절편", detail: "최근 정답률 58% · 약 5분", reward: "+10 XP" },
  ],
  lessons: [
    { id: "meaning", type: "개념 노트", title: "일차함수의 뜻", meta: "완료 · 6분", kind: "note", state: "complete" },
    { id: "slope", type: "짧은 영상", title: "그래프와 기울기", meta: "완료 · 4분", kind: "video", state: "complete" },
    { id: "equation", type: "문제 풀이", title: "일차함수의 식 구하기", meta: "진행 중 · 8분", kind: "practice", state: "active" },
    { id: "summary", type: "오디오 요약", title: "절편 핵심 정리", meta: "잠금 · 3분", kind: "audio", state: "locked" },
  ],
  reviewTitles: ["기울기 구하기", "좌표가 그래프 위에 있는지 확인", "두 점으로 식 구하기"],
  weeklyActivity: [42, 64, 38, 82, 68, 54, 76],
  reportSkills: [{ name: "함숫값", value: 86 }, { name: "그래프 읽기", value: 74 }, { name: "기울기와 절편", value: 58 }],
};

const challenges: Challenge[] = [
  { label: "식 완성하기", prompt: "기울기 2, y절편 1", helper: "조건에 맞는 일차함수의 식은?", options: ["y = x + 2", "y = 2x + 1", "y = 2x - 1", "y = 3x + 1"], answer: "y = 2x + 1", explanation: "y = ax + b에서 기울기 a는 2, y절편 b는 1입니다." },
  { label: "함숫값 구하기", prompt: "y = 2x + 1", helper: "x = 3일 때 y의 값은?", options: ["5", "6", "7", "8"], answer: "7", explanation: "x에 3을 대입하면 2 × 3 + 1 = 7입니다." },
  { label: "좌표 확인하기", prompt: "y = -x + 4", helper: "x = 1인 점의 좌표를 고르세요.", options: ["(1, 2)", "(1, 3)", "(2, 1)", "(3, 1)"], answer: "(1, 3)", explanation: "x = 1을 대입하면 y = -1 + 4 = 3입니다." },
  { label: "기울기 찾기", prompt: "(1, 3), (3, 7)", helper: "두 점을 지나는 직선의 기울기는?", options: ["1", "2", "3", "4"], answer: "2", explanation: "y의 변화량 4를 x의 변화량 2로 나누면 기울기는 2입니다." },
];

const navItems: Array<{ id: NavId; label: string; icon: typeof HomeIcon }> = [
  { id: "home", label: "홈", icon: HomeIcon },
  { id: "learn", label: "학습", icon: ReaderIcon },
  { id: "review", label: "복습", icon: CheckCircledIcon },
  { id: "report", label: "리포트", icon: BarChartIcon },
];

const progressStorageKey = "mast-progress-v5";
const themeStorageKey = "mast-theme-v3";
const sessionStorageKey = "mast-session-v1";
const fallbackProgress: ProgressState = { xp: 120, level: 2, stars: 42, streak: 3, overall: 38, completedStages: 2, completedQuests: [] };

function getScenario(): AppScenario {
  if (!import.meta.env.DEV) return "default";
  const value = new URLSearchParams(window.location.search).get("state");
  return value === "new" || value === "empty" || value === "offline" || value === "server" || value === "long" || value === "signed-out" ? value : "default";
}

function dataForScenario(scenario: AppScenario): MastData {
  if (scenario !== "long") return defaultData;
  return {
    ...defaultData,
    quests: defaultData.quests.map((quest, index) => index === 0 ? { ...quest, title: "두 점을 지나는 일차함수의 식을 여러 방법으로 구하고 비교하기", detail: "개념 설명과 단계별 풀이를 확인한 뒤 직접 식을 완성해요 · 약 12분" } : quest),
    lessons: defaultData.lessons.map((lesson, index) => index === 2 ? { ...lesson, title: "주어진 두 점과 y절편을 활용해 일차함수의 식 구하기" } : lesson),
  };
}

const mastClient = {
  async load(scenario: AppScenario, signal: AbortSignal): Promise<MastData> {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 420);
      signal.addEventListener("abort", () => { window.clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
    });
    if (scenario === "offline" || !navigator.onLine) throw new Error("offline");
    if (scenario === "server") throw new Error("server");
    if (scenario === "empty") return { ...defaultData, quests: [], lessons: [], reviewTitles: [], reportSkills: [], weeklyActivity: [] };
    return dataForScenario(scenario);
  },
};

function loadProgress(): ProgressState {
  try {
    const saved = JSON.parse(window.localStorage.getItem(progressStorageKey) ?? "null") as Partial<ProgressState> | null;
    if (!saved) return fallbackProgress;
    return {
      xp: typeof saved.xp === "number" ? Math.max(0, saved.xp) : 120,
      level: typeof saved.level === "number" ? Math.max(1, saved.level) : 2,
      stars: typeof saved.stars === "number" ? Math.max(0, saved.stars) : 42,
      streak: typeof saved.streak === "number" ? Math.max(0, saved.streak) : 3,
      overall: typeof saved.overall === "number" ? Math.max(0, Math.min(100, saved.overall)) : 38,
      completedStages: typeof saved.completedStages === "number" ? Math.max(0, saved.completedStages) : 2,
      completedQuests: Array.isArray(saved.completedQuests)
        ? saved.completedQuests.filter((mode): mode is LessonMode => mode === "lesson" || mode === "review" || mode === "weakness")
        : [],
    };
  } catch { return fallbackProgress; }
}

function loadTheme(): Theme {
  try { return window.localStorage.getItem(themeStorageKey) === "dark" ? "dark" : "light"; }
  catch { return "light"; }
}

function AppStateScreen({ state, onRetry }: { state: Exclude<AsyncState<MastData>, { status: "ready" }>; onRetry: () => void }) {
  if (state.status === "loading") return (
    <div className="state-screen loading-state" role="status" aria-label="학습 데이터 불러오는 중">
      <span className="loading-mark" aria-hidden="true" />
      <div className="state-lines" aria-hidden="true"><span /><span /><span /></div>
      <p>오늘의 학습을 불러오고 있어요.</p>
    </div>
  );

  const offline = state.status === "error" && state.kind === "offline";
  return (
    <div className="state-screen" role={state.status === "error" ? "alert" : "status"}>
      <span className="state-icon" aria-hidden="true">{state.status === "empty" ? <ReaderIcon /> : offline ? <ReloadIcon /> : <ExclamationTriangleIcon />}</span>
      <h1>{state.status === "empty" ? "아직 배정된 학습이 없어요" : offline ? "인터넷 연결을 확인해 주세요" : "학습 정보를 불러오지 못했어요"}</h1>
      <p>{state.status === "empty" ? "새 학습이 배정되면 이곳에 순서대로 표시됩니다." : state.message}</p>
      <button className="primary-button" type="button" onClick={onRetry}>{state.status === "empty" ? "새로고침" : "다시 시도"}<ReloadIcon aria-hidden="true" /></button>
    </div>
  );
}

function AuthScreen({ theme, onAuthenticated }: { theme: Theme; onAuthenticated: () => void }) {
  const keyboard = useKeyboard();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@")) { setError("이메일 주소를 확인해 주세요."); emailRef.current?.focus(); return; }
    if (password.length < 8) { setError("비밀번호는 8자 이상 입력해 주세요."); return; }
    setError(null);
    setPending(true);
    window.setTimeout(() => {
      try { window.localStorage.setItem(sessionStorageKey, "signed-in"); } catch { /* The signed-in session still works until reload. */ }
      keyboard.hide();
      setPending(false);
      onAuthenticated();
    }, 450);
  };

  return <div className="mast-shell" data-theme={theme}><MobileScroll className="auth-scroll"><main className="auth-content">
    <div className="auth-brand"><img src="/mast-mark-v2.png" alt="" draggable={false} /><strong>Mast</strong></div>
    <div className="auth-heading"><p>학습 이어가기</p><h1>계정에 로그인</h1><span>저장된 진도와 복습 기록을 불러옵니다.</span></div>
    <form className="auth-form" noValidate onSubmit={submit}>
      <label htmlFor="mast-email">이메일</label>
      <KeyboardInput ref={emailRef} id="mast-email" name="email" type="email" inputMode="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(error && !email.includes("@"))} aria-describedby={error ? "auth-error" : undefined} />
      <label htmlFor="mast-password">비밀번호</label>
      <div className="password-field"><KeyboardInput id="mast-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(error && password.length < 8)} aria-describedby={error ? "auth-error" : undefined} /><button type="button" aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}</button></div>
      <div className="form-message" id="auth-error" role="alert">{error ?? " "}</div>
      <button className="primary-button" type="submit" disabled={pending} aria-busy={pending}>{pending ? "로그인 중…" : "로그인"}</button>
    </form>
    <p className="auth-note">로그인 문제가 계속되면 학교 또는 보호자 계정 관리자에게 문의하세요.</p>
  </main></MobileScroll></div>;
}

function ProgressBar({ value, label }: { value: number; label: string }) {
  return <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${value}%` }} /></div>;
}

function BrandHeader({ theme, streak, stars, onThemeToggle }: { theme: Theme; streak: number; stars: number; onThemeToggle: () => void }) {
  return (
    <header className="brand-header">
      <div className="brand-lockup" aria-label="Mast"><img className="brand-mark" src="/mast-mark-v2.png" alt="" draggable={false} /><span>Mast</span></div>
      <div className="brand-stats">
        <span className="header-stat streak-stat"><RocketIcon aria-hidden="true" /> {streak}일</span>
        <span className="header-stat star-stat"><StarFilledIcon aria-hidden="true" /> {stars}</span>
        <button className="icon-button" type="button" aria-label={theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"} aria-pressed={theme === "dark"} onClick={onThemeToggle}>{theme === "dark" ? <SunIcon /> : <MoonIcon />}</button>
      </div>
    </header>
  );
}

function BottomNavigation({ active, onNavigate }: { active: NavId; onNavigate: (id: NavId) => void }) {
  return <nav className="bottom-nav" aria-label="주요 메뉴">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" className={active === item.id ? "active" : ""} aria-current={active === item.id ? "page" : undefined} onClick={() => onNavigate(item.id)}><Icon aria-hidden="true" /><span>{item.label}</span></button>; })}</nav>;
}

function ScreenHeader({ title, eyebrow }: { title: string; eyebrow: string }) {
  return <div className="screen-heading"><p>{eyebrow}</p><h1>{title}</h1></div>;
}

type QuestStepProps = {
  index: number;
  type: string;
  title: string;
  detail: string;
  reward: string;
  state: "complete" | "active" | "queued";
  onSelect: () => void;
};

function QuestStep({ index, type, title, detail, reward, state, onSelect }: QuestStepProps) {
  const status = state === "complete" ? "완료" : state === "active" ? "지금 학습" : "대기";
  return <li className={`quest-item ${state}`}>
    <span className="quest-node" aria-hidden="true">{state === "complete" ? <CheckIcon /> : String(index).padStart(2, "0")}</span>
    <button type="button" className="quest-button" disabled={state === "queued"} onClick={onSelect} aria-label={`${title}, ${status}`}>
      <span className="quest-copy"><small>{type}</small><strong>{title}</strong><em>{detail}</em></span>
      <span className="quest-side"><small>{status}</small><strong>{reward}</strong><ChevronRightIcon aria-hidden="true" /></span>
    </button>
  </li>;
}

function HomeScreen({ progress, data, onStart, onOpenReview, onOpenWeakness, onOpenGrowth }: { progress: ProgressState; data: MastData; onStart: () => void; onOpenReview: () => void; onOpenWeakness: () => void; onOpenGrowth: () => void }) {
  const todayLabel = new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "long" }).format(new Date());
  const actionByMode: Record<LessonMode, () => void> = { lesson: onStart, review: onOpenReview, weakness: onOpenWeakness };
  const quests = data.quests.map((quest) => ({ ...quest, onSelect: actionByMode[quest.mode] }));
  const completedCount = quests.filter((quest) => progress.completedQuests.includes(quest.mode)).length;
  const activeIndex = quests.findIndex((quest) => !progress.completedQuests.includes(quest.mode));
  const nextQuest = activeIndex >= 0 ? quests[activeIndex] : null;
  return <>
    <section className="progress-ledger" aria-label="레벨 진행">
      <div><span>레벨 {progress.level}</span><strong>{progress.xp}<small>/200 XP</small></strong></div>
      <div><span>전체 진도</span><strong>{progress.overall}%</strong></div>
      <ProgressBar value={progress.xp / 2} label={`레벨 ${progress.level} 진행률`} />
    </section>
    <section className="home-title-block">
      <div><p>{todayLabel}</p><span>{data.courseLabel}</span></div>
      <div className="daily-count" aria-label={`오늘 학습 ${completedCount}개 완료, 전체 ${quests.length}개`}><strong>{completedCount}</strong><span>/ {quests.length}</span></div>
      <h1>{quests.length > 0 && completedCount === quests.length ? "오늘 학습 완료" : progress.completedStages === 0 ? "첫 학습을 시작해요" : "오늘의 학습"}</h1>
    </section>
    <ol className="quest-rail" aria-label={`오늘의 학습 ${quests.length}단계`}>
      {quests.map((quest, index) => <QuestStep key={quest.mode} index={index + 1} {...quest} state={progress.completedQuests.includes(quest.mode) ? "complete" : index === activeIndex ? "active" : "queued"} />)}
    </ol>
    <button className="primary-button home-primary" type="button" onClick={nextQuest?.onSelect ?? onOpenGrowth}>{nextQuest ? `${nextQuest.type} 시작` : "성장 공간 보기"}<ChevronRightIcon aria-hidden="true" /></button>
    <button className="growth-entry" type="button" onClick={onOpenGrowth}><span className="growth-icon"><CubeIcon aria-hidden="true" /></span><span><strong>성장 공간</strong><small>보유 별 {progress.stars} · 다음 꾸미기까지 8개</small></span><ChevronRightIcon aria-hidden="true" /></button>
  </>;
}

function LearnScreen({ data, onStart }: { data: MastData; onStart: () => void }) {
  const iconByKind = { note: ReaderIcon, video: PlayIcon, practice: TargetIcon, audio: SpeakerLoudIcon };
  return <>
    <ScreenHeader eyebrow={data.unitEyebrow} title={data.unitTitle} />
    <div className="unit-progress"><div><span>단원 진도</span><strong>{data.unitProgress}%</strong></div><ProgressBar value={data.unitProgress} label={`${data.unitTitle} 단원 진도`} /></div>
    <section className="content-section"><div className="section-title"><h2>학습 단계</h2><span>순서대로 진행</span></div><div className="learning-list">{data.lessons.map((lesson, index) => { const Icon = iconByKind[lesson.kind]; const locked = lesson.state === "locked"; return <button key={lesson.id} type="button" className={`learning-row ${lesson.state}`} disabled={locked || lesson.state === "complete"} onClick={lesson.state === "active" ? onStart : undefined}><span className="learning-index">{lesson.state === "complete" ? <CheckIcon /> : locked ? <LockClosedIcon /> : index + 1}</span><span className="learning-type"><Icon aria-hidden="true" /> {lesson.type}</span><span className="learning-copy"><strong>{lesson.title}</strong><small>{lesson.meta}</small></span>{lesson.state === "active" && <ChevronRightIcon aria-hidden="true" />}</button>; })}</div></section>
    <button className="primary-button" type="button" onClick={onStart} disabled={!data.lessons.some((lesson) => lesson.state === "active")}>현재 단계 시작 <ChevronRightIcon /></button>
  </>;
}

function ReviewScreen({ data, onStart }: { data: MastData; onStart: () => void }) {
  return <>
    <ScreenHeader eyebrow="간격 반복 · 오늘 3문제" title="오답 복습" />
    <section className="review-summary"><TargetIcon aria-hidden="true" /><div><strong>기억이 흐려지기 전에</strong><span>최근 오답 3개를 지금 다시 풀면 복습 간격이 늘어납니다.</span></div></section>
    <section className="content-section"><div className="section-title"><h2>오늘 다시 볼 문제</h2><span>약 6분</span></div><div className="review-list">{data.reviewTitles.map((title, index) => <div className="review-row" key={title}><span>{index + 1}</span><div><strong>{title}</strong><small>{index === 0 ? "2번 틀림 · 오늘 복습" : "1번 틀림 · 오늘 복습"}</small></div><ReloadIcon aria-hidden="true" /></div>)}</div></section>
    <button className="primary-button" type="button" onClick={onStart} disabled={data.reviewTitles.length === 0}>{data.reviewTitles.length}문제 복습 시작 <ChevronRightIcon /></button>
  </>;
}

function ReportScreen({ data, progress }: { data: MastData; progress: ProgressState }) {
  return <>
    <ScreenHeader eyebrow="9월 21일–27일" title="학습 리포트" />
    <section className="report-metric"><div><span>이번 주 학습</span><strong>1시간 48분</strong></div><div><span>정답률</span><strong>78%</strong></div></section>
    <section className="report-chart" aria-label="요일별 학습량"><div className="chart-bars">{data.weeklyActivity.map((value, index) => <span key={index} style={{ height: `${value}%` }}><i>{["월", "화", "수", "목", "금", "토", "일"][index]}</i></span>)}</div></section>
    <section className="content-section"><div className="section-title"><h2>개념별 정확도</h2><span>최근 30일</span></div><div className="skill-list">{data.reportSkills.map((skill) => <div key={skill.name} className="skill-row"><div><strong>{skill.name}</strong><span>{skill.value}%</span></div><ProgressBar value={skill.value} label={`${skill.name} 정확도`} /></div>)}</div></section>
    <section className="achievement-strip"><StarFilledIcon aria-hidden="true" /><div><strong>이번 주 보상</strong><span>{progress.completedStages}개 스테이지 · 별 {progress.stars}개 보유</span></div></section>
  </>;
}

function GrowthScreen({ stars, onBack, onSelect }: { stars: number; onBack: () => void; onSelect: (message: string) => void }) {
  const items = [{ name: "그래프 노트", cost: 30, owned: true }, { name: "코발트 스탠드", cost: 50, owned: false }, { name: "함수 포스터", cost: 80, owned: false }];
  return <>
    <button className="back-button" type="button" onClick={onBack}><ChevronLeftIcon /> 홈으로</button>
    <div className="growth-hero"><img src="/assets/mast/mascot-study-flat.png" alt="연필과 수학 노트를 든 Mast 캐릭터" draggable={false} /><div><p>성장 공간</p><h1>배운 만큼 채워지는 방</h1><span>문제를 풀어 모은 별로 학습 공간을 꾸릴 수 있어요.</span></div></div>
    <div className="star-balance"><StarFilledIcon /> 보유 별 <strong>{stars}</strong></div>
    <section className="content-section"><div className="section-title"><h2>꾸미기</h2><span>3개 아이템</span></div><div className="growth-list">{items.map((item) => { const available = item.owned || stars >= item.cost; return <button key={item.name} type="button" disabled={!available} onClick={() => onSelect(item.owned ? `${item.name}을 배치했습니다.` : `${item.name}은 별 ${item.cost}개가 필요합니다.`)}><CubeIcon aria-hidden="true" /><span><strong>{item.name}</strong><small>{item.owned ? "보유 중" : `별 ${item.cost}`}</small></span>{item.owned ? <CheckCircledIcon /> : available ? <ChevronRightIcon /> : <LockClosedIcon />}</button>; })}</div></section>
  </>;
}

export default function Prototype() {
  const keyboard = useKeyboard();
  const scenario = useMemo(getScenario, []);
  const [progress, setProgress] = useState<ProgressState>(() => scenario === "new" ? { xp: 0, level: 1, stars: 0, streak: 0, overall: 0, completedStages: 0, completedQuests: [] } : loadProgress());
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [authenticated, setAuthenticated] = useState(() => {
    if (scenario === "signed-out") return false;
    try { return window.localStorage.getItem(sessionStorageKey) !== "signed-out"; } catch { return true; }
  });
  const [appState, setAppState] = useState<AsyncState<MastData>>({ status: "loading" });
  const requestRef = useRef<AbortController | null>(null);
  const [view, setView] = useState<View>("home");
  const [activeNav, setActiveNav] = useState<NavId>("home");
  const [lessonMode, setLessonMode] = useState<LessonMode>("lesson");
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hearts, setHearts] = useState(5);
  const [combo, setCombo] = useState(0);
  const [stageXp, setStageXp] = useState(0);
  const [stageStars, setStageStars] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const currentChallenge = challenges[challengeIndex];
  const isCorrect = selectedAnswer === currentChallenge.answer;
  const pageTitle = useMemo(() => !authenticated ? "로그인" : view === "lesson" ? "학습" : view === "result" ? "학습 결과" : view === "growth" ? "성장 공간" : navItems.find((item) => item.id === activeNav)?.label ?? "홈", [activeNav, authenticated, view]);

  const loadAppData = useCallback(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setAppState({ status: "loading" });
    void mastClient.load(scenario, controller.signal).then((data) => {
      if (controller.signal.aborted) return;
      const hasContent = data.quests.length > 0 || data.lessons.length > 0 || data.reviewTitles.length > 0;
      setAppState(hasContent ? { status: "ready", data } : { status: "empty" });
    }).catch((error: unknown) => {
      if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
      const offline = error instanceof Error && error.message === "offline";
      setAppState({ status: "error", kind: offline ? "offline" : "server", message: offline ? "연결이 복구되면 다시 시도할 수 있습니다. 저장된 학습 진도는 유지됩니다." : "서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요." });
    });
  }, [scenario]);

  useEffect(() => { document.title = `${pageTitle} — Mast`; }, [pageTitle]);
  useEffect(() => {
    if (!authenticated) return undefined;
    loadAppData();
    return () => requestRef.current?.abort();
  }, [authenticated, loadAppData]);
  useEffect(() => {
    if (scenario !== "default") return undefined;
    const handleOnline = () => loadAppData();
    const handleOffline = () => setAppState({ status: "error", kind: "offline", message: "연결이 복구되면 다시 시도할 수 있습니다. 저장된 학습 진도는 유지됩니다." });
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, [loadAppData, scenario]);
  useEffect(() => { if (scenario !== "new") { try { window.localStorage.setItem(progressStorageKey, JSON.stringify(progress)); } catch { /* Session state still works. */ } } }, [progress, scenario]);
  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(null), 2600); return () => window.clearTimeout(timer); }, [notice]);

  const navigate = (id: NavId) => { keyboard.hide(); setActiveNav(id); setView(id); };
  const startStage = (mode: LessonMode) => { keyboard.hide(); setLessonMode(mode); setChallengeIndex(mode === "review" ? 1 : mode === "weakness" ? 3 : 0); setSelectedAnswer(null); setSubmitted(false); setHearts(5); setCombo(0); setStageXp(0); setStageStars(0); setView("lesson"); };
  const submitAnswer = () => { if (!selectedAnswer || submitted) return; setSubmitted(true); if (isCorrect) { setCombo((value) => value + 1); setStageXp((value) => value + 10); setStageStars((value) => value + 2); } else { setHearts((value) => Math.max(0, value - 1)); setCombo(0); } };
  const finishStage = () => { setProgress((current) => { const totalXp = current.xp + stageXp; const levelUp = totalXp >= 200; return { ...current, xp: levelUp ? totalXp - 200 : totalXp, level: levelUp ? current.level + 1 : current.level, stars: current.stars + stageStars, overall: Math.min(100, current.overall + 3), completedStages: current.completedStages + 1, completedQuests: current.completedQuests.includes(lessonMode) ? current.completedQuests : [...current.completedQuests, lessonMode] }; }); setView("result"); };
  const advanceLesson = () => { if (!submitted) { submitAnswer(); return; } if (!isCorrect) { if (hearts === 0) { navigate("home"); setNotice("하트를 모두 사용했습니다. 진행 중인 XP는 저장되지 않았습니다."); return; } setSelectedAnswer(null); setSubmitted(false); return; } if (challengeIndex === challenges.length - 1) { finishStage(); return; } setChallengeIndex((value) => value + 1); setSelectedAnswer(null); setSubmitted(false); };
  const toggleTheme = () => { setTheme((current) => { const next = current === "light" ? "dark" : "light"; try { window.localStorage.setItem(themeStorageKey, next); } catch { /* Theme still changes. */ } return next; }); };

  if (!authenticated) return <AuthScreen theme={theme} onAuthenticated={() => setAuthenticated(true)} />;

  if (appState.status !== "ready") return <div className="mast-shell" data-theme={theme}><MobileScroll className="state-scroll"><main className="state-content"><BrandHeader theme={theme} streak={progress.streak} stars={progress.stars} onThemeToggle={toggleTheme} /><AppStateScreen state={appState} onRetry={loadAppData} /></main></MobileScroll></div>;

  const data = appState.data;

  if (view === "lesson") {
    const stageLabel = lessonMode === "review" ? "오답 복습" : lessonMode === "weakness" ? "취약 유형 훈련" : "새 학습";
    return <div className="mast-shell" data-theme={theme}><section className={`lesson-stage ${submitted ? (isCorrect ? "is-correct" : "is-wrong") : ""}`}>
      <header className="lesson-header"><button type="button" className="icon-button" aria-label="학습 나가기" onClick={() => navigate("home")}><Cross2Icon /></button><div className="lesson-progress" aria-label={`문제 ${challengeIndex + 1}/${challenges.length}`}>{challenges.map((_, index) => <span key={index} className={index <= challengeIndex ? "filled" : ""} />)}</div><span className="heart-count" aria-label={`하트 ${hearts}개`}><HeartFilledIcon /> {hearts}</span></header>
      <MobileScroll className="lesson-scroll"><main className="lesson-content"><div className="lesson-meta"><span>{stageLabel} · {currentChallenge.label}</span><strong>{challengeIndex + 1} / {challenges.length}</strong></div>{combo >= 2 && <div className="combo-status" role="status"><LightningBoltIcon /> {combo} 콤보</div>}<h1>{currentChallenge.helper}</h1><div className="math-board"><span aria-hidden="true" /><strong>{currentChallenge.prompt}</strong></div><div className="answer-list" aria-label="답안 선택">{currentChallenge.options.map((option, index) => { const state = submitted ? option === currentChallenge.answer ? "correct" : option === selectedAnswer ? "wrong" : "muted" : selectedAnswer === option ? "selected" : ""; return <button key={option} type="button" className={`answer-button ${state}`} disabled={submitted} aria-pressed={selectedAnswer === option} onClick={() => setSelectedAnswer(option)}><span>{index + 1}</span><strong>{option}</strong></button>; })}</div></main></MobileScroll>
      <footer className={`answer-dock ${submitted ? (isCorrect ? "correct" : "wrong") : "idle"}`}><div className="feedback-copy" role="status" aria-live="polite">{submitted ? <><span className="feedback-icon">{isCorrect ? <CheckIcon /> : <Cross2Icon />}</span><span><strong>{isCorrect ? "정답이에요" : "다시 확인해 보세요"}</strong><small>{isCorrect ? currentChallenge.explanation : "해설을 확인하고 같은 문제를 한 번 더 풀어요."}</small></span></> : <span><strong>답을 고른 뒤 확인하세요.</strong><small>선택은 제출 전까지 바꿀 수 있어요.</small></span>}</div><button type="button" className="lesson-action" disabled={!selectedAnswer} onClick={advanceLesson}>{!submitted ? "정답 확인" : !isCorrect ? "다시 풀기" : challengeIndex === challenges.length - 1 ? "결과 보기" : "다음 문제"}</button></footer>
    </section></div>;
  }

  if (view === "result") return <div className="mast-shell" data-theme={theme}><MobileScroll className="result-scroll"><main className="result-content"><img src="/assets/mast/mascot-celebrate-flat.png" alt="학습 완료를 축하하는 Mast 캐릭터" draggable={false} /><p>스테이지 완료</p><h1>일차함수 퀘스트 완료</h1><span>틀린 문제는 복습 목록에 자동으로 남겨뒀어요.</span><div className="result-stats"><div><LightningBoltIcon /><span>획득 XP</span><strong>+{stageXp}</strong></div><div><StarFilledIcon /><span>획득 별</span><strong>+{stageStars}</strong></div></div><button className="primary-button" type="button" onClick={() => navigate("home")}>홈으로 돌아가기 <ChevronRightIcon /></button></main></MobileScroll></div>;

  return <div className="mast-shell" data-theme={theme}><MobileScroll className="app-scroll"><main className="app-content">{view !== "growth" && <BrandHeader theme={theme} streak={progress.streak} stars={progress.stars} onThemeToggle={toggleTheme} />}{view === "home" && <HomeScreen progress={progress} data={data} onStart={() => startStage("lesson")} onOpenReview={() => navigate("review")} onOpenWeakness={() => startStage("weakness")} onOpenGrowth={() => setView("growth")} />}{view === "learn" && <LearnScreen data={data} onStart={() => startStage("lesson")} />}{view === "review" && <ReviewScreen data={data} onStart={() => startStage("review")} />}{view === "report" && <ReportScreen data={data} progress={progress} />}{view === "growth" && <GrowthScreen stars={progress.stars} onBack={() => navigate("home")} onSelect={setNotice} />}</main></MobileScroll>{view !== "growth" && <BottomNavigation active={activeNav} onNavigate={navigate} />}{notice && <div className="notice" role="status"><CheckCircledIcon /><span>{notice}</span><button type="button" aria-label="알림 닫기" onClick={() => setNotice(null)}><Cross2Icon /></button></div>}</div>;
}
