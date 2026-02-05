import { LlmService } from '@/llm/llm.service';
import { Injectable } from '@nestjs/common';
import { chromium as playwrightChromium } from 'playwright-extra';
import type { Page, Locator } from 'playwright';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { getDecisionPrompt } from './bot-prompt';
import { logRetryError, logWarning, wrapError } from '@/config/handleError';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface InteractiveElement {
  botId: number;
  tag: string;
  text: string;
  placeholder: string;
  ariaLabel: string;
  role: string;
  className: string;
  type?: string;
  href?: string;
}

interface AgentDecision {
  thought: string;
  action: 'CLICK' | 'TYPE' | 'SUCCESS' | 'ERROR' | 'WAIT';
  id: number | null;
  text?: string;
  reason?: string;
}

interface TaskStep {
  type: 'click' | 'type' | 'wait' | 'navigate';
  description: string;
  selector?: string;
  text?: string;
  pattern?: string;
  waitMs?: number;
  url?: string;
}

interface PatternDefinition {
  keywords?: string[];
  selectors?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// UI PATTERNS - Expanded for multiple use cases
// ═══════════════════════════════════════════════════════════════════════════

const UI_PATTERNS = {
  // ─── Authentication ───────────────────────────────────────────────────────
  googleLogin: [
    {
      keywords: [
        'sign in with google',
        'continue with google',
        'login with google',
        'google',
      ],
      selectors: [
        'button:has-text("Google")',
        'a:has-text("Google")',
        '[data-provider="google"]',
        '[aria-label*="Google" i]',
        '.google-login',
        '[class*="google"]',
        'button[class*="social" i]:has-text("Google")',
      ],
    },
  ],

  emailInput: [
    {
      selectors: [
        'input[type="email"]',
        'input[name="email"]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]',
        'input[aria-label*="email" i]',
        'input[autocomplete="email"]',
      ],
    },
  ],

  passwordInput: [
    {
      selectors: [
        'input[type="password"]',
        'input[name="password"]',
        'input[id*="password" i]',
        'input[autocomplete="current-password"]',
      ],
    },
  ],

  submitButton: [
    {
      keywords: [
        'submit',
        'continue',
        'next',
        'sign in',
        'log in',
        'login',
        'enter',
      ],
      selectors: [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:has-text("Continue")',
        'button:has-text("Next")',
        'button:has-text("Sign in")',
        'button:has-text("Submit")',
      ],
    },
  ],

  // ─── Navigation ───────────────────────────────────────────────────────────
  loginButton: [
    {
      keywords: ['login', 'sign in', 'log in'],
      selectors: [
        'button:has-text("Log in")',
        'button:has-text("Sign in")',
        'a:has-text("Log in")',
        'a:has-text("Sign in")',
        '[data-testid*="login"]',
        '[aria-label*="Log in" i]',
      ],
    },
  ],

  closeModal: [
    {
      keywords: ['close', 'dismiss', 'cancel'],
      selectors: [
        'button[aria-label*="Close" i]',
        'button:has-text("×")',
        '[data-testid*="close"]',
        '.modal-close',
        'button.close',
      ],
    },
  ],

  acceptCookies: [
    {
      keywords: ['accept', 'agree', 'accept all', 'got it', 'ok'],
      selectors: [
        'button:has-text("Accept")',
        'button:has-text("Agree")',
        'button:has-text("Got it")',
        '[data-testid*="cookie"]',
      ],
    },
  ],

  // ─── Search ───────────────────────────────────────────────────────────────
  searchInput: [
    {
      selectors: [
        'input[type="search"]',
        'input[name*="search" i]',
        'input[placeholder*="search" i]',
        '[role="searchbox"]',
        'input[aria-label*="search" i]',
        '[data-testid*="search"]',
      ],
    },
  ],

  // ─── Forms ────────────────────────────────────────────────────────────────
  textInput: [
    {
      selectors: [
        'input[type="text"]',
        'input:not([type])',
        'textarea',
        '[contenteditable="true"]',
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// TASK PLANNER - Expanded for more use cases
// ═══════════════════════════════════════════════════════════════════════════

class TaskPlanner {
  static planTask(goal: string, url: string): TaskStep[] {
    const goalLower = goal.toLowerCase();
    const steps: TaskStep[] = [];

    // ─── Google Login Flow ────────────────────────────────────────────────
    if (
      goalLower.includes('login with google') ||
      goalLower.includes('sign in with google')
    ) {
      // First, try to find and click login button to open modal
      if (!goalLower.includes('already logged in')) {
        steps.push({
          type: 'click',
          description: 'Click main login/sign in button',
          pattern: 'loginButton',
        });

        steps.push({
          type: 'wait',
          description: 'Wait for login modal to appear',
          waitMs: 1500,
        });
      }

      steps.push({
        type: 'click',
        description: 'Click Google OAuth button',
        pattern: 'googleLogin',
      });

      const emailMatch = goal.match(/email[:\s]+([^\s]+@[^\s]+)/i);
      if (emailMatch) {
        steps.push({
          type: 'wait',
          description: 'Wait for Google OAuth redirect',
          waitMs: 3000,
        });

        steps.push({
          type: 'type',
          description: 'Enter email in Google login',
          pattern: 'emailInput',
          text: emailMatch[1],
        });

        steps.push({
          type: 'click',
          description: 'Click next/continue',
          pattern: 'submitButton',
        });
      }

      return steps;
    }

    // ─── Search Flow ──────────────────────────────────────────────────────
    if (goalLower.includes('search for')) {
      const searchMatch = goal.match(
        /search for[:\s]+["']?([^"']+?)["']?(?:\s|$)/i,
      );
      if (searchMatch) {
        steps.push({
          type: 'click',
          description: 'Click search input',
          pattern: 'searchInput',
        });

        steps.push({
          type: 'type',
          description: `Search for: ${searchMatch[1]}`,
          pattern: 'searchInput',
          text: searchMatch[1].trim(),
        });

        return steps;
      }
    }

    // ─── Regular Login Flow ───────────────────────────────────────────────
    if (goalLower.includes('login') || goalLower.includes('sign in')) {
      const emailMatch = goal.match(/email[:\s]+([^\s]+@[^\s]+)/i);
      const passwordMatch = goal.match(/password[:\s]+([^\s]+)/i);

      if (emailMatch && passwordMatch) {
        steps.push({
          type: 'type',
          description: 'Enter email',
          pattern: 'emailInput',
          text: emailMatch[1],
        });

        steps.push({
          type: 'type',
          description: 'Enter password',
          pattern: 'passwordInput',
          text: passwordMatch[1],
        });

        steps.push({
          type: 'click',
          description: 'Click submit',
          pattern: 'submitButton',
        });

        return steps;
      }
    }

    // ─── Accept Cookies ───────────────────────────────────────────────────
    if (
      goalLower.includes('accept cookies') ||
      goalLower.includes('dismiss cookie')
    ) {
      steps.push({
        type: 'click',
        description: 'Accept cookies',
        pattern: 'acceptCookies',
      });

      return steps;
    }

    // ─── Close Modal/Popup ────────────────────────────────────────────────
    if (
      goalLower.includes('close modal') ||
      goalLower.includes('close popup')
    ) {
      steps.push({
        type: 'click',
        description: 'Close modal',
        pattern: 'closeModal',
      });

      return steps;
    }

    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ROBUST BOT SERVICE
// ═══════════════════════════════════════════════════════════════════════════

@Injectable()
export class JobBotService {
  private readonly INTERACTIVE_SELECTORS = [
    'button',
    'input',
    'a[href]',
    'textarea',
    'select',
    '[role="button"]',
    '[role="searchbox"]',
    '[role="textbox"]',
    '[role="combobox"]',
    '[contenteditable="true"]',
    '[data-testid*="search"]',
    '[data-testid*="input"]',
    '[data-testid*="button"]',
    '[data-testid*="login"]',
  ].join(', ');

  constructor(private llmService: LlmService) {
    playwrightChromium.use(StealthPlugin());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MAIN ENTRY POINT
  // ═══════════════════════════════════════════════════════════════════════════

  async browserNode(url: string, highLevelGoal: string): Promise<void> {
    const browser = await playwrightChromium.launch({
      headless: false,
      slowMo: 300,
      channel: 'chrome',
    });

    const page: Page = await browser.newPage();

    // Block heavy resources
    await page.route('**/*', async (route) => {
      const resourceType = route.request().resourceType();
      if (['image', 'font', 'media'].includes(resourceType)) {
        await route.abort();
      } else {
        await route.continue();
      }
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log(`\n🌐 Navigated to: ${url}`);
      console.log(`🎯 Goal: ${highLevelGoal}\n`);

      // Wait for initial page load
      await page.waitForTimeout(2000);

      // ─── Try deterministic plan first ───────────────────────────────────
      const plan = TaskPlanner.planTask(highLevelGoal, url);

      if (plan.length > 0) {
        console.log('📋 Using deterministic plan:');
        plan.forEach((step, i) =>
          console.log(`   ${i + 1}. ${step.description}`),
        );

        const success = await this.executePlan(page, plan);

        if (success) {
          console.log('\n✅ Goal achieved via deterministic plan!');
          return;
        }

        console.log('\n⚠️  Plan failed, falling back to LLM...\n');
      } else {
        console.log('📋 No deterministic plan available, using LLM...\n');
      }

      // ─── Fallback to LLM ────────────────────────────────────────────────
      await this.llmGuidedNavigation(page, highLevelGoal);
    } catch (error) {
      console.error('❌ Automation failed:', error);
    } finally {
      // await browser.close();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DETERMINISTIC PLAN EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  private async executePlan(page: Page, steps: TaskStep[]): Promise<boolean> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      console.log(`\n📍 Step ${i + 1}/${steps.length}: ${step.description}`);

      try {
        switch (step.type) {
          case 'wait':
            await page.waitForTimeout(step.waitMs || 1000);
            console.log(`   ⏳ Waited ${step.waitMs}ms`);
            break;

          case 'navigate':
            if (step.url) {
              await page.goto(step.url, { waitUntil: 'domcontentloaded' });
              console.log(`   🔄 Navigated to ${step.url}`);
            }
            break;

          case 'click': {
            const locator = await this.findByPattern(page, step.pattern!, 3); // 3 retries
            if (!locator) {
              console.error(`   ❌ Pattern not found: ${step.pattern}`);
              return false;
            }

            await this.safeClick(page, locator);
            console.log(`   ✅ Clicked successfully`);

            // Extra wait after click for modals/popups
            await page.waitForTimeout(1500);
            break;
          }

          case 'type': {
            const locator = await this.findByPattern(page, step.pattern!, 3);
            if (!locator || !step.text) {
              console.error(`   ❌ Pattern not found: ${step.pattern}`);
              return false;
            }

            await this.safeType(page, locator, step.text);
            console.log(`   ✅ Typed successfully`);
            break;
          }
        }
      } catch (error) {
        console.error(`   ❌ Step failed:`, error);
        return false;
      }
    }

    return true;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PATTERN MATCHING with RETRIES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Find element by pattern with automatic retries.
   * Waits for DOM to stabilize between retries.
   */
  private async findByPattern(
    page: Page,
    patternName: string,
    maxRetries: number = 3,
  ): Promise<Locator | null> {
    const pattern = UI_PATTERNS[patternName] as PatternDefinition[] | undefined;
    if (!pattern) {
      console.warn(`⚠️  Unknown pattern: ${patternName}`);
      return null;
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (attempt > 1) {
        console.log(`   🔄 Retry ${attempt}/${maxRetries}...`);
        await page.waitForTimeout(1000); // Wait for DOM to stabilize
      }

      // Try each pattern definition
      for (const def of pattern) {
        // Try direct selectors first
        if (def.selectors) {
          for (const selector of def.selectors) {
            try {
              const locator = page.locator(selector).first();

              // Wait briefly for element to appear
              await locator
                .waitFor({ state: 'attached', timeout: 2000 })
                .catch(() => {});

              const count = await locator.count();
              if (count > 0) {
                const isVisible = await locator.isVisible().catch(() => false);
                if (isVisible) {
                  console.log(`   🎯 Found via selector: ${selector}`);
                  return locator;
                }
              }
            } catch {
              continue;
            }
          }
        }

        // Try keyword-based search
        if (def.keywords) {
          for (const keyword of def.keywords) {
            try {
              const locator = page.getByText(keyword, { exact: false }).first();

              await locator
                .waitFor({ state: 'attached', timeout: 2000 })
                .catch(() => {});

              const count = await locator.count();
              if (count > 0) {
                const isVisible = await locator.isVisible().catch(() => false);
                if (isVisible) {
                  console.log(`   🎯 Found via keyword: "${keyword}"`);
                  return locator;
                }
              }
            } catch {
              continue;
            }
          }
        }
      }
    }

    console.log(
      `   ❌ Pattern "${patternName}" not found after ${maxRetries} attempts`,
    );
    return null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAFE CLICK - Handles dynamic elements
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Safely clicks an element with proper waiting and error handling.
   */
  private async safeClick(page: Page, locator: Locator): Promise<void> {
    // Scroll into view
    await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
    await page.waitForTimeout(300);

    // Wait for element to be stable (not animating)
    await locator.waitFor({ state: 'visible', timeout: 5000 });

    // Try normal click first
    try {
      await locator.click({ timeout: 5000 });
    } catch (error) {
      console.log(`   ⚠️  Normal click failed, trying force click...`);
      logWarning('      Click error', error);
      // Fallback to force click
      await locator.click({ force: true, timeout: 5000 });
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAFE TYPE - Handles input fields
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Safely types into an input with proper clearing and submission.
   */
  private async safeType(
    page: Page,
    locator: Locator,
    text: string,
  ): Promise<void> {
    await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
    await page.waitForTimeout(300);

    await locator.waitFor({ state: 'visible', timeout: 5000 });

    // Click to focus
    await locator.click({ timeout: 5000 });
    await page.waitForTimeout(200);

    // Clear existing content
    await locator.clear({ timeout: 5000 });
    await page.waitForTimeout(200);

    // Type new content
    await locator.fill(text, { timeout: 5000 });
    await page.waitForTimeout(300);

    // Try to submit (some forms need Enter)
    try {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
    } catch {
      // Enter might not be needed
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM-GUIDED NAVIGATION (Improved)
  // ═══════════════════════════════════════════════════════════════════════════

  private async llmGuidedNavigation(page: Page, goal: string): Promise<void> {
    let stepCount = 0;
    const maxSteps = 10;
    const actionHistory: number[] = [];
    const maxRepeatDetection = 3;

    while (stepCount < maxSteps) {
      console.log(`\n🤖 LLM Step ${stepCount + 1}/${maxSteps} [${page.url()}]`);

      // ─── RE-TAG elements fresh every time ─────────────────────────────
      // This ensures IDs are current even if DOM changed
      await this.reTagElements(page);
      await page.waitForTimeout(500); // Let tags stabilize

      // ─── Get fresh element list ───────────────────────────────────────
      const elements = await this.getVisibleInteractiveElements(page);
      console.log(`   📊 Found ${elements.length} interactive elements`);

      if (elements.length === 0) {
        console.log('   ⏳ No elements, waiting for page to load...');
        await page.waitForTimeout(2500);
        stepCount++;
        continue;
      }

      // ─── Get LLM decision ──────────────────────────────────────────────
      const decision = await this.getAgentDecision(
        elements,
        goal,
        page.url(),
        actionHistory,
      );

      if (decision.action === 'SUCCESS') {
        console.log('\n✅ Goal achieved!');
        break;
      }

      if (decision.action === 'ERROR') {
        console.error(`\n❌ Error: ${decision.reason}`);
        break;
      }

      // ─── Track history for loop detection ──────────────────────────────
      if (decision.id !== null) {
        actionHistory.push(decision.id);
        if (actionHistory.length > 6) actionHistory.shift();

        const lastN = actionHistory.slice(-maxRepeatDetection);
        const allSame =
          lastN.length === maxRepeatDetection &&
          lastN.every((id) => id === decision.id);

        if (allSame) {
          console.error(
            `\n❌ Stuck: Same element [${decision.id}] clicked ${maxRepeatDetection} times`,
          );
          break;
        }
      }

      // ─── Execute action with PROPER error handling ─────────────────────
      const urlBefore = page.url();

      try {
        await this.performActionRobust(page, decision);
        console.log(`   ✅ Action completed`);
      } catch (error) {
        logWarning('   ⚠️  Action failed', error);
        // Don't break - continue to next step
      }

      // ─── Wait for page to settle ───────────────────────────────────────
      await this.waitAfterAction(page, urlBefore);

      stepCount++;
    }

    if (stepCount >= maxSteps) {
      console.log('\n⚠️  Reached maximum steps');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ROBUST ACTION EXECUTION
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Performs action with proper retrying and element re-detection.
   * KEY FIX: Re-tags elements BEFORE each retry attempt.
   */
  private async performActionRobust(
    page: Page,
    decision: AgentDecision,
  ): Promise<void> {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // ─── RE-TAG before each attempt (CRITICAL FIX) ────────────────
        if (attempt > 1) {
          console.log(`   🔄 Re-tagging elements for retry ${attempt}...`);
          await this.reTagElements(page);
          await page.waitForTimeout(500);
        }

        const selector = `[data-bot-id="${decision.id}"]`;
        const locator = page.locator(selector).first();

        // ─── Verify element exists ────────────────────────────────────
        const count = await locator.count();
        if (count === 0) {
          throw new Error(`Element [${decision.id}] not found in DOM`);
        }

        // ─── Scroll and wait ──────────────────────────────────────────
        await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
        await page.waitForTimeout(300);

        // ─── Wait for visibility ──────────────────────────────────────
        await locator.waitFor({ state: 'visible', timeout: 5000 });

        // ─── Perform action ───────────────────────────────────────────
        if (decision.action === 'CLICK') {
          console.log(`   🖱️  Clicking [${decision.id}]`);
          await this.safeClick(page, locator);
          return; // Success!
        }

        if (decision.action === 'TYPE') {
          if (!decision.text) throw new Error('TYPE action missing text');
          console.log(`   ⌨️  Typing "${decision.text}" into [${decision.id}]`);
          await this.safeType(page, locator, decision.text);
          return; // Success!
        }
      } catch (error) {
        logRetryError(attempt, maxAttempts, error);

        if (attempt < maxAttempts) {
          // Wait longer between retries
          await page.waitForTimeout(1000 * attempt);
        } else {
          // Final attempt failed
          throw wrapError(
            error,
            `All ${maxAttempts} attempts failed for [${decision.id}]`,
          );
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ELEMENT DETECTION & TAGGING
  // ═══════════════════════════════════════════════════════════════════════════

  private async getVisibleInteractiveElements(
    page: Page,
  ): Promise<InteractiveElement[]> {
    return await page.evaluate((selectors) => {
      const elements = document.querySelectorAll(selectors);
      const unique = [...new Set(Array.from(elements))];

      return unique
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);

          // More lenient visibility check
          const isVisible =
            rect.width > 0 &&
            rect.height > 0 &&
            rect.top < window.innerHeight + 500 && // Increased range
            rect.bottom > -200 && // Increased range
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            parseFloat(style.opacity) > 0.1; // Allow slightly transparent

          return isVisible;
        })
        .map((el, index) => {
          el.setAttribute('data-bot-id', index.toString());

          return {
            botId: index,
            tag: el.tagName.toLowerCase(),
            text: (el.textContent?.trim() || '').substring(0, 60),
            placeholder: (el as HTMLInputElement).placeholder || '',
            ariaLabel: el.getAttribute('aria-label') || '',
            role: el.getAttribute('role') || '',
            className: (el.getAttribute('class') || '').substring(0, 80),
            type: (el as HTMLInputElement).type || '',
            href: (el as HTMLAnchorElement).href || '',
          };
        });
    }, this.INTERACTIVE_SELECTORS);
  }

  private async reTagElements(page: Page): Promise<void> {
    await page.evaluate((selectors) => {
      const elements = document.querySelectorAll(selectors);
      const unique = [...new Set(Array.from(elements))];

      unique
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            rect.top < window.innerHeight + 500 &&
            rect.bottom > -200 &&
            style.visibility !== 'hidden' &&
            style.display !== 'none' &&
            parseFloat(style.opacity) > 0.1
          );
        })
        .forEach((el, index) => {
          el.setAttribute('data-bot-id', index.toString());
        });
    }, this.INTERACTIVE_SELECTORS);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LLM INTERACTION
  // ═══════════════════════════════════════════════════════════════════════════

  private async getAgentDecision(
    elements: InteractiveElement[],
    goal: string,
    currentUrl: string,
    actionHistory: number[],
  ): Promise<AgentDecision> {
    const elementContext = elements
      .map((el) => {
        const parts = [`ID:${el.botId}`, `Tag:${el.tag}`];
        if (el.text) parts.push(`Text:"${el.text}"`);
        if (el.placeholder) parts.push(`Placeholder:"${el.placeholder}"`);
        if (el.type) parts.push(`Type:"${el.type}"`);
        if (el.role) parts.push(`Role:"${el.role}"`);
        if (el.ariaLabel) parts.push(`Aria:"${el.ariaLabel}"`);
        if (el.className)
          parts.push(`Class:"${el.className.substring(0, 40)}"`);
        return parts.join(' | ');
      })
      .join('\n');

    const prompt = getDecisionPrompt(
      goal,
      currentUrl,
      elementContext,
      actionHistory,
    );
    const response = await this.llmService.LLM.invoke(prompt);

    const content =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    const match = content.match(/\{[\s\S]*?\}/s);
    if (!match) {
      console.error('Raw LLM Response:', content);
      throw new Error('Failed to extract JSON from LLM response');
    }

    let jsonStr = match[0];
    jsonStr = jsonStr.replace(/"\[[\w_]+\]"/g, 'null');
    jsonStr = jsonStr.replace(/\[[\w_]+\]/g, 'null');

    try {
      const parsed = JSON.parse(jsonStr) as AgentDecision;

      if (
        parsed.id === null &&
        (parsed.action === 'CLICK' || parsed.action === 'TYPE')
      ) {
        throw new Error('LLM returned null id for CLICK/TYPE');
      }

      console.log(`   💭 Thought: ${parsed.thought}`);
      console.log(
        `   🎬 Action: ${parsed.action}${parsed.id !== null ? ` [${parsed.id}]` : ''}`,
      );

      return parsed;
    } catch (error) {
      console.error('Parse failed. Raw:', jsonStr);
      throw new Error(`JSON parse error: ${error}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SMART WAITING
  // ═══════════════════════════════════════════════════════════════════════════

  private async waitAfterAction(page: Page, urlBefore: string): Promise<void> {
    await page.waitForTimeout(800);

    try {
      const urlAfter = page.url();

      if (urlAfter !== urlBefore) {
        console.log(`   🔄 Navigation: ${urlBefore} → ${urlAfter}`);
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

        try {
          await page.waitForLoadState('networkidle', { timeout: 8000 });
        } catch {
          console.log('   ⏳ Network still active...');
        }
      } else {
        // No navigation - wait for any dynamic content
        try {
          await page.waitForLoadState('networkidle', { timeout: 3000 });
        } catch {
          await page.waitForTimeout(1500);
        }
      }
    } catch (error) {
      console.warn('   ⚠️  Wait error, using fallback');
      logWarning('      Wait error details', error);
      await page.waitForTimeout(2000);
    }
  }
}
