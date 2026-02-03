declare module 'playwright-extra' {
  import type {
    BrowserType,
    ChromiumBrowser,
    FirefoxBrowser,
    WebKitBrowser,
  } from 'playwright';

  export type PlaywrightExtraPlugin = any;

  export interface PlaywrightExtraClass<T = any> extends BrowserType<T> {
    use(plugin: PlaywrightExtraPlugin): this;
  }

  export const chromium: PlaywrightExtraClass<ChromiumBrowser>;
  export const firefox: PlaywrightExtraClass<FirefoxBrowser>;
  export const webkit: PlaywrightExtraClass<WebKitBrowser>;
}

declare module 'puppeteer-extra-plugin-stealth' {
  const StealthPlugin: () => any;
  export default StealthPlugin;
}
