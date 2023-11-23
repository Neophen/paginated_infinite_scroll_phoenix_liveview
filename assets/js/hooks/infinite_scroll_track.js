
const InfiniteScrollTrack = {
  container: null,
  childObserver: null,
  mounted() {
    if (!this.el) return;

    this.onChildrenChanged = this.onChildrenChanged.bind(this);
    this.init = this.init.bind(this);

    const firstPage = this.init();

    // Scroll to the top of the page if we are not on the first page
    if (firstPage > 1) {
      this.container.firstElementChild?.scrollIntoView();
    }
  },
  updated() {
    if (!this.el) return;
    this.childObserver?.disconnect();
    const containerId = this.el.dataset.containerId ?? null;
    this.container = document.getElementById(containerId);

    this.childObserver = createChildObserver(
      this.container,
      this.onChildrenChanged
    );
    this.onChildrenChanged();
  },
  destroyed() {
    this.childObserver?.disconnect();
  },
  init() {
    const containerId = this.el.dataset.containerId ?? null;
    this.container = document.getElementById(containerId);

    this.childObserver = createChildObserver(
      this.container,
      this.onChildrenChanged
    );

    return this.onChildrenChanged();
  },
  onChildrenChanged() {
    // A "data-page" attribute is required on the elements
    const firstPage = this.container.firstElementChild?.dataset.page ?? 1;
    const lastPage = this.container.lastElementChild?.dataset.page ?? 1;

    const url = new URL(document.URL);
    // Make sure to use the same query params separator in the handle_params
    const page = `${firstPage}-${lastPage}`;
    url.searchParams.set("page", page);
    history.replaceState(null, "", url.href);

    return firstPage
  },
};

const createChildObserver = (container, onChange) => {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        onChange();
        return;
      }
    }
  });

  observer.observe(container, {
    childList: true,
  });

  return observer;
};

export default InfiniteScrollTrack;
