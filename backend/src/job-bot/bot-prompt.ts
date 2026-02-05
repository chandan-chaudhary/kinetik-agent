// ############################## 1st times (OWN CREATED) ###############################

// export const getSelectorPrompt = (
//   goal: string,
//   compactElements: any,
// ): string => {
//   return `
//     You are a browser automation controller.
//     GOAL: ${goal}

//     ELEMENTS LIST:
//     ${compactElements}

//     INSTRUCTIONS:
//     - Respond ONLY with the ID number of the best element.
//     - If NO matching element exists in this list, respond with "NONE".
//     - DO NOT EXPLAIN.

//     ID:`;
// };

// export const getDecisionPrompt = (
//   goal: string,
//   currentUrl: string,
//   elementContext: any,
// ): string => {
//   return `
//   ULTIMATE GOAL: ${goal}

//   STRATEGY RULES:
//   1. If an INPUT or SEARCHBOX is visible, use it IMMEDIATELY. Do not click buttons if an input exists.
//   2. If you see an element with placeholder like "Search", "Symbol", or "Find", that is your target.
//   3. Avoid clicking the same ID twice in a row.
//   4. The "id" field MUST be an actual NUMBER from the elements list, not a placeholder.

//   ELEMENTS:
//   ${elementContext}

//   YOUR TASK:
//   Analyze the elements and decide the next action.

//   RESPONSE FORMAT - Return ONLY valid JSON:
//   {
//     "thought": "string explaining your reasoning",
//     "action": "CLICK" | "TYPE" | "SUCCESS" | "ERROR",
//     "id": 5,
//     "text": "bitcoin",
//     "reason": "optional error reason"
//   }

//   IMPORTANT:
//   - "id" must be an actual number from the elements list above
//   - "action" must be one of: CLICK, TYPE, SUCCESS, ERROR
//   - If typing, include "text" field with what to type
//   - Return ONLY the JSON object, nothing else`;
//   //   return `
//   //     ULTIMATE GOAL: ${goal}
//   //     CURRENT URL: ${currentUrl}

//   // CRITICAL OBSERVATION:
//   //   If you previously clicked a button and now a new INPUT or MODAL has appeared,
//   //   DO NOT click the button again. Switch your focus to the new INPUT.

//   //     VISIBLE ELEMENTS:
//   //     ${elementContext}

//   //     YOUR TASK:
//   //     Look at the elements and decide the NEXT SINGLE STEP to reach the goal.
//   //     - If you see a search icon and no input, CLICK the icon.
//   //     - If you see an input field, TYPE the search term.
//   //     - If you see the results you wanted, return SUCCESS.

//   //     RESPONSE FORMAT (JSON ONLY):
//   //     {
//   //       "thought": "I see a search button but no input, so I need to click the button first.",
//   //       "action": "CLICK" | "TYPE" | "SUCCESS" | "ERROR",
//   //       "id": number | null,
//   //       "text": "string (only if typing)",
//   //       "reason": "string (only if error)"
//   //     }
//   //     `;
// };

// ############################## 2nd times ###############################
// export const getSelectorPrompt = (
//   goal: string,
//   compactElements: string,
// ): string => {
//   return `
// You are a browser automation controller.
// GOAL: ${goal}

// ELEMENTS LIST:
// ${compactElements}

// INSTRUCTIONS:
// - Respond ONLY with the ID number of the best matching element.
// - If NO matching element exists in this list, respond with "NONE".
// - DO NOT EXPLAIN. Just the number or NONE.

// ID:`;
// };

// export const getDecisionPrompt = (
//   goal: string,
//   currentUrl: string,
//   elementContext: string,
//   lastClickedId: number | null,
// ): string => {
//   return `
// You are a browser automation agent. Your job is to reach the ULTIMATE GOAL by interacting with the page one step at a time.

// ULTIMATE GOAL: ${goal}
// CURRENT URL: ${currentUrl}
// LAST CLICKED ELEMENT ID: ${lastClickedId ?? 'none'}

// ─── STRATEGY RULES ───
// 1. If you see an INPUT, SEARCHBOX, TEXTBOX, or COMBOBOX, use it IMMEDIATELY. Do not click other buttons if a typeable field is already visible.
// 2. If an element has a placeholder like "Search", "Symbol", "Find", or "ISIN", that is almost certainly your target — TYPE into it.
// 3. DO NOT click the same element ID twice in a row (last clicked: ${lastClickedId ?? 'none'}). If you just clicked something and nothing changed, look for a different element.
// 4. If you see search RESULTS that match the goal, return SUCCESS.
// 5. The "id" field in your response MUST be an actual number from the ELEMENTS list below. Never invent an ID.

// ─── VISIBLE ELEMENTS ───
// ${elementContext}

// ─── YOUR TASK ───
// Look at the elements above. Decide the ONE next action to take.

// - If you see a typeable input → action should be TYPE
// - If you need to open something first (like a search panel) → action should be CLICK
// - If the goal is already achieved on screen → action should be SUCCESS
// - If you are completely stuck and nothing makes sense → action should be ERROR

// ─── RESPONSE FORMAT ───
// Return ONLY a valid JSON object. No extra text, no markdown, no explanation outside the JSON.

// {
//   "thought": "One sentence explaining why you chose this action.",
//   "action": "CLICK or TYPE or SUCCESS or ERROR",
//   "id": <actual number from elements list>,
//   "text": "only include this if action is TYPE — the value to type",
//   "reason": "only include this if action is ERROR — why you gave up"
// }`;
// };

// ############################## 3nd times ###############################

// export const getSelectorPrompt = (
//   goal: string,
//   compactElements: string,
// ): string => {
//   return `
// You are a browser automation controller.
// GOAL: ${goal}

// ELEMENTS LIST:
// ${compactElements}

