import { Component } from "../utils/component";
import { intersectionObserver } from "../utils/observer.utils";
import type { Response } from "../types";

type Props<T> = {
  itemMargin: number;
  pageSize: number;
  load: (start: number, limit: number) => Promise<Response<T>>;
  templateFn: (item: T) => string;
  updateFn: (element: HTMLElement, datum: T) => HTMLElement;
};

type State = {
  prevCursor: number;
  nextCursor?: number;
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
  state = {
    prevCursor: 0,
    nextCursor: 0,
  };

  init(): void {
    const classes = "relative"
    this.element.classList.add(...classes.split(" "));

    this.element.style.paddingTop = "0px";
    this.element.style.paddingBottom = "0px";



    [this.TOP_OBSERVER_ELEMENT] = intersectionObserver({
      root: this.root,
      callback: async ([entry]) => {
        if (entry.intersectionRatio > 0.1) {
          await this.update(ScrollDirection.UP);
        }
      },
      elementConfig: { className: `bg-red-500 ${ABSOLUTE_CENTER}` }
    });

    [this.BOTTOM_OBSERVER_ELEMENT] = intersectionObserver({
      root: this.root,
      callback: async ([entry]) => {
        if (entry.intersectionRatio > 0.1) {
          await this.update(ScrollDirection.DOWN);
        }
      },
      elementConfig: { className: `bg-blue-500 ${ABSOLUTE_CENTER}` }
    });
  }

  getComponentId(): string {
    return "virtual-list";
  }

  async update(trigger: ScrollDirectionType) {
    switch (trigger) {
      case ScrollDirection.UP:
        await this.#handleTopIntersection();
        break;
      case ScrollDirection.DOWN:
        await this.#handleBottomIntersection();
        break;
    }
  }

  #handleRecycleUp(chunk: T[]) {
    const { updateFn, itemMargin, pageSize } = this.props;
    const chunkLength = chunk.length;
    // Get the first element from the pool to determine the right position
    let firstCurrentElement = this.ELEMENTS_POOL[0];
    // Select last props.pageSize items from buffer zone
    for (let i = this.ELEMENTS_LIMIT - 1; i >= pageSize; i--) {
      const page = this.ELEMENTS_LIMIT - i - 1;
      console.log("page", page)

      const element = this.ELEMENTS_POOL[i];
      // Update ordering attribute
      element.dataset.listOrder = `${this.state.start + (i - pageSize)}`;

      if (page > chunkLength - 1) {

      } else {
        // Update the item content
        updateFn(element, chunk[i - pageSize]);
        // Update the item position
        const nextFirstPositionY = +firstCurrentElement.dataset.translateY - itemMargin - element.getBoundingClientRect().height;

        element.style.transform = `translateY(${nextFirstPositionY}px)`;
        // Store it for easy access in the next iteration
        element.dataset.translateY = `${nextFirstPositionY}`;
        // Update last element reference and position
        firstCurrentElement = element;
      }
    }

    // Sort pool according to elements order
    this.ELEMENTS_POOL = this.ELEMENTS_POOL.sort((a, b) => {
      return +a.dataset.listOrder - +b.dataset.listOrder;
    });
  }

  #handleTopIntersection = async () => {
    // Move top and bottom observers
    if (this.state.prevCursor <= 0) { return; }

    const { pageSize } = this.props;
    const {
      chunk,
      prev_cursor: prevCursor,
      next_cursor: nextCursor,
      size
    } = await this.props.load(this.state.prevCursor, pageSize);
    this.state.prevCursor = prevCursor;
    this.state.nextCursor = nextCursor;
    // Trigger recycling
    this.#handleRecycleUp(chunk);
    // Get the current first element Y Position
    const firstElementTranslateY = this.ELEMENTS_POOL[0].dataset.translateY;
    console.log("firstElement", this.ELEMENTS_POOL[0])
    // The diff between old and new first element position is the value
    // that we need to subtract from the bottom spacer
    const diff =
      +firstElementTranslateY -
      +this.element.style.paddingTop.replace("px", "");
    this.element.style.paddingBottom = `${Math.max(
      0,
      +this.element.style.paddingBottom.replace("px", "") - diff
    )}px`;
    this.element.style.paddingTop = `${firstElementTranslateY}px`;
    // Move observers to 1st and last rendered item respectively
    this.TOP_OBSERVER_ELEMENT.style.transform = `translateY(${firstElementTranslateY}px)`;
    this.BOTTOM_OBSERVER_ELEMENT.style.transform = `translateY(${getLast(this.ELEMENTS_POOL).dataset.translateY}px)`;

  };

  #handleBottomIntersection = async () => {
    if (this.state.nextCursor === null) {
      return;
    }

    const {
      chunk,
      next_cursor: nextCursor,
      prev_cursor: prevCursor,
      size,
    } = await this.props.load(this.state.nextCursor, this.props.pageSize);

    this.state.prevCursor = prevCursor;
    this.state.nextCursor = nextCursor;

    if (size < this.ELEMENTS_LIMIT) {
      this.#initElementsPool(chunk);
    } else if (count === this.ELEMENTS_LIMIT) {
      this.state.start += nextSize;
      this.state.end += nextSize;
      this.#handleRecycleDown(data);

      const firstY = +this.ELEMENTS_POOL[0].dataset.translateY;
      const { paddingTop, paddingBottom } = this.element.style;
      const diff = firstY - +paddingTop.replace("px", "");
      this.element.style.paddingTop = `${firstY}px`;
      this.element.style.paddingBottom = `${Math.max(0, +paddingBottom.replace("px", "") - diff)}px`;
      this.TOP_OBSERVER_ELEMENT.style.transform = `translateY(${firstY}px)`;
    }

    const lastItem = getLast(this.ELEMENTS_POOL);
    this.BOTTOM_OBSERVER_ELEMENT.style.transform = `translateY(${lastItem.dataset.translateY}px)`;
  };


  #handleRecycleDown(chunk: T[]) {
    const { updateFn, itemMargin, pageSize } = this.props;
    const chunkLength = chunk.length;
    let lastEl = getLast(this.ELEMENTS_POOL);
    let lastElY = +lastEl.dataset.translateY + lastEl.getBoundingClientRect().height + itemMargin;

    for (let i = 0; i < pageSize; i++) {
      const element = this.ELEMENTS_POOL[i];
      element.dataset.listOrder = `${this.state.start + pageSize + i}`;

      if (i >= chunkLength) {
        element.style.display = "none";
        element.dataset.translateY = `${lastElY}`;
        lastEl = element;
        lastElY = +lastEl.dataset.translateY + lastEl.getBoundingClientRect().height + itemMargin;
      } else {
        element.style.display = "grid";
        updateFn(element, chunk[i]);
        element.style.transform = `translateY(${lastElY}px)`;
        element.dataset.translateY = `${lastElY}`;
        lastEl = element;
        lastElY = +lastEl.dataset.translateY + lastEl.getBoundingClientRect().height + itemMargin;
      }
    }

    this.ELEMENTS_POOL.sort((a, b) => +a.dataset.listOrder - +b.dataset.listOrder);
  }


  #initElementsPool(chunk: T[]): void {
    const elements = chunk.map((d, i) => {
      const element = document.createElement("div");
      element.innerHTML = this.props.templateFn(d);
      const itemElement = element.firstElementChild as ListItemElement;
      // Add absolute positioning to each list item
      itemElement.classList.add(...ABSOLUTE_CENTER.split(" "));
      // Set up virtual list order attribute
      itemElement.dataset.listOrder = `${this.ELEMENTS_POOL.length + i}`;
      // Initialize translateY attribute
      itemElement.dataset.translateY = `${0}`;
      return element.firstElementChild as ListItemElement;
    });

    this.ELEMENTS_POOL.push(...elements);
    this.element.append(...elements);

    for (const element of elements) {
      if (element.previousSibling !== null) {
        // Getting the previous element if exists
        const siblingElement = element.previousElementSibling as ListItemElement;
        // Getting the previous element height
        const siblingHeight = siblingElement.getBoundingClientRect().height;
        // Getting the previous element translateY
        const siblingTranslateY = +siblingElement.dataset.translateY;
        // Calculating the position of current element
        const translateY =
          siblingHeight + siblingTranslateY + this.props.itemMargin;
        // Moving element
        element.style.transform = `translateY(${translateY}px)`;
        // Store the position in data attribute
        element.dataset.translateY = `${translateY}`;
      }
    }
  }
}


const getLast = <T>(array: T[]): T => {
  return array[array.length - 1];
}
