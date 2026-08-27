export type Lang = "es" | "en";

export const LANGS: Lang[] = ["es", "en"];

// Each entry maps a translation key to its Spanish / English string.
// Spanish strings must match the original UI exactly.
const dict = {
  // ── Language selector ──────────────────────────────────────────────
  langSelectorLabel: { es: "Idioma", en: "Language" },
  langSpanish: { es: "Español", en: "Spanish" },
  langEnglish: { es: "Inglés", en: "English" },

  // ── Auth nav (auth-nav.tsx) ────────────────────────────────────────
  authSignIn: { es: "Iniciar sesión", en: "Sign in" },
  authSignUp: { es: "Crear cuenta", en: "Sign up" },
  authSignOut: { es: "Cerrar sesión", en: "Sign out" },
  profileMenuPlan: { es: "Tu plan", en: "Your plan" },
  profileMenuPlanView: { es: "Ver o mejorar tu plan", en: "View or upgrade your plan" },
  profileMenuSecurity: { es: "Seguridad de la cuenta", en: "Account security" },
  profileMenuSecurityHint: { es: "Contraseña y verificación en dos pasos", en: "Password and two-step verification" },
  profilePlanAdmin: { es: "Administrador", en: "Administrator" },
  profilePlanFounder: { es: "Fundador (gratis)", en: "Founder (free)" },
  profilePlanTrial: { es: "Prueba gratis", en: "Free trial" },
  profilePlanActive: { es: "Suscripción activa", en: "Active subscription" },
  profilePlanNone: { es: "Sin plan activo", en: "No active plan" },
  inviteMenuItem: { es: "Invitar a un amigo", en: "Invite a friend" },
  inviteMenuHint: { es: "Comparte por texto o enlace", en: "Share by text or link" },
  inviteTitle: { es: "Invita y comparte la riqueza", en: "Invite and share the wealth" },
  inviteSubtitle: {
    es: "Envía la invitación por mensaje de texto, compártela o copia el enlace.",
    en: "Send the invite by text message, share it, or copy the link.",
  },
  inviteMessage: {
    es: "💰 Te tengo un dato de oro: estoy usando DualyStocks y me dice en segundos si una acción está de ganga o está cara, en español claro y sin jerga. Así se toman decisiones con el billete: con datos, no con corazonadas. 📈 Pruébala gratis por 7 días y empieza a poner tu dinero a trabajar:",
    en: "💰 Golden tip: I'm using DualyStocks and it tells me in seconds whether a stock is a bargain or overpriced — in plain language, no jargon. That's how you make money moves: with data, not hunches. 📈 Try it free for 7 days and put your money to work:",
  },
  inviteSms: { es: "Enviar por mensaje de texto", en: "Send by text message" },
  inviteShare: { es: "Compartir…", en: "Share…" },
  inviteCopyMessage: { es: "Copiar mensaje", en: "Copy message" },
  inviteCopyLink: { es: "Copiar enlace", en: "Copy link" },
  inviteCopied: { es: "¡Copiado!", en: "Copied!" },
  inviteCopyManual: { es: "Copia el texto manualmente:", en: "Copy the text manually:" },
  swingTitle: { es: "Movimiento típico en dólares", en: "Typical move in dollars" },
  swingPerDay: { es: "Por día", en: "Per day" },
  swingPerWeek: { es: "Por semana", en: "Per week" },
  swingPerMonth: { es: "Por mes", en: "Per month" },
  swingPctOfPrice: { es: "del precio de la acción", en: "of the stock price" },
  swingUpBefore: { es: "Sube ~", en: "Rises ~" },
  swingUpMid: { es: " en ~", en: " over ~" },
  swingDaysWord: { es: " días seguidos", en: " days in a row" },
  swingDownBefore: { es: "Baja ~", en: "Drops ~" },
  swingNote: {
    es: "Promedios del último año. No es una predicción.",
    en: "Averages from the last year. Not a prediction.",
  },
  inviteRewardNote: {
    es: "Cuando tu invitado termine su prueba gratis y pague su primera factura, tú ganas un 25% de descuento en tu próxima factura.",
    en: "When your friend finishes their free trial and pays their first bill, you earn 25% off your next bill.",
  },
  profileMenuAria: { es: "Menú de perfil", en: "Profile menu" },

  // ── Home (home.tsx) ────────────────────────────────────────────────
  homeTagline: {
    es: "Inversión clara, sin jerga. Descubre la verdadera situación financiera de cualquier empresa en segundos.",
    en: "Clear investing, no jargon. Discover the true financial situation of any company in seconds.",
  },
  homeSearchPlaceholder: {
    es: "Busca una empresa o ticker (ej. Apple, AAPL)...",
    en: "Search a company or ticker (e.g. Apple, AAPL)...",
  },
  homeSearchButton: { es: "Analizar", en: "Analyze" },
  homeIdeasCta: {
    es: "Acciones baratas con alto potencial de subida y bajo riesgo",
    en: "Cheap stocks with high upside potential and low risk",
  },
  homeScreenerDesc: {
    es: "Filtra el mercado y encuentra las mejores acciones según tus criterios.",
    en: "Screen the market and find the best stocks according to your criteria.",
  },
  homeDividendsDesc: {
    es: "Empresas sólidas que pagan dividendos consistentes y confiables.",
    en: "Solid companies paying consistent and reliable dividends.",
  },
  homeEngineBadge: { es: "Motor Algorítmico", en: "Algorithmic Engine" },

  // ── Landing (signed-out home) ──────────────────────────────────────
  landingHeroTitle: {
    es: "Invierte con claridad, sin ser experto",
    en: "Invest with clarity, no expertise needed",
  },
  landingHeroSubtitle: {
    es: "Automatizamos el análisis profesional de acciones y te lo entregamos en lenguaje sencillo: qué comprar, por qué y cuándo.",
    en: "We automate professional stock analysis and deliver it in plain language: what to buy, why, and when.",
  },
  landingCtaSignUp: { es: "Crear mi cuenta", en: "Create my account" },
  landingCtaSignIn: { es: "Ya tengo cuenta", en: "I already have an account" },
  landingWhyTitle: { es: "¿Qué hace DualyStocks por ti?", en: "What does DualyStocks do for you?" },
  landingFeature1Title: { es: "Empresas sólidas", en: "Solid companies" },
  landingFeature1Desc: {
    es: "Solo consideramos compañías de más de $500 millones: negocios establecidos que difícilmente van a quiebra.",
    en: "We only consider companies worth over $500 million: established businesses that are unlikely to go bankrupt.",
  },
  landingFeature2Title: { es: "Precio de oportunidad", en: "Opportunity pricing" },
  landingFeature2Desc: {
    es: "Buscamos acciones con más de 50% de potencial frente al precio objetivo de los analistas: compramos barato para vender bien.",
    en: "We look for stocks with 50%+ upside versus analyst price targets: buy low to sell well.",
  },
  landingFeature3Title: { es: "Los que saben, compran", en: "Insiders are buying" },
  landingFeature3Desc: {
    es: "Vigilamos a los directivos de cada empresa: si el CEO y los dueños están comprando sus propias acciones, es buena señal.",
    en: "We watch each company's executives: when the CEO and owners are buying their own stock, that's a good sign.",
  },
  landingFeature4Title: { es: "Confirmación gráfica", en: "Chart confirmation" },
  landingFeature4Desc: {
    es: "Confirmamos con el gráfico: acciones muy por debajo de su media móvil de 20 días, a precio de gallina enferma.",
    en: "We confirm with the chart: stocks trading far below their 20-day moving average, at bargain-basement prices.",
  },
  landingHowTitle: { es: "Cómo funciona", en: "How it works" },
  landingStep1Title: { es: "Crea tu cuenta", en: "Create your account" },
  landingStep1Desc: {
    es: "Regístrate en menos de un minuto y accede a la plataforma completa.",
    en: "Sign up in under a minute and access the full platform.",
  },
  landingStep2Title: { es: "Mira las recomendaciones", en: "See the recommendations" },
  landingStep2Desc: {
    es: "Nuestro motor filtra el mercado completo cada día y te muestra solo las acciones que cumplen la estrategia.",
    en: "Our engine screens the entire market daily and shows you only the stocks that meet the strategy.",
  },
  landingStep3Title: { es: "Decide con confianza", en: "Decide with confidence" },
  landingStep3Desc: {
    es: "Cada acción trae su análisis completo con veredicto claro: comprar o no comprar, a corto, mediano o largo plazo.",
    en: "Every stock comes with a full analysis and a clear verdict: buy or don't buy, for the short, medium, or long term.",
  },
  landingProofTitle: {
    es: "Análisis automatizado, resultados que funcionan",
    en: "Automated analysis, results that work",
  },
  landingProofDesc: {
    es: "Combinamos el análisis fundamental y el análisis gráfico en una estrategia probada, diseñada para que más del 95% de las señales funcionen. Tú solo miras la lista y decides.",
    en: "We combine fundamental and chart analysis into a proven strategy, designed so that over 95% of the signals work. You just look at the list and decide.",
  },
  landingFinalCtaTitle: {
    es: "Empieza a invertir con ventaja",
    en: "Start investing with an edge",
  },
  landingFinalCtaDesc: {
    es: "Únete hoy y descubre qué acciones están a buen precio ahora mismo.",
    en: "Join today and discover which stocks are at a great price right now.",
  },
  homeEngineTitle: {
    es: "Análisis inteligente a tu alcance",
    en: "Smart analysis within your reach",
  },
  homeEngineSubtitle: {
    es: "DualyStocks procesa millones de datos financieros y patrones de gráficos complejos para entregarte conclusiones claras, precisas y accionables.",
    en: "DualyStocks processes millions of financial data points and complex chart patterns to deliver clear, precise and actionable conclusions.",
  },
  homeFeatureScoreTitle: { es: "Puntaje 0-100", en: "0-100 Score" },
  homeFeatureScoreDesc: {
    es: "Calificación instantánea basada en valoración, crecimiento y salud financiera.",
    en: "Instant rating based on valuation, growth and financial health.",
  },
  homeFeatureTechnicalTitle: { es: "Lectura técnica", en: "Technical reading" },
  homeFeatureTechnicalDesc: {
    es: "Identificación automática de tendencias, soportes, resistencias y RSI en tiempo real.",
    en: "Automatic detection of trends, supports, resistances and RSI in real time.",
  },
  homeFeatureSuggestionTitle: { es: "Sugerencia de compra", en: "Buy suggestion" },
  homeFeatureSuggestionDesc: {
    es: "Veredicto claro y directo sobre cada acción, respaldado por algoritmos avanzados.",
    en: "A clear, direct verdict on every stock, backed by advanced algorithms.",
  },
  homeExploreIdeas: {
    es: "Explorar ideas de inversión",
    en: "Explore investment ideas",
  },
  homeRecentTitle: {
    es: "Análisis recientes de la comunidad",
    en: "Recent community analyses",
  },
  homeCurrentPrice: { es: "Precio actual", en: "Current price" },
  homeNoRecent: {
    es: "No hay análisis recientes todavía.",
    en: "No recent analyses yet.",
  },
  homeFooter: {
    es: "DualyStocks no ofrece asesoramiento financiero profesional. Invierte bajo tu propia responsabilidad.",
    en: "DualyStocks does not provide professional financial advice. Invest at your own risk.",
  },
  signUpDisclaimer: {
    es: "DualyStocks calcula y organiza información basada en datos de Finviz. No ofrecemos asesoramiento financiero ni nos hacemos responsables de tus decisiones de inversión. Al crear tu cuenta aceptas invertir bajo tu propia responsabilidad.",
    en: "DualyStocks calculates and organizes information based on Finviz data. We do not provide financial advice and are not responsible for your investment decisions. By creating your account you agree to invest at your own risk.",
  },
  recentNewsTitle: {
    es: "Últimas noticias que pueden afectar la acción",
    en: "Latest news that may affect this stock",
  },
  recentNewsEmpty: {
    es: "No hay noticias recientes para esta acción.",
    en: "There is no recent news for this stock.",
  },
  recentNewsReadMore: {
    es: "Leer la noticia",
    en: "Read the story",
  },
  recentNewsImpactPositive: {
    es: "Posible impacto positivo",
    en: "Possible positive impact",
  },
  recentNewsImpactNegative: {
    es: "Posible impacto negativo",
    en: "Possible negative impact",
  },
  recentNewsImpactNeutral: {
    es: "Impacto incierto o neutral",
    en: "Uncertain or neutral impact",
  },
  recentNewsImpactReasonUnavailable: {
    es: "El titular no aporta suficiente información para determinar un posible impacto.",
    en: "The headline does not provide enough information to determine a possible impact.",
  },
  recentNewsImpactDisclaimer: {
    es: "Interpretación informativa basada solo en el titular. No es una predicción ni una recomendación de compra o venta.",
    en: "Informational interpretation based only on the headline. It is not a prediction or advice to buy or sell.",
  },
  finvizPoweredBy: { es: "Impulsado por", en: "Powered by" },
  finvizSealNote: {
    es: "Nuestros análisis usan datos profesionales de Finviz® Elite, la misma fuente que usan los traders expertos.",
    en: "Our analyses use professional data from Finviz® Elite, the same source expert traders rely on.",
  },
  brokersMenuLabel: { es: "Brókers", en: "Brokers" },
  brokersStripLabel: {
    es: "Opera con las plataformas líderes",
    en: "Trade with leading platforms",
  },
  brokersTitle: {
    es: "¿Aún no tienes cuenta con un bróker?",
    en: "Don't have a broker account yet?",
  },
  brokersSubtitle: {
    es: "Para comprar y vender acciones necesitas un bróker. Estos son algunos populares:",
    en: "To buy and sell stocks you need a broker. Here are some popular ones:",
  },
  brokersDisclaimer: {
    es: "Son sitios externos. DualyStocks no tiene relación comercial con ellos.",
    en: "These are external sites. DualyStocks has no commercial relationship with them.",
  },
  logoAlt: {
    es: "DualyStocks — Markets Made Simple",
    en: "DualyStocks — Markets Made Simple",
  },

  // ── Ideas (ideas.tsx) ──────────────────────────────────────────────
  ideasBack: { es: "Volver", en: "Back" },
  sectorTrendTitle: { es: "Sectores en tendencia", en: "Trending sectors" },
  sectorTrendSubtitle: {
    es: "Qué grupos del mercado están subiendo o bajando. Un sector fuerte empuja a sus acciones.",
    en: "Which market groups are rising or falling. A strong sector lifts its stocks.",
  },
  sectorColName: { es: "Sector", en: "Sector" },
  sectorColToday: { es: "Hoy", en: "Today" },
  sectorColWeek: { es: "Semana", en: "Week" },
  sectorColMonth: { es: "Mes", en: "Month" },
  sectorColQuarter: { es: "Trimestre", en: "Quarter" },
  sectorColYtd: { es: "Este año", en: "This year" },
  sectorTrendNote: {
    es: "Ordenado por rendimiento del último mes. Datos de Finviz, se actualizan cada 30 minutos.",
    en: "Ranked by last-month performance. Finviz data, refreshed every 30 minutes.",
  },
  analysisWeightLabel: {
    es: "{pct}% del puntaje total",
    en: "{pct}% of the total score",
  },
  analysisFactorsTitle: {
    es: "Qué medimos aquí",
    en: "What we measure here",
  },
  sectorTrendError: {
    es: "No se pudieron cargar los sectores ahora mismo. Vuelve a intentarlo en un minuto.",
    en: "Couldn't load sector data right now. Try again in a minute.",
  },
  ideasTitle: { es: "Ideas de Inversión", en: "Investment Ideas" },
  ideasSubtitle: {
    es: "Acciones filtradas por nuestros modelos algorítmicos bajo criterios estrictos para inversión a mediano y largo plazo.",
    en: "Stocks filtered by our algorithmic models under strict criteria for mid- and long-term investing.",
  },
  ideasTabValue: { es: "Valor", en: "Value" },
  ideasTabDividends: { es: "Dividendos", en: "Dividends" },
  ideasTabOpportunities: { es: "Oportunidades", en: "Opportunities" },
  ideasFiltersTitle: { es: "Filtros adicionales", en: "Additional filters" },
  ideasClear: { es: "Limpiar", en: "Clear" },
  ideasCriteriaTitle: { es: "Criterios de filtro", en: "Filter criteria" },
  ideasSeeFullAnalysis: {
    es: "Ver análisis completo",
    en: "See full analysis",
  },
  ideasNoResults: {
    es: "No se encontraron acciones que cumplan estos criterios actualmente.",
    en: "No stocks currently meet these criteria.",
  },
  ideasLoadError: {
    es: "No pudimos cargar las ideas en este momento. Puede ser un problema temporal con la fuente de datos.",
    en: "We couldn't load the ideas right now. It may be a temporary issue with the data source.",
  },
  ideasRetrying: { es: "Reintentando...", en: "Retrying..." },
  ideasRetry: { es: "Reintentar", en: "Retry" },
  ideasBuy: { es: "Compra", en: "Buy" },
  ideasStrategySignal: { es: "Señal de estrategia", en: "Strategy signal" },

  // Filter labels
  filterIndex: { es: "Índice", en: "Index" },
  filterExchange: { es: "Mercado", en: "Exchange" },
  filterCap: { es: "Capitalización", en: "Market cap" },
  filterCountry: { es: "País", en: "Country" },
  filterPrice: { es: "Precio", en: "Price" },
  filterRecom: { es: "Recomendación", en: "Recommendation" },
  filterInsider: { es: "Directivos", en: "Insiders" },
  refMag7Title: { es: "Las 7 Magníficas", en: "The Magnificent 7" },
  refMag7Subtitle: { es: "Las 7 tecnológicas gigantes que mueven el mercado", en: "The 7 tech giants that move the market" },
  refMag7Desc: { es: "Las siete empresas tecnológicas más grandes de la bolsa. Toca cualquiera para ver su análisis.", en: "The seven biggest tech companies in the market. Tap any of them to see its analysis." },
  refBlocksTitle: { es: "Los bloques", en: "The blocks" },
  refBlocksSubtitle: { es: "Acciones que suelen subir y bajar juntas", en: "Stocks that usually rise and fall together" },
  refBlocksDesc: { es: "Grupos de acciones que suelen moverse en la misma dirección. Si una del grupo se mueve fuerte, fíjate en las demás. Toca cualquiera para analizarla.", en: "Groups of stocks that tend to move in the same direction. If one moves sharply, keep an eye on the others. Tap any to analyze it." },
  refDoublesTitle: { es: "Los \u00d72 (por dos)", en: "The \u00d72 (doubles)" },
  refDoublesSubtitle: { es: "Fondos que duplican el movimiento diario", en: "Funds that double the daily move" },
  refDoublesDesc: { es: "Fondos (ETFs) que se mueven el doble que su acción o índice cada día: si la acción sube 1%, estos suben ~2%. Toca cualquiera para analizarlo.", en: "ETFs that move twice as much as their stock or index each day: if the stock rises 1%, these rise ~2%. Tap any to analyze it." },
  refDoublesWarning: { es: "Ojo: duplican el movimiento de CADA DÍA, también las pérdidas. Si el precio va lateral mucho tiempo, pierden valor poco a poco. Son para movimientos cortos, no para guardar años.", en: "Careful: they double EACH DAY's move, including losses. In sideways markets they slowly lose value. They're for short-term moves, not for holding for years." },
  refOpenList: { es: "Ver la lista", en: "See the list" },

  // Admin panel
  adminTitle: { es: "Panel de administración", en: "Admin panel" },
  adminBack: { es: "Volver", en: "Back" },
  adminForbidden: {
    es: "Esta sección es solo para administradores.",
    en: "This section is for administrators only.",
  },
  adminInvitations: { es: "Invitaciones", en: "Invitations" },
  adminInvitePlaceholder: { es: "correo@ejemplo.com", en: "email@example.com" },
  adminInviteSend: { es: "Invitar", en: "Invite" },
  adminInviteHint: {
    es: "La persona recibirá un correo con un enlace para crear su cuenta.",
    en: "The person will receive an email with a link to create their account.",
  },
  adminInviteSent: { es: "Invitación enviada", en: "Invitation sent" },
  adminInviteRevoked: { es: "Invitación revocada", en: "Invitation revoked" },
  adminNoInvitations: {
    es: "Todavía no has enviado invitaciones.",
    en: "You haven't sent any invitations yet.",
  },
  adminInvitePending: { es: "Pendiente", en: "Pending" },
  adminInviteAccepted: { es: "Aceptada", en: "Accepted" },
  adminInviteRevokedBadge: { es: "Revocada", en: "Revoked" },
  adminUsers: { es: "Usuarios", en: "Users" },
  subBackHomeBtn: { es: "Volver al inicio", en: "Back to home" },
  pulseTitle: { es: "El pulso del mercado hoy", en: "Today's market pulse" },
  pulseMoodUp: { es: "El mercado sube hoy", en: "The market is up today" },
  pulseMoodDown: { es: "El mercado baja hoy", en: "The market is down today" },
  pulseMoodMixed: { es: "Día mixto en el mercado", en: "Mixed day in the market" },
  pulseLoading: { es: "Actualizando los datos del mercado…", en: "Updating market data…" },
  pulseUnavailable: {
    es: "El pulso del mercado no está disponible en este momento.",
    en: "The market pulse is unavailable right now.",
  },
  pulseDisclaimer: {
    es: "Los días rojos son normales en la bolsa. Esto es información, no un consejo de compra o venta.",
    en: "Red days are normal in the market. This is information, not advice to buy or sell.",
  },
  ratesFedTitle: { es: "Tasas y próximas decisiones de la Fed", en: "Rates and upcoming Fed decisions" },
  ratesFedLoading: { es: "Consultando fuentes oficiales…", en: "Checking official sources…" },
  ratesFedAsOf: { es: "Rendimientos al cierre del", en: "Closing yields as of" },
  ratesFedOfficialData: { es: "Datos oficiales del Tesoro", en: "Official Treasury data" },
  ratesFedTwoYear: { es: "Tesoro a 2 años", en: "2-year Treasury" },
  ratesFedTenYear: { es: "Tesoro a 10 años", en: "10-year Treasury" },
  ratesFedCurve: { es: "Curva 10–2", en: "10–2 curve" },
  ratesFedCurveHint: { es: "Diferencia entre 10 y 2 años", en: "10-year minus 2-year yield" },
  ratesFedNextDecision: { es: "Próxima decisión de la Fed", en: "Next Fed decision" },
  ratesFedPressConference: { es: "Incluye conferencia de prensa", en: "Includes a press conference" },
  ratesFedFollowing: { es: "Reuniones siguientes", en: "Following meetings" },
  ratesFedDisclaimer: {
    es: "Los rendimientos son datos diarios de cierre. Su relación con las acciones no es automática. Fuente:",
    en: "Yields are daily closing data. Their relationship with stocks is not automatic. Source:",
  },
  ratesFedFedSource: { es: "Reserva Federal", en: "Federal Reserve" },
  adminNewSignupOne: { es: "¡Alguien nuevo se registró!", en: "Someone new signed up!" },
  adminNewSignupMany: { es: "registros nuevos desde tu última visita", en: "new signups since your last visit" },
  adminNewSignupSeen: { es: "Entendido", en: "Got it" },
  adminNewBadge: { es: "Nuevo", en: "New" },
  adminSince: { es: "desde", en: "since" },
  adminAccessFree: { es: "Acceso libre", en: "Free access" },
  adminFounder: { es: "Fundador (gratis)", en: "Founder (free)" },
  trialBannerTitle: {
    es: "Prueba DualyStocks gratis por 7 días",
    en: "Try DualyStocks free for 7 days",
  },
  trialBannerSubtitle: {
    es: "Desbloquea el análisis completo y las Ideas. Cancela cuando quieras.",
    en: "Unlock full analysis and Ideas. Cancel anytime.",
  },
  trialBannerCta: { es: "Empezar prueba gratis", en: "Start free trial" },
  favTitle: { es: "Tus favoritas", en: "Your favorites" },
  favSubtitle: {
    es: "Las acciones que sigues, con su precio y cambio de hoy para ayudarte a decidir.",
    en: "The stocks you follow, with today's price and change to help you decide.",
  },
  favEmpty: {
    es: "Aún no sigues ninguna acción. Busca una y pulsa la estrella en su análisis para guardarla aquí.",
    en: "You aren't following any stocks yet. Search for one and tap the star on its analysis to save it here.",
  },
  favAdd: { es: "Seguir esta acción", en: "Follow this stock" },
  favRemove: { es: "Dejar de seguir", en: "Unfollow" },
  lastEarningsDate: { es: "Fecha de resultados anteriores", en: "Previous earnings date" },
  nextEarningsDate: { es: "Fecha de próximos resultados", en: "Next earnings date" },
  favUpside: { es: "potencial", en: "upside" },
  refInversesTitle: { es: "Los inversos", en: "The inverses" },
  refInversesSubtitle: {
    es: "ETFs que suben cuando el mercado o una acción baja.",
    en: "ETFs that rise when the market or a stock falls.",
  },
  refInversesDesc: {
    es: "Sirven para ganar (o protegerte) cuando crees que algo va a bajar: hay inversos de los índices y de acciones individuales.",
    en: "They let you profit (or protect yourself) when you think something will fall: there are inverses for indexes and for single stocks.",
  },
  refInversesWarning: {
    es: "Ojo: los inversos están pensados para plazos cortos. Si los mantienes muchos días, pierden valor poco a poco aunque el mercado no se mueva.",
    en: "Careful: inverse ETFs are meant for short time frames. Held for many days, they slowly lose value even if the market doesn't move.",
  },
  adminSubActive: { es: "Suscripción activa", en: "Active subscription" },
  adminSubNone: { es: "Sin suscripción", en: "No subscription" },
  adminUserDeleted: { es: "Usuario eliminado", en: "User deleted" },
  adminDeleteConfirm: {
    es: "¿Seguro que quieres eliminar este usuario? Perderá su cuenta y acceso.",
    en: "Are you sure you want to delete this user? They will lose their account and access.",
  },
  refBadgeList: { es: "7 acciones", en: "7 stocks" },
  refBadgeGroups: { es: "6 grupos", en: "6 groups" },
  refBadgeEtf: { es: "23 ETFs", en: "23 ETFs" },
  filterInsiderOwn: { es: "% en manos de directivos", en: "Insider ownership" },
  filterOptionable: { es: "¿Tiene opciones?", en: "Has options?" },
  filterOptionableYes: { es: "Solo con opciones", en: "Only optionable" },
  filterInsiderOwnOver30: { es: "Más del 30%", en: "Over 30%" },
  filterTargetUpside: { es: "Potencial obj.", en: "Target upside" },
  statDivYield: { es: "Div. anual", en: "Div yield" },
  statTargetPrice: { es: "P. obj.", en: "Target" },
  statUpside: { es: "Potencial", en: "Upside" },
  statChange: { es: "Cambio", en: "Change" },
  filterAll: { es: "Todos", en: "All" },
  filterAllFem: { es: "Todas", en: "All" },
  filterAny: { es: "Cualquiera", en: "Any" },
  filterUsa: { es: "Estados Unidos", en: "United States" },
  filterNotUsa: { es: "Fuera de USA", en: "Outside USA" },
  filterEurope: { es: "Europa", en: "Europe" },
  filterChina: { es: "China", en: "China" },
  filterCanada: { es: "Canadá", en: "Canada" },
  filterJapan: { es: "Japón", en: "Japan" },
  ideasTabStrategy: { es: "Mi Estrategia", en: "My Strategy" },
  filterCapOver500: { es: "> $500M", en: "> $500M" },
  filterCapOver1000: { es: "> $1.000M", en: "> $1,000M" },
  filterCapFrom500to1000: { es: "$500M - $1.000M", en: "$500M - $1,000M" },
  filterCapUnder500: { es: "< $500M", en: "< $500M" },
  filterPriceO50: { es: "Más de $50", en: "More than $50" },
  filterPriceO100: { es: "Más de $100", en: "More than $100" },
  filterPriceO150: { es: "Más de $150", en: "More than $150" },
  subTitle: {
    es: "Desbloquea todo el análisis",
    en: "Unlock the full analysis",
  },
  subSubtitle: {
    es: "Acceso completo al análisis de acciones y a las ideas de inversión que siguen tu estrategia.",
    en: "Full access to stock analysis and the investment ideas that follow your strategy.",
  },
  subTrialNote: {
    es: "Prueba gratis 7 días. Cancela cuando quieras.",
    en: "7-day free trial. Cancel anytime.",
  },
  subSuccessMsg: {
    es: "¡Listo! Tu suscripción se está activando. En unos segundos tendrás acceso completo.",
    en: "Done! Your subscription is activating. You'll have full access in a few seconds.",
  },
  subCancelledMsg: {
    es: "No se completó el pago. Puedes intentarlo de nuevo cuando quieras.",
    en: "Payment wasn't completed. You can try again whenever you like.",
  },
  subActiveTitle: {
    es: "Tu suscripción está activa",
    en: "Your subscription is active",
  },
  subActiveTrial: {
    es: "Estás en tu período de prueba gratis. Disfruta el acceso completo.",
    en: "You're in your free trial period. Enjoy full access.",
  },
  subActiveBody: {
    es: "Tienes acceso completo a DualyStocks Premium.",
    en: "You have full access to DualyStocks Premium.",
  },
  subManageBtn: {
    es: "Administrar mi suscripción",
    en: "Manage my subscription",
  },
  subBestValue: {
    es: "Mejor precio",
    en: "Best value",
  },
  subMonthlyPlan: {
    es: "Plan mensual",
    en: "Monthly plan",
  },
  subYearlyPlan: {
    es: "Plan anual",
    en: "Yearly plan",
  },
  subPerMonth: {
    es: "mes",
    en: "month",
  },
  subPerYear: {
    es: "año",
    en: "year",
  },
  subMonthlyHint: {
    es: "Flexible: paga mes a mes",
    en: "Flexible: pay month to month",
  },
  subYearlySavings: {
    es: "2 meses gratis comparado con el plan mensual",
    en: "2 months free compared to the monthly plan",
  },
  subFeature1: {
    es: "Análisis completo de cualquier acción, explicado en lenguaje claro",
    en: "Full analysis of any stock, explained in plain language",
  },
  subFeature2: {
    es: "Ideas de inversión con los criterios de la estrategia ya aplicados",
    en: "Investment ideas with the strategy criteria already applied",
  },
  subFeature3: {
    es: "Señal 'Muy barata ahora' para detectar gangas a tiempo",
    en: "'Very cheap now' signal to spot bargains in time",
  },
  subStartTrialBtn: {
    es: "Empezar prueba gratis de 7 días",
    en: "Start 7-day free trial",
  },
  subFinePrint: {
    es: "No se te cobra nada durante los 7 días de prueba. Puedes cancelar en cualquier momento desde 'Administrar mi suscripción'.",
    en: "You won't be charged during the 7-day trial. You can cancel anytime from 'Manage my subscription'.",
  },
  analysisStrategyScoreNote: {
    es: "Puntaje fundamental. Tu estrategia busca gangas: aquí un puntaje bajo es normal.",
    en: "Fundamental score. Your strategy hunts bargains: a low score here is normal.",
  },
  filterRecomStrongBuy: { es: "Compra fuerte (1, la mejor)", en: "Strong buy (1, the best)" },
  filterRecomBuyBetter: { es: "Menos de 2 (muy buena)", en: "Below 2 (very good)" },
  filterRecomHoldBetter: { es: "Menos de 3 (buena)", en: "Below 3 (good)" },
  filterRecomHoldWorse: { es: "Más de 3 (débil)", en: "Above 3 (weak)" },
  filterInsiderBuying: { es: "Comprando", en: "Buying" },
  filterInsiderSelling: { es: "Vendiendo", en: "Selling" },
  filterUpside5: { es: "+5% o más", en: "+5% or more" },
  filterUpside10: { es: "+10% o más", en: "+10% or more" },
  filterUpside20: { es: "+20% o más", en: "+20% or more" },
  filterUpside30: { es: "+30% o más", en: "+30% or more" },
  filterUpside50: { es: "+50% o más", en: "+50% or more" },

  // Recommendation labels (getRecomLabel)
  recomStrongBuy: { es: "Compra fuerte", en: "Strong buy" },
  recomBuy: { es: "Compra", en: "Buy" },
  recomHold: { es: "Mantener", en: "Hold" },
  recomSell: { es: "Venta", en: "Sell" },

  // ── Analysis (analysis.tsx) ────────────────────────────────────────
  analysisLoadingTitle: { es: "Analizando", en: "Analyzing" },
  analysisLoadingDesc: {
    es: "Recolectando datos financieros, evaluando métricas y generando el veredicto. Esto tomará unos segundos.",
    en: "Collecting financial data, evaluating metrics and generating the verdict. This will take a few seconds.",
  },
  analysisNotFoundTitle: {
    es: "No encontramos esta acción",
    en: "We couldn't find this stock",
  },
  analysisNotFoundDescBefore: {
    es: "No pudimos obtener datos para \"",
    en: "We couldn't get data for \"",
  },
  analysisNotFoundDescAfter: {
    es: "\". Verifica que el símbolo (ticker) sea correcto.",
    en: "\". Check that the symbol (ticker) is correct.",
  },
  analysisSearchOther: { es: "Buscar otra empresa", en: "Search another company" },
  analysisNewSearch: { es: "Nueva búsqueda", en: "New search" },
  analysisBack: { es: "Volver", en: "Back" },
  analysisShowDetails: { es: "Ver el análisis completo", en: "See the full analysis" },
  topPicksTitle: { es: "Las 3 elegidas de hoy", en: "Today's top 3 picks" },
  topPicksSubtitle: {
    es: "Las 3 acciones que el sistema más recomienda hoy: buen tamaño (más de $500M), buen potencial según los analistas y mejor lectura del gráfico. Se actualizan al abrir el mercado (9:30 AM, hora de Nueva York).",
    en: "The 3 stocks the system recommends most today: solid size (over $500M), strong analyst upside and the best chart reading. Refreshed at market open (9:30 AM New York time).",
  },
  topPicksUpdated: { es: "Actualizado a las", en: "Updated at" },
  topPicksSignal: { es: "Señal de estrategia", en: "Strategy signal" },
  topPicksUpside: { es: "de potencial", en: "upside" },
  topPicksSee: { es: "Ver análisis completo", en: "See full analysis" },
  topPicksError: {
    es: "No pudimos calcular las elegidas de hoy. Intenta de nuevo en unos minutos.",
    en: "We couldn't compute today's picks. Try again in a few minutes.",
  },
  topPicksNote: {
    es: "Es una guía basada en datos, no una recomendación garantizada. Revisa cada análisis antes de invertir.",
    en: "This is a data-based guide, not a guaranteed recommendation. Review each analysis before investing.",
  },
  analysisHideDetails: { es: "Ocultar los detalles", en: "Hide details" },
  analysisInvestmentIdeas: { es: "Ideas de inversión", en: "Investment ideas" },
  analysisCurrentPrice: { es: "Precio actual", en: "Current price" },
  analysisMarketCap: { es: "Cap. de mercado:", en: "Market cap:" },
  analysisGlobalScore: { es: "Puntuación Global", en: "Overall Score" },
  analysisVerdictDateBefore: {
    es: "Basado en nuestro análisis de datos de mercado recientes, actualizados al ",
    en: "Based on our analysis of recent market data, updated on ",
  },
  analysisVerdictDateAfter: { es: ".", en: "." },
  analysisKeyPoints: { es: "Puntos Clave", en: "Key Points" },
  analysisAnalystOpinion: {
    es: "Opinión de los analistas",
    en: "Analyst opinion",
  },
  analysisRecommendation: { es: "Recomendación", en: "Recommendation" },
  analysisRecomBuy: { es: "Compra recomendada", en: "Buy recommended" },
  analysisRecomNeutral: { es: "Neutral / Mantener", en: "Neutral / Hold" },
  analysisRecomNo: {
    es: "No se recomienda comprar",
    en: "Not recommended to buy",
  },
  analysisRecomHint: {
    es: "Escala de 1 (compra fuerte) a 5 (venta). Menos de 2 es bueno, entre 2 y 3 regular, más de 3 no recomendada.",
    en: "Scale from 1 (strong buy) to 5 (sell). Below 2 is good, between 2 and 3 average, above 3 not recommended.",
  },
  analysisTargetPrice: {
    es: "Precio objetivo promedio",
    en: "Average target price",
  },
  analysisPotential: { es: "de potencial", en: "potential" },
  analysisGreatPrice: { es: " — muy buen precio", en: " — great price" },
  analysisTargetHint: {
    es: "Promedio de los precios objetivo de los analistas. Un potencial de +50% o más indica una acción en muy buen precio.",
    en: "Average of analysts' target prices. A potential of +50% or more indicates a stock at a great price.",
  },
  analysisInsidersTitle: {
    es: "Directivos de la empresa",
    en: "Company insiders",
  },
  analysisInsidersBuying: {
    es: "Están comprando acciones",
    en: "They are buying shares",
  },
  analysisInsidersSelling: {
    es: "Están vendiendo acciones",
    en: "They are selling shares",
  },
  analysisInsidersNone: {
    es: "Sin movimientos recientes",
    en: "No recent movements",
  },
  analysisInsidersHintBase: {
    es: "Compras/ventas netas de los directivos en los últimos 6 meses.",
    en: "Net insider buys/sells over the last 6 months.",
  },
  analysisInsidersOwnBefore: { es: " Poseen el ", en: " They own " },
  analysisInsidersOwnAfter: {
    es: "% de la empresa.",
    en: "% of the company.",
  },
  analysisInsidersHintTail: {
    es: " Cuando los que dirigen la empresa compran, suele ser buena señal.",
    en: " When the people running the company buy, it is usually a good sign.",
  },
  analysisTrendTitle: {
    es: "Análisis de tendencia",
    en: "Trend analysis",
  },
  analysisVsSma20: { es: "vs media 20", en: "vs 20 MA" },
  analysisTrendPriority: {
    es: "Orden de prioridad: mensual → semanal → diario → hora. Comparamos el precio con su media móvil de 20 períodos en cada marco de tiempo.",
    en: "Priority order: monthly → weekly → daily → hourly. We compare the price with its 20-period moving average in each timeframe.",
  },
  analysisStrategySignal: {
    es: "Señal de la estrategia",
    en: "Strategy signal",
  },
  analysisLowToSma20Before: {
    es: "Distancia mínimo vs media de 20 días: ",
    en: "Distance from low to 20-day MA: ",
  },
  analysisLowToSma20After: {
    es: " (se valida con más de 20%)",
    en: " (validated above 20%)",
  },
  analysisChartTitle: {
    es: "Gráfico y lectura técnica",
    en: "Chart and technical reading",
  },
  analysisAlgoReading: { es: "Lectura algorítmica", en: "Algorithmic reading" },
  analysisBuySuggestion: {
    es: "Sugerencia de compra",
    en: "Buy suggestion",
  },
  analysisTrendBadge: { es: "Tendencia", en: "Trend" },
  analysisSupport: { es: "Soporte", en: "Support" },
  analysisResistance: { es: "Resistencia", en: "Resistance" },
  analysisBreakdown: {
    es: "Desglose del Análisis",
    en: "Analysis Breakdown",
  },
  analysisKeyMetrics: { es: "Métricas Clave", en: "Key Metrics" },
  analysisMetric: { es: "Métrica", en: "Metric" },
  analysisValue: { es: "Valor", en: "Value" },
  analysisContext: { es: "Contexto", en: "Context" },

  // ── Trend frame names (API contract values → display) ──────────────
  frameMensual: { es: "mensual", en: "monthly" },
  frameSemanal: { es: "semanal", en: "weekly" },
  frameDiario: { es: "diario", en: "daily" },
  frameHora: { es: "hora", en: "hourly" },

  // ── Trend values (API contract values → display) ───────────────────
  trendAlcista: { es: "alcista", en: "bullish" },
  trendBajista: { es: "bajista", en: "bearish" },
  trendLateral: { es: "lateral", en: "sideways" },
  trendSinDatos: { es: "sin datos", en: "no data" },

  // ── Not found (not-found.tsx) ──────────────────────────────────────
  notFoundTitle: {
    es: "Página no encontrada",
    en: "Page not found",
  },
  notFoundDesc: {
    es: "No pudimos encontrar lo que buscabas. Es posible que la dirección sea incorrecta o la página haya sido eliminada.",
    en: "We couldn't find what you were looking for. The address may be wrong or the page may have been removed.",
  },
  notFoundBack: { es: "Volver al inicio", en: "Back to home" },

  // ── Trading chart (trading-chart.tsx) ──────────────────────────────
  chartPriceEvolution: { es: "Evolución del Precio", en: "Price Evolution" },
  chartSupport: { es: "Soporte", en: "Support" },
  chartResistance: { es: "Resistencia", en: "Resistance" },

  // ── Login referral promo (referral-promo.tsx) ──────────────────────
  promoTitle: { es: "¡Comparte y gana!", en: "Share and win!" },
  promoBody: {
    es: "Invita a un amigo a DualyStocks. Cuando termine su prueba gratis y pague su primera factura, tú ganas.",
    en: "Invite a friend to DualyStocks. When they finish their free trial and pay their first bill, you win.",
  },
  promoReward: {
    es: "25% de descuento en tu siguiente factura",
    en: "25% off your next bill",
  },
  promoCta: { es: "Invitar a un amigo", en: "Invite a friend" },
  promoLater: { es: "Ahora no", en: "Not now" },

  // ── Leveraged / inverse ETF banner (analysis.tsx) ──────────────────
  levBadgeX2: { es: "Producto ×2", en: "×2 product" },
  levBadgeInverse: { es: "Producto inverso", en: "Inverse product" },
  levBadgeInverseX2: { es: "Producto inverso ×2", en: "Inverse ×2 product" },
  levExplainX2: {
    es: "no es una empresa: es un fondo que duplica los movimientos de cada día de",
    en: "is not a company: it's a fund that doubles the daily moves of",
  },
  levExplainInverse: {
    es: "no es una empresa: es un fondo que se mueve al revés que",
    en: "is not a company: it's a fund that moves opposite to",
  },
  levExplainInverseX2: {
    es: "no es una empresa: es un fondo que sube el doble cuando baja",
    en: "is not a company: it's a fund that rises double when it falls —",
  },
  levShowingBase: {
    es: "Por eso aquí te mostramos el análisis completo de la acción base: es la que decide hacia dónde va este producto.",
    en: "That's why we show you the full analysis of the base asset: it's what decides where this product goes.",
  },
  levReadingTitle: {
    es: "¿Qué significa para este producto?",
    en: "What does it mean for this product?",
  },
  levGoodBull: {
    es: "El análisis y el gráfico de la acción base acompañan. Es el escenario donde un ×2 tiene más sentido — solo a corto plazo y vigilándolo a diario, porque también duplica las caídas.",
    en: "The base asset's analysis and chart are supportive. This is the scenario where a ×2 makes the most sense — short term only and watching it daily, because it also doubles the drops.",
  },
  levMixedBull: {
    es: "Las señales de la acción base son mixtas. Un ×2 amplifica también los sustos: mejor esperar a que el gráfico confirme.",
    en: "The base asset's signals are mixed. A ×2 also amplifies the scares: better to wait for the chart to confirm.",
  },
  levBadBull: {
    es: "El gráfico de la acción base no acompaña ahora. Un ×2 duplicaría las caídas: escenario poco favorable.",
    en: "The base asset's chart is not supportive right now. A ×2 would double the drops: an unfavorable scenario.",
  },
  levGoodBear: {
    es: "La acción base muestra debilidad, que es justo cuando un inverso gana. Aun así, es una herramienta de días, no de meses.",
    en: "The base asset shows weakness, which is exactly when an inverse gains. Even so, it's a tool for days, not months.",
  },
  levMixedBear: {
    es: "Las señales de la acción base son mixtas. Un inverso solo gana si la base baja: sin señal clara de caída, es una apuesta arriesgada.",
    en: "The base asset's signals are mixed. An inverse only gains if the base falls: without a clear falling signal, it's a risky bet.",
  },
  levBadBear: {
    es: "La acción base está fuerte o al alza: un inverso perdería. Escenario poco favorable para este producto.",
    en: "The base asset is strong or rising: an inverse would lose. An unfavorable scenario for this product.",
  },
  levRiskNote: {
    es: "Recuerda: los ×2 e inversos se reinician cada día y pierden valor si los mantienes mucho tiempo. Esto es información educativa, no una recomendación de compra o venta.",
    en: "Remember: ×2 and inverse funds reset every day and lose value if you hold them for long. This is educational information, not a buy or sell recommendation.",
  },

  // ── RSI interpretation (analysis.tsx) ──────────────────────────────
  rsiOversold: { es: "Sobreventa", en: "Oversold" },
  rsiOversoldHint: {
    es: "Ha caído mucho; a veces rebota desde aquí",
    en: "It has dropped a lot; it sometimes bounces from here",
  },
  rsiNeutral: { es: "Zona normal", en: "Normal zone" },
  rsiNeutralHint: {
    es: "Sin señales de exceso en el precio",
    en: "No signs of excess in the price",
  },
  rsiOverbought: { es: "Sobrecompra", en: "Overbought" },
  rsiOverboughtHint: {
    es: "Ha subido muy rápido; podría tomarse un respiro",
    en: "It has risen very fast; it could take a breather",
  },

  // ── Support / customer service (support.tsx, admin.tsx) ────────────
  supportTitle: { es: "Atención al cliente", en: "Customer service" },
  supportSubtitle: {
    es: "¿Tienes una duda o un problema? Escríbenos y te responderemos lo antes posible.",
    en: "Questions or problems? Write to us and we'll get back to you as soon as possible.",
  },
  supportSubjectLabel: { es: "Asunto", en: "Subject" },
  supportSubjectPlaceholder: { es: "Ej.: Problema con mi suscripción", en: "E.g.: Problem with my subscription" },
  supportMessageLabel: { es: "Mensaje", en: "Message" },
  supportMessagePlaceholder: {
    es: "Cuéntanos con detalle en qué podemos ayudarte…",
    en: "Tell us in detail how we can help…",
  },
  supportSend: { es: "Enviar mensaje", en: "Send message" },
  supportSending: { es: "Enviando…", en: "Sending…" },
  supportSuccessTitle: { es: "¡Mensaje enviado!", en: "Message sent!" },
  supportSuccessBody: {
    es: "Gracias por escribirnos. Te responderemos al correo de tu cuenta.",
    en: "Thanks for writing. We'll reply to your account email.",
  },
  supportSendAnother: { es: "Enviar otro mensaje", en: "Send another message" },
  supportError: { es: "No se pudo enviar el mensaje. Inténtalo de nuevo.", en: "The message could not be sent. Please try again." },
  supportSignInPrompt: {
    es: "Inicia sesión para enviarnos un mensaje desde la app.",
    en: "Sign in to send us a message from the app.",
  },
  supportEmailTitle: { es: "¿Prefieres el correo?", en: "Prefer email?" },
  supportEmailBody: { es: "También puedes escribirnos directamente a", en: "You can also write to us directly at" },
  supportBack: { es: "Volver", en: "Back" },
  supportNavLabel: { es: "Atención al cliente", en: "Customer service" },
  supportNavHint: { es: "Escríbenos si necesitas ayuda", en: "Write to us if you need help" },
  footerSupportLink: { es: "Atención al cliente", en: "Customer service" },
  adminSupportTitle: { es: "Mensajes de soporte", en: "Support messages" },
  adminSupportDesc: { es: "Mensajes enviados por los usuarios desde la app.", en: "Messages sent by users from the app." },
  adminSupportEmpty: { es: "Todavía no hay mensajes.", en: "No messages yet." },
  adminSupportOpen: { es: "Pendiente", en: "Open" },
  adminSupportResolved: { es: "Resuelto", en: "Resolved" },
  adminSupportMarkResolved: { es: "Marcar resuelto", en: "Mark resolved" },
  adminSupportReopen: { es: "Reabrir", en: "Reopen" },
  adminSupportReply: { es: "Responder por correo", en: "Reply by email" },
} as const;

export type TranslationKey = keyof typeof dict;

export const translations = dict;

// Locale strings for Intl formatting (dates).
export const locales: Record<Lang, string> = {
  es: "es-ES",
  en: "en-US",
};

/**
 * Map an API trend-frame value (Spanish contract value) to a display key.
 */
export function frameKey(frame: string): TranslationKey {
  switch (frame) {
    case "mensual":
      return "frameMensual";
    case "semanal":
      return "frameSemanal";
    case "diario":
      return "frameDiario";
    case "hora":
      return "frameHora";
    default:
      return "frameMensual";
  }
}

/**
 * Map an API trend value (Spanish contract value) to a display key.
 * Returns null when the value is unknown so callers can fall back to the raw value.
 */
export function trendKey(trend: string): TranslationKey | null {
  switch (trend) {
    case "alcista":
      return "trendAlcista";
    case "bajista":
      return "trendBajista";
    case "lateral":
      return "trendLateral";
    case "sin datos":
      return "trendSinDatos";
    default:
      return null;
  }
}
