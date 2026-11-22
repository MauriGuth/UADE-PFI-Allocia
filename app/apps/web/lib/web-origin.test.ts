import { expect, test } from "vitest";
import { allowedWebOrigin } from "./web-origin";
test("Custom and fallback domains require exact allowlisted origins", () => {
 const allowed="https://allocia.com.ar,https://allocia-two.vercel.app";
 expect(allowedWebOrigin("https://allocia.com.ar",allowed)).toBe(true);
 expect(allowedWebOrigin("https://allocia-two.vercel.app",allowed)).toBe(true);
 for(const origin of [null,"null","https://evil.test","https://allocia.com.ar.evil.test","https://allocia.com.ar/path","https://allocia.com.ar/","http://allocia.com.ar","https://user@allocia.com.ar"])
  expect(allowedWebOrigin(origin,allowed)).toBe(false);
 expect(allowedWebOrigin("https://allocia.com.ar","")).toBe(false);
});
