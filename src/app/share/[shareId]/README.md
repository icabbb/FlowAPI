# Estilos Cartoon en la Vista Compartida

Este directorio contiene los componentes para la vista compartida de flujos, estilizados con un tema "cartoon" que proporciona una apariencia más atractiva y consistente.

## Descripción de Estilos

El estilo "cartoon" aplicado a los componentes de la vista compartida presenta las siguientes características:

1. **Bordes redondeados y pronunciados**: Radios de borde más amplios y bordes más gruesos
2. **Paleta de colores vibrante**: Uso de azules y contrastes más fuertes
3. **Sombras suaves**: Para dar profundidad sin sobrecargar la interfaz
4. **Diseño más lúdico**: Combinación de elementos estilizados y funcionales
5. **Adaptación al modo oscuro**: Optimización especial para modo oscuro con tonos de azul

## Componentes Estilizados

### SharedFlowView
- Contenedor principal con clase `dark-cartoon` en modo oscuro
- Header con bordes y fondos personalizados
- Estilos de botones redondeados con bordes más gruesos
- Panel de 3 columnas con bordes estilizados

### SharedSidebar
- Sección lateral con clase `dark-cartoon-sidebar`
- Pestañas con bordes redondeados y efectos de hover
- Información del flujo con estilos mejorados
- Lista de nodos con iconos específicos por tipo

### SharedFlowCanvas
- Fondo de puntos con tamaño y espaciado personalizados
- Controles con clase `dark-cartoon-controls`
- Minimapa con clase `dark-cartoon-minimap`
- Nodos seleccionables pero no editables

### SharedNodePanel
- Panel de configuración con clase `dark-cartoon-panel`
- Pestañas con fondos y bordes personalizados
- Badges con estilos específicos para estados (éxito, error, etc.)
- Botón de simulación con bordes gruesos y efecto hover

## Clases CSS Principales

```css
.dark-cartoon {
  /* Estilos generales para el tema cartoon en modo oscuro */
}

.dark-cartoon-sidebar {
  /* Estilos para el panel lateral */
}

.dark-cartoon-panel {
  /* Estilos para el panel de configuración */
}

.dark-cartoon-header {
  /* Estilos para el encabezado */
}

.dark-cartoon-controls {
  /* Estilos para los controles de ReactFlow */
}

.dark-cartoon-minimap {
  /* Estilos para el minimapa */
}
```

## Estrategia de Estilos

1. **Uso de tailwindcss**: Se utilizan clases utilitarias de Tailwind CSS
2. **Función `cn()`**: Combinación condicional de clases basada en el tema
3. **Hook `useTheme()`**: Detección del tema actual (claro u oscuro)
4. **Variables CSS**: Utilización de variables CSS para colores y tamaños consistentes
5. **Estilos específicos para componentes**: Cada componente tiene sus propios estilos personalizados

## Ventajas

- **Consistencia visual**: Todos los componentes siguen el mismo estilo
- **Mejor experiencia de usuario**: La interfaz es más atractiva y fácil de usar
- **Adaptabilidad**: Funciona bien tanto en modo claro como oscuro
- **Mantenibilidad**: Los estilos están agrupados y son fáciles de modificar
- **Rendimiento**: Los estilos son eficientes y no afectan al rendimiento

## Directrices para Futuras Modificaciones

1. Mantener la coherencia visual con los estilos existentes
2. Utilizar la función `cn()` para combinar clases condicionales
3. Comprobar siempre que los cambios se vean bien en ambos temas
4. Utilizar las clases prefijadas con `dark-cartoon-` para mantener la consistencia
5. Documentar cualquier nueva clase o modificación en este README 