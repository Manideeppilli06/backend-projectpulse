import useLiveTopic from './useLiveTopic';

export default function useBoardLive(boardId, onEvent) {
  return useLiveTopic(`/topic/boards/${boardId}`, onEvent);
}