import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useEmergencies() {
  return useQuery({
    queryKey: [api.emergencies.list.path],
    queryFn: async () => {
      const res = await fetch(api.emergencies.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch emergencies");
      const data = await res.json();
      return parseWithLogging(api.emergencies.list.responses[200], data, "emergencies.list");
    },
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useCreateEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: z.infer<typeof api.emergencies.create.input>) => {
      const validated = api.emergencies.create.input.parse(input);
      const res = await fetch(api.emergencies.create.path, {
        method: api.emergencies.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create emergency");
      const data = await res.json();
      return parseWithLogging(api.emergencies.create.responses[201], data, "emergencies.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.emergencies.list.path] });
    },
  });
}

export function useResolveEmergency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.emergencies.resolve.path, { id });
      const res = await fetch(url, {
        method: api.emergencies.resolve.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to resolve emergency");
      const data = await res.json();
      return parseWithLogging(api.emergencies.resolve.responses[200], data, "emergencies.resolve");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.emergencies.list.path] });
    },
  });
}
