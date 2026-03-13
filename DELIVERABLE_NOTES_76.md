# Deliverable 76

- Removed stale `InternationalGrowthDeck` reference from `src/app/(marketing)/tours/page.tsx` to fix Next.js type-check/build error.
- Tours page now goes directly from pagination to `FeaturedReviews`, keeping public catalog cleaner and avoiding internal-growth deck leakage.
