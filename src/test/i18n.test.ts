import { describe, expect, it } from "vitest";
import { languages, matchLanguage } from "@/lib/i18n";
describe("i18n", () => {
  it("supports 39 languages", () => expect(languages).toHaveLength(39));
  it("picks the region language", () => { expect(matchLanguage(["pt-BR"])).toBe("pt"); expect(matchLanguage(["zh-TW"])).toBe("zh-TW"); });
  it("falls back to English", () => expect(matchLanguage(["xx"])).toBe("en"));
});
