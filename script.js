// WhatsApp number for enquiries (country code + number, digits only). Update with the real office number.
const WHATSAPP_NUMBER = '918584242019';

const burger = document.querySelector('.burger');
const menu = document.getElementById('menu');
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});
menu.addEventListener('click', e => { if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });

window.addEventListener('scroll', () => document.querySelector('.nav').classList.toggle('solid', scrollY > 30));

const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

document.getElementById('yr').textContent = new Date().getFullYear();

document.getElementById('enquiry').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const text = `Hello, I'm ${f.get('name')} (${f.get('phone')}). Enquiry for ${f.get('inst')}. ${f.get('msg') || ''}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
});
