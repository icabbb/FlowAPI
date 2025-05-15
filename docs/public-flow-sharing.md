# Compartir Flujos Públicamente

Esta documentación explica cómo utilizar la función de enlaces públicos para compartir flujos en modo de solo lectura con personas que no tienen una cuenta en la plataforma.

## Características principales

- **Enlaces de sólo lectura**: Los flujos compartidos son de solo lectura, lo que significa que los destinatarios pueden ver el flujo pero no pueden editarlo.
- **No requiere inicio de sesión**: Los enlaces públicos son accesibles para cualquier persona con la URL, sin necesidad de iniciar sesión.
- **Expiración configurable**: Puedes establecer una fecha de caducidad para los enlaces compartidos o hacerlos permanentes.
- **Estadísticas de acceso**: Puedes ver cuántas veces se ha accedido a un flujo compartido.
- **Desactivación de enlaces**: Puedes desactivar los enlaces compartidos en cualquier momento.

## Cómo compartir un flujo

### Desde la barra de herramientas principal

1. Carga el flujo que deseas compartir.
2. Haz clic en el botón **Share** en la barra de herramientas.
3. En el diálogo de compartir, puedes:
   - Elegir si el enlace expira o no
   - Si eliges que expire, establece una fecha de caducidad
4. Haz clic en **Create Share Link**.
5. Se generará un enlace público que puedes copiar y compartir.

### Desde el administrador de flujos

1. Abre el administrador de flujos haciendo clic en **Manage Flows**.
2. Carga el flujo que deseas compartir.
3. Haz clic en el botón **Share Current** en el panel de acciones.
4. Sigue los mismos pasos que en la sección anterior para configurar y crear el enlace.

## Gestionar enlaces compartidos

En la pestaña **Manage Shares** del diálogo de compartir, puedes:

1. Ver todos los enlaces compartidos activos para tus flujos.
2. Ver cuántas veces se ha accedido a cada enlace.
3. Copiar los enlaces existentes.
4. Desactivar enlaces que ya no deseas que sean accesibles.

## Visualización de flujos compartidos

Cuando alguien accede a un enlace compartido:

1. Se le presenta una vista de solo lectura del flujo.
2. Pueden ver el nombre y la descripción del flujo.
3. Pueden interactuar con el lienzo (zoom, panorámica) pero no pueden editar los nodos ni las conexiones.
4. Tienen la opción de exportar el flujo como un archivo JSON.

## Consideraciones de seguridad

- Los enlaces compartidos no exponen tu cuenta de usuario ni tus credenciales.
- Solo se comparten los datos del flujo seleccionado, no otros flujos ni datos sensibles.
- No se exponen variables de entorno ni secretos.
- Puedes desactivar un enlace compartido en cualquier momento.
- Los enlaces pueden configurarse para expirar automáticamente.

## Limitaciones

- No es posible hacer ediciones en la vista compartida.
- Los destinatarios no pueden guardar cambios en el flujo compartido.
- No hay opción para compartir con permisos de edición (por el momento).
- No hay notificaciones cuando alguien accede a un flujo compartido.

## Solución de problemas

- **El enlace dice "Flujo no encontrado"**: Es posible que el enlace haya expirado o haya sido desactivado.
- **Errores al crear enlaces**: Asegúrate de estar autenticado y de que el flujo se haya guardado previamente.
- **Recuento de accesos no actualizado**: El recuento de accesos se actualiza cuando se accede al flujo, pero puede haber un retraso en la actualización de la interfaz. 