defmodule PaginatedInfiniteScrollPhoenixLiveviewWeb.ListLive.Show do
  use PaginatedInfiniteScrollPhoenixLiveviewWeb, :live_view

  @total 10_001
  @products Enum.map(0..@total, fn i ->
              %{
                id: "product-#{i}",
                index: i,
                title: "Products #{i}",
                content: "Some content #{i}",
                price: i,
                tax: 20
              }
            end)

  def mount(params, _session, socket) do
    id = String.to_integer(params["id"] || "1")

    products = Enum.slice(@products, id - 1, 1) |> List.first()

    socket =
      socket
      |> assign(:products, products)

    {:ok, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="mt-4 space-y-4 bg-white p-8 rounded-2xl">
      <div class="flex gap-4">
        <.button onclick="window.history.go(-1); return false;">Back</.button>
        <h1 class="text-4xl text-rose-600 font-bold"><%= @products.title %></h1>
      </div>

      <p><%= @products.content %></p>
    </div>
    """
  end
end
