// Public-facing offer data only. Internal gift costs deliberately never enter HTML.
export const GIFTS = [
  { id: 'envio', name: 'Envío gratis', value: 15000, level: 1 },
  { id: 'perfume', name: 'Perfume capilar · 30 ml', value: 29900, level: 2 },
  { id: 'scrunchie', name: 'Scrunchie', value: 12900, level: 2, color: true },
  { id: 'termoprotector', name: 'Termoprotector capilar', value: 29900, level: 3 },
  { id: 'reparador', name: 'Reparador de puntas', value: 29900, level: 3 },
];
export const BONUS = { id: 'gorro', name: 'Gorro de satín', value: 39900, color: true };
export const PLANS = [
  { qty: 1, price: 139900, unit: 139900, gifts: 1, giftValue: 15000, label: 'Tu primer paso', badge: '' },
  { qty: 2, price: 199900, unit: 99950, gifts: 3, giftValue: 57800, label: 'Hazlo parte de tu día', badge: 'MÁS ELEGIDO' },
  { qty: 3, price: 249900, unit: 83300, gifts: 5, giftValue: 117600, label: 'Dale tiempo a tu rutina', badge: 'TODOS LOS REGALOS' },
];
export const money = n => '$' + n.toLocaleString('es-CO');
export const SLUG = 'dermafol-360-brand';
export const PAGE_ID = 'pag_dermafol_brand_private';
export const TITLE = 'Dermafol 360° — Brand Ritual · versión privada';
export const TIMELINE = [
  { title: 'Primero, un hábito que sí puedes sostener.', label: 'Semanas 1–2', tag: 'CONOCE TU PUNTO DE PARTIDA', text: 'Integra los dos pasos a tu día. En esta etapa no necesitas buscar cambios visibles: empieza por conocer tu cabello y ser constante.', tip: 'Toma una foto inicial de tu raya con luz natural. Será tu referencia.', image: 'mujer-producto' },
  { title: 'Observa tu cabello, sin perseguir el calendario.', label: 'Semanas 3–4', tag: 'PEQUEÑAS SEÑALES', text: 'Fíjate en cómo se siente tu cabello y en la cantidad que queda en el cepillo. Puede haber variaciones de un día a otro; ninguna semana garantiza un resultado.', tip: 'Anota lo que observas una vez por semana, siempre con la misma rutina.', image: 'aplicando-rollon' },
  { title: 'Compara tu progreso con perspectiva.', label: 'Semanas 5–8', tag: 'CONSTANCIA QUE SE ACOMPAÑA', text: 'Algunas clientas describen menos caída tras varias semanas de uso. Tu respuesta puede ser distinta: compara tus fotos, no tu evolución con la de otra persona.', tip: 'Usa la misma luz, el mismo ángulo y el cabello seco al fotografiarlo.', image: 'hero-mujer' },
  { title: 'Haz un balance. Tu cabello marca su ritmo.', label: 'Semanas 9–12', tag: 'TU MOMENTO DE REVISAR', text: 'Revisa tus fotos y notas: caída percibida, aspecto y sensación de densidad. Los cambios pueden necesitar más tiempo y dependen de la causa de la caída.', tip: 'Si la caída persiste o empeora, consulta con un dermatólogo.', image: 'suplemento-abierto' },
];
