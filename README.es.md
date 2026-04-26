# 🏥 ProceTurn AI - Sistema de Gestión Hospitalaria (API & Core)

**ProceTurn AI** es el resultado de un proyecto final integrador desarrollado bajo metodologías ágiles, diseñado para simular un entorno de trabajo real. El sistema provee una solución completa para la gestión de clínicas y hospitales, centrándose en el procesamiento eficiente de datos, la automatización de flujos mediante IA y la escalabilidad del Backend.

---

## 🏗️ Descripción y Arquitectura

El core del proyecto está estructurado en una arquitectura cliente-servidor, donde el enfoque principal radica en una API RESTful robusta y un esquema de base de datos relacional optimizado, acompañados por un dashboard administrativo en React.

### Arquitectura Backend & Data (Core)
- **Framework Principal:** Python con Flask.
- **Base de Datos:** PostgreSQL para persistencia de datos relacionales.
- **ORM & Migraciones:** SQLAlchemy y Flask-Migrate (Alembic) para el modelado de datos y control de versiones del esquema.
- **Seguridad y Autenticación:** Flask-JWT-Extended para la protección de rutas y manejo de sesiones.
- **Integraciones de Terceros:** Integración de endpoints para servicios de mensajería externa (WhatsApp vía Twilio) y un motor de IA para la sugerencia inteligente y prellenado de turnos médicos en base al historial del chat.
- **Estructura de Datos (SQL):** El esquema está altamente normalizado para garantizar la integridad referencial. Incluye entidades como:
  - `User`, `Patient` (Gestión de perfiles y seguridad).
  - `Appointment`, `Procedure`, `Specialty`, `ProcedureAvailability` (Lógica de turnos, agendas y bloqueos de horarios).
  - `Message`, `Notification`, `AISuggestion` (Historial de comunicaciones, notificaciones asíncronas e integraciones con IA).

### Arquitectura Frontend (Mención Secundaria)
- **Tecnología:** React + Vite.
- **Objetivo:** Consumir de manera eficiente la API RESTful para proveer un dashboard interactivo de gestión (calendario, chat en tiempo real, administración de pacientes y turnos).

---

## 👨‍💻 Mis Aportes y Rol en el Equipo

Mi participación en el equipo estuvo fuertemente orientada al área de Backend Development, asumiendo la responsabilidad sobre la lógica de la información, el diseño de la API y la automatización de procesos. 

**Responsabilidades Clave y Logros:**
- **Lógica de Negocio en Backend:** Desarrollé endpoints críticos para el flujo conversacional y la generación de turnos médicos. Implementé el backend para las **AI Suggestions**, diseñando la lógica que analiza interacciones y sugiere turnos de manera inteligente.
- **Seguridad de Endpoints:** Me aseguré de que el acceso a las rutas críticas y el manejo de los payloads del sistema de usuarios y notificaciones cumplieran con las validaciones correspondientes y los estándares de acceso.
- **Adaptabilidad y Resolución Frontend:** Ante bloqueos y cuellos de botella en la entrega del producto, demostré adaptabilidad asumiendo el rol de desarrollador Frontend en **React**. Construí componentes clave como la vista de Chat interactivo (integrando librerías especializadas) y programé la lógica de parámetros en la URL (`NewAppointment.jsx`) para que la interfaz se comunicara de forma transparente con el motor de IA del backend, garantizando así la entrega de la funcionalidad a tiempo.

---

## 🚀 Despliegue Local

A continuación, se detallan los pasos exactos para levantar el entorno de desarrollo localmente, basados en los archivos de dependencias del proyecto.

### Requisitos Previos
- Python 3.8+
- Node.js 20.0.0+
- PostgreSQL

### 1. Configuración del Backend (Python/Flask)
Ubicarse en el directorio raíz del proyecto. El entorno utiliza `pipenv` para la gestión de paquetes:

```bash
# 1. Instalar dependencias del proyecto

pipenv install

# 2. Configurar variables de entorno
# 💡 Nota sobre la Base de Datos:
# - Por defecto (sin configuración adicional), el sistema utilizará SQLite localmente.
# - Si deseas correrlo en PostgreSQL, simplemente define la variable en tu .env:
#   DATABASE_URL="postgresql://usuario:password@localhost:5432/nombre_db"

cp .env.example .env

# 3. Migrar la base de datos

pipenv run upgrade

# 4. Levantar el servidor Flask
# La API quedará escuchando en http://localhost:3001

pipenv run start
```

### 2. Configuración del Frontend (React/Vite)
Abrir una nueva terminal en el directorio raíz del proyecto:

```bash
# 1. Instalar las dependencias de Node.js

npm install

# 2. Levantar el servidor de desarrollo de Vite
# El entorno local de desarrollo de React estará disponible en el puerto indicado (por ej. http://localhost:5173)

npm run dev
```

---

## 👥 Equipo / Contribuyentes

- Laureano Gonzalez - Fullstack Developer | [LinkedIn] | [GitHub]
- [@Drokko-Dev](https://github.com/Drokko-Dev) - Jaime Vega
- [@VicenteCastroIb](https://github.com/VicenteCastroIb) - Vicente Castro
- [@Fragoz22](https://github.com/Fragoz22) - Francisco M. Gómez

