import { expect, test } from "@playwright/test";

test("loads the state-driven home and keeps queued quests locked", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("오늘의 학습을 불러오고 있어요.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "오늘의 학습" })).toBeVisible();
  await expect(page.getByRole("button", { name: /기울기와 절편, 대기/ })).toBeDisabled();
});

test("renders recoverable offline, server, and empty states", async ({ page }) => {
  await page.goto("/?state=offline");
  await expect(page.getByRole("heading", { name: "인터넷 연결을 확인해 주세요" })).toBeVisible();
  await expect(page.getByRole("button", { name: "다시 시도" })).toBeEnabled();

  await page.goto("/?state=server");
  await expect(page.getByRole("heading", { name: "학습 정보를 불러오지 못했어요" })).toBeVisible();

  await page.goto("/?state=empty");
  await expect(page.getByRole("heading", { name: "아직 배정된 학습이 없어요" })).toBeVisible();
  await expect(page.getByRole("button", { name: "새로고침" })).toBeEnabled();
});

test("auth owns validation, password reveal, and busy state", async ({ page }) => {
  await page.goto("/?state=signed-out");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("alert")).toHaveText("이메일 주소를 확인해 주세요.");

  await page.getByLabel("이메일", { exact: true }).fill("learner@example.com");
  await page.getByLabel("비밀번호", { exact: true }).fill("password123");
  await page.getByRole("button", { name: "비밀번호 보기" }).click();
  await expect(page.getByLabel("비밀번호", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "로그인" }).click();
  await expect(page.getByRole("button", { name: "로그인 중…" })).toBeDisabled();
  await expect(page.getByRole("heading", { name: "오늘의 학습" })).toBeVisible();
});

test("supports long content, new learners, and repeated navigation", async ({ page }) => {
  await page.goto("/?state=long");
  const longTitle = page.getByText("두 점을 지나는 일차함수의 식을 여러 방법으로 구하고 비교하기", { exact: true });
  await expect(longTitle).toBeVisible();
  expect((await longTitle.boundingBox())?.height).toBeGreaterThan(20);

  for (let index = 0; index < 3; index += 1) {
    await page.getByRole("button", { name: "학습", exact: true }).click();
    await expect(page).toHaveTitle("학습 — Mast");
    await page.getByRole("button", { name: "홈", exact: true }).click();
    await expect(page).toHaveTitle("홈 — Mast");
  }

  await page.goto("/?state=new");
  await expect(page.getByRole("heading", { name: "첫 학습을 시작해요" })).toBeVisible();
  await expect(page.getByLabel("오늘 학습 0개 완료, 전체 3개")).toBeVisible();
});

test("reduced motion keeps the learning flow usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: /일차함수의 식, 지금 학습/ }).click();
  await page.getByRole("button", { name: /y = 2x \+ 1/ }).click();
  await page.getByRole("button", { name: "정답 확인" }).click();
  await expect(page.getByText("정답이에요")).toBeVisible();
  await expect(page.getByRole("button", { name: "다음 문제" })).toBeEnabled();
});
