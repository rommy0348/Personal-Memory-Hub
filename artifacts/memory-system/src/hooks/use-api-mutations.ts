import { useQueryClient } from '@tanstack/react-query';
import { 
  useCreateFolder as useBaseCreateFolder,
  useCreateMemory as useBaseCreateMemory,
  useUpdateMemory as useBaseUpdateMemory,
  useDeleteMemory as useBaseDeleteMemory,
  useAiChat as useBaseAiChat,
  getListFoldersQueryKey,
  getListMemoriesQueryKey,
  getGetChatMessagesQueryKey,
} from '@workspace/api-client-react';

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useBaseCreateFolder({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFoldersQueryKey() });
      },
    }
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();
  return useBaseCreateMemory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
      },
    }
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();
  return useBaseUpdateMemory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
      },
    }
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useBaseDeleteMemory({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
      },
    }
  });
}

export function useAiChat() {
  const queryClient = useQueryClient();
  return useBaseAiChat({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetChatMessagesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListMemoriesQueryKey() });
      },
    }
  });
}
