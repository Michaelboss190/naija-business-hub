import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useSupabaseQuery<T>(
  key: string[],
  query: () => Promise<{ data: T | null; error: any }>,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await query()
      if (error) throw error
      return data as T
    },
    ...options,
  })
}

export function useSupabaseMutation<T>(
  mutationFn: (variables: any) => Promise<{ data: T | null; error: any }>,
  options?: {
    onSuccess?: (data: T) => void
    onError?: (error: any) => void
    invalidateKeys?: string[][]
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: any) => {
      const { data, error } = await mutationFn(variables)
      if (error) throw error
      return data as T
    },
    onSuccess: (data) => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }))
      }
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}