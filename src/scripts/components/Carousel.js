import Swiper from 'swiper/bundle';
export default class Carousel {
  constructor(element) {
    this.element = element;

    this.init();
  }
  init() {
    const swiper = new Swiper(this.element, {
      direction: 'vertical',
      pagination: {
        el: '.swiper-pagination',
      },
    });
  }
}
