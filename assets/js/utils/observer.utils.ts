type TElementConfig = {
  className?: string;
  insertPosition?: InsertPosition;
  tag?: keyof HTMLElementTagNameMap;
};

type IntersectionObserverArgs = {
  root: HTMLElement;
  callback: IntersectionObserverCallback;
  observerConfig?: IntersectionObserverInit;
  elementConfig?: TElementConfig;
}

const defaultObserverConfig: IntersectionObserverInit = { threshold: 0.25 };

// /**
//  * @param root - Root element where we want to insert the newly created element
//  * @param callback - callback function that is called when the viewport is intersected with element
//  * @param observerConfig - {@link IntersectionObserverInit} - init config for Intersection Observer
//  * @param elementConfig  - utility attributes for HTMLElement
//  */
export function intersectionObserver({ root, callback, observerConfig, elementConfig }: IntersectionObserverArgs): [HTMLElement, IntersectionObserver] {
  const className = elementConfig?.className ?? "";
  const insertPosition = elementConfig?.insertPosition ?? "beforeend";
  const tag = elementConfig?.tag ?? "div";

  observerConfig = Object.assign(observerConfig ?? {}, defaultObserverConfig);
  const observer = new IntersectionObserver(callback, observerConfig); // init observer
  const element = document.createElement(tag); // Create a target element

  const defaultClass = "w-full h-12 mx-auto";
  const classes = [...defaultClass.split(" "), ...className.split(" ")].filter(Boolean);
  element.classList.add(...classes); // Add utility classname to the target element
  root.insertAdjacentElement(insertPosition, element); // Insert the target element into DOM
  setTimeout(() => observer.observe(element), 100); // Observer intersection of target element with viewport
  return [element, observer]; // Return target element and observer object
}
