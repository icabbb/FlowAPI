This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Aplicación de gestión de flujos

## Integración Context7 con Clerk y Supabase

Esta aplicación incluye una integración completa entre [Clerk](https://clerk.dev/) para autenticación y [Supabase](https://supabase.io/) para el almacenamiento de datos, utilizando el patrón Context7 para una gestión eficiente de los tokens JWT.

### Configuración

1. Añade el proveedor Context7 cerca de la raíz de tu aplicación, típicamente en `src/app/layout.tsx`:

```tsx
import { Context7Provider } from '@/components/auth/context7-provider';

// ...

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>
          <Context7Provider>
            {children}
          </Context7Provider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

2. Asegúrate de que la migración SQL para la tabla `profiles` está ejecutada en tu base de datos Supabase.

### Uso en componentes

Para usar Context7 en un componente:

```tsx
'use client';

import { useSession } from '@clerk/nextjs';
import { ensureValidToken, createContext7Client } from '@/utils/context7';

export function MyComponent() {
  const { isLoaded, isSignedIn } = useSession();
  
  const handleSaveData = async () => {
    if (!isLoaded || !isSignedIn) return;
    
    // Asegurar que tenemos un token válido
    await ensureValidToken();
    
    // Crear un cliente con el token actual
    const supabase = createContext7Client();
    if (!supabase) {
      ('No se pudo crear el cliente Supabase');
      return;
    }
    
    // Usar el cliente para operaciones con la base de datos
    const { data, error } = await supabase
      .from('mi_tabla')
      .select('*');
      
    // ...
  };
  
  return (
    // ...
  );
}
```

### Uso con stores de Zustand

Para integrar Context7 con un store de Zustand:

```tsx
import { useContext7Store } from '@/hooks/use-context7-store';
import { useMyStore } from '@/store/my-store';

export function MyComponent() {
  // Envolver el store con Context7
  const store = useContext7Store(useMyStore);
  
  // Seleccionar valores del estado
  const value = store.select(s => s.value);
  
  // Seleccionar acciones (automáticamente se asegura token válido)
  const saveValue = store.select(s => s.saveValue);
  
  const handleSave = async () => {
    try {
      // La acción saveValue automáticamente validará el token JWT
      await saveValue(123);
    } catch (error) {
      ('Error al guardar:', error);
    }
  };
  
  // También puedes envolver tus propias funciones
  const handleCustomAction = async () => {
    await store.withValidToken(async () => {
      // Este código se ejecutará con un token válido
      const { data } = await fetch('/api/data');
      // ...
    });
  };
  
  return (
    // ...
  );
}
```

### Migración SQL

Para que el sistema funcione correctamente, ejecuta la migración SQL proporcionada en la carpeta `src/migrations/`:

- `profiles.sql`: Crea la tabla `profiles` y configura políticas RLS
- `flow_collaborators.sql`: Configura las tablas y políticas para colaboración en tiempo real

Estas migraciones utilizan el patrón de verificación de ID desde la tabla `profiles` en lugar de extraer directamente del JWT.
