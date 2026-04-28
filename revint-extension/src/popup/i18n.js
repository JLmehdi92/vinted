/**
 * ReVint i18n — lightweight translation system
 * Usage: import { t, setLocale, getLocale, LOCALES } from './i18n.js';
 *        t('auto_messages_title') → "Réponse auto aux favoris"
 *        t('greeting', { name: 'Mehdi' }) → "Bonjour Mehdi"
 */

export const LOCALES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'pt', label: 'Português' },
  { code: 'pl', label: 'Polski' },
];

const STORAGE_KEY = 'revint_locale';
const DEFAULT_LOCALE = 'fr';

let currentLocale = DEFAULT_LOCALE;

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const translations = {
  // ── French (default) ────────────────────────────────────────────────────
  fr: {
    // Common
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    loading: 'Chargement…',
    error: 'Erreur',
    success: 'Succès',
    start: 'Démarrer',
    stop: 'Arrêter',
    enabled: 'Activé',
    disabled: 'Désactivé',
    apply: 'Appliquer',
    confirm: 'Confirmer',
    back: 'Retour',
    search: 'Rechercher',
    export: 'Exporter',

    // Auto-messages
    auto_messages_title: 'Réponse auto aux favoris',
    auto_messages_status_active: 'Messages automatiques actifs',
    auto_messages_status_disabled: 'Messages automatiques désactivés',
    auto_messages_sent_today: 'Messages envoyés aujourd\'hui',
    template_section: 'Modèle de message',
    preview_section: 'Aperçu',
    conditions_section: 'Conditions d\'envoi',
    delay_label: 'Délai avant envoi',
    daily_limit_label: 'Limite journalière',
    ignore_recent_label: 'Ignorer les favoris récents',
    no_duplicates_label: 'Pas de doublons',

    // Smart Offers
    smart_offers_title: 'Offres intelligentes',
    offer_type_simple: 'Offre simple',
    offer_type_tiered: 'Offre par paliers',
    accept_percent: 'Accepter au-dessus de (%)',
    counter_percent: 'Contre-offre à (%)',
    enable_rounding: 'Arrondir les prix',
    enable_counter: 'Activer la contre-offre',
    accept_message: 'Message d\'acceptation',
    counter_message: 'Message de contre-offre',
    check_interval: 'Intervalle de vérification',

    // Restocker
    restocker_title: 'Remise en vente',
    delay_before_restock: 'Délai avant remise en vente',
    publish_as_draft: 'Publier en brouillon',
    backlog_orders: 'File d\'attente',
    restocked_today: 'Remis en vente aujourd\'hui',

    // Bulk
    bulk_title: 'Actions groupées',
    visibility_section: 'Visibilité',
    price_section: 'Prix',
    text_section: 'Texte',
    follow_section: 'Abonnements',
    lower: 'Baisser',
    raise: 'Augmenter',
    set_price: 'Fixer le prix',
    replace: 'Remplacer',
    prepend: 'Ajouter au début',
    append: 'Ajouter à la fin',
    follow_back: 'Suivre en retour',
    unfollow_all: 'Se désabonner de tous',

    // Orders
    orders_title: 'Commandes',
    shipping_label: 'Étiquette d\'envoi',
    leave_feedback: 'Laisser un avis',
    load_more: 'Charger plus',
    csv_export: 'Export CSV',
    no_orders: 'Aucune commande',

    // General
    accounts_title: 'Comptes',
    add_account: 'Ajouter un compte',
    switch_account: 'Changer de compte',
    remove_account: 'Supprimer le compte',
    settings_title: 'Paramètres',
    dashboard_title: 'Tableau de bord',
    articles_title: 'Articles',
    stats_title: 'Statistiques',
    inbox_title: 'Messagerie',
  },

  // ── English ─────────────────────────────────────────────────────────────
  en: {
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading…',
    error: 'Error',
    success: 'Success',
    start: 'Start',
    stop: 'Stop',
    enabled: 'Enabled',
    disabled: 'Disabled',
    apply: 'Apply',
    confirm: 'Confirm',
    back: 'Back',
    search: 'Search',
    export: 'Export',

    // Auto-messages
    auto_messages_title: 'Auto-reply to favourites',
    auto_messages_status_active: 'Auto-messages active',
    auto_messages_status_disabled: 'Auto-messages disabled',
    auto_messages_sent_today: 'Messages sent today',
    template_section: 'Message template',
    preview_section: 'Preview',
    conditions_section: 'Send conditions',
    delay_label: 'Delay before sending',
    daily_limit_label: 'Daily limit',
    ignore_recent_label: 'Ignore recent favourites',
    no_duplicates_label: 'No duplicates',

    // Smart Offers
    smart_offers_title: 'Smart Offers',
    offer_type_simple: 'Simple offer',
    offer_type_tiered: 'Tiered offer',
    accept_percent: 'Accept above (%)',
    counter_percent: 'Counter-offer at (%)',
    enable_rounding: 'Round prices',
    enable_counter: 'Enable counter-offer',
    accept_message: 'Acceptance message',
    counter_message: 'Counter-offer message',
    check_interval: 'Check interval',

    // Restocker
    restocker_title: 'Restock',
    delay_before_restock: 'Delay before restocking',
    publish_as_draft: 'Publish as draft',
    backlog_orders: 'Backlog',
    restocked_today: 'Restocked today',

    // Bulk
    bulk_title: 'Bulk actions',
    visibility_section: 'Visibility',
    price_section: 'Price',
    text_section: 'Text',
    follow_section: 'Follows',
    lower: 'Lower',
    raise: 'Raise',
    set_price: 'Set price',
    replace: 'Replace',
    prepend: 'Prepend',
    append: 'Append',
    follow_back: 'Follow back',
    unfollow_all: 'Unfollow all',

    // Orders
    orders_title: 'Orders',
    shipping_label: 'Shipping label',
    leave_feedback: 'Leave feedback',
    load_more: 'Load more',
    csv_export: 'CSV export',
    no_orders: 'No orders',

    // General
    accounts_title: 'Accounts',
    add_account: 'Add account',
    switch_account: 'Switch account',
    remove_account: 'Remove account',
    settings_title: 'Settings',
    dashboard_title: 'Dashboard',
    articles_title: 'Items',
    stats_title: 'Statistics',
    inbox_title: 'Inbox',
  },

  // ── Spanish ─────────────────────────────────────────────────────────────
  es: {
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Cerrar',
    loading: 'Cargando…',
    error: 'Error',
    success: 'Éxito',
    start: 'Iniciar',
    stop: 'Detener',
    enabled: 'Activado',
    disabled: 'Desactivado',
    apply: 'Aplicar',
    confirm: 'Confirmar',
    back: 'Volver',
    search: 'Buscar',
    export: 'Exportar',

    // Auto-messages
    auto_messages_title: 'Respuesta automática a favoritos',
    auto_messages_status_active: 'Mensajes automáticos activos',
    auto_messages_status_disabled: 'Mensajes automáticos desactivados',
    auto_messages_sent_today: 'Mensajes enviados hoy',
    template_section: 'Plantilla del mensaje',
    preview_section: 'Vista previa',
    conditions_section: 'Condiciones de envío',
    delay_label: 'Retraso antes del envío',
    daily_limit_label: 'Límite diario',
    ignore_recent_label: 'Ignorar favoritos recientes',
    no_duplicates_label: 'Sin duplicados',

    // Smart Offers
    smart_offers_title: 'Ofertas inteligentes',
    offer_type_simple: 'Oferta simple',
    offer_type_tiered: 'Oferta por niveles',
    accept_percent: 'Aceptar por encima de (%)',
    counter_percent: 'Contraoferta en (%)',
    enable_rounding: 'Redondear precios',
    enable_counter: 'Activar contraoferta',
    accept_message: 'Mensaje de aceptación',
    counter_message: 'Mensaje de contraoferta',
    check_interval: 'Intervalo de comprobación',

    // Restocker
    restocker_title: 'Republicación',
    delay_before_restock: 'Retraso antes de republicar',
    publish_as_draft: 'Publicar como borrador',
    backlog_orders: 'Cola de espera',
    restocked_today: 'Republicados hoy',

    // Bulk
    bulk_title: 'Acciones masivas',
    visibility_section: 'Visibilidad',
    price_section: 'Precio',
    text_section: 'Texto',
    follow_section: 'Seguimientos',
    lower: 'Bajar',
    raise: 'Subir',
    set_price: 'Fijar precio',
    replace: 'Reemplazar',
    prepend: 'Añadir al inicio',
    append: 'Añadir al final',
    follow_back: 'Seguir de vuelta',
    unfollow_all: 'Dejar de seguir a todos',

    // Orders
    orders_title: 'Pedidos',
    shipping_label: 'Etiqueta de envío',
    leave_feedback: 'Dejar opinión',
    load_more: 'Cargar más',
    csv_export: 'Exportar CSV',
    no_orders: 'Sin pedidos',

    // General
    accounts_title: 'Cuentas',
    add_account: 'Añadir cuenta',
    switch_account: 'Cambiar de cuenta',
    remove_account: 'Eliminar cuenta',
    settings_title: 'Ajustes',
    dashboard_title: 'Panel de control',
    articles_title: 'Artículos',
    stats_title: 'Estadísticas',
    inbox_title: 'Bandeja de entrada',
  },

  // ── German ──────────────────────────────────────────────────────────────
  de: {
    // Common
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    close: 'Schließen',
    loading: 'Wird geladen…',
    error: 'Fehler',
    success: 'Erfolg',
    start: 'Starten',
    stop: 'Stoppen',
    enabled: 'Aktiviert',
    disabled: 'Deaktiviert',
    apply: 'Anwenden',
    confirm: 'Bestätigen',
    back: 'Zurück',
    search: 'Suchen',
    export: 'Exportieren',

    // Auto-messages
    auto_messages_title: 'Automatische Antwort auf Favoriten',
    auto_messages_status_active: 'Automatische Nachrichten aktiv',
    auto_messages_status_disabled: 'Automatische Nachrichten deaktiviert',
    auto_messages_sent_today: 'Heute gesendete Nachrichten',
    template_section: 'Nachrichtenvorlage',
    preview_section: 'Vorschau',
    conditions_section: 'Versandbedingungen',
    delay_label: 'Verzögerung vor dem Senden',
    daily_limit_label: 'Tageslimit',
    ignore_recent_label: 'Neueste Favoriten ignorieren',
    no_duplicates_label: 'Keine Duplikate',

    // Smart Offers
    smart_offers_title: 'Intelligente Angebote',
    offer_type_simple: 'Einfaches Angebot',
    offer_type_tiered: 'Gestaffeltes Angebot',
    accept_percent: 'Akzeptieren ab (%)',
    counter_percent: 'Gegenangebot bei (%)',
    enable_rounding: 'Preise runden',
    enable_counter: 'Gegenangebot aktivieren',
    accept_message: 'Annahmenachricht',
    counter_message: 'Gegenangebotsnachricht',
    check_interval: 'Prüfintervall',

    // Restocker
    restocker_title: 'Wiedereinstellen',
    delay_before_restock: 'Verzögerung vor dem Wiedereinstellen',
    publish_as_draft: 'Als Entwurf veröffentlichen',
    backlog_orders: 'Warteschlange',
    restocked_today: 'Heute wiedereingestellt',

    // Bulk
    bulk_title: 'Massenaktionen',
    visibility_section: 'Sichtbarkeit',
    price_section: 'Preis',
    text_section: 'Text',
    follow_section: 'Abonnements',
    lower: 'Senken',
    raise: 'Erhöhen',
    set_price: 'Preis festlegen',
    replace: 'Ersetzen',
    prepend: 'Voranstellen',
    append: 'Anhängen',
    follow_back: 'Zurückfolgen',
    unfollow_all: 'Allen entfolgen',

    // Orders
    orders_title: 'Bestellungen',
    shipping_label: 'Versandetikett',
    leave_feedback: 'Bewertung hinterlassen',
    load_more: 'Mehr laden',
    csv_export: 'CSV-Export',
    no_orders: 'Keine Bestellungen',

    // General
    accounts_title: 'Konten',
    add_account: 'Konto hinzufügen',
    switch_account: 'Konto wechseln',
    remove_account: 'Konto entfernen',
    settings_title: 'Einstellungen',
    dashboard_title: 'Übersicht',
    articles_title: 'Artikel',
    stats_title: 'Statistiken',
    inbox_title: 'Posteingang',
  },

  // ── Italian ─────────────────────────────────────────────────────────────
  it: {
    // Common
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    edit: 'Modifica',
    close: 'Chiudi',
    loading: 'Caricamento…',
    error: 'Errore',
    success: 'Successo',
    start: 'Avvia',
    stop: 'Ferma',
    enabled: 'Attivato',
    disabled: 'Disattivato',
    apply: 'Applica',
    confirm: 'Conferma',
    back: 'Indietro',
    search: 'Cerca',
    export: 'Esporta',

    // Auto-messages
    auto_messages_title: 'Risposta automatica ai preferiti',
    auto_messages_status_active: 'Messaggi automatici attivi',
    auto_messages_status_disabled: 'Messaggi automatici disattivati',
    auto_messages_sent_today: 'Messaggi inviati oggi',
    template_section: 'Modello del messaggio',
    preview_section: 'Anteprima',
    conditions_section: 'Condizioni di invio',
    delay_label: 'Ritardo prima dell\'invio',
    daily_limit_label: 'Limite giornaliero',
    ignore_recent_label: 'Ignora preferiti recenti',
    no_duplicates_label: 'Nessun duplicato',

    // Smart Offers
    smart_offers_title: 'Offerte intelligenti',
    offer_type_simple: 'Offerta semplice',
    offer_type_tiered: 'Offerta a scaglioni',
    accept_percent: 'Accetta sopra (%)',
    counter_percent: 'Controproposta a (%)',
    enable_rounding: 'Arrotonda i prezzi',
    enable_counter: 'Attiva controproposta',
    accept_message: 'Messaggio di accettazione',
    counter_message: 'Messaggio di controproposta',
    check_interval: 'Intervallo di controllo',

    // Restocker
    restocker_title: 'Rimessa in vendita',
    delay_before_restock: 'Ritardo prima della rimessa in vendita',
    publish_as_draft: 'Pubblica come bozza',
    backlog_orders: 'Coda d\'attesa',
    restocked_today: 'Rimessi in vendita oggi',

    // Bulk
    bulk_title: 'Azioni di massa',
    visibility_section: 'Visibilità',
    price_section: 'Prezzo',
    text_section: 'Testo',
    follow_section: 'Seguiti',
    lower: 'Abbassa',
    raise: 'Aumenta',
    set_price: 'Imposta prezzo',
    replace: 'Sostituisci',
    prepend: 'Aggiungi all\'inizio',
    append: 'Aggiungi alla fine',
    follow_back: 'Ricambia il follow',
    unfollow_all: 'Smetti di seguire tutti',

    // Orders
    orders_title: 'Ordini',
    shipping_label: 'Etichetta di spedizione',
    leave_feedback: 'Lascia un feedback',
    load_more: 'Carica altri',
    csv_export: 'Esporta CSV',
    no_orders: 'Nessun ordine',

    // General
    accounts_title: 'Account',
    add_account: 'Aggiungi account',
    switch_account: 'Cambia account',
    remove_account: 'Rimuovi account',
    settings_title: 'Impostazioni',
    dashboard_title: 'Pannello di controllo',
    articles_title: 'Articoli',
    stats_title: 'Statistiche',
    inbox_title: 'Messaggi',
  },

  // ── Dutch ───────────────────────────────────────────────────────────────
  nl: {
    // Common
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    close: 'Sluiten',
    loading: 'Laden…',
    error: 'Fout',
    success: 'Gelukt',
    start: 'Starten',
    stop: 'Stoppen',
    enabled: 'Ingeschakeld',
    disabled: 'Uitgeschakeld',
    apply: 'Toepassen',
    confirm: 'Bevestigen',
    back: 'Terug',
    search: 'Zoeken',
    export: 'Exporteren',

    // Auto-messages
    auto_messages_title: 'Automatisch antwoord op favorieten',
    auto_messages_status_active: 'Automatische berichten actief',
    auto_messages_status_disabled: 'Automatische berichten uitgeschakeld',
    auto_messages_sent_today: 'Berichten verzonden vandaag',
    template_section: 'Berichtsjabloon',
    preview_section: 'Voorbeeld',
    conditions_section: 'Verzendvoorwaarden',
    delay_label: 'Vertraging voor verzending',
    daily_limit_label: 'Dagelijks limiet',
    ignore_recent_label: 'Recente favorieten negeren',
    no_duplicates_label: 'Geen duplicaten',

    // Smart Offers
    smart_offers_title: 'Slimme aanbiedingen',
    offer_type_simple: 'Eenvoudig bod',
    offer_type_tiered: 'Gestaffeld bod',
    accept_percent: 'Accepteren boven (%)',
    counter_percent: 'Tegenbod bij (%)',
    enable_rounding: 'Prijzen afronden',
    enable_counter: 'Tegenbod inschakelen',
    accept_message: 'Acceptatiebericht',
    counter_message: 'Tegenbodbericht',
    check_interval: 'Controle-interval',

    // Restocker
    restocker_title: 'Opnieuw plaatsen',
    delay_before_restock: 'Vertraging voor herplaatsing',
    publish_as_draft: 'Publiceren als concept',
    backlog_orders: 'Wachtrij',
    restocked_today: 'Vandaag herplaatst',

    // Bulk
    bulk_title: 'Bulkacties',
    visibility_section: 'Zichtbaarheid',
    price_section: 'Prijs',
    text_section: 'Tekst',
    follow_section: 'Volgen',
    lower: 'Verlagen',
    raise: 'Verhogen',
    set_price: 'Prijs instellen',
    replace: 'Vervangen',
    prepend: 'Vooraan toevoegen',
    append: 'Achteraan toevoegen',
    follow_back: 'Terugvolgen',
    unfollow_all: 'Iedereen ontvolgen',

    // Orders
    orders_title: 'Bestellingen',
    shipping_label: 'Verzendlabel',
    leave_feedback: 'Beoordeling achterlaten',
    load_more: 'Meer laden',
    csv_export: 'CSV-export',
    no_orders: 'Geen bestellingen',

    // General
    accounts_title: 'Accounts',
    add_account: 'Account toevoegen',
    switch_account: 'Van account wisselen',
    remove_account: 'Account verwijderen',
    settings_title: 'Instellingen',
    dashboard_title: 'Dashboard',
    articles_title: 'Artikelen',
    stats_title: 'Statistieken',
    inbox_title: 'Postvak',
  },

  // ── Portuguese ──────────────────────────────────────────────────────────
  pt: {
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    close: 'Fechar',
    loading: 'A carregar…',
    error: 'Erro',
    success: 'Sucesso',
    start: 'Iniciar',
    stop: 'Parar',
    enabled: 'Ativado',
    disabled: 'Desativado',
    apply: 'Aplicar',
    confirm: 'Confirmar',
    back: 'Voltar',
    search: 'Pesquisar',
    export: 'Exportar',

    // Auto-messages
    auto_messages_title: 'Resposta automática aos favoritos',
    auto_messages_status_active: 'Mensagens automáticas ativas',
    auto_messages_status_disabled: 'Mensagens automáticas desativadas',
    auto_messages_sent_today: 'Mensagens enviadas hoje',
    template_section: 'Modelo da mensagem',
    preview_section: 'Pré-visualização',
    conditions_section: 'Condições de envio',
    delay_label: 'Atraso antes do envio',
    daily_limit_label: 'Limite diário',
    ignore_recent_label: 'Ignorar favoritos recentes',
    no_duplicates_label: 'Sem duplicados',

    // Smart Offers
    smart_offers_title: 'Ofertas inteligentes',
    offer_type_simple: 'Oferta simples',
    offer_type_tiered: 'Oferta por escalões',
    accept_percent: 'Aceitar acima de (%)',
    counter_percent: 'Contraproposta em (%)',
    enable_rounding: 'Arredondar preços',
    enable_counter: 'Ativar contraproposta',
    accept_message: 'Mensagem de aceitação',
    counter_message: 'Mensagem de contraproposta',
    check_interval: 'Intervalo de verificação',

    // Restocker
    restocker_title: 'Republicação',
    delay_before_restock: 'Atraso antes da republicação',
    publish_as_draft: 'Publicar como rascunho',
    backlog_orders: 'Fila de espera',
    restocked_today: 'Republicados hoje',

    // Bulk
    bulk_title: 'Ações em massa',
    visibility_section: 'Visibilidade',
    price_section: 'Preço',
    text_section: 'Texto',
    follow_section: 'Seguimentos',
    lower: 'Baixar',
    raise: 'Aumentar',
    set_price: 'Definir preço',
    replace: 'Substituir',
    prepend: 'Adicionar no início',
    append: 'Adicionar no final',
    follow_back: 'Seguir de volta',
    unfollow_all: 'Deixar de seguir todos',

    // Orders
    orders_title: 'Encomendas',
    shipping_label: 'Etiqueta de envio',
    leave_feedback: 'Deixar avaliação',
    load_more: 'Carregar mais',
    csv_export: 'Exportar CSV',
    no_orders: 'Sem encomendas',

    // General
    accounts_title: 'Contas',
    add_account: 'Adicionar conta',
    switch_account: 'Mudar de conta',
    remove_account: 'Remover conta',
    settings_title: 'Definições',
    dashboard_title: 'Painel de controlo',
    articles_title: 'Artigos',
    stats_title: 'Estatísticas',
    inbox_title: 'Caixa de entrada',
  },

  // ── Polish ──────────────────────────────────────────────────────────────
  pl: {
    // Common
    save: 'Zapisz',
    cancel: 'Anuluj',
    delete: 'Usuń',
    edit: 'Edytuj',
    close: 'Zamknij',
    loading: 'Ładowanie…',
    error: 'Błąd',
    success: 'Sukces',
    start: 'Rozpocznij',
    stop: 'Zatrzymaj',
    enabled: 'Włączono',
    disabled: 'Wyłączono',
    apply: 'Zastosuj',
    confirm: 'Potwierdź',
    back: 'Wróć',
    search: 'Szukaj',
    export: 'Eksportuj',

    // Auto-messages
    auto_messages_title: 'Automatyczna odpowiedź na ulubione',
    auto_messages_status_active: 'Automatyczne wiadomości aktywne',
    auto_messages_status_disabled: 'Automatyczne wiadomości wyłączone',
    auto_messages_sent_today: 'Wiadomości wysłane dzisiaj',
    template_section: 'Szablon wiadomości',
    preview_section: 'Podgląd',
    conditions_section: 'Warunki wysyłki',
    delay_label: 'Opóźnienie przed wysłaniem',
    daily_limit_label: 'Dzienny limit',
    ignore_recent_label: 'Ignoruj ostatnio dodane do ulubionych',
    no_duplicates_label: 'Bez duplikatów',

    // Smart Offers
    smart_offers_title: 'Inteligentne oferty',
    offer_type_simple: 'Oferta prosta',
    offer_type_tiered: 'Oferta wielopoziomowa',
    accept_percent: 'Akceptuj powyżej (%)',
    counter_percent: 'Kontroferta przy (%)',
    enable_rounding: 'Zaokrąglaj ceny',
    enable_counter: 'Włącz kontrofertę',
    accept_message: 'Wiadomość akceptacji',
    counter_message: 'Wiadomość kontroferty',
    check_interval: 'Częstotliwość sprawdzania',

    // Restocker
    restocker_title: 'Ponowne wystawienie',
    delay_before_restock: 'Opóźnienie przed ponownym wystawieniem',
    publish_as_draft: 'Opublikuj jako szkic',
    backlog_orders: 'Kolejka oczekujących',
    restocked_today: 'Wystawione ponownie dzisiaj',

    // Bulk
    bulk_title: 'Akcje zbiorcze',
    visibility_section: 'Widoczność',
    price_section: 'Cena',
    text_section: 'Tekst',
    follow_section: 'Obserwacje',
    lower: 'Obniż',
    raise: 'Podnieś',
    set_price: 'Ustaw cenę',
    replace: 'Zamień',
    prepend: 'Dodaj na początku',
    append: 'Dodaj na końcu',
    follow_back: 'Zaobserwuj w zamian',
    unfollow_all: 'Przestań obserwować wszystkich',

    // Orders
    orders_title: 'Zamówienia',
    shipping_label: 'Etykieta wysyłkowa',
    leave_feedback: 'Wystaw opinię',
    load_more: 'Załaduj więcej',
    csv_export: 'Eksport CSV',
    no_orders: 'Brak zamówień',

    // General
    accounts_title: 'Konta',
    add_account: 'Dodaj konto',
    switch_account: 'Zmień konto',
    remove_account: 'Usuń konto',
    settings_title: 'Ustawienia',
    dashboard_title: 'Panel główny',
    articles_title: 'Przedmioty',
    stats_title: 'Statystyki',
    inbox_title: 'Skrzynka odbiorcza',
  },
};

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Translate a key, with optional parameter substitution.
 * Falls back to French (default locale) if the key is missing in the current locale.
 *
 * Params can be positional ({0}, {1}) or named ({count}, {name}):
 *   t('greeting', { name: 'Mehdi' })  → replaces {name}
 *   t('items', ['5'])                  → replaces {0}
 */
