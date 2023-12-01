import type { FeedItem } from "../types";

const safeSelect = <T extends HTMLElement>(element: HTMLElement, selector: string): T => {
  const el = element.querySelector<T>(selector);
  if (!el) {
    console.log(element)
    throw new Error(`Selector ${selector} not found in element:`);
  }
  return el;
}



const renderItem = (item: FeedItem) => {
  return `<div class="item" >
  <div class="relative divide-y border">
    <a href="${item.link}" class="item-link group/product">
      <div class="overflow-hidden">
        <img
          src="${item.src}"
          alt=""
          class="item-image x-image aspect-square w-full object-cover transition-transform group-hover/product:scale-[1.2]"
        />
      </div>
      <div ${item.sold && "data-sold"} class="item-sold hidden data-[sold]:block bg-black text-white pointer-events-none absolute top-4 right-0 px-4 py-1 text-center sm:text-sm ">
        Sold!
      </div>
    </a>
    <div class="bg-white w-full px-4 py-2 text-left">
      <p class="item-price text-xl font-bold text-slate-900">
        ${item.price}
      </p>
      <button
        type="button"
        class="text-caption-2 text-slate-500 inline-flex items-center gap-px hover:underline"
      >
        <span class="item-full-price">${item.full_price}</span> ☑︎
      </button>
    </div>
  </div>
</div>`.trim();
};


const updateItem = (
  element: HTMLElement,
  item?: FeedItem
) => {
  if (!item) {
    element.style.display = "none";
    return element;
  }

  const { src, link, price, full_price, sold } = item;

  // element.style.display = null;
  safeSelect<HTMLImageElement>(element, ".item-image").src = src;
  safeSelect<HTMLAnchorElement>(element, ".item-link").href = link;
  safeSelect(element, ".item-price").innerHTML = price;
  safeSelect(element, ".item-full-price").innerHTML = full_price;
  const soldElement = safeSelect(element, ".item-sold");

  if (sold) {
    soldElement.dataset.sold = "true";
  } else {
    delete soldElement.dataset.sold;
  }

  return element;
};


export const renderProductRow = (items: FeedItem[]) => {
  return `
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    ${items.map(renderItem).join("")}
  </div>
  `.trim();
};


export const updateProductRow = (element: HTMLElement, data: FeedItem[]) => {
  const itemElements = element.querySelectorAll<HTMLDivElement>(".item");
  itemElements.forEach((el, index) => {
    updateItem(el, data[index]);
  });

  return element;
}
