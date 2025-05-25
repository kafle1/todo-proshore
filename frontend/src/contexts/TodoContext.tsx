import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

export type FilterType = 'ALL' | 'COMPLETED' | 'UPCOMING';

interface Todo {
  id: string;
  name: string;
  shortDescription: string;
  dateTime: string;
  isDone: boolean;
}

interface TodoContextValue {
  todos: Todo[];
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  refetch: () => void;
}

const TodoContext = createContext<TodoContextValue | undefined>(undefined);

export const TodoProvider = ({ children }: { children: ReactNode }) => {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const { data, refetch } = useQuery<Todo[], Error>({
    queryKey: ['todos', filter],
    queryFn: () =>
      api.get<Todo[]>(`/todos${filter === 'ALL' ? '' : `?status=${filter}`}`).then(res => res.data),
  });
  const todos = useMemo(() => data || [], [data]);

  const value = useMemo(() => ({ todos, filter, setFilter, refetch }), [todos, filter, refetch]);

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};

export function useTodos() {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
} 