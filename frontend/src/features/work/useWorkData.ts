import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Project, Task, Workspace } from "@/types";
export function useWorkData() {
  return useQuery({
    queryKey: ["work-data"],
    retry: 1,
    queryFn: async () => {
      const [projects, tasks, spaces] = await Promise.all([
        api.get<Project[]>("/api/projects"),
        api.get<Task[]>("/api/tasks"),
        api.get<Workspace[]>("/api/workspaces"),
      ]);
      return { projects: projects.data, tasks: tasks.data, spaces: spaces.data };
    },
  });
}