export function t(key, params) {
  const dict = translations[currentLocale] || translations[DEFAULT_LOCALE];
  let text = dict[key];

  // Fallback to French if key missing in current locale
  if (text === undefined) {
    text = translations[DEFAULT_LOCALE][key];
  }

  // Last resort: return the key itself
  if (text === undefined) {
    return key;
  }

  // Parameter substitution
  if (params) {
    if (Array.isArray(params)) {
      params.forEach((val, i) => {
        text = text.replace(new RegExp(`\\{${i}\\}`, 'g'), val);
      });
    } else if (typeof params === 'object') {
      Object.keys(params).forEach((name) => {
        text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), params[name]);
      });
    }
  }

  return text;
}

/**
 * Get the current locale code (e.g. 'fr').
 */
export function getLocale() {
  return currentLocale;
}

/**
 * Set the locale and persist it in chrome.storage.local.
 * Returns a Promise that resolves once storage is written.
 */
export async function setLocale(code) {
  const valid = LOCALES.some((l) => l.code === code);
  if (!valid) {
    console.warn(`[i18n] Unknown locale "${code}", falling back to ${DEFAULT_LOCALE}`);
    code = DEFAULT_LOCALE;
  }
  currentLocale = code;

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    await chrome.storage.local.set({ [STORAGE_KEY]: code });
  }
}

/**
 * Initialise the i18n system by reading the stored locale.
 * Call this once at app startup (e.g. in index.jsx).
 */
export async function initLocale() {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    try {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const stored = result[STORAGE_KEY];
      if (stored && LOCALES.some((l) => l.code === stored)) {
        currentLocale = stored;
      }
    } catch (err) {
      console.warn('[i18n] Could not read stored locale:', err);
    }
  }
  return currentLocale;
}
