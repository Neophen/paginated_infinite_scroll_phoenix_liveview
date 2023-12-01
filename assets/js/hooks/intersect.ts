
const defaultConfig = {
  root: null, // window by default
  rootMargin: '400px',
  threshold: 0.1
};

const Intersect = {
  observer: null,
  value: null,
  mounted() {
    if (!this.el) return;

    this.value = this.el.getAttribute("data-value");

    this.observer = createObserver(this.el, ([entry]) => {
      if (entry.isIntersecting) {
        this.pushEvent("intersect", { value: this.value });
      }
    }, defaultConfig);
  },
  updated() {
    // if (!this.el) return;
    // this.value = this.el.getAttribute("data-value");
    // this.observer?.disconnect();
    // this.observer = createObserver(this.el, ([entry]) => {
    //   if (entry.isIntersecting) {
    //     this.pushEvent("intersect", { value: this.value });
    //   }
    // }, defaultConfig);
  },
  destroyed() {
    this.observer?.disconnect();
  },
};

const createObserver = (el, callback, config) => {
  const observer = new IntersectionObserver(callback, config);
  observer.observe(el);
  return observer;
}

export default Intersect;
