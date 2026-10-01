/* ==========================================================
   LUX96 — site settings
   Edit the values below; everything on the site reads from here.
   Lines marked CONFIRM are sensible defaults that the workshop
   should check before launch.
   ========================================================== */
window.LUX = {
  // Contact details are only ever used inside links — never displayed.
  whatsapp: "2348167993933",            // international format, digits only
  email: "hello@lux96furnitures.com",   // CONFIRM

  // Commission terms (used in the FAQ, piece pages and guarantee seal)
  leadTime: "4–8 weeks",                // CONFIRM: typical time from approved drawing to delivery
  depositPercent: 60,                   // CONFIRM: deposit taken to start a build
  guaranteeYears: 10,                   // CONFIRM: joinery guarantee length

  // Delivery map. "all" lights every state; or list state ids, e.g. ["lagos", "ogun", "oyo", "fct"]
  // Ids: abia adamawa akwa-ibom anambra bauchi bayelsa benue borno cross-river delta ebonyi edo ekiti
  //      enugu fct gombe imo jigawa kaduna kano katsina kebbi kogi kwara lagos nassarawa niger ogun
  //      ondo osun oyo plateau rivers sokoto taraba yobe zamfara
  deliveryStates: "all",                // CONFIRM
  installStates: [],                    // CONFIRM: states where the team also installs on site (shown brighter)

  // Workshop opening hours (Lagos time), used for the live "open / closed" clock on the opening screen.
  // Days: 0 = Sunday … 6 = Saturday. Keep in step with the hours shown in the contact section.
  hours: { days: [1, 2, 3, 4, 5, 6], open: 8, close: 18 },

  // Greetings used on the opening screen and at the start of WhatsApp messages
  greetings: {
    en: { label: "English", hello: "Hello", welcome: "Welcome" },
    yo: { label: "Yorùbá",  hello: "Ẹ n lẹ́ o", welcome: "Ẹ káàbọ̀" },
    ig: { label: "Igbo",    hello: "Ndewo",    welcome: "Nnọọ" },
    ha: { label: "Hausa",   hello: "Sannu",    welcome: "Barka da zuwa" },
  },
};
