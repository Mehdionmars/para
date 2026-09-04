import { describe, expect, it } from "vitest";

import { draftReducer } from "@/components/dashboard/storefront/StorefrontBuilder";

/**
 * The Storefront Builder's edit/undo/redo transition.
 *
 * Worth testing on its own because the four panels now share it: Home runs it
 * with `record: true`, Navigation, Theme and Site Chrome with `record: false`,
 * and a regression here would show up as lost edits rather than as a crash.
 *
 * The last two cases pin the behaviour that the previous ref-based
 * implementation got wrong.
 */

type Doc = { title: string };

const start = (title = "a") => ({ draft: { title }, past: [{ title }], cursor: 0 });
const set = (value: Doc | ((prev: Doc) => Doc), record = true) => ({ type: "set" as const, value, record });

describe("draftReducer", () => {
  it("records an edit and advances the cursor", () => {
    const s = draftReducer(start(), set({ title: "b" }));
    expect(s.draft).toEqual({ title: "b" });
    expect(s.past.map((d) => d.title)).toEqual(["a", "b"]);
    expect(s.cursor).toBe(1);
  });

  it("accepts an updater function, like a useState setter", () => {
    const s = draftReducer(start(), set((prev) => ({ title: prev.title + "!" })));
    expect(s.draft).toEqual({ title: "a!" });
  });

  it("leaves the stack alone when history is off", () => {
    const s = draftReducer(start(), set({ title: "b" }, false));
    expect(s.draft).toEqual({ title: "b" });
    expect(s.past).toHaveLength(1);
    expect(s.cursor).toBe(0);
  });

  it("treats an unchanged draft as a no-op", () => {
    const before = start();
    expect(draftReducer(before, set(before.draft))).toBe(before);
  });

  it("walks back and forward", () => {
    let s = draftReducer(start(), set({ title: "b" }));
    s = draftReducer(s, set({ title: "c" }));

    s = draftReducer(s, { type: "undo" });
    expect(s.draft).toEqual({ title: "b" });
    s = draftReducer(s, { type: "undo" });
    expect(s.draft).toEqual({ title: "a" });

    s = draftReducer(s, { type: "redo" });
    expect(s.draft).toEqual({ title: "b" });
  });

  it("stops at both ends", () => {
    const first = start();
    expect(draftReducer(first, { type: "undo" })).toBe(first);
    expect(draftReducer(first, { type: "redo" })).toBe(first);
  });

  it("drops the redo tail once you edit after undoing", () => {
    let s = draftReducer(start(), set({ title: "b" }));
    s = draftReducer(s, set({ title: "c" }));
    s = draftReducer(s, { type: "undo" });
    s = draftReducer(s, set({ title: "d" }));

    expect(s.past.map((d) => d.title)).toEqual(["a", "b", "d"]);
    expect(s.cursor).toBe(2);
    expect(draftReducer(s, { type: "redo" })).toBe(s);
  });

  it("forgets the stack when a discard restores the published document", () => {
    let s = draftReducer(start(), set({ title: "b" }));
    s = draftReducer(s, { type: "reset", value: { title: "published" } });

    expect(s.draft).toEqual({ title: "published" });
    expect(s.past).toHaveLength(1);
    expect(s.cursor).toBe(0);
    expect(draftReducer(s, { type: "undo" })).toBe(s);
  });

  it("records both edits when two land in the same batch", () => {
    // Each dispatch derives its entry from the state it was handed, so edits
    // that land before a render stack up rather than collapsing into one.
    // Pinned because getting it wrong costs an undo step silently.
    let s = start();
    s = draftReducer(s, set((prev) => ({ title: prev.title + "b" })));
    s = draftReducer(s, set((prev) => ({ title: prev.title + "c" })));

    expect(s.draft).toEqual({ title: "abc" });
    expect(s.past.map((d) => d.title)).toEqual(["a", "ab", "abc"]);
    expect(draftReducer(s, { type: "undo" }).draft).toEqual({ title: "ab" });
  });
});
