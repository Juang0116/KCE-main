Sprint 27: mobile menu auth rail stabilized

What changed
- Replaced the moving auth area in the mobile drawer with a stable 2x2 auth rail.
- The top account block now keeps the same layout whether the user is signed out or signed in.
- Removed the extra mobile AuthMenu card below the sticky account block to stop vertical shifting.

UX result
- "Iniciar sesión" no longer jumps around after auth state resolves.
- Signed-in state swaps actions inside the same fixed slots instead of inserting a new card.
- Quick access remains visible in mobile vertical.
