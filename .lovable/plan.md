## Internacionalización profesional ES/EN con react-i18next

### Resumen del alcance

ScorpionFlow tiene ~30 páginas y ~80 componentes con miles de strings en español hardcodeados. Una traducción 100% completa y natural en una sola pasada implica tocar prácticamente todo el código de UI. Para mantener calidad (inglés SaaS B2B natural, sin mezclas) y evitar romper módulos críticos (auth, MP, suscripciones, exporters), propongo el siguiente enfoque por fases.

### Fase 1 — Infraestructura i18n (esta entrega)

1. Instalar `i18next`, `react-i18next`, `i18next-browser-languagedetector`.
2. Crear:
   - `src/i18n/index.ts` — configuración con detector, fallback `es`, persistencia en `localStorage` con clave `scorpionflow_language`.
   - `src/i18n/locales/es.json` y `en.json` — estructura por namespaces: `common`, `auth`, `landing`, `sidebar`, `dashboard`, `clients`, `quotations`, `projects`, `team`, `resources`, `reports`, `risks`, `settings`, `help`, `toasts`, `errors`.
3. Importar `./i18n` en `src/main.tsx`.
4. Crear componente reutilizable `<LanguageSwitcher />` (variantes `compact` para navbar/auth y `full` para sidebar/settings).
5. Insertar el selector en:
   - Landing navbar
   - `AuthLayout` (visible en Login/Register/Forgot/Reset)
   - Sidebar (footer, junto a Configuración) y Settings page

### Fase 2 — Traducción de páginas públicas y core (esta entrega)

Reemplazar strings por `t("...")` en:
- `LandingPage`
- `LoginPage`, `RegisterPage`, `ForgotPasswordPage`, `ResetPasswordPage`, `AuthLayout`
- `AppSidebar`, `TopBar`, breadcrumbs
- `Dashboard` / `Index`
- `SettingsPage`
- `LearnCenterPage`

Inglés escrito naturalmente para SaaS B2B (no literal). Marcas (ScorpionFlow, Business, Founder Access, Pro) se mantienen.

### Fase 3 — Módulos de negocio (entrega siguiente, mismo PR si entra en presupuesto)

- Clientes, Cotizaciones, Proyectos (incluye workspace y tabs), Equipo
- Recursos, Informes, Riesgos
- Modales, formularios, badges, estados vacíos, toasts y errores compartidos (`humanize-error.ts`, `PageStates`, etc.)

> **Nota importante**: Los exporters PDF/Excel y los emails transaccionales (edge functions) **no** se internacionalizan en este PR salvo que lo pidas explícitamente — son sistemas separados que requieren su propia estrategia (idioma del usuario en BD, plantillas duplicadas, etc.).

### Validación

- `tsc --noEmit` limpio
- Cambio ES→EN re-renderiza todas las pantallas tocadas sin mezcla
- `localStorage.scorpionflow_language` persiste tras refresh
- No se rompe Auth, Mercado Pago, RLS, navegación

### Pregunta clave antes de ejecutar

Dado el tamaño real (50+ archivos, ~1500+ strings), confírmame:

**A)** Hago **todo en un solo turno** (Fases 1+2+3 completas, será una entrega muy grande, mayor riesgo de regresiones menores en textos secundarios).

**B)** Hago **Fases 1+2 ahora** (infra sólida + landing/auth/sidebar/dashboard/settings/help 100% bilingües y selector funcional) y dejo Fase 3 para el siguiente turno con cambios más enfocados y revisables.

Recomiendo **B** para calidad SaaS real. ¿Apruebas B o prefieres A?