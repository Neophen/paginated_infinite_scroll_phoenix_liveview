import { Component } from "../utils/component";
import { intersectionObserver } from "../utils/observer.utils";
import type { Response } from "../types";

type Props<T> = {
  itemMargin: number;
  pageSize: number;
  startPage?: number;
  load: (start: number, limit: number) => Promise<Response<T>>;
  initLoad: (start: number, limit: number) => Promise<Response<T>>;
  renderItem: (item: T) => string;
  updateItem: (element: HTMLElement, datum: T) => HTMLElement;
  afterInit: () => void;
};

type State = {
  prevCursor: number;
  nextCursor: number | null;
  end: number;
  start: number;
};

const ScrollDirection = {
  UP: "UP",
  DOWN: "DOWN"
} as const;

type ScrollDirectionType = keyof typeof ScrollDirection

const ABSOLUTE_CENTER = "absolute mx-auto left-0 right-0 top-0";

type ListItemElement = HTMLElement & {
  dataset: {
    listOrder: string;
    translateY: string;
  };
};

export class VirtualListComponent<T> extends Component<Props<T>, State> {
  TOP_OBSERVER_ELEMENT: HTMLElement;
  BOTTOM_OBSERVER_ELEMENT: HTMLElement;
  ELEMENTS_LIMIT = this.props.pageSize * 2;
  ELEMENTS_POOL: ListItemElement[] = [];
  state: State = {
    prevCursor: 0,
    nextCursor: 0,
    start: 0,
    end: 0,
  };

  async init(): Promise<void> {
    const classes = "relative"
    let initialized = false;
    this.element.classList.add(...classes.split(" "));

    this.element.style.paddingTop = "0px";
    this.element.style.paddingBottom = "0px";
    const { startPage, pageSize } = this.props;

    if (startPage && startPage > 0) {
      const start = startPage >= pageSize ? startPage - pageSize : startPage;
      const limit = pageSize * 2;

      const {
        chunk,
        prev_cursor: prevCursor,
        next_cursor: nextCursor,
      } = await this.props.initLoad(start, limit);

      this.#initElementsPool(start, chunk, limit);

      const newPageSize = nextCursor === null ? pageSize : limit

      this.state.start = start;
      this.state.end = start + newPageSize;
      this.state.prevCursor = prevCursor;
      this.state.nextCursor = nextCursor;
    }

    [this.TOP_OBSERVER_ELEMENT] = intersectionObserver({
      root: this.root,
      callback: ([entry]) => {

        if (initialized && entry.intersectionRatio > 0.1) {
          this.update(ScrollDirection.UP);
        }
      },
      elementConfig: { className: `bg-red-500 ${ABSOLUTE_CENTER}` }
    });

    [this.BOTTOM_OBSERVER_ELEMENT] = intersectionObserver({
      root: this.root,
      callback: ([entry]) => {
        if (initialized && entry.intersectionRatio > 0.1) {
          this.update(ScrollDirection.DOWN);
        }
      },
      elementConfig: { className: `bg-blue-500 ${ABSOLUTE_CENTER}` }
    });

    if (startPage && startPage > 0) {
      this.props.afterInit();

      const firstElementTranslateY = this.ELEMENTS_POOL[0].dataset.translateY;
      const diff = +firstElementTranslateY - this.#paddingTop();

      this.element.style.paddingBottom = `${Math.max(0, this.#paddingBottom() - diff)}px`;
      this.element.style.paddingTop = `${firstElementTranslateY}px`;

      this.TOP_OBSERVER_ELEMENT.style.transform = `translateY(${firstElementTranslateY}px)`;
      this.BOTTOM_OBSERVER_ELEMENT.style.transform = `translateY(${getLast(this.ELEMENTS_POOL).dataset.translateY}px)`;

    }

    initialized = true;
  }

  getComponentId(): string {
    return "virtual-list";
  }

  update(trigger: ScrollDirectionType) {
    switch (trigger) {
      case ScrollDirection.UP:
        this.#handleTopIntersection();
        break;
      case ScrollDirection.DOWN:
        this.#handleBottomIntersection();
        break;
    }
  }

  async #handleTopIntersection() {
    if (this.state.start <= 0) {
      return;
    }

    const { pageSize } = this.props;

    const {
      chunk,
      prev_cursor: prevCursor,
      next_cursor: nextCursor,
    } = await this.props.load(this.state.start - pageSize, pageSize);
    this.state.prevCursor = prevCursor;
    this.state.nextCursor = nextCursor;
    // Update start and end position
    this.state.start -= pageSize;
    this.state.end -= pageSize;

    // Trigger recycling
    this.#handleRecycleUp(chunk);
    // Get the current first element Y Position
    const firstElementTranslateY = this.ELEMENTS_POOL[0].dataset.translateY;
    // The diff between old and new first element position is the value
    // that we need to subtract from the bottom spacer
    const diff = +firstElementTranslateY - this.#paddingTop();

    this.element.style.paddingBottom = `${Math.max(0, this.#paddingBottom() - diff)}px`;
    this.element.style.paddingTop = `${firstElementTranslateY}px`;

