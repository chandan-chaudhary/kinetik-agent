import { Test, TestingModule } from '@nestjs/testing';
import { JobBotController } from './job-bot.controller';
import { JobBotService } from './job-bot.service';

describe('JobBotController', () => {
  let controller: JobBotController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobBotController],
      providers: [JobBotService],
    }).compile();

    controller = module.get<JobBotController>(JobBotController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

// import { LlmService } from '@/llm/llm.service';
// import { Injectable } from '@nestjs/common';
// import { chromium as playwrightChromium } from 'playwright-extra';
// import type { Page, Locator } from 'playwright';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// import { getDecisionPrompt, getSelectorPrompt } from './bot-prompt';

// @Injectable()
// export class JobBotService {
//   constructor(private llmService: LlmService) {
//     playwrightChromium.use(StealthPlugin());
//   }

//   async browserNode(url: string, highLevelGoal: string): Promise<void> {
//     const browser = await playwrightChromium.launch({
//       headless: false,
//       slowMo: 500, // Reduced for efficiency but kept for "human" feel
//       channel: 'chrome',
//     });

//     const page: Page = await browser.newPage();
//     try {
//       await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
//       console.log(`Mapsd to: ${url}`, highLevelGoal);
//       let stepCount = 0;
//       const maxSteps = 5;

//       while (stepCount < maxSteps) {
//         console.log(`\n--- Step ${stepCount + 1} ---`);

//         // 1. OBSERVE: Get only what's visible and interactive
//         const elements = await this.getVisibleInteractiveElements(page);

//         const inputFound = await page.evaluate(() => {
//           // Try to find any visible search input manually
//           const searchInput = document.querySelector(
//             'input[type="search"], input[placeholder*="Search"], input[placeholder*="Symbol"]',
//           );
//           if (
//             searchInput &&
//             (searchInput as HTMLElement).offsetParent !== null
//           ) {
//             searchInput.setAttribute('data-bot-id', '999'); // Give it a reserved ID
//             return true;
//           }
//           return false;
//         });

//         // If we manually found it, tell the LLM or just force-type into it
//         if (inputFound) {
//           console.log('Manual override: Detected search input, forcing focus.');
//           await page.focus('[data-bot-id="999"]');
//         }
//         // 2. THINK & ACT: Let the LLM decide the next physical move
//         const decision = await this.getAgentDecision(
//           elements,
//           highLevelGoal,
//           page.url(),
//         );

//         if (decision.action === 'SUCCESS') {
//           console.log('Goal achieved!');
//           break;
//         }

//         if (decision.action === 'ERROR') {
//           console.error('Agent gave up:', decision.reason);
//           break;
//         }

//         // 3. EXECUTE: Perform the click or type
//         await this.performAction(page, decision);

//         // 4. WAIT: Allow the site to animate/load
//         await page.waitForTimeout(2000);
//         stepCount++;
//       }

//       // // STEP 1: OPEN SEARCH
//       // const searchButton = await this.findSelectorForGoal(
//       //   page,
//       //   "Find the button that opens the search input or says 'Search'",
//       // );
//       // await searchButton.click();

//       // // IMPORTANT: Wait for the search input to actually transition/animate in
//       // await page.waitForTimeout(1500);

//       // // // STEP 2: TYPE IN INPUT
//       // const searchInput = await this.findSelectorForGoal(
//       //   page,
//       //   "The actual text input field where I can type 'bitcoin'",
//       // );

//       // // // Clear before typing to be safe
//       // await searchInput.click();
//       // await searchInput.fill('bitcoin');
//       // await page.keyboard.press('Enter');

//       console.log('Search submitted successfully.');
//     } catch (error) {
//       console.error('Automation failed:', error);
//     }
//   }

//   // Get only visible and interactive elements to reduce noise for the LLM
//   async getVisibleInteractiveElements(page: Page) {
//     // We add a 'role' check and 'aria-label' to give the LLM more context
//     return await page.evaluate(() => {
//       const selectors =
//         'button, input, a, [role="button"], textarea, [role="searchbox"]';
//       const elements = document.querySelectorAll(selectors);

//       return Array.from(elements)
//         .filter((el) => {
//           const rect = el.getBoundingClientRect();
//           const style = window.getComputedStyle(el);
//           return (
//             rect.width > 0 &&
//             rect.height > 0 &&
//             rect.top >= 0 &&
//             rect.top <= window.innerHeight &&
//             style.visibility !== 'hidden' &&
//             style.display !== 'none'
//           );
//         })
//         .map((el, index) => {
//           // Force set the ID for Playwright to find it later
//           el.setAttribute('data-bot-id', index.toString());
//           return {
//             botId: index,
//             tag: el.tagName,
//             text: el.textContent?.trim().substring(0, 50) || '',
//             placeholder: (el as HTMLInputElement).placeholder || '',
//             ariaLabel: el.getAttribute('aria-label') || '',
//             role: el.getAttribute('role') || '',
//           };
//         });
//     });
//   }

//   // LLM decides the next action based on visible elements and goal
//   async findSelectorForGoal(
//     page: Page,
//     goal: string,
//     retries = 3,
//   ): Promise<Locator> {
//     for (let i = 0; i < retries; i++) {
//       console.log(`Attempt ${i + 1}: Searching for - ${goal}`);

//       const allElements = await this.getVisibleInteractiveElements(page);

//       // If we found 0 elements, the page might still be loading
//       if (allElements.length === 0) {
//         await page.waitForTimeout(1000);
//         continue;
//       }

//       const compactElements = allElements
//         .map(
//           (el) =>
//             `ID:${el.botId} | Tag:${el.tag} | Text:${el.text} | Placeholder:${el.placeholder} | Aria:${el.ariaLabel}`,
//         )
//         .join('\n');

//       const prompt = getSelectorPrompt(goal, compactElements);
//       const response = await this.llmService.LLM.invoke(prompt);
//       const content =
//         typeof response.content === 'string'
//           ? response.content
//           : JSON.stringify(response.content);

//       const match = content.match(/\b\d+\b/);

//       if (match) {
//         const botId = match[0];
//         console.log(`LLM selected botId: ${botId}`);
//         return page.locator(`[data-bot-id="${botId}"]`);
//       }

//       // If LLM said "NONE", wait and retry
//       console.log(`Goal not found in DOM yet, waiting...`);
//       await page.waitForTimeout(2000);
//     }

//     throw new Error(
//       `Failed to find element for goal: "${goal}" after ${retries} attempts.`,
//     );
//   }

//   // LLM decides the next action based on visible elements and goal
//   private async getAgentDecision(
//     elements: Array<{
//       botId: number;
//       tag: string;
//       text: string;
//       placeholder: string;
//       ariaLabel: string;
//       role: string;
//     }>,
//     goal: string,
//     currentUrl: string,
//   ): Promise<{
//     thought: string;
//     action: 'CLICK' | 'TYPE' | 'SUCCESS' | 'ERROR';
//     id: number | null;
//     text?: string;
//     reason?: string;
//   }> {
//     const elementContext = elements
//       .map(
//         (el) =>
//           `ID:${el.botId} | Tag:${el.tag} | Text:${el.text} | PlaceHolder:${el.placeholder} | Role:${el.role}`,
//       )
//       .join('\n');

//     const prompt = getDecisionPrompt(goal, currentUrl, elementContext);
//     const response = await this.llmService.LLM.invoke(prompt);
//     // Standardize content parsing
//     const content =
//       typeof response.content === 'string'
//         ? response.content
//         : JSON.stringify(response.content);

//     // Extract JSON block
//     const match = content.match(/\{[\s\S]*?\}/s);
//     if (!match) {
//       console.error('LLM Response:', content);
//       throw new Error('Failed to extract JSON from LLM response');
//     }

//     let jsonStr = match[0];

//     // Clean up common issues
//     // Replace placeholder patterns with null
//     jsonStr = jsonStr.replace(/\[THE_INPUT_ID\]/g, 'null');
//     jsonStr = jsonStr.replace(/\[\w+_ID\]/g, 'null');

//     try {
//       const parsed = JSON.parse(jsonStr) as {
//         thought: string;
//         action: 'CLICK' | 'TYPE' | 'SUCCESS' | 'ERROR';
//         id: number | null;
//         text?: string;
//         reason?: string;
//       };

//       // Validate the response
//       if (
//         parsed.id === null &&
//         (parsed.action === 'CLICK' || parsed.action === 'TYPE')
//       ) {
//         console.error('LLM returned invalid id:', content);
//         throw new Error(
//           'LLM returned placeholder instead of actual element ID',
//         );
//       }

//       console.log('Agent Decision:', parsed);
//       return parsed;
//     } catch (error) {
//       console.error('Failed to parse JSON:', jsonStr);
//       console.error('Original response:', content);
//       throw new Error(`JSON parse error: ${error}`);
//     }
//   }

//   // Execute the decided action on the page
//   private async performAction(
//     page: Page,
//     decision: {
//       thought: string;
//       action: 'CLICK' | 'TYPE' | 'SUCCESS' | 'ERROR';
//       id: number | null;
//       text?: string;
//       reason?: string;
//     },
//   ) {
//     const locator = page.locator(`[data-bot-id="${decision.id}"]`);
//     if (decision.action === 'CLICK') {
//       console.log(`Agent Thought: ${decision.thought}`);
//       await locator.click({ force: true, timeout: 5000 });
//     } else if (decision.action === 'TYPE') {
//       console.log(
//         `Agent Thought: ${decision.thought}, Typing: ${decision.text}`,
//       );
//       if (decision.text) {
//         // await locator.fill(decision.text, { force: true });
//         // await page.keyboard.press('Enter');
//         await locator.click({ force: true }); // Ensure it's focused
//         await page.keyboard.down('Control'); // Clear existing text
//         await page.keyboard.press('A');
//         await page.keyboard.up('Control');
//         await page.keyboard.press('Backspace');

//         await page.keyboard.type(decision.text, { delay: 100 }); // Human-like speed
//         await page.keyboard.press('Enter');
//       }
//     }
//   }
// }

// ********************************************** 2nd APPROACH FOR BOT *****************************************************
// import { LlmService } from '@/llm/llm.service';
// import { Injectable } from '@nestjs/common';
// import { chromium as playwrightChromium } from 'playwright-extra';
// import type { Page } from 'playwright';
// import StealthPlugin from 'puppeteer-extra-plugin-stealth';
// import { getDecisionPrompt, getSelectorPrompt } from './bot-prompt';

// // ─── Types ────────────────────────────────────────────────────────────────────
// interface InteractiveElement {
//   botId: number;
//   tag: string;
//   text: string;
//   placeholder: string;
//   ariaLabel: string;
//   role: string;
//   className: string;
// }

// interface AgentDecision {
//   thought: string;
//   action: 'CLICK' | 'TYPE' | 'SUCCESS' | 'ERROR';
//   id: number | null;
//   text?: string;
//   reason?: string;
// }

// // ─── Shared selector list ─────────────────────────────────────────────────────
// // Covers standard elements + common framework patterns (data-testid, comboboxes, etc.)
// const INTERACTIVE_SELECTORS = [
//   'button',
//   'input', // all inputs (text, search, hidden, etc.)
//   'a[href]',
//   'textarea',
//   'select',
//   '[role="button"]',
//   '[role="searchbox"]',
//   '[role="textbox"]',
//   '[role="combobox"]',
//   '[role="listbox"]',
//   '[contenteditable="true"]',
//   '[data-testid*="search"]', // common in React/Next apps like TradingView
//   '[data-testid*="input"]',
//   '[class*="search"]', // fallback: any element with "search" in class
// ].join(', ');

// // ─── Service ──────────────────────────────────────────────────────────────────
// @Injectable()
// export class JobBotService {
//   constructor(private llmService: LlmService) {
//     playwrightChromium.use(StealthPlugin());
//   }

//   // ─── Main Loop ──────────────────────────────────────────────────────────────
//   async browserNode(url: string, highLevelGoal: string): Promise<void> {
//     const browser = await playwrightChromium.launch({
//       headless: false,
//       slowMo: 300,
//       channel: 'chrome',
//     });

//     const page: Page = await browser.newPage();

//     // Block heavy resources. Keep stylesheets — needed for layout.
//     await page.route('**/*', async (route) => {
//       const resourceType = route.request().resourceType();
//       if (['image', 'font', 'media'].includes(resourceType)) {
//         await route.abort();
//       } else {
//         await route.continue();
//       }
//     });

//     try {
//       await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
//       console.log(`Navigated to: ${url} | Goal: ${highLevelGoal}`);

//       let stepCount = 0;
//       const maxSteps = 10;

//       // ── Action history: last N action IDs the LLM picked
//       //    Used for TWO things:
//       //    1. Passed to the LLM so it can see what already failed
//       //    2. Used locally to detect "stuck clicking same ID" loops
//       const actionHistory: number[] = [];
//       const maxRepeatDetection = 3; // if same ID clicked 3x in a row → stuck

//       while (stepCount < maxSteps) {
//         console.log(`\n--- Step ${stepCount + 1} --- [URL: ${page.url()}]`);

//         // 1. OBSERVE
//         const elements = await this.getVisibleInteractiveElements(page);

//         if (elements.length === 0) {
//           console.log('No interactive elements found, waiting...');
//           await page.waitForTimeout(2500);
//           stepCount++;
//           continue;
//         }

//         // 2. THINK
//         const decision = await this.getAgentDecision(
//           elements,
//           highLevelGoal,
//           page.url(),
//           actionHistory,
//         );

//         if (decision.action === 'SUCCESS') {
//           console.log('✅ Goal achieved!');
//           break;
//         }

//         if (decision.action === 'ERROR') {
//           console.error('❌ Agent gave up:', decision.reason);
//           break;
//         }

//         // ── Stuck detection: if LLM picked the same ID N times in a row, stop
//         if (decision.id !== null) {
//           actionHistory.push(decision.id);
//           // Keep history trimmed to last 6 entries (enough for prompt context)
//           if (actionHistory.length > 6) actionHistory.shift();

//           const lastN = actionHistory.slice(-maxRepeatDetection);
//           const allSame =
//             lastN.length === maxRepeatDetection &&
//             lastN.every((id) => id === decision.id);

//           if (allSame) {
//             console.error(
//               `❌ Stuck: LLM clicked [${decision.id}] ${maxRepeatDetection} times in a row. Stopping.`,
//             );
//             break;
//           }
//         }

//         // 3. EXECUTE
//         await this.reTagElements(page);
//         const urlBefore = page.url();

//         await this.performAction(page, decision);

//         // 4. WAIT
//         //    If we just CLICKed something, wait a bit longer than usual —
//         //    modals / overlays / dropdowns often animate in after a click.
//         const extraClickDelay = decision.action === 'CLICK' ? 1500 : 0;
//         await page.waitForTimeout(extraClickDelay);

//         await this.waitAfterAction(page, urlBefore);

//         stepCount++;
//       }

//       console.log('Automation loop finished.');
//     } catch (error) {
//       console.error('Automation failed:', error);
//     } finally {
//       // await browser.close();
//     }
//   }

//   // ─── Observe ────────────────────────────────────────────────────────────────
//   async getVisibleInteractiveElements(
//     page: Page,
//   ): Promise<InteractiveElement[]> {
//     return await page.evaluate((selectors) => {
//       const elements = document.querySelectorAll(selectors);
//       // Deduplicate — some elements match multiple selectors
//       const unique = [...new Set(Array.from(elements))];

//       return unique
//         .filter((el) => {
//           const rect = el.getBoundingClientRect();
//           const style = window.getComputedStyle(el);
//           return (
//             rect.width > 0 &&
//             rect.height > 0 &&
//             rect.top < window.innerHeight + 300 &&
//             rect.bottom > -100 &&
//             style.visibility !== 'hidden' &&
//             style.display !== 'none' &&
//             style.opacity !== '0'
//           );
//         })
//         .map((el, index) => {
//           el.setAttribute('data-bot-id', index.toString());
//           return {
//             botId: index,
//             tag: el.tagName.toLowerCase(),
//             text: (el.textContent?.trim() || '').substring(0, 60),
//             placeholder: (el as HTMLInputElement).placeholder || '',
//             ariaLabel: el.getAttribute('aria-label') || '',
//             role: el.getAttribute('role') || '',
//             // Pass className too — helps LLM understand what something IS
//             // (e.g. "search-input__xyz" is clearly a search input)
//             className: (el.getAttribute('class') || '').substring(0, 80),
//           };
//         });
//     }, INTERACTIVE_SELECTORS);
//   }

//   // ─── Re-tag ─────────────────────────────────────────────────────────────────
//   private async reTagElements(page: Page): Promise<void> {
//     await page.evaluate((selectors) => {
//       const elements = document.querySelectorAll(selectors);
//       const unique = [...new Set(Array.from(elements))];

//       unique
//         .filter((el) => {
//           const rect = el.getBoundingClientRect();
//           const style = window.getComputedStyle(el);
//           return (
//             rect.width > 0 &&
//             rect.height > 0 &&
//             rect.top < window.innerHeight + 300 &&
//             rect.bottom > -100 &&
//             style.visibility !== 'hidden' &&
//             style.display !== 'none' &&
//             style.opacity !== '0'
//           );
//         })
//         .forEach((el, index) => {
//           el.setAttribute('data-bot-id', index.toString());
//         });
//     }, INTERACTIVE_SELECTORS);
//   }

//   // ─── Think ──────────────────────────────────────────────────────────────────
//   private async getAgentDecision(
//     elements: InteractiveElement[],
//     goal: string,
//     currentUrl: string,
//     actionHistory: number[],
//   ): Promise<AgentDecision> {
//     const elementContext = elements
//       .map(
//         (el) =>
//           `ID:${el.botId} | Tag:${el.tag} | Text:"${el.text}" | Placeholder:"${el.placeholder}" | Role:"${el.role}" | Class:"${el.className || ''}"`,
//       )
//       .join('\n');

//     const prompt = getDecisionPrompt(
//       goal,
//       currentUrl,
//       elementContext,
//       actionHistory,
//     );
//     const response = await this.llmService.LLM.invoke(prompt);

//     const content =
//       typeof response.content === 'string'
//         ? response.content
//         : JSON.stringify(response.content);

//     const match = content.match(/\{[\s\S]*?\}/s);
//     if (!match) {
//       console.error('Raw LLM Response:', content);
//       throw new Error('Failed to extract JSON from LLM response');
//     }

//     let jsonStr = match[0];
//     jsonStr = jsonStr.replace(/"\[[\w_]+\]"/g, 'null');
//     jsonStr = jsonStr.replace(/\[[\w_]+\]/g, 'null');

//     try {
//       const parsed = JSON.parse(jsonStr) as AgentDecision;

//       if (
//         parsed.id === null &&
//         (parsed.action === 'CLICK' || parsed.action === 'TYPE')
//       ) {
//         throw new Error('LLM returned null id for CLICK/TYPE');
//       }

//       console.log('🤖 Agent Decision:', parsed);
//       return parsed;
//     } catch (error) {
//       console.error('Parse failed. Raw:', jsonStr);
//       throw new Error(`JSON parse error: ${error}`);
//     }
//   }

//   // ─── Act ────────────────────────────────────────────────────────────────────
//   private async performAction(
//     page: Page,
//     decision: AgentDecision,
//     retries = 3,
//   ): Promise<void> {
//     for (let attempt = 1; attempt <= retries; attempt++) {
//       try {
//         const selector = `[data-bot-id="${decision.id}"]`;

//         await page.evaluate((sel) => {
//           const el = document.querySelector(sel);
//           if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
//         }, selector);

//         await page.waitForTimeout(200);

//         const locator = page.locator(selector);
//         await locator.waitFor({ state: 'visible', timeout: 5000 });

//         if (decision.action === 'CLICK') {
//           console.log(`🖱️  Click [${decision.id}] | ${decision.thought}`);
//           await locator.click({ force: true, timeout: 5000 });
//           return;
//         }

//         if (decision.action === 'TYPE') {
//           if (!decision.text) throw new Error('TYPE action missing text');

//           console.log(
//             `⌨️  Type "${decision.text}" → [${decision.id}] | ${decision.thought}`,
//           );

//           await locator.click({ force: true, timeout: 5000 });
//           await page.waitForTimeout(150);
//           await locator.fill(decision.text, { timeout: 5000 });
//           await page.waitForTimeout(200);
//           await page.keyboard.press('Enter');
//           return;
//         }
//       } catch (error) {
//         console.warn(
//           `⚠️  Attempt ${attempt}/${retries} failed [${decision.id}]:`,
//           error,
//         );

//         if (attempt < retries) {
//           await this.reTagElements(page);
//           await page.waitForTimeout(800);
//         } else {
//           throw new Error(
//             `performAction failed after ${retries} attempts for [${decision.id}]`,
//           );
//         }
//       }
//     }
//   }

//   // ─── Wait: Navigation-aware settle ──────────────────────────────────────────
//   private async waitAfterAction(page: Page, urlBefore: string): Promise<void> {
//     await page.waitForTimeout(600);

//     try {
//       const urlAfter = page.url();

//       if (urlAfter !== urlBefore) {
//         console.log(`🔄 Navigation: ${urlBefore} → ${urlAfter}`);
//         await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
//         try {
//           await page.waitForLoadState('networkidle', { timeout: 8000 });
//         } catch {
//           console.log('networkidle timed out after nav, continuing.');
//         }
//       } else {
//         try {
//           await page.waitForLoadState('networkidle', { timeout: 3000 });
//         } catch {
//           await page.waitForTimeout(1500);
//         }
//       }
//     } catch (error) {
//       console.warn('⚠️  URL read failed after action, hard wait...', error);
//       await page.waitForTimeout(3000);
//     }
//   }

//   // ─── Legacy ─────────────────────────────────────────────────────────────────
//   async findSelectorForGoal(page: Page, goal: string, retries = 3) {
//     for (let i = 0; i < retries; i++) {
//       console.log(`Attempt ${i + 1}: Searching for - ${goal}`);

//       const allElements = await this.getVisibleInteractiveElements(page);

//       if (allElements.length === 0) {
//         await page.waitForTimeout(1500);
//         continue;
//       }

//       const compactElements = allElements
//         .map(
//           (el) =>
//             `ID:${el.botId} | Tag:${el.tag} | Text:${el.text} | Placeholder:${el.placeholder} | Aria:${el.ariaLabel}`,
//         )
//         .join('\n');

//       const prompt = getSelectorPrompt(goal, compactElements);
//       const response = await this.llmService.LLM.invoke(prompt);
//       const content =
//         typeof response.content === 'string'
//           ? response.content
//           : JSON.stringify(response.content);

//       const match = content.match(/\b\d+\b/);

//       if (match) {
//         const botId = match[0];
//         console.log(`LLM selected botId: ${botId}`);
//         await this.reTagElements(page);
//         return page.locator(`[data-bot-id="${botId}"]`);
//       }

//       console.log('Goal not found in DOM yet, waiting...');
//       await page.waitForTimeout(2000);
//     }

//     throw new Error(
//       `Failed to find element for goal: "${goal}" after ${retries} attempts.`,
//     );
//   }
// }