// INSTRUCTIONS:
// - Respond ONLY with the ID number of the best matching element.
// - If NO matching element exists in this list, respond with "NONE".
// - DO NOT EXPLAIN. Just the number or NONE.

// ID:`;
// };

// export const getDecisionPrompt = (
//   goal: string,
//   currentUrl: string,
//   elementContext: string,
//   actionHistory: number[],
// ): string => {
//   return `
// You are a browser automation agent. Reach the ULTIMATE GOAL by interacting with the page one step at a time.

// ═══════════════════════════════════════════════
// ULTIMATE GOAL: ${goal}
// CURRENT URL:   ${currentUrl}
// ═══════════════════════════════════════════════

// PREVIOUS ACTIONS (IDs you already clicked/typed, in order):
// ${actionHistory.length > 0 ? actionHistory.join(' → ') : 'none yet'}

// ─── CRITICAL RULES (read every one) ──────────────

// 1. CHECK THE URL FIRST.
//    If the goal mentions a symbol/keyword and that word already appears in the
//    current URL, the goal is ALREADY DONE. Return SUCCESS immediately.
//    Example: goal is "search for NIFTY" and URL contains "symbol=NIFTY" → SUCCESS.

// 2. NEVER click an ID that appears 2+ times in your PREVIOUS ACTIONS list above.
//    It already failed. Clicking it again will loop forever.
//    Pick a DIFFERENT element or return ERROR.

// 3. If you see ANY of these, TYPE into it immediately — do not click other things:
//    - An <input> element (any type)
//    - Any element with placeholder containing: search, symbol, find, query, ticker
//    - Any element with role="searchbox", role="textbox", role="combobox"
//    - Any element with class containing "search"
//    These ARE your target. Do not skip them.

// 4. If you clicked something and NOTHING changed (no new input appeared), it was
//    the wrong element. Look for alternatives.

// 5. "id" MUST be an actual number from the ELEMENTS list. Never invent one.

// ─── VISIBLE ELEMENTS ─────────────────────────────
// ${elementContext}

// ─── YOUR TASK ────────────────────────────────────
// Pick the ONE best next action. Think step by step:
//   a) Is the goal already done based on the URL? → SUCCESS
//   b) Is there a typeable input visible right now? → TYPE into it
//   c) Is there something to click to REVEAL an input? → CLICK it
//      (but NOT if you already clicked it before — check PREVIOUS ACTIONS)
//   d) Nothing makes sense? → ERROR

// ─── RESPONSE ─────────────────────────────────────
// Return ONLY valid JSON. Nothing else.

// {
//   "thought": "One sentence: why you chose this.",
//   "action": "CLICK | TYPE | SUCCESS | ERROR",
//   "id": <number from elements list, or null if SUCCESS/ERROR>,
//   "text": "<only if TYPE — the value to type>",
//   "reason": "<only if ERROR — why>"
// }`;
// };

// ############################## 4th times ###############################
/**
 * Optimized prompts for browser automation bot.
 * These prompts are designed to:
 * 1. Be concise (reduce token usage)
 * 2. Guide LLM to make better decisions
 * 3. Handle edge cases effectively
 */

export function getDecisionPrompt(
  goal: string,
  currentUrl: string,
  elementContext: string,
  actionHistory: number[],
): string {
  // Build action history context (what we've already tried)
  const historyContext =
    actionHistory.length > 0
      ? `\n\nACTION HISTORY (recent attempts):\n${actionHistory.map((id, i) => `${i + 1}. Interacted with ID:${id}`).join('\n')}`
      : '';

  return `You are a browser automation agent. Your goal: ${goal}

CURRENT PAGE: ${currentUrl}

AVAILABLE ELEMENTS:
${elementContext}
${historyContext}

RULES:
1. If goal is achieved, return {"action": "SUCCESS", "thought": "...", "id": null}
2. If stuck or goal impossible, return {"action": "ERROR", "reason": "...", "id": null, "thought": "..."}
3. To click: {"action": "CLICK", "id": <number>, "thought": "..."}
4. To type: {"action": "TYPE", "id": <number>, "text": "...", "thought": "..."}
5. AVOID repeating same actions - check HISTORY
6. Prefer elements with clear labels/text
7. For OAuth/login flows, look for "Continue with Google", "Sign in", etc.
8. If you see a search input but goal isn't search-related, IGNORE it

IMPORTANT:
- Return ONLY valid JSON, no markdown, no backticks
- "id" must be a number from the list above
- "thought" should explain WHY you chose this action
- If element not found, return ERROR, don't guess

Respond with JSON:`;
}

/**
 * Legacy selector prompt (if still needed for backward compatibility)
 */
export function getSelectorPrompt(
  goal: string,
  elementContext: string,
): string {
  return `Find the element that matches this goal: "${goal}"

Elements:
${elementContext}

Return ONLY the botId number of the best match. If no match, return -1.`;
}

/**
 * Specialized prompt for when bot is stuck (provides more guidance)
 */
export function getRecoveryPrompt(
  goal: string,
  currentUrl: string,
  elementContext: string,
  stuckReason: string,
): string {
  return `RECOVERY MODE - Bot is stuck.

GOAL: ${goal}
CURRENT PAGE: ${currentUrl}
STUCK REASON: ${stuckReason}

ELEMENTS:
${elementContext}

Analyze the situation:
1. Is the goal actually impossible on this page?
2. Are we on the right page?
3. Is there an alternative path to the goal?
4. Should we look for different element types?

Respond with JSON:
- If truly stuck: {"action": "ERROR", "reason": "...", "id": null, "thought": "..."}
- If found alternative: {"action": "CLICK" or "TYPE", "id": <number>, "text": "...", "thought": "..."}

JSON:`;
}
