defmodule PaginatedInfiniteScrollPhoenixLiveviewWeb.ListLive.Index do
  use PaginatedInfiniteScrollPhoenixLiveviewWeb, :live_view

  @total 10_001
  @products Enum.map(0..@total, fn i ->
              %{
                price: "#{i}",
                link: "/#{i}",
                full_price: "#{i + 20}",
                sold: rem(i, 2) == 0,
                src:
                  "https://ucarecdn.com/59bb7a75-8065-4b6b-af93-80ce21648cfc/-/format/auto/-/quality/smart/-/scale_crop/380x380/smart_objects_faces_points/center/"
              }
            end)

  @spec render(assigns :: map()) :: Rendered.t()
  def render(assigns) do
    ~H"""
    <div class="bg-white p-4">
      <div class="relative">
        <div id="infinite-scroll" phx-hook="InfiniteScroll" />
      </div>
    </div>
    """
  end

  def mount(_params, _session, socket) do
    products = @products

    socket =
      socket
      |> assign(:products, products)

    {:ok, socket}
  end

  def handle_event("load", params, socket) do
    %{
      "start" => start,
      "limit" => limit
    } = params

    {:reply, load(start, limit), socket}
  end

  defp load(start, limit) when start > @total do
    %{
      chunk: [],
      next_cursor: nil,
      prev_cursor: -limit,
      size: 0
    }
  end

  defp load(start, limit) do
    chunk = Enum.slice(@products, start, limit)

    next_cursor = if(length(chunk) == limit, do: start + limit, else: nil)

    %{
      chunk: chunk,
      next_cursor: next_cursor,
      prev_cursor: start,
      size: length(chunk)
    }
  end

  attr(:id, :string, required: true)
  attr(:product, :map, required: true)

  @spec product_card(assigns :: map()) :: Rendered.t()
  def product_card(%{product: %{price: price, tax: tax}} = assigns) do
    assigns = assign(assigns, :total_price, price + tax)

    ~H"""
    <div id={@id}>
      <div class="relative divide-y border">
        <.link navigate={~p"/#{@product.index}"} class="group/product">
          <div class="overflow-hidden h-12">
            <img
              src="https://ucarecdn.com/59bb7a75-8065-4b6b-af93-80ce21648cfc/-/format/auto/-/quality/smart/-/scale_crop/380x380/smart_objects_faces_points/center/"
              alt=""
              class="x-image aspect-square w-full object-cover transition-transform group-hover/product:scale-[1.2]"
            />
          </div>
          <div class=" bg-black text-white pointer-events-none absolute top-4 right-0 px-4 py-1 text-center sm:text-sm ">
            <%= dgettext("product_card", "Sold!") %>
          </div>
        </.link>
        <div class="bg-white w-full px-4 py-2 text-left">
          <p class="text-xl font-bold text-slate-900">
            <%= @product.price %>
          </p>
          <button
            type="button"
            class="text-caption-2 text-slate-500 inline-flex items-center gap-px hover:underline"
          >
            <%= "#{@total_price} Incl." %> ☑︎
          </button>
        </div>
      </div>
    </div>
    """
  end
end
