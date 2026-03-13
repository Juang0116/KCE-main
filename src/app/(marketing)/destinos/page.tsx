// src/app/(marketing)/destinos/page.tsx
// Spanish alias → canonical /destinations

import { redirect } from 'next/navigation';

export default function DestinosRedirect() {
  redirect('/destinations');
}
