import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Rutas que no requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', 
  '/sign-up(.*)', 
  '/',
  '/api/public-flow(.*)', // Mantener acceso público a las API de flujos compartidos
  '/share(.*)', // Mantener acceso público a las vistas de flujos compartidos
])

// Rutas que deben ser protegidas pero necesitan un manejo especial
const protectedApiRoutes = [
  '/api/*',
  '/api/library/flows'
]

export default clerkMiddleware(async (auth, req) => {
  const path = new URL(req.url).pathname;

  // Si la ruta es pública, permitirla sin autenticación
  if (isPublicRoute(req)) {
    return;
  }

  // Proteger todas las demás rutas
  await auth.protect();
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}