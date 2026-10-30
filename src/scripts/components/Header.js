export default class Header {
  constructor(element) {
    this.element = element;

    this.init();
  }
  init() {
    window.addEventListener('scroll', this.update.bind(this), { passive: true });
    this.update();
  }
  update() {
    // Ajoute une ombre dès qu'on a défilé un peu
    this.element.classList.toggle('is-scrolled', window.scrollY > 10);
  }
}
