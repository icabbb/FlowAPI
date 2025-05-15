# Vista compartida de flujos (Shared Flow View)

Este directorio contiene los componentes necesarios para la vista de flujos compartidos, que permite a los usuarios visualizar flujos públicos compartidos sin necesidad de iniciar sesión.

## Características principales

- **Modo de solo lectura**: Los flujos se muestran sin posibilidad de edición o guardar cambios
- **Seguimiento de visitas**: Registra automáticamente cuando un flujo es visitado
- **Exportación**: Permite a los usuarios descargar el flujo en formato JSON
- **Exploración completa**: Los usuarios pueden navegar por el gráfico, seleccionar nodos y ver detalles
- **Simulación**: Pueden ejecutar simulaciones de nodos individuales para entender su funcionamiento

## Estructura de archivos

- **[shareId]/page.tsx**: Punto de entrada principal que carga los datos del flujo compartido
- **[shareId]/access-tracker.tsx**: Componente invisible que registra las visitas al flujo
- **[shareId]/shared-flow-view.tsx**: Componente principal que define la estructura de la página
- **[shareId]/shared-sidebar.tsx**: Panel lateral con información del flujo y nodos disponibles
- **[shareId]/shared-flow-canvas.tsx**: Lienzo de ReactFlow que muestra el gráfico en modo lectura
- **[shareId]/shared-node-panel.tsx**: Panel de configuración para ver detalles de los nodos seleccionados

## Principios de diseño

1. **Independencia de componentes**: Los componentes de la vista compartida no modifican los componentes originales
2. **Consistencia visual**: La interfaz mantiene la misma estructura y apariencia que el dashboard principal
3. **Seguridad**: No se exponen funcionalidades de edición ni datos sensibles
4. **Rendimiento**: Optimizado para cargar rápidamente, incluso con gráficos complejos
5. **Compatibilidad**: Funciona correctamente en dispositivos móviles y de escritorio

## Flujo de datos

1. El usuario visita `/share/[shareId]`
2. `page.tsx` carga los datos del flujo desde la API utilizando `getPublicFlow`
3. Los datos del flujo se pasan a `shared-flow-view.tsx`
4. El componente `access-tracker.tsx` registra la visita en la base de datos
5. El usuario puede interactuar con el flujo de manera limitada (zoom, selección, etc.)

## Registro de accesos

El componente `access-tracker.tsx` intenta dos métodos para registrar las visitas:

1. **Método regular**: Utiliza `/api/public-flow/[shareId]/access` que depende de triggers en la base de datos
2. **Método directo**: Si el primero falla, intenta `/api/public-flow/[shareId]/direct-access` que actualiza directamente la base de datos

## Pruebas

Para probar esta funcionalidad:

1. Crea un flujo en el dashboard principal
2. Comparte el flujo para obtener un ID de compartición
3. Visita `/share/[ID-compartido]` para ver el flujo compartido
4. Verifica que el contador de visitas se incremente correctamente
5. Prueba la exportación y que los nodos se muestren correctamente

## Solución de problemas

- **El flujo no carga**: Verifica que el ID de compartición sea válido y el flujo esté marcado como público
- **El contador de visitas no funciona**: Comprueba las políticas RLS en Supabase para la tabla `public_flow_shares`
- **Error "Flow not found"**: El flujo puede haber sido eliminado o no ser accesible públicamente
- **Problemas con la simulación**: Verifica que las variables de entorno para APIs externas estén configuradas correctamente 