    // Move observers to 1st and last rendered item respectively
    this.TOP_OBSERVER_ELEMENT.style.transform = `translateY(${firstElementTranslateY}px)`;
    this.BOTTOM_OBSERVER_ELEMENT.style.transform = `translateY(${getLast(this.ELEMENTS_POOL).dataset.translateY}px)`;
  };

  #handleRecycleUp(chunk: T[]) {
    const { updateItem, itemMargin, pageSize } = this.props;
    const start = this.state.start;

    // Get the first element from the pool to determine the right position
    let firstCurrentElement = this.ELEMENTS_POOL[0];
    // Select last props.pageSize items from buffer zone
    for (let i = this.ELEMENTS_LIMIT - 1; i >= pageSize; i--) {
      const element = this.ELEMENTS_POOL[i];

      element.style.display = "grid";
      element.dataset.listOrder = `${start + (i - pageSize)}`;

      updateItem(element, chunk[i - pageSize]);
      // Update the item position
      const nextFirstPositionY = +firstCurrentElement.dataset.translateY - itemMargin - element.getBoundingClientRect().height;

      element.style.transform = `translateY(${nextFirstPositionY}px)`;
      // Store it for easy access in the next iteration
      element.dataset.translateY = `${nextFirstPositionY}`;
      // Update last element reference and position
      firstCurrentElement = element;

    }

    // Sort pool according to elements order
    this.ELEMENTS_POOL = this.ELEMENTS_POOL.sort((a, b) => {
      return +a.dataset.listOrder - +b.dataset.listOrder;
    });
  }

  async #handleBottomIntersection() {
    const { pageSize } = this.props;
    if (this.state.nextCursor === null) {
      return;
    }

    const count = this.state.end - this.state.start;

    const {
      chunk,
      prev_cursor: prevCursor,
      next_cursor: nextCursor,
    } = await this.props.load(this.state.end, pageSize);

    this.state.prevCursor = prevCursor;
    this.state.nextCursor = nextCursor;


    if (count < this.ELEMENTS_LIMIT) {
      this.state.end += pageSize;
      this.#initElementsPool(this.state.start, chunk);
    } else {
      this.state.start += pageSize;
      this.state.end += pageSize;
      this.#handleRecycleDown(chunk);

      const paddingTop = this.#paddingTop();
      const paddingBottom = this.#paddingBottom();

      const firstY = +this.ELEMENTS_POOL[0].dataset.translateY;
      const diff = firstY - paddingTop;

      this.element.style.paddingTop = `${firstY}px`;
      this.element.style.paddingBottom = `${Math.max(0, paddingBottom - diff)}px`;

      this.TOP_OBSERVER_ELEMENT.style.transform = `translateY(${firstY}px)`;
    }

    const lastItem = getLast(this.ELEMENTS_POOL);
    this.BOTTOM_OBSERVER_ELEMENT.style.transform = `translateY(${lastItem.dataset.translateY}px)`;


  };


  #handleRecycleDown(chunk: T[]) {
    const { updateItem, itemMargin, pageSize } = this.props;
    const chunkLength = chunk.length;
    let lastEl = getLast(this.ELEMENTS_POOL);
    let lastElY = +lastEl.dataset.translateY + lastEl.getBoundingClientRect().height + itemMargin;

    for (let i = 0; i < pageSize; i++) {
      const element = this.ELEMENTS_POOL[i];
      element.dataset.listOrder = `${this.state.prevCursor + i}`;

      if (i >= chunkLength) {
        element.dataset.translateY = `${lastElY}`;
        lastEl = element;
        element.style.display = "none";
      } else {
        element.style.display = "grid";
        updateItem(element, chunk[i]);
        element.style.transform = `translateY(${lastElY}px)`;
        element.dataset.translateY = `${lastElY}`;
        lastEl = element;
        lastElY = +lastEl.dataset.translateY + lastEl.getBoundingClientRect().height + itemMargin;
      }
    }

    this.ELEMENTS_POOL.sort((a, b) => +a.dataset.listOrder - +b.dataset.listOrder);
  }


  #initElementsPool(start: number, chunk: T[], limit?: number): void {
    const totalElements = limit ?? chunk.length;

    const elements = Array(totalElements).fill(null).map((_, i) => {
      const element = document.createElement("div");
      element.innerHTML = this.props.renderItem(chunk[i]);

      const itemElement = element.firstElementChild as ListItemElement;
      itemElement.classList.add(...ABSOLUTE_CENTER.split(" "));
      itemElement.dataset.listOrder = `${start + i}`;
      itemElement.dataset.translateY = `${0}`;

      return element.firstElementChild as ListItemElement;
    });

    this.ELEMENTS_POOL.push(...elements);
    this.element.append(...elements);

    const paddingTop = this.#paddingTop();

    for (const element of elements) {
      if (element.previousSibling === null) {
        const height = element.getBoundingClientRect().height;
        const translateY = height * start + this.props.itemMargin * start + paddingTop;
        element.style.transform = `translateY(${translateY}px)`;
        element.dataset.translateY = `${translateY}`;
      } else {
        const siblingElement = element.previousElementSibling as ListItemElement;
        const siblingHeight = siblingElement.getBoundingClientRect().height;

        const siblingTranslateY = +siblingElement.dataset.translateY;
        let translateY = siblingHeight + siblingTranslateY + this.props.itemMargin;
        if (siblingHeight === 0) {
          translateY = siblingTranslateY;
        }

        element.style.transform = `translateY(${translateY}px)`;
        element.dataset.translateY = `${translateY}`;
      }
    }
  }

  #paddingTop = (): number => {
    return +this.element.style.paddingTop.replace("px", "");
  }

  #paddingBottom = (): number => {
    return +this.element.style.paddingBottom.replace("px", "");
  }
}




const getLast = <T>(array: T[]): T => {
  return array[array.length - 1];
}
