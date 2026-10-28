import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  createPurchaseOrder,
  decideMaterialRequest,
  decidePurchaseOrder,
  getPurchasingSettings,
  listLocations,
  listMaterialRequests,
  listPurchaseOrders,
  listStock,
  listStockItems,
  listStockMovements,
  type ListStockMovementsParams,
  type ListStockParams,
} from "@/lib/api/inventory";
import type { Decision, MaterialRequest, PurchaseOrder } from "@/lib/api/types";
import { refreshApprovalCounts } from "@/lib/queries/dashboard";

/** Lookups that change rarely (the catalogue, the stores, the rules) are kept fresh for longer. */
const LOOKUP_STALE_TIME = 5 * 60_000;

export const inventoryQueries = {
  all: () => ["inventory"] as const,
  stock: (params: ListStockParams = {}) =>
    queryOptions({
      queryKey: [...inventoryQueries.all(), "stock", params],
      queryFn: ({ signal }) => listStock(params, { signal }),
    }),
  items: () =>
    queryOptions({
      queryKey: [...inventoryQueries.all(), "items"],
      queryFn: ({ signal }) => listStockItems({ signal }),
      staleTime: LOOKUP_STALE_TIME,
    }),
  locations: () =>
    queryOptions({
      queryKey: [...inventoryQueries.all(), "locations"],
      queryFn: ({ signal }) => listLocations({ signal }),
      staleTime: LOOKUP_STALE_TIME,
    }),
  movements: (params: ListStockMovementsParams = {}) =>
    queryOptions({
      queryKey: [...inventoryQueries.all(), "movements", params],
      queryFn: ({ signal }) => listStockMovements(params, { signal }),
    }),
  purchasingSettings: () =>
    queryOptions({
      queryKey: [...inventoryQueries.all(), "purchasing-settings"],
      queryFn: ({ signal }) => getPurchasingSettings({ signal }),
      staleTime: LOOKUP_STALE_TIME,
    }),
  materialRequests: () =>
    queryOptions({
      queryKey: [...inventoryQueries.all(), "material-requests"],
      queryFn: ({ signal }) => listMaterialRequests({ signal }),
    }),
  purchaseOrders: () =>
    queryOptions({
      queryKey: [...inventoryQueries.all(), "purchase-orders"],
      queryFn: ({ signal }) => listPurchaseOrders({ signal }),
    }),
};

export const useStockLevels = (params?: ListStockParams) =>
  useSuspenseQuery(inventoryQueries.stock(params));

export const useStockItems = () => useSuspenseQuery(inventoryQueries.items());

export const useLocations = () => useSuspenseQuery(inventoryQueries.locations());

export const useStockMovements = (params?: ListStockMovementsParams) =>
  useSuspenseQuery(inventoryQueries.movements(params));

export const usePurchasingSettings = () => useSuspenseQuery(inventoryQueries.purchasingSettings());

export const useMaterialRequests = () => useSuspenseQuery(inventoryQueries.materialRequests());

export const usePurchaseOrders = () => useSuspenseQuery(inventoryQueries.purchaseOrders());

/** Put an updated record into a cached list in place, so the row changes before the refetch lands. */
function replaceIn<T extends { id: string }>(list: T[] | undefined, updated: T) {
  return list?.map((entry) => (entry.id === updated.id ? updated : entry));
}

/**
 * Approve or reject a material request. Waits for the server, like every
 * decision; the button shows it's busy meanwhile.
 */
export function useDecideMaterialRequest() {
  const queryClient = useQueryClient();
  const listKey = inventoryQueries.materialRequests().queryKey;
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: Decision }) =>
      decideMaterialRequest(id, decision),
    onSuccess: (request) =>
      queryClient.setQueryData<MaterialRequest[]>(listKey, (list) => replaceIn(list, request)),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: listKey }),
        refreshApprovalCounts(queryClient),
      ]),
  });
}

export function useDecidePurchaseOrder() {
  const queryClient = useQueryClient();
  const listKey = inventoryQueries.purchaseOrders().queryKey;
  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: Decision }) =>
      decidePurchaseOrder(id, decision),
    onSuccess: (order) =>
      queryClient.setQueryData<PurchaseOrder[]>(listKey, (list) => replaceIn(list, order)),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: listKey }),
        refreshApprovalCounts(queryClient),
      ]),
  });
}

/** Lets anything ask whether an order is being sent right now (`useIsMutating`). */
export const CREATE_PURCHASE_ORDER = ["inventory", "create-purchase-order"];

/**
 * Raise a purchase order. The new order goes to the top of the cached list as
 * soon as the server returns it; then the list and the approval counts
 * refetch, since an order over the threshold adds one to what's waiting.
 */
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  const listKey = inventoryQueries.purchaseOrders().queryKey;
  return useMutation({
    mutationKey: CREATE_PURCHASE_ORDER,
    mutationFn: createPurchaseOrder,
    onSuccess: (order) =>
      queryClient.setQueryData<PurchaseOrder[]>(listKey, (list) => list && [order, ...list]),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: listKey }),
        refreshApprovalCounts(queryClient),
      ]),
  });
}
