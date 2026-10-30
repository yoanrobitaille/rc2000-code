export default class Scrolly {
  constructor(element) {
    this.element = element;
    this.options = {
      rootMargin: '0px',
    };

    this.init();
  }
  init() {
    const observer = new IntersectionObserver(
      this.watch.bind(this),
      this.options,
    );

    const items = this.element.querySelectorAll('[data-scrolly]');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      //console.log(item);
      observer.observe(item);
    }
  }
  watch(entries, observer) {
    //console.log(entries);
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const target = entry.target;

      if (entry.isIntersecting) {
        //console.log('oui');
        target.classList.add('is-active');

        if (this.element.hasAttribute('data-no-repeat')) {
          // Enleve les animation lorsqu'on remonte
          observer.unobserve(target);
        }
      } else {
        //console.log('non');
        if (!this.element.hasAttribute('data-no-repeat')) {
          target.classList.remove('is-active');
        }
      }
    }
  }
}
