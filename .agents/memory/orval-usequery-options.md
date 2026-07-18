---
name: Orval UseQueryOptions queryKey required
description: Orval-generated hooks type the query option as UseQueryOptions which requires queryKey in React Query v5, causing TS errors when only passing enabled.
---

Orval generates hooks with signature `options?: { query?: UseQueryOptions<...>, request?: ... }`. In `@tanstack/react-query` v5 + `@tanstack/query-core@5.100.9`, `UseQueryOptions` has `queryKey` as required. This means `{ enabled: !isNaN(id) }` causes TS2741 ("queryKey missing").

**Why:** The Orval template uses `UseQueryOptions` directly instead of `Omit<UseQueryOptions, 'queryKey' | 'queryFn'>`.

**How to apply:** Fix with `as any` on the options object. The hook internally generates the correct `queryKey` so this is safe:
```typescript
useGetSomeThing(id, {
  query: { enabled: !isNaN(id) } as any,
});
```
Do not use `as Parameters<typeof useGetSomeThing>[1]` — TypeScript resolves that back to the same constrained type.
