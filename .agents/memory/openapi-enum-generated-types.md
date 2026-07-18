---
name: OpenAPI enum and generated types
description: Removing values from an OpenAPI enum causes TS errors in code that compared against the old values, requiring a cast for legacy runtime compatibility.
---

When you remove enum values from an OpenAPI spec (e.g. removing "jarvis" from the personality enum), Orval regenerates tighter TypeScript union types. Any existing code that compared against the removed values (e.g. `settings.personality === "jarvis"`) will get a TS2367 "no overlap" error.

**Why:** The generated type becomes `"omni" | "custom"` and TypeScript correctly flags comparisons against impossible values.

**How to apply:** For legacy DB values that may still exist at runtime, cast to `string` before comparing:
```typescript
(["jarvis", "friday", "friday_v2"] as string[]).includes(settings.personality as string) ? "omni" : settings.personality
```
For type casts in mutation payloads, simplify from the old full union to the new clean one:
```typescript
// Before: form.personality as "omni" | "jarvis" | "friday" | "friday_v2" | "custom"
// After:  form.personality as "omni" | "custom"
```
