# Asistente Virtual de El Corte Inglés (Web + API)

Este repositorio contiene el **frontend web del Asistente Virtual de El Corte Inglés**, desarrollado con **Next.js 14**, **React**, **TypeScript** y **TailwindCSS**.  
El proyecto se comunica con una **API desplegada en AWS Lambda (contenedor)** que integra un motor de similitud **Annoy (Approximate Nearest Neighbors)** para generar recomendaciones de productos en tiempo real.

El despliegue de este frontend se realiza mediante **AWS Amplify**.

---

## Arquitectura del proyecto

**Frontend (este repositorio)**  
- Framework: [Next.js 14](https://nextjs.org/)
- Lenguaje: TypeScript
- UI: React + TailwindCSS + Lucide Icons
- Hosting: AWS Amplify
- Comunicación con la API mediante `fetch` autenticado con JWT

**Backend (API en AWS Lambda)**  
- Desarrollada en Python (FastAPI)
- Desplegada como contenedor Lambda sin API Gateway
- Incluye:
  - Módulo Annoy para recomendaciones por similitud
  - Endpoints `/products/similar`, `/products/filter`, `/customers/{id}`
  - Autenticación con `/auth/token`
  - Conexión a base de datos PostgreSQL en AWS RDS

---

## Estructura del proyecto

```
app/
├── api/llm/                      # Endpoints locales para LLM
│   ├── route.ts                  # Clasificador de intenciones
│   ├── product-description/route.ts
│   ├── search-recommendation/route.ts
│   ├── welcome-message/route.ts
│   ├── handlers/                 # Módulos auxiliares (saludos, fallbacks)
│
├── components/                   # Interfaz React
│   ├── Chat.tsx                  # Lógica principal del chatbot
│   ├── Message.tsx               # Renderizado de mensajes
│   ├── ProductCard.tsx           # Ficha de producto (expandible)
│   ├── SimilarProductsCarousel.tsx
│   ├── InputBox.tsx
│   ├── TypingIndicator.tsx
│
├── lib/                          # Lógica cliente (API + tipos)
│   ├── api/                      # Conexión con API AWS
│   │   ├── auth.ts
│   │   ├── client.ts
│   │   ├── products.ts
│   │   ├── llm.ts
│   ├── types/                    # Tipos compartidos (Product, Customer, Chat)
│
├── hooks/                        # Hooks personalizados
│   └── useDarkMode.ts
│
├── test/                         # Páginas auxiliares de diagnóstico
│   ├── system/                   # /test/system: health y base de datos
│   ├── product/                  # /test/product/* para endpoints individuales
│   ├── customer/                 # /test/customer/[id]
│
├── globals.css                   # Estilos globales y animaciones
├── layout.tsx                    # Layout principal
└── page.tsx                      # Página de inicio (Chat)
```

---

## Variables de entorno

En el entorno de **AWS Amplify** o local (`.env.local`):

```bash
NEXT_PUBLIC_API_URL=https://<tu-endpoint-lambda>
NEXT_PUBLIC_API_USER=<usuario_api>
NEXT_PUBLIC_API_PASSWORD=<password_api>
OPENAI_API_KEY=<clave_openai>
MODEL=gpt-4o-mini
NEXT_PUBLIC_DEBUG=false
```

---

## Ejecución local

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear archivo `.env.local` con las variables de entorno anteriores.

3. Ejecutar en modo desarrollo:
   ```bash
   npm run dev
   ```

4. Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

---

## Despliegue en AWS Amplify

El proyecto está configurado para despliegue continuo desde GitHub.  
Amplify detecta automáticamente la app Next.js y construye el entorno con:

```bash
npm ci
npm run build
npm run export
```

El `OPENAI_API_KEY` y las credenciales de la API se gestionan desde el apartado **Environment Variables** del entorno Amplify.

---

## Endpoints API principales (AWS Lambda)

| Método | Endpoint | Descripción |
|--------|-----------|-------------|
| `POST` | `/auth/token` | Devuelve token JWT |
| `GET`  | `/products/single/{id}` | Devuelve un producto |
| `GET`  | `/products/similar/{id}` | Recomendaciones Annoy |
| `GET`  | `/products/filter` | Filtro dinámico por atributos |
| `GET`  | `/products/values/{col}` | Valores únicos de columna |
| `GET`  | `/customers/{id}` | Devuelve cliente y productos asociados |
| `GET`  | `/health` | Estado general del sistema |
| `GET`  | `/db/health` | Estado de la base de datos |

---

## Inteligencia Artificial integrada

El asistente usa **modelos de OpenAI (GPT-4.1)** para:

- Clasificación de intenciones (`/api/llm`)
- Saludos personalizados (`/api/llm/auth-greeting`, `/api/llm/welcome-message`)
- Descripciones de productos (`/api/llm/product-description`)
- Búsqueda inteligente por texto (`/api/llm/search-recommendation`)

Todos los prompts están diseñados en español y orientados al contexto **retail**.

---

## Flujo conversacional principal

1. **Inicio** → mensaje de bienvenida generado por LLM.  
2. **Usuario escribe:**
   - “Soy el cliente 12345” → identificación + saludo + recomendaciones.  
   - “Buscar zapatillas rojas” → búsqueda semántica + carrusel de productos.  
3. **El sistema:**
   - Genera texto explicativo con OpenAI.  
   - Enriquece cada producto con descripción generada.  
   - Muestra tarjetas visuales y carruseles interactivos.  
4. **Modo oscuro** disponible con persistencia local.

---

## Módulo Annoy (en API Lambda)

El backend emplea **Annoy (Approximate Nearest Neighbors)** para calcular productos similares de forma eficiente.

**Características:**
- Índices precalculados en memoria.  
- Distancia coseno para similitud entre embeddings de productos.  
- Respuesta optimizada con score de similitud y exclusión del producto base.

---

## Stack tecnológico completo

| Capa | Tecnología |
|------|-------------|
| **Frontend** | Next.js 14, React, TailwindCSS |
| **Backend** | FastAPI (Python) |
| **Recomendaciones** | Annoy (Nearest Neighbors) |
| **LLM** | OpenAI GPT-4.1 |
| **Auth** | JWT con `/auth/token` |
| **DB** | PostgreSQL en AWS RDS |
| **Infraestructura** | AWS Lambda (contenedor), AWS Amplify |

---

## Contexto académico

Proyecto desarrollado como parte del  
**Máster en Analítica de Datos en Marketing Digital (Universidad de Alcalá - CEURA)**,  
dentro del **Trabajo Fin de Máster: “Análisis predictivo de comportamiento del consumidor a través del análisis de datos”**.

---

## Autores

**Grupo 3 - Marketing Online**

- Antonio Andreu González  
- Miguel Ángel Comino Matas  
- Dolores Manchado Miguel  
- Ana María Torres González  

Universidad de Alcalá · CEURA · 2025

---

## Licencia

Proyecto académico.  
Todos los derechos reservados a los autores y a la Universidad de Alcalá.
