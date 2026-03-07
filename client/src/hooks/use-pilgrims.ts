import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Helper to log and parse
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function usePilgrims(options?: { refetchInterval?: number }) {
  return useQuery({
    queryKey: [api.pilgrims.list.path],
    queryFn: async () => {
      const res = await fetch(api.pilgrims.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pilgrims");
      const data = await res.json();
      return parseWithLogging(api.pilgrims.list.responses[200], data, "pilgrims.list");
    },
    refetchInterval: options?.refetchInterval,
  });
}

export function usePilgrim(id: number) {
  return useQuery({
    queryKey: [api.pilgrims.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.pilgrims.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch pilgrim");
      const data = await res.json();
      return parseWithLogging(api.pilgrims.get.responses[200], data, "pilgrims.get");
    },
    enabled: !!id,
  });
}

export function useCreatePilgrim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: z.infer<typeof api.pilgrims.create.input>) => {
      const validated = api.pilgrims.create.input.parse(input);
      const res = await fetch(api.pilgrims.create.path, {
        method: api.pilgrims.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create pilgrim");
      const data = await res.json();
      return parseWithLogging(api.pilgrims.create.responses[201], data, "pilgrims.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pilgrims.list.path] });
    },
  });
}

export function useDeletePilgrim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/pilgrims/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete pilgrim");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pilgrims.list.path] });
    },
  });
}

export function useUpdatePilgrimPermitStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/pilgrims/${id}/permit-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update permit status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.pilgrims.list.path] });
    },
  });
}

export function useUpdatePilgrimLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, locationLat, locationLng }: { id: number, locationLat: number, locationLng: number }) => {
      const url = buildUrl(api.pilgrims.updateLocation.path, { id });
      const validated = api.pilgrims.updateLocation.input.parse({ locationLat, locationLng });
      const res = await fetch(url, {
        method: api.pilgrims.updateLocation.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update location");
      const data = await res.json();
      return parseWithLogging(api.pilgrims.updateLocation.responses[200], data, "pilgrims.updateLocation");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.pilgrims.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.pilgrims.get.path, variables.id] });
    },
  });
}
